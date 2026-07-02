import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2, AlertCircle, TrendingUp, Coins, Target, BarChart3, Zap,
  ChevronRight, Megaphone, Star, ArrowRight, ShieldAlert, Clock, Sparkles,
} from 'lucide-react';
import api from '../lib/axios';

interface Suspension {
  id: number;
  reason: string | null;
  endDate: string;
}

interface TierInfo {
  tier: string;
  tierLabel: string;
  tierColor: string;
  completedCampaigns: number;
  totalCampaigns: number;
  completionRate: number;
  nextTierTarget: number | null;
  progressToNext: number;
}

interface DashboardStats {
  totalEarnings: number;
  potentialEarnings: number;
  completedCampaigns: number;
  activeCampaigns: number;
  rejectedCampaigns: number;
  totalCampaigns: number;
}

interface Profile {
  id: string;
  fullName: string;
  profilePictureUrl?: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  suspension?: Suspension | null;
}

interface Campaign {
  id: string;
  title: string | null;
  feePerBrief: string | null;
  requiredLinks: number;
  status: string;
}

interface Registration {
  id: string;
  status: string;
  campaign: Campaign | null;
  approvedCount: number;
  totalSubmissions: number;
  createdAt: string;
}

function formatRupiah(val: number | null | undefined) {
  if (!val) return '0';
  return new Intl.NumberFormat('id-ID').format(val);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const TIER_NEXT: Record<string, string> = {
  none: 'Bronze',
  bronze: 'Silver',
  silver: 'Gold',
  gold: 'Platinum',
};

const TIER_RATE_REQ: Record<string, number | null> = {
  none: null,
  bronze: 80,
  silver: 90,
  gold: 95,
};

const TIER_ICONS: Record<string, string> = {
  none: '○', bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎',
};

function getBlobColors(tier: string): [string, string, string] {
  switch (tier) {
    case 'platinum': return ['#8b5cf6', '#06b6d4', '#6366f1'];
    case 'gold':     return ['#f59e0b', '#f97316', '#fbbf24'];
    case 'silver':   return ['#94a3b8', '#7c3aed', '#60a5fa'];
    case 'bronze':   return ['#cd7f32', '#f59e0b', '#92400e'];
    default:         return ['#9ca3af', '#6b7280', '#d1d5db'];
  }
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/api$/, '') ?? 'http://localhost:8000';

function resolveImg(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
}

function MetricCard({ icon: Icon, label, value }: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-xl font-bold text-accent">{value}</p>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [showBankWarning] = useState(true);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ['my-profile'],
    queryFn: async () => (await api.get('/members/me/profile')).data,
  });

  const { data: tierInfo, isLoading: tierLoading } = useQuery<TierInfo>({
    queryKey: ['my-tier'],
    queryFn: async () => (await api.get('/members/me/tier')).data,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => (await api.get('/members/me/dashboard-stats')).data,
  });

  const { data: campaigns } = useQuery<Registration[]>({
    queryKey: ['my-campaigns'],
    queryFn: async () => {
      const res = await api.get('/members/me/campaigns');
      return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    },
  });

  const bankComplete = Boolean(
    profile?.bankName?.trim() &&
    profile?.bankAccountNumber?.trim() &&
    profile?.bankAccountHolder?.trim(),
  );

  const suspension = profile?.suspension ?? null;
  const activeCampaigns = campaigns?.filter(c => c.status === 'approved') ?? [];
  const allCompleted = campaigns?.filter(c => c.status === 'completed') ?? [];
  const completedCampaigns = showAllCompleted ? allCompleted : allCompleted.slice(0, 5);
  const isLoading = profileLoading || tierLoading || statsLoading;

  const currentTier = tierInfo?.tier ?? 'none';
  const nextTierName = TIER_NEXT[currentTier];
  const rateReq = TIER_RATE_REQ[currentTier];
  const campaignsLeft = tierInfo?.nextTierTarget
    ? tierInfo.nextTierTarget - tierInfo.completedCampaigns
    : null;
  const [blob1, blob2, blob3] = getBlobColors(currentTier);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        <span className="text-xs font-medium">Memuat dashboard...</span>
      </div>
    );
  }

  const avatarImg = resolveImg(profile?.profilePictureUrl);

  return (
    <div>
      {/* ── MESH GRADIENT HERO ── */}
      <div className="relative overflow-hidden" style={{ minHeight: 300 }}>
        {/* Blobs */}
        <div style={{
          position: 'absolute', top: '-40px', left: '-40px',
          width: 220, height: 220,
          background: `radial-gradient(circle, ${blob1}, transparent)`,
          filter: 'blur(60px)', opacity: 0.85,
        }} />
        <div style={{
          position: 'absolute', top: '20px', right: '-30px',
          width: 180, height: 180,
          background: `radial-gradient(circle, ${blob2}, transparent)`,
          filter: 'blur(55px)', opacity: 0.75,
        }} />
        <div style={{
          position: 'absolute', bottom: '-20px', left: '40%',
          width: 160, height: 160,
          background: `radial-gradient(circle, ${blob3}, transparent)`,
          filter: 'blur(50px)', opacity: 0.65,
        }} />

        {/* Dark gradient overlay for readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(15,15,25,0.55) 0%, rgba(10,10,20,0.72) 100%)',
        }} />

        {/* Content */}
        <div className="relative z-10 px-4 pt-16 pb-7">
          {/* Greeting + badge→avatar group */}
          <div className="flex items-center gap-3 mb-4">
            {/* Greeting left */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/60 font-medium">Selamat datang 👋</p>
              <h1 className="text-2xl font-black text-white leading-tight">
                Halo, {profile?.fullName?.split(' ')[0] ?? 'Member'}!
              </h1>
            </div>

            {/* Badge + Avatar — badge slides behind avatar */}
            <div className="flex items-center shrink-0" style={{ position: 'relative' }}>
              {/* Badge rectangle — gradient flows into avatar ring color */}
              {tierInfo && (
                <div
                  className="flex flex-col items-center justify-center border border-white/20"
                  style={{
                    paddingLeft: 14,
                    paddingRight: 36,
                    paddingTop: 10,
                    paddingBottom: 10,
                    borderRadius: 16,
                    background: `linear-gradient(90deg, rgba(255,255,255,0.08) 0%, ${blob1}cc 100%)`,
                    backdropFilter: 'blur(12px)',
                    marginRight: -28,
                    zIndex: 0,
                    minWidth: 80,
                  }}
                >
                  <span className="text-lg leading-none">{TIER_ICONS[currentTier]}</span>
                  <span className="text-[9px] font-bold text-white mt-1">{tierInfo.tierLabel}</span>
                </div>
              )}

              {/* Avatar on top (z-index higher, covers right edge of badge) */}
              <div style={{
                position: 'relative',
                zIndex: 10,
                padding: 4,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${blob1}, ${blob2})`,
                boxShadow: `0 0 28px ${blob1}77`,
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  overflow: 'hidden', background: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {avatarImg ? (
                    <img src={avatarImg} alt={profile?.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      background: blob1, color: 'white',
                      fontSize: 28, fontWeight: 900,
                    }}>
                      {profile?.fullName?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          {tierInfo && (
            <div className="flex gap-2.5 mb-5">
              <div className="flex-1 rounded-xl px-3 py-2.5 border border-white/15"
                style={{ backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.10)' }}>
                <p className="text-xl font-black text-white tabular">{tierInfo.completedCampaigns}</p>
                <p className="text-[10px] text-white/60 mt-0.5">Campaign selesai</p>
              </div>
              <div className="flex-1 rounded-xl px-3 py-2.5 border border-white/15"
                style={{ backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.10)' }}>
                <p className="text-xl font-black text-white tabular">{tierInfo.completionRate}%</p>
                <p className="text-[10px] text-white/60 mt-0.5">Approval rate</p>
              </div>
            </div>
          )}

          {/* Progress bar — non-platinum */}
          {tierInfo && currentTier !== 'platinum' && (
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-white/60">Progress ke {nextTierName}</span>
                <span className="font-bold text-white">{tierInfo.progressToNext}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }}>
                <div className="h-1.5 rounded-full bg-white transition-all"
                  style={{ width: `${tierInfo.progressToNext}%` }} />
              </div>
              {campaignsLeft !== null && campaignsLeft > 0 && (
                <p className="text-[10px] text-white/50 mt-1.5">
                  {campaignsLeft} campaign lagi untuk {nextTierName}
                  {rateReq ? ` (+ ${rateReq}% rate)` : ''}
                </p>
              )}
            </div>
          )}
          {tierInfo && currentTier === 'platinum' && (
            <p className="text-[11px] text-white/60">
              Kamu sudah di tier tertinggi! Pertahankan terus. 💎
            </p>
          )}
        </div>
      </div>

      {/* ── Rest of content (padded) ── */}
      <div className="px-4 pb-4 space-y-5 mt-4">
        {/* Suspended Banner */}
        {suspension && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div className="space-y-1 flex-1">
              <p className="font-bold text-sm">Akun kamu sedang disuspend</p>
              {suspension.reason && (
                <p className="text-xs opacity-90">Alasan: {suspension.reason}</p>
              )}
              <div className="flex items-center gap-1.5 mt-1.5">
                <Clock className="w-3.5 h-3.5 text-red-500" />
                <p className="text-xs font-semibold">
                  Aktif kembali: {formatDate(suspension.endDate)}
                  {' '}({daysUntil(suspension.endDate)} hari lagi)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning: Bank belum lengkap */}
        {showBankWarning && profile && !bankComplete && !suspension && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <p className="font-bold">Lengkapi data rekening dulu</p>
              <p className="opacity-90 text-xs">Anda belum bisa mengikuti campaign sebelum mengisi data rekening bank.</p>
              <Link to="/profile" className="inline-flex items-center gap-1 font-bold text-amber-900 underline text-xs">
                Isi sekarang <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={Coins} label="Total Earnings" value={`Rp ${formatRupiah(stats.totalEarnings)}`} />
            <MetricCard icon={TrendingUp} label="Potensi Cuan" value={`Rp ${formatRupiah(stats.potentialEarnings)}`} />
            <MetricCard icon={Target} label="Campaign Diikuti" value={stats.totalCampaigns} />
            <MetricCard icon={BarChart3} label="Completion Rate" value={`${tierInfo?.completionRate ?? 0}%`} />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/campaigns')}
            disabled={!!suspension}
            className="bg-primary hover:bg-primary-hover text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Megaphone className="w-4 h-4" />
            <span className="text-sm">Browse Campaign</span>
          </button>
          <Link
            to="/my-campaign"
            className="bg-white border border-primary text-primary font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-primary-light transition-all"
          >
            <Zap className="w-4 h-4" />
            <span className="text-sm">Campaign Saya</span>
          </Link>
        </div>

        {/* Active Campaigns */}
        {activeCampaigns.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-accent">Campaign Sedang Berjalan</h2>
              <button
                onClick={() => navigate('/my-campaign')}
                className="text-primary text-xs font-semibold flex items-center gap-1 hover:underline"
              >
                Lihat Semua <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {activeCampaigns.slice(0, 3).map(reg => (
                <div key={reg.id} className="bg-white border border-neutral-200 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-accent truncate">{reg.campaign?.title || 'Campaign'}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-full bg-neutral-100 rounded-full h-1">
                          <div
                            className="bg-primary h-1 rounded-full"
                            style={{
                              width: `${Math.min(100, (reg.approvedCount / (reg.campaign?.requiredLinks ?? 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500 whitespace-nowrap">
                          {reg.approvedCount}/{reg.campaign?.requiredLinks}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community CreativeHub Teaser */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 p-4"
          style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}>
          {/* Subtle glow blobs */}
          <div style={{
            position: 'absolute', top: -20, right: -20, width: 100, height: 100,
            background: 'radial-gradient(circle, rgba(255,107,53,0.3), transparent)',
            filter: 'blur(30px)',
          }} />
          <div style={{
            position: 'absolute', bottom: -10, left: 10, width: 80, height: 80,
            background: 'radial-gradient(circle, rgba(139,92,246,0.25), transparent)',
            filter: 'blur(25px)',
          }} />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Community CreativeHub</h3>
                <span className="text-[9px] font-bold bg-primary/80 text-white px-1.5 py-0.5 rounded-md">SOON</span>
              </div>
              <p className="text-[11px] text-white/60 mt-0.5">Ada something big yang kami siapkan ✨</p>
            </div>
          </div>
        </div>

        {/* Completed Campaigns */}
        {allCompleted.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-accent">Campaign Selesai</h2>
              <button
                onClick={() => navigate('/my-campaign')}
                className="text-primary text-xs font-semibold flex items-center gap-1 hover:underline"
              >
                Lihat Semua <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {completedCampaigns.map(reg => (
                <div key={reg.id} className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-accent truncate">{reg.campaign?.title || 'Campaign'}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Selesai · Rp {formatRupiah(parseFloat(reg.campaign?.feePerBrief || '0'))}
                      </p>
                    </div>
                    <Star className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
            {allCompleted.length > 5 && (
              <button
                onClick={() => setShowAllCompleted(v => !v)}
                className="w-full py-2.5 text-xs font-semibold text-neutral-500 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all flex items-center justify-center gap-1"
              >
                {showAllCompleted
                  ? 'Sembunyikan'
                  : `Lihat ${allCompleted.length - 5} campaign lainnya`}
                <ChevronRight className={`w-3 h-3 transition-transform ${showAllCompleted ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!activeCampaigns.length && !completedCampaigns.length && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Megaphone className="w-10 h-10 text-neutral-300 mb-3" />
            <p className="text-sm font-medium text-neutral-500">Belum ada campaign</p>
            <p className="text-xs text-neutral-400 mt-1">Mulai dari menu "Browse Campaign" untuk ikut campaign menarik</p>
          </div>
        )}
      </div>
    </div>
  );
}
