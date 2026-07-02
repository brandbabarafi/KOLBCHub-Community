import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone, Loader2, AlertCircle, CheckCircle2, ArrowRight, Clock,
  Instagram, Video, FileText, Coins, X, Calendar, Link2,
  MessageSquare, Send, ChevronRight, ShieldAlert,
} from 'lucide-react';
import api from '../lib/axios';

interface Campaign {
  id: string;
  brandId: string | null;
  campaignType: 'kol' | 'community';
  title: string | null;
  description: string | null;
  objective: string | null;
  startDate: string | null;
  endDate: string | null;
  requiredLinks: number;
  requiredIgLinks: number;
  requiredTtLinks: number;
  feePerBrief: string | null;
  totalBriefs: number | null;
  status: 'draft' | 'active' | 'closed' | 'archived';
}

interface Registration {
  id: string;
  status: string;
  feedback: string | null;
  approvedCount: number;
  totalSubmissions: number;
  createdAt: string;
  campaign: {
    id: string;
    title: string | null;
    status: string;
    requiredLinks: number;
  } | null;
}

interface RegInfo {
  registrationId: string;
  status: string;
  canRejoin: boolean;
  approvedCount: number;
  totalSubmissions: number;
  requiredLinks: number;
  feedback: string | null;
}

interface ListResponse {
  data?: Campaign[];
}

type FilterTab = 'all' | 'available' | 'active' | 'completed';

function formatDate(d: string | null) {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return d;
  }
}

function formatRupiah(val: string | null | undefined) {
  if (!val) return null;
  const n = parseFloat(val);
  if (isNaN(n)) return null;
  return new Intl.NumberFormat('id-ID').format(n);
}

/* ── Submit Link + Feedback (redesign: per-platform, bisa tambah URL) ─ */
function SubmitLinkModal({
  registrationId,
  campaignTitle,
  approvedCount,
  requiredLinks,
  requiredIgLinks,
  requiredTtLinks,
  currentFeedback,
  onClose,
}: {
  registrationId: string;
  campaignTitle: string | null;
  approvedCount: number;
  requiredLinks: number;
  requiredIgLinks: number;
  requiredTtLinks: number;
  currentFeedback: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [igUrls, setIgUrls] = useState<string[]>(['']);
  const [ttUrls, setTtUrls] = useState<string[]>(['']);
  const [feedback, setFeedback] = useState(currentFeedback ?? '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const igValid = igUrls.filter(u => u.trim().startsWith('http'));
      const ttValid = ttUrls.filter(u => u.trim().startsWith('http'));
      // Submit all valid URLs sequentially
      for (const url of igValid) {
        await api.post(`/registrations/${registrationId}/submissions`, { platform: 'instagram', linkUrl: url });
      }
      for (const url of ttValid) {
        await api.post(`/registrations/${registrationId}/submissions`, { platform: 'tiktok', linkUrl: url });
      }
      await api.patch(`/registrations/${registrationId}/feedback`, { feedback });
    },
    onSuccess: () => {
      setSuccess('Link berhasil disubmit dan feedback tersimpan!');
      queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
      setTimeout(onClose, 1800);
    },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Gagal submit. Coba lagi.'),
  });

  const handleSubmit = () => {
    setError('');
    const igValid = igUrls.filter(u => u.trim());
    const ttValid = ttUrls.filter(u => u.trim());
    const allUrls = [...igValid, ...ttValid];
    if (allUrls.length === 0) { setError('Masukkan minimal satu URL.'); return; }
    const invalid = allUrls.filter(u => !u.startsWith('http'));
    if (invalid.length > 0) { setError('Semua URL harus diawali https://'); return; }
    if (!feedback.trim()) { setError('Kritik & saran wajib diisi sebelum submit.'); return; }
    submitMutation.mutate();
  };

  const updateUrl = (list: string[], setList: (v: string[]) => void, idx: number, val: string) => {
    const next = [...list]; next[idx] = val; setList(next);
    setError('');
  };
  const addUrl = (list: string[], setList: (v: string[]) => void) => setList([...list, '']);
  const removeUrl = (list: string[], setList: (v: string[]) => void, idx: number) =>
    setList(list.filter((_, i) => i !== idx));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-light flex items-center justify-center">
              <Link2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-accent">Submit Link</h2>
              <p className="text-[11px] text-neutral-500">{campaignTitle || 'Campaign'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Progress */}
          <div className="bg-neutral-50 rounded-xl px-3.5 py-3 flex items-center justify-between">
            <span className="text-xs text-neutral-600 font-medium">Link Disetujui</span>
            <span className="text-sm font-extrabold text-primary">{approvedCount} / {requiredLinks}</span>
          </div>

          {/* Instagram section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-accent">Instagram Reel</span>
                {requiredIgLinks > 0 && (
                  <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-full font-medium">
                    Wajib {requiredIgLinks}
                  </span>
                )}
              </div>
              <button
                onClick={() => addUrl(igUrls, setIgUrls)}
                className="text-[11px] font-bold text-primary flex items-center gap-0.5 hover:underline"
              >
                + Tambah
              </button>
            </div>
            {igUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateUrl(igUrls, setIgUrls, i, e.target.value)}
                  placeholder="https://www.instagram.com/reel/..."
                  className="flex-1 px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:bg-white transition-all"
                />
                {igUrls.length > 1 && (
                  <button onClick={() => removeUrl(igUrls, setIgUrls, i)}
                    className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* TikTok section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-neutral-700" />
                <span className="text-xs font-bold text-accent">TikTok</span>
                {requiredTtLinks > 0 && (
                  <span className="text-[10px] bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded-full font-medium">
                    Wajib {requiredTtLinks}
                  </span>
                )}
              </div>
              <button
                onClick={() => addUrl(ttUrls, setTtUrls)}
                className="text-[11px] font-bold text-primary flex items-center gap-0.5 hover:underline"
              >
                + Tambah
              </button>
            </div>
            {ttUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateUrl(ttUrls, setTtUrls, i, e.target.value)}
                  placeholder="https://www.tiktok.com/@username/video/..."
                  className="flex-1 px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-400 focus:bg-white transition-all"
                />
                {ttUrls.length > 1 && (
                  <button onClick={() => removeUrl(ttUrls, setTtUrls, i)}
                    className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="text-[11px] text-neutral-400">
            Kamu bisa mengumpulkan lebih dari jumlah wajib — semua akan direviewed.
          </p>

          {/* Feedback */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-600 block">
              Kritik & Saran <span className="text-primary">*</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => { setFeedback(e.target.value); setError(''); }}
              placeholder="Tulis pengalamanmu mengikuti campaign ini..."
              rows={3}
              className="w-full px-3.5 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all resize-none"
            />
            <p className="text-[11px] text-neutral-400">Wajib diisi sebelum submit.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 bg-emerald-50 text-emerald-700 text-xs p-3 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> {success}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
              : <><Send className="w-4 h-4" /> Submit Link</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Feedback-only Modal (untuk campaign selesai) ───────── */
function FeedbackModal({
  registrationId,
  campaignTitle,
  currentFeedback,
  onClose,
}: {
  registrationId: string;
  campaignTitle: string | null;
  currentFeedback: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [text, setText] = useState(currentFeedback ?? '');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.patch(`/registrations/${registrationId}/feedback`, { feedback: text }),
    onSuccess: () => {
      setSuccess('Kritik & saran berhasil disimpan.');
      queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
      setTimeout(onClose, 1500);
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-accent">Kritik & Saran</h2>
              <p className="text-[11px] text-neutral-500">{campaignTitle || 'Campaign'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tulis kritik atau saran kamu di sini..."
            rows={5}
            className="w-full px-3.5 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all resize-none"
          />
          {success && (
            <div className="flex items-start gap-2 bg-emerald-50 text-emerald-700 text-xs p-3 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> {success}
            </div>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !text.trim()}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saveMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
              : <><Send className="w-4 h-4" /> Simpan Feedback</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Campaign Detail Modal ──────────────────────────────── */
function CampaignDetailModal({ c, onClose }: { c: Campaign; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
              <Megaphone className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-sm font-bold text-accent leading-tight">{c.title || 'Tanpa Judul'}</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Calendar className="w-4 h-4 shrink-0 text-primary" />
            <span>{formatDate(c.startDate)} – {formatDate(c.endDate)}</span>
          </div>

          {c.feePerBrief && (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-3">
              <Coins className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-base font-extrabold text-emerald-700 leading-tight">Rp {formatRupiah(c.feePerBrief)}</p>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5">per campaign</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Kewajiban Konten</p>
            <div className="flex flex-wrap gap-2">
              {(c.requiredIgLinks > 0 || c.requiredTtLinks > 0) ? (
                <>
                  {c.requiredIgLinks > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-100 rounded-full px-3 py-1">
                      <Instagram className="w-3.5 h-3.5" /> {c.requiredIgLinks} Video Instagram
                    </span>
                  )}
                  {c.requiredTtLinks > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 border border-neutral-200 rounded-full px-3 py-1">
                      <Video className="w-3.5 h-3.5" /> {c.requiredTtLinks} Video TikTok
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-neutral-400">{c.requiredLinks} link wajib</span>
              )}
            </div>
          </div>

          {c.description && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Deskripsi</p>
              <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-line">{c.description}</p>
            </div>
          )}

          {c.objective && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Objective</p>
              <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-line break-words">{c.objective}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Campaign Card ──────────────────────────────────────── */
const CARD_ACCENTS = [
  { border: 'border-l-orange-400', icon: 'bg-orange-50 text-orange-500' },
  { border: 'border-l-blue-400', icon: 'bg-blue-50 text-blue-500' },
  { border: 'border-l-emerald-400', icon: 'bg-emerald-50 text-emerald-500' },
  { border: 'border-l-violet-400', icon: 'bg-violet-50 text-violet-500' },
  { border: 'border-l-rose-400', icon: 'bg-rose-50 text-rose-500' },
  { border: 'border-l-cyan-400', icon: 'bg-cyan-50 text-cyan-500' },
];

function CampaignCard({
  campaign,
  regInfo,
  onDetail,
  onJoin,
  onSubmitLink,
  onFeedback,
  isJoining,
  bankComplete,
  colorIndex = 0,
}: {
  campaign: Campaign;
  regInfo?: RegInfo;
  onDetail: () => void;
  onJoin?: () => void;
  onSubmitLink?: () => void;
  onFeedback?: () => void;
  isJoining?: boolean;
  bankComplete?: boolean;
  colorIndex?: number;
}) {
  const rupiah = formatRupiah(campaign.feePerBrief);
  const isActive = regInfo?.status === 'approved';
  const isCompleted = regInfo?.status === 'completed';
  const accent = CARD_ACCENTS[colorIndex % CARD_ACCENTS.length];

  return (
    <div className={`bg-white border border-neutral-200 border-l-4 ${accent.border} rounded-2xl p-4 space-y-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent.icon}`}>
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-accent leading-tight">{campaign.title || 'Tanpa Judul'}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-success'
            }`}>
              {isActive ? 'Sedang Berjalan' : isCompleted ? 'Selesai' : 'Aktif'}
            </span>
          </div>
        </div>
        <button
          onClick={onDetail}
          className="shrink-0 text-[10px] font-semibold text-primary border border-primary/30 px-2.5 py-1 rounded-lg hover:bg-primary-light transition"
        >
          Detail
        </button>
      </div>

      {campaign.description && (
        <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">{campaign.description}</p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-neutral-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
        </span>
        {(campaign.requiredIgLinks > 0 || campaign.requiredTtLinks > 0) ? (
          <>
            {campaign.requiredIgLinks > 0 && <span className="flex items-center gap-1"><Instagram className="w-3 h-3" /> {campaign.requiredIgLinks} IG</span>}
            {campaign.requiredTtLinks > 0 && <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {campaign.requiredTtLinks} TikTok</span>}
          </>
        ) : (
          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {campaign.requiredLinks} link wajib</span>
        )}
        {rupiah && (
          <span className="flex items-center gap-1 font-bold text-emerald-600 text-xs">
            <Coins className="w-3.5 h-3.5" /> Rp {rupiah} / campaign
          </span>
        )}
      </div>

      {/* Progress bar for active registrations */}
      {isActive && regInfo && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-neutral-500">Link disetujui</span>
            <span className="font-bold text-primary">{regInfo.approvedCount}/{regInfo.requiredLinks}</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (regInfo.approvedCount / Math.max(regInfo.requiredLinks, 1)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      {isActive && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onSubmitLink}
            className="flex items-center justify-center gap-1.5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all"
          >
            <Link2 className="w-3.5 h-3.5" /> Submit Link
          </button>
          <button
            onClick={onFeedback}
            className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {regInfo?.feedback ? 'Edit Feedback' : 'Kritik & Saran'}
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold text-emerald-700 flex-1">Campaign selesai</span>
          {onFeedback && (
            <button onClick={onFeedback} className="text-[11px] font-bold text-emerald-700 flex items-center gap-0.5 hover:underline">
              {regInfo?.feedback ? 'Edit Feedback' : 'Beri Feedback'} <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {!regInfo && onJoin && (
        <button
          onClick={onJoin}
          disabled={isJoining || !bankComplete}
          title={!bankComplete ? 'Lengkapi data rekening dulu untuk bisa ikut campaign' : undefined}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
        >
          {isJoining
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Mendaftar...</>
            : !bankComplete
            ? <>Lengkapi rekening dulu</>
            : <>Ikuti Campaign <ArrowRight className="w-3.5 h-3.5" /></>}
        </button>
      )}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────── */
export default function Campaigns() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [submitModal, setSubmitModal] = useState<{ regInfo: RegInfo; campaign: Campaign } | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{ regInfo: RegInfo; title: string | null } | null>(null);
  const queryClient = useQueryClient();

  const { data: myProfile } = useQuery<{
    id: string;
    bankName: string | null;
    bankAccountNumber: string | null;
    bankAccountHolder: string | null;
    suspension?: { endDate: string; reason: string | null } | null;
  }>({
    queryKey: ['my-profile'],
    queryFn: async () => (await api.get('/members/me/profile')).data,
  });

  const suspension = myProfile?.suspension ?? null;

  const bankComplete = Boolean(
    myProfile?.bankName?.trim() &&
    myProfile?.bankAccountNumber?.trim() &&
    myProfile?.bankAccountHolder?.trim(),
  );

  const { data: myRegs } = useQuery<Registration[]>({
    queryKey: ['my-campaigns'],
    queryFn: async () => {
      const res = await api.get('/members/me/campaigns');
      return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    },
  });

  // Build reg map: campaignId → RegInfo
  const campaignRegMap = useMemo(() => {
    const map = new Map<string, RegInfo>();
    (myRegs ?? []).forEach((r) => {
      const cid = String(r.campaign?.id ?? '');
      if (!cid || map.has(cid)) return;
      const allApproved =
        r.status === 'approved' &&
        r.approvedCount > 0 &&
        r.totalSubmissions > 0 &&
        r.approvedCount === r.totalSubmissions;
      map.set(cid, {
        registrationId: r.id,
        status: r.status,
        canRejoin: allApproved,
        approvedCount: r.approvedCount,
        totalSubmissions: r.totalSubmissions,
        requiredLinks: r.campaign?.requiredLinks ?? 0,
        feedback: r.feedback,
      });
    });
    return map;
  }, [myRegs]);

  const { data: availableCampaigns, isLoading, isError } = useQuery<Campaign[]>({
    queryKey: ['campaigns-available'],
    queryFn: async () => {
      const res = await api.get<ListResponse | Campaign[]>('/campaigns');
      const list: Campaign[] = Array.isArray(res.data)
        ? res.data
        : (res.data as ListResponse)?.data ?? [];
      return list.filter((c) => c.campaignType === 'community' && c.status === 'active');
    },
  });

  const [joiningId, setJoiningId] = useState<string | null>(null);
  const joinMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      if (!myProfile?.id) throw new Error('Profil member belum dimuat.');
      return (await api.post(`/campaigns/${campaignId}/registrations`, {
        communityMemberId: Number(myProfile.id),
      })).data;
    },
    onMutate: (campaignId) => setJoiningId(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns-available'] });
      queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
      setJoiningId(null);
    },
    onError: () => setJoiningId(null),
  });

  const filteredCampaigns = useMemo(() => {
    const available = availableCampaigns ?? [];
    const myRegistrations = myRegs ?? [];

    switch (activeTab) {
      case 'available':
        return available.filter(c => !campaignRegMap.has(String(c.id)));
      case 'active':
        return available.filter(c => {
          const reg = campaignRegMap.get(String(c.id));
          return reg?.status === 'approved';
        });
      case 'completed':
        // Show from myRegs for completed (campaign may be closed)
        return myRegistrations
          .filter(r => r.status === 'completed' && r.campaign)
          .map(r => ({
            id: r.campaign!.id,
            title: r.campaign!.title,
            status: r.campaign!.status as any,
            requiredLinks: r.campaign!.requiredLinks,
            campaignType: 'community' as const,
            brandId: null, description: null, objective: null,
            startDate: null, endDate: null,
            requiredIgLinks: 0, requiredTtLinks: 0,
            feePerBrief: null, totalBriefs: null,
          }));
      case 'all':
      default: {
        const all = [
          ...available,
          ...myRegistrations
            .filter(r => r.campaign && !available.find(a => a.id === r.campaign!.id))
            .map(r => ({
              id: r.campaign!.id,
              title: r.campaign!.title,
              status: r.campaign!.status as any,
              requiredLinks: r.campaign!.requiredLinks,
              campaignType: 'community' as const,
              brandId: null, description: null, objective: null,
              startDate: null, endDate: null,
              requiredIgLinks: 0, requiredTtLinks: 0,
              feePerBrief: null, totalBriefs: null,
            })),
        ];
        return all.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
      }
    }
  }, [activeTab, availableCampaigns, myRegs, campaignRegMap]);

  if (isError) {
    return (
      <div className="flex items-start gap-2 bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Gagal memuat campaign. Coba muat ulang halaman.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-[45px] z-20 bg-neutral-50 -mx-4 px-4 pt-2 pb-3 space-y-3">
        <div>
          <h1 className="text-lg font-bold text-accent">Campaign</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Kelola campaign yang sedang berjalan atau jelajahi campaign baru.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'available', 'active', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeTab === tab
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-accent hover:bg-neutral-200'
            }`}
          >
            {{ all: 'Semua', available: 'Tersedia', active: 'Sedang Berjalan', completed: 'Selesai' }[tab]}
          </button>
        ))}
        </div>
      </div>

      {/* Suspended Warning */}
      {suspension && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="space-y-1 flex-1">
            <p className="font-bold text-sm">Akun kamu sedang disuspend</p>
            {suspension.reason && <p className="text-xs opacity-90">Alasan: {suspension.reason}</p>}
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3.5 h-3.5 text-red-500" />
              <p className="text-xs font-semibold">
                {(() => {
                  const days = Math.max(0, Math.ceil((new Date(suspension.endDate).getTime() - Date.now()) / 86400000));
                  const tanggal = new Date(suspension.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                  return `Aktif kembali: ${tanggal} (${days} hari lagi)`;
                })()}
              </p>
            </div>
            <p className="text-xs opacity-80 mt-1">Kamu tidak bisa mendaftar campaign selama masa suspensi.</p>
          </div>
        </div>
      )}

      {/* Campaign List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
          <Loader2 className="w-6 h-6 animate-spin mb-2" />
          <span className="text-xs font-medium">Memuat campaign...</span>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
          <Megaphone className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium text-neutral-500">Tidak ada campaign</p>
          <p className="text-xs mt-1">
            {activeTab === 'available' && 'Semua campaign tersedia sudah kamu ikuti.'}
            {activeTab === 'active' && 'Belum ada campaign aktif yang kamu ikuti.'}
            {activeTab === 'completed' && 'Belum ada campaign yang selesai.'}
            {activeTab === 'all' && 'Campaign akan muncul di sini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCampaigns.map((c, idx) => {
            const regInfo = campaignRegMap.get(String(c.id));
            return (
              <div key={c.id} className={`animate-fade-in-up delay-${Math.min(idx * 100, 500)}`}>
                <CampaignCard
                  campaign={c}
                  regInfo={regInfo}
                  colorIndex={idx}
                  onDetail={() => setDetailCampaign(c)}
                  onJoin={!regInfo && !suspension ? () => joinMutation.mutate(c.id) : undefined}
                  onSubmitLink={regInfo?.status === 'approved'
                    ? () => setSubmitModal({ regInfo, campaign: c })
                    : undefined}
                  onFeedback={(regInfo?.status === 'approved' || regInfo?.status === 'completed')
                    ? () => setFeedbackModal({ regInfo, title: c.title })
                    : undefined}
                  isJoining={joiningId === c.id}
                  bankComplete={bankComplete}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {detailCampaign && (
        <CampaignDetailModal c={detailCampaign} onClose={() => setDetailCampaign(null)} />
      )}
      {submitModal && (
        <SubmitLinkModal
          registrationId={submitModal.regInfo.registrationId}
          campaignTitle={submitModal.campaign.title}
          approvedCount={submitModal.regInfo.approvedCount}
          requiredLinks={submitModal.regInfo.requiredLinks}
          requiredIgLinks={submitModal.campaign.requiredIgLinks}
          requiredTtLinks={submitModal.campaign.requiredTtLinks}
          currentFeedback={submitModal.regInfo.feedback}
          onClose={() => setSubmitModal(null)}
        />
      )}
      {feedbackModal && (
        <FeedbackModal
          registrationId={feedbackModal.regInfo.registrationId}
          campaignTitle={feedbackModal.title}
          currentFeedback={feedbackModal.regInfo.feedback}
          onClose={() => setFeedbackModal(null)}
        />
      )}
    </div>
  );
}
