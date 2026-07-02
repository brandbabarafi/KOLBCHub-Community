import { spellCode } from '../lib/spellCode';

/**
 * Kartu voucher: gambar background + kode ter-overlay di kanan bawah + ejaan.
 * Posisi overlay mengikuti template (2 kotak di kanan bawah, seperti desain Baba Rafi).
 * Dipakai di: preview admin (internal) & halaman voucher member (community).
 */
export function VoucherCard({
  imageUrl, code,
}: {
  imageUrl: string | null | undefined;
  code: string | null | undefined;
}) {
  const spelled = spellCode(code);

  if (!imageUrl) {
    return (
      <div className="w-full aspect-[2/1] rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 flex items-center justify-center text-center px-4">
        <span className="text-sm text-neutral-400">
          Gambar voucher belum diatur untuk campaign ini.
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-card">
      {/* Gambar voucher */}
      <img src={imageUrl} alt="Voucher" className="w-full h-auto block" />

      {/* Overlay area kode (kanan bawah, mengikuti template) */}
      <div
        className="absolute"
        style={{
          left: '56%',
          right: '4%',
          top: '70%',
          bottom: '6%',
          display: 'flex',
          flexDirection: 'column',
          gap: '4%',
        }}
      >
        {/* Kotak atas: kode voucher */}
        <div className="flex-1 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-sm px-2">
          <span className="font-mono font-bold text-accent leading-none tracking-wider"
            style={{ fontSize: 'clamp(10px, 3.2vw, 26px)' }}>
            {code || '—'}
          </span>
        </div>
        {/* Kotak bawah: ejaan kode */}
        <div className="flex-1 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-sm px-2 overflow-hidden">
          <span className="text-accent/80 leading-tight text-center"
            style={{ fontSize: 'clamp(6px, 1.5vw, 12px)' }}>
            {spelled || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
