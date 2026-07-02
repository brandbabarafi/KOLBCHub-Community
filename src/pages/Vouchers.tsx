import { useQuery } from '@tanstack/react-query';
import { Ticket, Loader2, AlertCircle, Clock } from 'lucide-react';
import api from '../lib/axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/api$/, '') ?? 'http://localhost:8000';

function resolveUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}
import { VoucherCard as VoucherVisual } from '../components/VoucherCard';
import { spellCode } from '../lib/spellCode';

interface Registration {
  id: string;
  status: string;
  campaign: { id: string; title: string | null } | null;
}
interface Voucher {
  id: string;
  voucherType: 'text' | 'image';
  voucherCode: string | null;
  imageUrl: string | null;
  voucherImageUrl: string | null;
  assignedAt: string | null;
}

export default function Vouchers() {
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
        <span className="text-xs font-medium">Memuat voucher...</span>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex items-start gap-2 bg-red-50 text-danger text-xs p-3 rounded-xl border border-red-100">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Gagal memuat voucher. Coba muat ulang halaman.</span>
      </div>
    );
  }

  const regs = (registrations ?? []).filter(
    (r) => r.status === 'approved' || r.status === 'completed',
  );

  return (
    <div className="space-y-4">
      <div className="sticky top-[45px] z-20 bg-neutral-50 -mx-4 px-4 pt-3 pb-3 border-b border-neutral-100 animate-fade-in-up">
        <h1 className="text-base font-bold text-accent">Voucher Saya</h1>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          Voucher yang kamu terima dari campaign yang sudah disetujui.
        </p>
      </div>

      {regs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {regs.map((reg, idx) => (
            <div key={reg.id} className={`animate-fade-in-up delay-${Math.min(idx * 100, 500)}`}>
              <VoucherItem registrationId={reg.id} title={reg.campaign?.title || 'Campaign'} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
      <Ticket className="w-10 h-10 mb-3 opacity-40" />
      <p className="text-sm font-medium text-neutral-500">Belum ada voucher</p>
      <p className="text-xs mt-1">Voucher muncul setelah pendaftaran campaign disetujui.</p>
    </div>
  );
}

function VoucherItem({ registrationId, title }: { registrationId: string; title: string }) {
  const { data: voucher, isLoading, isError } = useQuery<Voucher | null>({
    queryKey: ['voucher', registrationId],
    queryFn: async () => {
      try {
        const res = await api.get(`/members/me/registrations/${registrationId}/voucher`);
        return res.data ?? null;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    retry: false,
  });

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
          <Ticket className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-bold text-accent leading-tight">{title}</h3>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-neutral-400 py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat voucher...
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex items-center gap-2 text-xs text-danger py-2">
          <AlertCircle className="w-4 h-4" /> Gagal memuat voucher ini.
        </div>
      )}

      {!isLoading && !isError && !voucher && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          <Clock className="w-4 h-4 shrink-0" />
          Voucher belum tersedia. Tunggu admin menetapkan voucher.
        </div>
      )}

      {/* Case 1: voucher tipe IMAGE — tampilkan gambar langsung */}
      {voucher && voucher.voucherType === 'image' && voucher.imageUrl && (
        <div className="rounded-2xl overflow-hidden border border-neutral-100 shadow-sm">
          <img
            src={resolveUrl(voucher.imageUrl)!}
            alt="Voucher"
            className="w-full h-auto block"
          />
        </div>
      )}

      {/* Case 2: template campaign + kode overlay */}
      {voucher && voucher.voucherType !== 'image' && voucher.voucherImageUrl && (
        <>
          <VoucherVisual imageUrl={resolveUrl(voucher.voucherImageUrl)} code={voucher.voucherCode} />
          {voucher.voucherCode && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-center space-y-1">
              <div className="font-mono font-bold text-lg tracking-wider text-accent select-all">
                {voucher.voucherCode}
              </div>
              <div className="text-[11px] text-neutral-500 leading-snug">
                {spellCode(voucher.voucherCode)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Case 3: hanya kode teks (belum ada gambar template dari admin) */}
      {voucher && voucher.voucherType !== 'image' && !voucher.voucherImageUrl && voucher.voucherCode && (
        <div className="bg-neutral-50 border-2 border-dashed border-primary/30 rounded-xl px-4 py-3 text-center space-y-1">
          <div className="font-mono font-bold text-lg tracking-wider text-accent select-all">
            {voucher.voucherCode}
          </div>
          <div className="text-[11px] text-neutral-500 leading-snug">
            {spellCode(voucher.voucherCode)}
          </div>
        </div>
      )}
    </div>
  );
}
