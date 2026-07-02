import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bookmark, Loader2, AlertCircle, CheckCircle2, Clock, XCircle,
  Send, ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react';
import api from '../lib/axios';

type RegStatus = 'pending' | 'approved' | 'rejected' | 'completed';
type SubStatus = 'pending' | 'approved' | 'rejected';

interface Campaign {
  id: string;
  title: string | null;
  status: string;
  requiredLinks: number;
}
interface Registration {
  id: string;
  status: RegStatus;
  campaign: Campaign | null;
}
interface Submission {
  id: string;
  platform: 'tiktok' | 'instagram';
  linkUrl: string | null;
  status: SubStatus;
}

const regBadge: Record<RegStatus, { label: string; cls: string; icon: any }> = {
  pending:   { label: 'Menunggu Approval', cls: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock },
  approved:  { label: 'Disetujui',         cls: 'text-success bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
  rejected:  { label: 'Ditolak',           cls: 'text-danger bg-red-50 border-red-100', icon: XCircle },
  completed: { label: 'Selesai',           cls: 'text-primary bg-primary-light border-primary/20', icon: CheckCircle2 },
};

const subBadge: Record<SubStatus, { label: string; cls: string }> = {
  pending:  { label: 'Pending',  cls: 'text-amber-600 bg-amber-50' },
  approved: { label: 'Approved', cls: 'text-success bg-emerald-50' },
  rejected: { label: 'Rejected', cls: 'text-danger bg-red-50' },
};

export default function MyCampaign() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: registrations, isLoading, isError } = useQuery<Registration[]>({
    queryKey: ['my-campaigns'],
    queryFn: async () => {
      const res = await api.get('/members/me/campaigns');
      return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        <span className="text-xs font-medium">Memuat campaign...</span>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex items-start gap-2 bg-red-50 text-danger text-xs p-3 rounded-xl border border-red-100">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Gagal memuat campaign. Coba muat ulang halaman.</span>
      </div>
    );
  }

  const regs = registrations ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-accent">Campaign Saya</h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Campaign yang kamu ikuti. Submit link karyamu di campaign yang sudah disetujui.
        </p>
      </div>

      {regs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
          <Bookmark className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium text-neutral-500">Belum ikut campaign apa pun</p>
          <p className="text-xs mt-1">Buka menu Home untuk mulai mengikuti campaign.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {regs.map((reg) => {
            const badge = regBadge[reg.status];
            const BadgeIcon = badge.icon;
            const isOpen = expandedId === reg.id;
            return (
              <div key={reg.id} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-accent leading-tight">
                      {reg.campaign?.title || 'Campaign'}
                    </h3>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border shrink-0 ${badge.cls}`}>
                      <BadgeIcon className="w-3 h-3" /> {badge.label}
                    </span>
                  </div>

                  {reg.status === 'approved' && (
                    <button
                      onClick={() => setExpandedId(isOpen ? null : reg.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-primary pt-1"
                    >
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isOpen ? 'Tutup' : 'Submit / Lihat Link'}
                    </button>
                  )}
                  {reg.status === 'pending' && (
                    <p className="text-[11px] text-neutral-400">
                      Menunggu admin menyetujui. Link bisa dikirim setelah disetujui.
                    </p>
                  )}
                </div>

                {reg.status === 'approved' && isOpen && (
                  <SubmissionPanel
                    registrationId={reg.id}
                    requiredLinks={reg.campaign?.requiredLinks ?? 1}
                    onChanged={() => queryClient.invalidateQueries({ queryKey: ['submissions', reg.id] })}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SubmissionPanel({
  registrationId, requiredLinks, onChanged,
}: {
  registrationId: string;
  requiredLinks: number;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState<'tiktok' | 'instagram'>('tiktok');
  const [linkUrl, setLinkUrl] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const { data: submissions } = useQuery<Submission[]>({
    queryKey: ['submissions', registrationId],
    queryFn: async () => {
      const res = await api.get(`/registrations/${registrationId}/submissions`);
      return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/registrations/${registrationId}/submissions`, {
        platform,
        linkUrl,
      });
      return res.data;
    },
    onSuccess: () => {
      setFeedback({ type: 'ok', msg: 'Link berhasil dikirim! Menunggu review admin.' });
      setLinkUrl('');
      queryClient.invalidateQueries({ queryKey: ['submissions', registrationId] });
      onChanged();
    },
    onError: (error: any) => {
      setFeedback({ type: 'err', msg: error.response?.data?.message || 'Gagal mengirim link.' });
    },
  });

  const subs = submissions ?? [];
  const approvedCount = subs.filter((s) => s.status === 'approved').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      setFeedback({ type: 'err', msg: 'Link wajib diisi.' });
      return;
    }
    submitMutation.mutate();
  };

  return (
    <div className="border-t border-neutral-100 bg-neutral-50 p-4 space-y-3">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-neutral-600">Progres link disetujui</span>
        <span className="font-bold text-accent">{approvedCount} / {requiredLinks}</span>
      </div>

      {feedback && (
        <div className={`flex items-start gap-2 text-xs p-2.5 rounded-lg border ${
          feedback.type === 'ok'
            ? 'bg-emerald-50 text-success border-emerald-100'
            : 'bg-red-50 text-danger border-red-100'
        }`}>
          {feedback.type === 'ok'
            ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Daftar submission yang sudah dikirim */}
      {subs.length > 0 && (
        <div className="space-y-1.5">
          {subs.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold uppercase text-neutral-400 shrink-0">{s.platform}</span>
                {s.linkUrl && (
                  <a href={s.linkUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-primary truncate flex items-center gap-1">
                    {s.linkUrl} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                )}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${subBadge[s.status].cls}`}>
                {subBadge[s.status].label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Form submit link baru */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as 'tiktok' | 'instagram')}
            className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-medium text-accent focus:outline-none focus:border-primary"
          >
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
          </select>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-primary text-accent"
          />
        </div>
        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitMutation.isPending ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengirim...</>
          ) : (
            <><Send className="w-3.5 h-3.5" /> Kirim Link</>
          )}
        </button>
      </form>
    </div>
  );
}
