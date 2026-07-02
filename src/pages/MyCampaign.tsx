import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bookmark, Loader2, AlertCircle, CheckCircle2, Clock, XCircle,
  Send, ExternalLink, ChevronDown, ChevronUp, Pencil, X, Check, MessageSquare,
  RefreshCw,
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
  feedback: string | null;
  campaign: Campaign | null;
  approvedCount: number;
  totalSubmissions: number;
  createdAt: string;
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

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

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

  // Grup per campaign, urutkan registrasi per campaign dari terbaru ke lama
  const grouped = new Map<string, { title: string; regs: Registration[] }>();
  regs.forEach((r) => {
    const cid = r.campaign?.id ?? 'unknown';
    if (!grouped.has(cid)) {
      grouped.set(cid, { title: r.campaign?.title ?? 'Campaign', regs: [] });
    }
    grouped.get(cid)!.regs.push(r);
  });

  return (
    <div className="space-y-4">
      <div className="sticky top-[45px] z-20 bg-neutral-50 -mx-4 px-4 pt-3 pb-3 border-b border-neutral-100">
        <h1 className="text-base font-bold text-accent">Campaign Saya</h1>
        <p className="text-[11px] text-neutral-500 mt-0.5">
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
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([cid, group]) => (
            <div key={cid} className="space-y-2">
              {/* Nama campaign sebagai header grup kalau ada lebih dari 1 registrasi */}
              {group.regs.length > 1 && (
                <div className="flex items-center gap-2 px-1">
                  <RefreshCw className="w-3.5 h-3.5 text-primary shrink-0" />
                  <p className="text-xs font-bold text-accent">{group.title}</p>
                  <span className="text-[10px] text-neutral-400">{group.regs.length}× diikuti</span>
                </div>
              )}
              {group.regs.map((reg, idx) => {
                const badge = regBadge[reg.status];
                const BadgeIcon = badge.icon;
                const isOpen = expandedId === reg.id;
                const isLatest = idx === 0;
                const allApproved =
                  reg.status === 'approved' &&
                  reg.approvedCount > 0 &&
                  reg.approvedCount === reg.totalSubmissions &&
                  reg.totalSubmissions > 0;

                return (
                  <div
                    key={reg.id}
                    className={`bg-white border rounded-2xl overflow-hidden ${
                      !isLatest ? 'border-neutral-100 opacity-75' : 'border-neutral-200'
                    }`}
                  >
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-accent leading-tight">
                            {reg.campaign?.title || 'Campaign'}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-neutral-400">
                              {formatDate(reg.createdAt)}
                            </span>
                            {group.regs.length > 1 && (
                              <span className="text-[10px] text-primary font-semibold">
                                {isLatest ? 'Terbaru' : `Periode ${group.regs.length - idx}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border shrink-0 ${badge.cls}`}>
                          <BadgeIcon className="w-3 h-3" /> {badge.label}
                        </span>
                      </div>

                      {/* Progress bar link */}
                      {reg.status === 'approved' && reg.campaign && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-neutral-500">
                            <span>Link disetujui</span>
                            <span className="font-bold text-accent">
                              {reg.approvedCount}/{reg.campaign.requiredLinks}
                            </span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, (reg.approvedCount / reg.campaign.requiredLinks) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Banner selesai semua */}
                      {allApproved && (
                        <div className="flex items-center gap-2 bg-primary-light border border-primary/20 rounded-xl px-3 py-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <p className="text-[11px] text-primary font-semibold">
                            Semua link disetujui! Kamu bisa ikut campaign ini lagi dari halaman Home.
                          </p>
                        </div>
                      )}

                      {reg.status === 'approved' && !allApproved && (
                        <button
                          onClick={() => setExpandedId(isOpen ? null : reg.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-primary pt-1"
                        >
                          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          {isOpen ? 'Tutup' : 'Submit / Lihat Link'}
                        </button>
                      )}

                      {reg.status === 'approved' && allApproved && (
                        <button
                          onClick={() => setExpandedId(isOpen ? null : reg.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 pt-1"
                        >
                          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          {isOpen ? 'Tutup' : 'Lihat Link'}
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
                        initialFeedback={reg.feedback ?? ''}
                        allApproved={allApproved}
                        onChanged={() => {
                          queryClient.invalidateQueries({ queryKey: ['submissions', reg.id] });
                          queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionPanel({
  registrationId, requiredLinks, initialFeedback, allApproved, onChanged,
}: {
  registrationId: string;
  requiredLinks: number;
  initialFeedback: string;
  allApproved: boolean;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState<'tiktok' | 'instagram'>('tiktok');
  const [linkUrl, setLinkUrl] = useState('');
  const [feedbackText, setFeedbackText] = useState(initialFeedback);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLink, setEditLink] = useState('');

  useEffect(() => { setFeedbackText(initialFeedback); }, [initialFeedback]);

  const { data: submissions } = useQuery<Submission[]>({
    queryKey: ['submissions', registrationId],
    queryFn: async () => {
      const res = await api.get(`/registrations/${registrationId}/submissions`);
      return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/registrations/${registrationId}/feedback`, { feedback: feedbackText });
      if (linkUrl.trim()) {
        await api.post(`/registrations/${registrationId}/submissions`, { platform, linkUrl });
      }
    },
    onSuccess: () => {
      setNotice({ type: 'ok', msg: linkUrl.trim() ? 'Link & catatan tersimpan! Menunggu review admin.' : 'Kritik & saran tersimpan.' });
      setLinkUrl('');
      queryClient.invalidateQueries({ queryKey: ['submissions', registrationId] });
      onChanged();
    },
    onError: (error: any) => {
      setNotice({ type: 'err', msg: error.response?.data?.message || 'Gagal menyimpan.' });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, link }: { id: string; link: string }) => {
      await api.put(`/submissions/${id}`, { linkUrl: link });
    },
    onSuccess: () => {
      setNotice({ type: 'ok', msg: 'Link berhasil diperbarui.' });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['submissions', registrationId] });
    },
    onError: (error: any) => {
      setNotice({ type: 'err', msg: error.response?.data?.message || 'Gagal memperbarui link.' });
    },
  });

  const subs = submissions ?? [];
  const approvedCount = subs.filter((s) => s.status === 'approved').length;

  return (
    <div className="border-t border-neutral-100 bg-neutral-50 p-4 space-y-3">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-neutral-600">Progres link disetujui</span>
        <span className="font-bold text-accent">{approvedCount} / {requiredLinks}</span>
      </div>

      {notice && (
        <div className={`flex items-start gap-2 text-xs p-2.5 rounded-lg border ${
          notice.type === 'ok'
            ? 'bg-emerald-50 text-success border-emerald-100'
            : 'bg-red-50 text-danger border-red-100'
        }`}>
          {notice.type === 'ok'
            ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{notice.msg}</span>
        </div>
      )}

      {subs.length > 0 && (
        <div className="space-y-1.5">
          {subs.map((s) => {
            const isEditing = editingId === s.id;
            return (
              <div key={s.id} className="bg-white border border-neutral-200 rounded-lg px-3 py-2">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={editLink}
                      onChange={(e) => setEditLink(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-2 py-1.5 bg-white border border-neutral-200 rounded-lg text-[11px] focus:outline-none focus:border-primary text-accent"
                    />
                    <button onClick={() => editMutation.mutate({ id: s.id, link: editLink })}
                      className="p-1 text-success hover:bg-emerald-50 rounded" title="Simpan">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="p-1 text-neutral-400 hover:bg-neutral-100 rounded" title="Batal">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold uppercase text-neutral-400 shrink-0">{s.platform}</span>
                      {s.linkUrl && (
                        <a href={s.linkUrl} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-primary truncate flex items-center gap-1">
                          {s.linkUrl} <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {s.status === 'pending' && (
                        <button
                          onClick={() => { setEditingId(s.id); setEditLink(s.linkUrl ?? ''); }}
                          className="p-1 text-neutral-400 hover:text-primary hover:bg-primary-light rounded"
                          title="Edit link"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${subBadge[s.status].cls}`}>
                        {subBadge[s.status].label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form submit — sembunyikan kalau semua sudah approved */}
      {!allApproved && (
        <form onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }} className="space-y-2">
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

          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 mb-1">
              <MessageSquare className="w-3.5 h-3.5" /> Kritik & Saran <span className="text-neutral-400 font-normal">(opsional)</span>
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={2}
              placeholder="Tulis masukan untuk campaign ini..."
              className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-primary text-accent resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitMutation.isPending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</>
            ) : (
              <><Send className="w-3.5 h-3.5" /> Kirim</>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
