import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  User, AtSign, Phone, Wallet, CreditCard, UserCheck,
  Loader2, AlertCircle, CheckCircle2, Save, MapPin, ShieldCheck, ChevronDown,
  Link, Video, Mail, LogOut,
} from 'lucide-react';
import api from '../lib/axios';
import CitySelect from '../components/CitySelect';
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import { provinceNameOfCity } from '../data/wilayah';

interface MemberProfile {
  id: string;
  userId: string | null;
  fullName: string | null;
  username: string | null;
  phone: string | null;
  city: string | null;
  profilePictureUrl?: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
  status: string;
}

const EWALLET_OPTIONS = [
  'GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja', 'Sakuku (BCA)', 'Jenius', 'Lainnya',
];

const inputCls = 'w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-accent placeholder:text-neutral-400';
const selectCls = 'w-full pl-10 pr-8 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-accent appearance-none';

export default function Profile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const userRaw = localStorage.getItem('user');
  const currentUser = userRaw ? JSON.parse(userRaw) : null;
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    phone: '',
    city: '',
    instagramHandle: '',
    tiktokHandle: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: '',
  });

  const [eWalletCustom, setEWalletCustom] = useState('');
  const isCustom = form.bankName === 'Lainnya' || (form.bankName !== '' && !EWALLET_OPTIONS.includes(form.bankName));

  const { data: profile, isLoading, isError } = useQuery<MemberProfile>({
    queryKey: ['my-profile'],
    queryFn: async () => (await api.get('/members/me/profile')).data,
  });

  useEffect(() => {
    if (profile) {
      const storedName = profile.bankName ?? '';
      const isKnown = EWALLET_OPTIONS.includes(storedName) || storedName === '';
      setForm({
        fullName: profile.fullName ?? '',
        username: profile.username ?? '',
        phone: profile.phone ?? '',
        city: profile.city ?? '',
        instagramHandle: profile.instagramHandle ?? '',
        tiktokHandle: profile.tiktokHandle ?? '',
        bankName: isKnown ? storedName : 'Lainnya',
        bankAccountNumber: profile.bankAccountNumber ?? '',
        bankAccountHolder: profile.bankAccountHolder ?? '',
      });
      if (!isKnown) setEWalletCustom(storedName);
    }
  }, [profile]);

  const effectiveEWallet = form.bankName === 'Lainnya' ? eWalletCustom : form.bankName;

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Profil belum dimuat.');
      return (await api.patch(`/members/${profile.id}/profile`, {
        ...form,
        bankName: effectiveEWallet,
      })).data;
    },
    onSuccess: () => {
      setSuccessMessage('Profil berhasil disimpan.');
      setErrorMessage('');
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Gagal menyimpan profil.');
      setSuccessMessage('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setErrorMessage('Nama lengkap wajib diisi.'); return; }
    updateMutation.mutate();
  };

  const eWalletComplete = Boolean(effectiveEWallet.trim() && form.bankAccountHolder?.trim());
  const province = form.city ? (provinceNameOfCity(form.city) ?? '') : '';

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
      <Loader2 className="w-6 h-6 animate-spin mb-2" />
      <span className="text-xs font-medium">Memuat profil...</span>
    </div>
  );

  if (isError) return (
    <div className="flex items-start gap-2 bg-red-50 text-danger text-xs p-3 rounded-xl border border-red-100">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>Gagal memuat profil. Coba muat ulang halaman.</span>
    </div>
  );

  return (
    <div className="space-y-4 pb-4">
      {/* Sticky header */}
      <div className="sticky top-[45px] z-20 bg-neutral-50 -mx-4 px-4 pt-3 pb-3 border-b border-neutral-100 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-accent">Profil & eWallet</h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Informasi pribadi dan data eWallet untuk pencairan dana.
          </p>
        </div>
        {eWalletComplete && (
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-success text-[10px] font-bold px-2.5 py-1.5 rounded-xl shrink-0 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            eWallet OK
          </div>
        )}
      </div>

      {/* Alert eWallet belum lengkap */}
      {!eWalletComplete && profile && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <p className="leading-relaxed">
            <strong>Data eWallet belum lengkap.</strong> Isi data eWallet untuk bisa menerima pembayaran dari campaign.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2 bg-red-50 text-danger text-xs p-3 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="flex items-start gap-2 bg-emerald-50 text-success text-xs p-3 rounded-xl border border-emerald-100">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Profile Picture */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4">
        <ProfilePictureUpload
          currentImage={profile?.profilePictureUrl}
          onUpload={async (base64) => {
            await api.post(`/members/profile-picture`, { imageData: base64 });
            queryClient.invalidateQueries({ queryKey: ['my-profile'] });
          }}
          onRemove={async () => {
            await api.post(`/members/profile-picture`, { imageData: '' });
            queryClient.invalidateQueries({ queryKey: ['my-profile'] });
          }}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* DATA PRIBADI */}
        <div className="bg-white border border-neutral-200 rounded-2xl">
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
            <h2 className="text-xs font-bold text-accent uppercase tracking-wider">Data Pribadi</h2>
          </div>
          <div className="p-4 space-y-3.5">
            <Field label="Nama Lengkap" icon={User}>
              <input type="text" value={form.fullName}
                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="Nama lengkap" className={inputCls} />
            </Field>

            <Field label="Email" icon={Mail}>
              <input type="email" value={currentUser?.email ?? ''} readOnly
                className="w-full pl-10 pr-4 py-3 bg-neutral-100 border border-neutral-200 rounded-xl text-sm text-neutral-400 cursor-not-allowed" />
            </Field>

            <Field label="Username" icon={AtSign}>
              <input type="text" value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                placeholder="Username" className={inputCls} />
            </Field>

            <Field label="Nomor WhatsApp" icon={Phone}>
              <input type="tel" value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="08xxxxxxxxxx" className={inputCls} />
            </Field>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-600 block">Kota / Kabupaten</label>
              <CitySelect value={form.city} onChange={(city) => setForm((p) => ({ ...p, city }))} />
            </div>

            {province && (
              <Field label="Provinsi" icon={MapPin}>
                <input type="text" value={province} readOnly
                  className="w-full pl-10 pr-4 py-3 bg-neutral-100 border border-neutral-200 rounded-xl text-sm text-neutral-500 cursor-not-allowed" />
              </Field>
            )}
          </div>
        </div>

        {/* MEDIA SOSIAL */}
        <div className="bg-white border border-neutral-200 rounded-2xl">
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
            <h2 className="text-xs font-bold text-accent uppercase tracking-wider">Media Sosial</h2>
          </div>
          <div className="p-4 space-y-3.5">
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Akun yang kamu gunakan untuk campaign. Isi sesuai username akun kamu (tanpa @).
            </p>
            <Field label="Instagram" icon={Link}>
              <input type="text" value={form.instagramHandle}
                onChange={(e) => setForm((p) => ({ ...p, instagramHandle: e.target.value }))}
                placeholder="username_instagram" className={inputCls} />
            </Field>

            <Field label="TikTok" icon={Video}>
              <input type="text" value={form.tiktokHandle}
                onChange={(e) => setForm((p) => ({ ...p, tiktokHandle: e.target.value }))}
                placeholder="username_tiktok" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* DATA eWALLET */}
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
            <h2 className="text-xs font-bold text-accent uppercase tracking-wider">Data eWallet</h2>
            {eWalletComplete && <ShieldCheck className="w-4 h-4 text-success" />}
          </div>
          <div className="p-4 space-y-3.5">
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Digunakan untuk pencairan dana campaign. Pastikan data sesuai akun eWallet aktif kamu.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-600 block">Nama eWallet</label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <select
                  value={form.bankName}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, bankName: e.target.value }));
                    if (e.target.value !== 'Lainnya') setEWalletCustom('');
                  }}
                  className={selectCls}
                >
                  <option value="">-- pilih eWallet --</option>
                  {EWALLET_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {isCustom && (
              <Field label="Nama eWallet (lainnya)" icon={Wallet}>
                <input
                  type="text"
                  value={eWalletCustom}
                  onChange={(e) => setEWalletCustom(e.target.value)}
                  placeholder="Tulis nama eWallet"
                  className={inputCls}
                />
              </Field>
            )}

            <Field label="Atas Nama" icon={UserCheck}>
              <input type="text" value={form.bankAccountHolder}
                onChange={(e) => setForm((p) => ({ ...p, bankAccountHolder: e.target.value }))}
                placeholder="Nama pemilik akun eWallet" className={inputCls} />
            </Field>

            <Field label="Nomor / ID Akun eWallet" icon={CreditCard}>
              <input type="text" value={form.bankAccountNumber}
                onChange={(e) => setForm((p) => ({ ...p, bankAccountNumber: e.target.value }))}
                placeholder="Nomor HP atau ID akun" className={inputCls} />
            </Field>
          </div>
        </div>

        <button type="submit" disabled={updateMutation.isPending}
          className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm shadow-primary/20 disabled:opacity-60">
          {updateMutation.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
            : <><Save className="w-4 h-4" /> Simpan Perubahan</>}
        </button>
      </form>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 border border-red-200 text-danger text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
      >
        <LogOut className="w-4 h-4" /> Keluar dari Akun
      </button>
    </div>
  );
}

function Field({ label, icon: Icon, children }: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-neutral-600 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        {children}
      </div>
    </div>
  );
}
