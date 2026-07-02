import { useQuery } from '@tanstack/react-query';
import {
  CreditCard, Loader2, AlertCircle, Clock, RefreshCw, CheckCircle2,
  ExternalLink, Banknote, Calendar, Tag, Gift,
} from 'lucide-react';
import api from '../lib/axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:8000';

interface Registration {
  id: string;
  status: string;
  createdAt: string;
  campaign: {
    id: string;
    title: string | null;
    startDate?: string | null;
    endDate?: string | null;
    feePerBrief?: string | null;
  } | null;
  approvedCount: number;
  totalSubmissions: number;
}

type PaymentStatus = 'pending' | 'processing' | 'transferred';

interface Payment {
  id: string;
  status: PaymentStatus;
  transferProofUrl: string | null;
  transferredAt: string | null;
  bonusAmount?: string | null;
  bonusReason?: string | null;
  campaign?: {
    title: string | null;
    feePerBrief?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  } | null;
}

const statusInfo: Record<PaymentStatus, { label: string; desc: string; cls: string; icon: any }> = {
  pending:     { label: 'Menunggu Diproses', desc: 'Dalam antrean tim Finance.', cls: 'text-amber-700 bg-amber-50 border-amber-200', icon: Clock },
  processing:  { label: 'Sedang Diproses',   desc: 'Tim Finance sedang memproses transfer.', cls: 'text-blue-700 bg-blue-50 border-blue-200', icon: RefreshCw },
  transferred: { label: 'Sudah Ditransfer',  desc: 'Dana sudah masuk ke akun eWallet kamu.', cls: 'text-success bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
};

function formatDate(d: string | null | undefined) {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

function formatShort(d: string) {
  try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function formatRp(val: string | null | undefined) {
  if (!val) return null;
  const n = Number(val);
  if (isNaN(n) || n === 0) return null;
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export default function Payments() {
  const { data: registrations, isLoading, isError } = useQuery<Registration[]>({
    queryKey: ['my-campaigns'],
    queryFn: async () => {
      const res = await api.get('/members/me/campaigns');
      return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    },
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
      <Loader2 className="w-6 h-6 animate-spin mb-2" />
      <span className="text-xs font-medium">Memuat status pembayaran...</span>
    </div>
  );

  if (isError) return (
    <div className="flex items-start gap-2 bg-red-50 text-danger text-xs p-3 rounded-xl border border-red-100">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>Gagal memuat pembayaran. Coba muat ulang halaman.</span>
    </div>
  );

  const regs = (registrations ?? []).filter(
    (r) => r.status === 'approved' || r.status === 'completed',
  );

  const campaignCount = new Map<string, number>();
  regs.forEach((r) => {
    const cid = r.campaign?.id ?? 'unknown';
    campaignCount.set(cid, (campaignCount.get(cid) ?? 0) + 1);
  });
  const campaignIdx = new Map<string, number>();

  return (
    <div className="space-y-4 pb-4">
      <div className="sticky top-[45px] z-20 bg-neutral-50 -mx-4 px-4 pt-3 pb-3 border-b border-neutral-100 animate-fade-in-up">
        <h1 className="text-base font-bold text-accent">Status Pembayaran</h1>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          Pantau status pencairan dana untuk campaign yang kamu ikuti.
        </p>
      </div>

      {regs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
            <Banknote className="w-8 h-8 opacity-40" />
          </div>
          <p className="text-sm font-semibold text-neutral-500">Belum ada pembayaran</p>
          <p className="text-xs mt-1 max-w-[200px] leading-relaxed">
            Status muncul setelah registrasi campaign kamu disetujui admin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {regs.map((reg, idx) => {
            const cid = reg.campaign?.id ?? 'unknown';
            const total = campaignCount.get(cid) ?? 1;
            const current = (campaignIdx.get(cid) ?? 0) + 1;
            campaignIdx.set(cid, current);
            const showPeriode = total > 1;

            return (
              <div key={reg.id} className={`animate-fade-in-up delay-${Math.min(idx * 100, 500)}`}>
                <PaymentCard
                  registrationId={reg.id}
                  campaign={reg.campaign}
                  createdAt={reg.createdAt}
                  periodeLabel={showPeriode ? `Periode ${current}` : undefined}
                  isLatest={current === total}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PaymentCard({
  registrationId, campaign, createdAt, periodeLabel, isLatest,
}: {
  registrationId: string;
  campaign: Registration['campaign'];
  createdAt: string;
  periodeLabel?: string;
  isLatest?: boolean;
}) {
  const { data: payment, isLoading, isError } = useQuery<Payment | null>({
    queryKey: ['payment', registrationId],
    queryFn: async () => {
      try {
        const res = await api.get(`/members/me/registrations/${registrationId}/payment`);
        return res.data ?? null;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    retry: false,
  });

  const feePerCampaign = payment?.campaign?.feePerBrief ?? campaign?.feePerBrief;
  const bonusAmt = payment?.bonusAmount ? Number(payment.bonusAmount) : 0;
  const hasBreakdown = feePerCampaign || bonusAmt > 0;

  const proofUrl = payment?.transferProofUrl
    ? (payment.transferProofUrl.startsWith('http')
      ? payment.transferProofUrl
      : `${API_BASE}${payment.transferProofUrl}`)
    : null;

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden ${!isLatest && periodeLabel ? 'border-neutral-100 opacity-80' : 'border-neutral-200'}`}>
      {/* Header kartu */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-100">
        <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
          <CreditCard className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-accent leading-tight truncate">
            {campaign?.title || 'Campaign'}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-neutral-400">{formatShort(createdAt)}</span>
            {periodeLabel && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                isLatest ? 'bg-primary-light text-primary' : 'bg-neutral-100 text-neutral-500'
              }`}>
                {periodeLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Detail campaign */}
      {campaign && (campaign.startDate || campaign.endDate) && (
        <div className="px-4 pt-3 pb-1 flex items-center gap-1.5 text-[11px] text-neutral-500">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}
        </div>
      )}

      {/* Fee breakdown */}
      {hasBreakdown && (
        <div className="px-4 py-3 border-t border-neutral-50 space-y-1.5">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Rincian Pembayaran</p>
          {feePerCampaign && Number(feePerCampaign) > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-neutral-600">
                <Tag className="w-3.5 h-3.5 text-primary" /> Fee Campaign
              </span>
              <span className="font-semibold text-accent">{formatRp(feePerCampaign)}</span>
            </div>
          )}
          {bonusAmt > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-neutral-600">
                <Gift className="w-3.5 h-3.5 text-success" />
                {payment?.bonusReason || 'Bonus tambahan'}
              </span>
              <span className="font-semibold text-success">+{formatRp(payment?.bonusAmount)}</span>
            </div>
          )}
        </div>
      )}

      {/* Status pembayaran */}
      <div className="px-4 py-3 border-t border-neutral-50">
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat status...
          </div>
        )}
        {!isLoading && isError && (
          <div className="flex items-center gap-2 text-xs text-danger py-1">
            <AlertCircle className="w-3.5 h-3.5" /> Gagal memuat status pembayaran.
          </div>
        )}
        {!isLoading && !isError && !payment && (
          <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5">
            <Clock className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
            <span>Pembayaran belum tersedia. Muncul setelah link kamu disetujui.</span>
          </div>
        )}
        {payment && (() => {
          const info = statusInfo[payment.status];
          const Icon = info.icon;
          const date = formatDate(payment.transferredAt);
          return (
            <div className="space-y-2">
              <div className={`flex items-start gap-2.5 text-xs px-3 py-3 rounded-xl border ${info.cls}`}>
                <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold">{info.label}</p>
                  <p className="opacity-80 mt-0.5 leading-relaxed">{info.desc}</p>
                  {payment.status === 'transferred' && date && (
                    <p className="opacity-80 mt-0.5">Tanggal transfer: <strong>{date}</strong></p>
                  )}
                </div>
              </div>
              {proofUrl && (
                <a href={proofUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary py-1 hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" /> Lihat bukti transfer
                </a>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
