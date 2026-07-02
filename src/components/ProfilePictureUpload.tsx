import { useState, useRef, useEffect } from 'react';
import { Camera, Trash2, X, Check, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  currentImage?: string | null;
  onUpload: (base64Data: string) => Promise<void>;
  onRemove?: () => Promise<void>;
  isLoading?: boolean;
}

export default function ProfilePictureUpload({ currentImage, onUpload, onRemove, isLoading = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<'idle' | 'crop'>('idle');
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [cropPx, setCropPx] = useState(280);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const drag = useRef({ active: false, sx: 0, sy: 0, sox: 0, soy: 0 });

  // Sync preview with currentImage from parent (when profile loads)
  useEffect(() => {
    if (step === 'idle') setPreview(currentImage ?? null);
  }, [currentImage, step]);

  // Measure crop container after entering crop step
  useEffect(() => {
    if (step !== 'crop' || !cropRef.current || naturalSize.w === 0) return;
    const rect = cropRef.current.getBoundingClientRect();
    const size = Math.round(rect.width);
    setCropPx(size);
    const s = Math.max(size / naturalSize.w, size / naturalSize.h);
    setScale(s);
    setOffset({
      x: (size - naturalSize.w * s) / 2,
      y: (size - naturalSize.h * s) / 2,
    });
  }, [step, naturalSize]);

  const clamp = (ox: number, oy: number, s: number, c: number) => ({
    x: Math.min(0, Math.max(ox, c - naturalSize.w * s)),
    y: Math.min(0, Math.max(oy, c - naturalSize.h * s)),
  });

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { active: true, sx: e.clientX, sy: e.clientY, sox: offset.x, soy: offset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    setOffset(clamp(drag.current.sox + dx, drag.current.soy + dy, scale, cropPx));
  };

  const onPointerUp = () => { drag.current.active = false; };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format harus JPEG, PNG, atau WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran maksimal 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
        setRawSrc(src);
        setStep('crop');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const doCrop = async () => {
    if (!rawSrc) return;
    setUploading(true);
    setError(null);
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = rawSrc;
      });
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      const srcX = -offset.x / scale;
      const srcY = -offset.y / scale;
      const srcSize = cropPx / scale;
      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, 256, 256);
      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      await onUpload(base64);
      setPreview(base64);
      setStep('idle');
      setRawSrc(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message || 'Gagal memproses foto');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setError(null);
    if (onRemove) {
      setRemoving(true);
      try {
        await onRemove();
        setPreview(null);
      } catch (err: any) {
        setError(err.message || 'Gagal menghapus foto');
      } finally {
        setRemoving(false);
      }
    } else {
      setPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // — Crop step —
  if (step === 'crop' && rawSrc) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-bold text-accent">Atur posisi foto profil</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Drag foto untuk mengatur posisi yang kamu inginkan</p>
        </div>

        <div
          ref={cropRef}
          className="relative w-full overflow-hidden rounded-2xl bg-neutral-900 cursor-grab active:cursor-grabbing select-none mx-auto"
          style={{ aspectRatio: '1', maxWidth: 300 }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <img
            src={rawSrc}
            alt="Crop preview"
            draggable={false}
            style={{
              position: 'absolute',
              left: offset.x,
              top: offset.y,
              width: naturalSize.w * scale,
              height: naturalSize.h * scale,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
          {/* Rule-of-thirds grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
              `,
              backgroundSize: `33.33% 33.33%`,
            }}
          />
          {/* Corner marks */}
          {[['top-2 left-2', 'border-t-2 border-l-2'], ['top-2 right-2', 'border-t-2 border-r-2'], ['bottom-2 left-2', 'border-b-2 border-l-2'], ['bottom-2 right-2', 'border-b-2 border-r-2']].map(([pos, border]) => (
            <div key={pos} className={`absolute ${pos} w-5 h-5 border-white rounded-sm pointer-events-none ${border}`} />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-danger bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => { setStep('idle'); setRawSrc(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
            className="flex-1 py-2.5 border border-neutral-200 text-accent text-xs font-bold rounded-xl hover:bg-neutral-100 transition-all flex items-center justify-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" /> Batal
          </button>
          <button
            onClick={doCrop}
            disabled={uploading}
            className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {uploading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengupload...</>
              : <><Check className="w-3.5 h-3.5" /> Crop & Simpan</>}
          </button>
        </div>
      </div>
    );
  }

  // — Idle step —
  return (
    <div className="flex flex-col items-center gap-3 py-1">
      {/* Avatar circle */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-neutral-300 hover:border-primary hover:bg-primary-light/10 transition-all group"
        title="Klik untuk upload foto"
      >
        {preview ? (
          <img src={preview} alt="Foto profil" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 group-hover:text-primary transition-colors">
            <Camera className="w-6 h-6" />
            <span className="text-[9px] mt-1 font-semibold uppercase tracking-wide">Foto</span>
          </div>
        )}
        {/* Hover overlay on existing photo */}
        {preview && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
            <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-all" />
          </div>
        )}
      </button>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary-hover transition-all flex items-center gap-1.5 disabled:opacity-60"
        >
          <Camera className="w-3.5 h-3.5" />
          {preview ? 'Ganti Foto' : 'Upload Foto'}
        </button>
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="px-4 py-2 text-xs font-bold border border-red-200 text-danger bg-red-50 hover:bg-red-100 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-60"
          >
            {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Hapus
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-danger bg-red-50 border border-red-100 rounded-xl px-3 py-2 w-full">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <p className="text-[10px] text-neutral-400">Max 5MB · JPEG, PNG, atau WebP</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
