import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, User, Phone, AlertCircle, Loader2, CheckCircle2, MapPin, Eye, EyeOff, Instagram, Video } from 'lucide-react';
import api from '../lib/axios';
import { provinceNameOfCity } from '../data/wilayah';
import CitySelect from '../components/CitySelect';

export default function Login() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'MASUK' | 'DAFTAR'>('MASUK');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');


  const [regFullName, setRegFullName] = useState('');
  const [regWhatsApp, setRegWhatsApp] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regInstagram, setRegInstagram] = useState('');
  const [regTikTok, setRegTikTok] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regProvince, setRegProvince] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
  }, [activeTab]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.user?.role !== 'community') {
        setErrorMessage('Akses ditolak. Halaman ini khusus untuk Brand Community Member.');
        localStorage.clear();
        return;
      }
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Email atau password salah.');
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/register-community', {
        full_name: regFullName,
        phone: regWhatsApp,
        email: regEmail,
        password: regPassword,
        city: regCity,
        instagramHandle: regInstagram || undefined,
        tiktokHandle: regTikTok || undefined,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.user?.role !== 'community') {
        setErrorMessage('Akses ditolak. Halaman ini khusus untuk Brand Community Member.');
        localStorage.clear();
        return;
      }
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Gagal mendaftar.');
    },
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMessage('Semua kolom wajib diisi.');
      return;
    }
    loginMutation.mutate();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regWhatsApp || !regEmail || !regPassword || !regConfirmPassword) {
      setErrorMessage('Semua kolom wajib diisi.');
      return;
    }
    if (!regCity) { setErrorMessage('Silakan pilih kota domisili.'); return; }
    if (regPassword.length < 8) { setErrorMessage('Password minimal 8 karakter.'); return; }
    if (regPassword !== regConfirmPassword) { setErrorMessage('Konfirmasi password tidak cocok.'); return; }
    registerMutation.mutate();
  };

  const inputCls = 'w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-accent placeholder:text-neutral-400';
  const inputPrCls = 'w-full pl-10 pr-10 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-accent placeholder:text-neutral-400';
  const labelCls = 'text-xs font-semibold text-neutral-600 block mb-1.5';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-neutral-50 font-sans selection:bg-primary-light flex flex-col">

      {/* MOBILE HERO — hanya tampil di layar kecil (< lg) */}
      <div className="lg:hidden bg-white border-b border-neutral-100 px-6 pt-8 pb-6">
        <img
          src="/logo.png"
          alt="Logo Baba Rafi Brand Community"
          className="h-16 w-auto object-contain self-start"
          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
        />
        <div className="inline-flex items-center gap-1.5 bg-primary-light px-3 py-1 rounded-full mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Brand Community</span>
        </div>
        <h1 className="text-2xl font-black text-accent leading-tight">
          Creator Pemula?<br />
          <span className="text-primary italic">Bisa Support System!</span>
        </h1>
        <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
          Voucher, fee kunjungan, & pembayaran konten — semuanya ada di sini.
        </p>
      </div>

      {/* GRID UTAMA */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:py-0">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Kolom kiri — hanya tampil desktop */}
          <div className="hidden lg:flex lg:col-span-7 flex-col items-start space-y-7 pr-8">
            <img
              src="/logo.png"
              alt="Logo Baba Rafi Brand Community"
              className="h-16 w-auto object-contain"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-primary-light px-3 py-1.5 rounded-full mb-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest">#1 Brand Community Kebab Indonesia</span>
              </div>
              <h1 className="text-3xl xl:text-4xl font-black tracking-tight text-accent leading-[1.08] uppercase">
                Kini Semua Creator Pemula
              </h1>
              <h1 className="text-3xl xl:text-4xl font-black tracking-tight text-primary leading-[1.08] uppercase italic">
                Bisa Punya Support System!
              </h1>
            </div>
            <p className="text-base text-neutral-600 max-w-lg leading-relaxed font-medium">
              Gabung di Brand Community Baba Rafi dan dapatkan support voucher sampai fee perjalanan.
            </p>

            {/* Stats strip */}
            <div className="flex gap-6 pt-2">
              {[
                { value: '500+', label: 'Member Aktif' },
                { value: 'Rp 0', label: 'Biaya Daftar' },
                { value: '100%', label: 'Gratis' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-black text-primary">{s.value}</div>
                  <div className="text-xs text-neutral-500 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-xl shadow-neutral-100">

              {/* Tab */}
              <div className="flex p-1 bg-neutral-100 rounded-2xl mb-6 gap-1">
                {(['MASUK', 'DAFTAR'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                      activeTab === tab
                        ? 'bg-white text-accent shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Alert */}
              {errorMessage && (
                <div className="flex items-start gap-2 bg-red-50 text-danger text-xs p-3 rounded-xl border border-red-100 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="flex items-start gap-2 bg-emerald-50 text-success text-xs p-3 rounded-xl border border-emerald-100 mb-4">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {activeTab === 'MASUK' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className={labelCls}>Email Koresponden</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input type="email" placeholder="nama@email.com" value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)} className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input type={showLoginPassword ? 'text' : 'password'} placeholder="••••••••"
                        value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={inputPrCls} />
                      <button type="button" onClick={() => setShowLoginPassword((v) => !v)} tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="text-right mt-1.5">
                      <a href={`https://wa.me/6281234567890?text=${encodeURIComponent(`Kak akun saya ${loginEmail || '[Email]'} saya ingin reset password saya.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-neutral-400 hover:text-primary transition-colors font-medium">
                        Reset password?
                      </a>
                    </div>
                  </div>

                  <button type="submit" disabled={loginMutation.isPending}
                    className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm shadow-primary/30 disabled:opacity-60 mt-1">
                    {loginMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi...</> : 'Masuk Ke Dashboard'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className={labelCls}>Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input type="text" placeholder="Nama lengkap Anda" value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)} className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Nomor WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input type="tel" placeholder="08xxxxxxxxxx" value={regWhatsApp}
                        onChange={(e) => setRegWhatsApp(e.target.value)} className={inputCls} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Akun Instagram</label>
                      <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input type="text" placeholder="@username" value={regInstagram}
                          onChange={(e) => setRegInstagram(e.target.value)} className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Akun TikTok</label>
                      <div className="relative">
                        <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input type="text" placeholder="@username" value={regTikTok}
                          onChange={(e) => setRegTikTok(e.target.value)} className={inputCls} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Email Utama</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input type="email" placeholder="nama.kreator@email.com" value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)} className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Kota / Kabupaten Domisili</label>
                    <CitySelect value={regCity} onChange={(city) => {
                      setRegCity(city);
                      setRegProvince(city ? (provinceNameOfCity(city) ?? '') : '');
                    }} />
                  </div>

                  <div>
                    <label className={labelCls}>Provinsi</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input type="text" value={regProvince} readOnly placeholder="Terisi otomatis dari kota"
                        className="w-full pl-10 pr-4 py-3 bg-neutral-100 border border-neutral-200 rounded-xl text-sm text-neutral-500 cursor-not-allowed" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input type={showRegPassword ? 'text' : 'password'} placeholder="Min. 8 karakter"
                          value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className={inputPrCls} />
                        <button type="button" onClick={() => setShowRegPassword((v) => !v)} tabIndex={-1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Konfirmasi</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input type={showRegConfirm ? 'text' : 'password'} placeholder="Ulangi password"
                          value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} className={inputPrCls} />
                        <button type="button" onClick={() => setShowRegConfirm((v) => !v)} tabIndex={-1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                          {showRegConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={registerMutation.isPending}
                    className="w-full py-3.5 bg-accent hover:bg-neutral-800 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 mt-1">
                    {registerMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : 'Daftar Sekarang'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center text-[11px] text-neutral-400 font-medium py-6">
        &copy; 2026 PT Kebab Turki Baba Rafi & Ngikan. All Rights Reserved.
      </footer>
    </div>
  );
}
