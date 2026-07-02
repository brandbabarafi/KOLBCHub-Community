import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Loader2, AlertCircle, Medal, Star } from 'lucide-react';
import api from '../lib/axios';

interface LeaderboardEntry {
  id: string;
  fullName: string;
  city: string | null;
  profilePictureUrl: string | null;
  tier: string;
  tierLabel: string;
  tierColor: string;
  tierLevel: number;
  completedCampaigns: number;
  completionRate: number;
}

const TIER_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'platinum', label: '💎 Platinum' },
  { key: 'gold', label: '🥇 Gold' },
  { key: 'silver', label: '🥈 Silver' },
  { key: 'bronze', label: '🥉 Bronze' },
];

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/api$/, '') ?? 'http://localhost:8000';

function resolveImg(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
}

function Avatar({
  entry,
  size,
  ringWidth = 3,
}: {
  entry: LeaderboardEntry;
  size: number;
  ringWidth?: number;
}) {
  const img = resolveImg(entry.profilePictureUrl);
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        padding: ringWidth,
        background: `linear-gradient(135deg, ${entry.tierColor}, ${entry.tierColor}88)`,
        boxShadow: `0 4px 16px ${entry.tierColor}44`,
      }}
    >
      <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
        {img ? (
          <img src={img} alt={entry.fullName} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-black text-white"
            style={{ fontSize: size * 0.35, backgroundColor: entry.tierColor }}
          >
            {entry.fullName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

function PodiumSlot({
  entry,
  rank,
  platformHeight,
  avatarSize,
  isMe,
}: {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
  platformHeight: number;
  avatarSize: number;
  isMe: boolean;
}) {
  const crownColors: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
  const crownIcons: Record<number, string> = { 1: '👑', 2: '🥈', 3: '🥉' };
  const platformAlpha: Record<number, string> = { 1: 'ff', 2: 'dd', 3: 'bb' };

  return (
    <div className="flex flex-col items-center flex-1">
      {/* Crown / medal */}
      <div className="text-xl mb-1 drop-shadow">{crownIcons[rank]}</div>

      {/* Avatar */}
      <div className="relative">
        <Avatar entry={entry} size={avatarSize} ringWidth={rank === 1 ? 4 : 3} />
        {isMe && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white flex items-center justify-center">
            <Star className="w-2 h-2 text-white fill-white" />
          </div>
        )}
      </div>

      {/* Name + info */}
      <p className="text-xs font-black text-accent text-center mt-2 leading-tight line-clamp-2 w-full px-1">
        {entry.fullName}
        {isMe && <span className="text-primary"> ✦</span>}
      </p>
      <p className="text-[10px] font-bold mt-0.5" style={{ color: entry.tierColor }}>
        {entry.tierLabel}
      </p>
      <p className="text-[10px] text-neutral-500 mt-0.5">
        {entry.completedCampaigns} ✓
      </p>

      {/* Platform pedestal */}
      <div
        className="w-full mt-3 rounded-t-2xl flex items-center justify-center"
        style={{
          height: platformHeight,
          background: `linear-gradient(180deg, ${entry.tierColor}${platformAlpha[rank]} 0%, ${entry.tierColor}66 100%)`,
        }}
      >
        <span className="text-white font-black text-xl opacity-60">#{rank}</span>
      </div>
    </div>
  );
}

// Gradient intensity per rank for list rows
function rowGradient(idx: number, tierColor: string): string {
  const alpha = Math.max(8, 28 - idx * 3);
  const alphaHex = alpha.toString(16).padStart(2, '0');
  return `linear-gradient(90deg, ${tierColor}${alphaHex} 0%, transparent 70%)`;
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('all');

  const userRaw = localStorage.getItem('user');
  const currentUser = userRaw ? JSON.parse(userRaw) : null;

  const { data, isLoading, isError } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: async () => (await api.get('/members/leaderboard/all')).data,
  });

  const filtered = (data ?? []).filter(
    (e) => activeTab === 'all' || e.tier === activeTab,
  );

  // Match current user by name (JWT stores name, not memberId)
  const myEntry = data?.find((e) => e.fullName === currentUser?.name);
  const myRank = myEntry ? filtered.findIndex((e) => e.id === myEntry.id) + 1 : -1;

  const podiumEntries = filtered.slice(0, 3);
  const listEntries = filtered.slice(3);
  const showPodium = activeTab === 'all' && podiumEntries.length >= 1;

  return (
    <div className="space-y-0 -mx-4">
      {/* ── Sticky header ── */}
      <div className="sticky top-[45px] z-20 bg-neutral-50 px-4 pt-3 pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <h1 className="text-base font-bold text-accent">Leaderboard</h1>
          {data && (
            <span className="text-[11px] text-neutral-400 ml-1">{data.length} member</span>
          )}
        </div>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          Ranking member berdasarkan tier &amp; campaign selesai
        </p>
      </div>

      {/* ── Tier filter tabs ── */}
      <div className="px-4 py-3 flex gap-1.5 flex-wrap bg-neutral-50 border-b border-neutral-100">
        {TIER_TABS.map((t) => {
          const count =
            t.key === 'all'
              ? (data?.length ?? 0)
              : (data?.filter((e) => e.tier === t.key).length ?? 0);
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all border ${
                activeTab === t.key
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-neutral-500 border-neutral-200'
              }`}
            >
              {t.label}
              <span className="ml-1 opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Loading / Error / Empty ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400 px-4">
          <Loader2 className="w-6 h-6 animate-spin mb-2" />
          <span className="text-xs">Memuat ranking...</span>
        </div>
      )}
      {isError && (
        <div className="mx-4 mt-4 flex items-start gap-2 bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          Gagal memuat leaderboard.
        </div>
      )}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-neutral-400 px-4">
          <Medal className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-medium text-neutral-500">Belum ada member di tier ini</p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <>
          {/* ── Podium section ── */}
          {showPodium && (
            <div
              className="px-4 pt-6 animate-fade-in-up"
              style={{
                background: 'linear-gradient(180deg, #fff7f3 0%, #ffffff 100%)',
              }}
            >
              <div className="flex items-end gap-1">
                {/* Slot order: 2nd | 1st | 3rd */}
                {podiumEntries.length >= 2 ? (
                  <div className="flex-1 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <PodiumSlot
                      entry={podiumEntries[1]}
                      rank={2}
                      platformHeight={72}
                      avatarSize={60}
                      isMe={myEntry?.id === podiumEntries[1].id}
                    />
                  </div>
                ) : <div className="flex-1" />}

                {podiumEntries.length >= 1 && (
                  <div className="flex-1 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                    <PodiumSlot
                      entry={podiumEntries[0]}
                      rank={1}
                      platformHeight={96}
                      avatarSize={72}
                      isMe={myEntry?.id === podiumEntries[0].id}
                    />
                  </div>
                )}

                {podiumEntries.length >= 3 ? (
                  <div className="flex-1 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <PodiumSlot
                      entry={podiumEntries[2]}
                      rank={3}
                      platformHeight={52}
                      avatarSize={56}
                      isMe={myEntry?.id === podiumEntries[2].id}
                    />
                  </div>
                ) : <div className="flex-1" />}
              </div>
            </div>
          )}

          {/* ── "My Position" banner (only if outside top 3 and in all tab) ── */}
          {activeTab === 'all' && myRank > 3 && myEntry && (
            <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 border border-primary/30 animate-fade-in-up"
              style={{ background: 'linear-gradient(90deg, rgba(255,107,53,0.12) 0%, transparent 100%)' }}>
              <Avatar entry={myEntry} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary font-bold">Posisi kamu</p>
                <p className="text-sm font-black text-accent">
                  #{myRank} dari {filtered.length} member
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                <span className="text-white font-black text-sm">#{myRank}</span>
              </div>
            </div>
          )}

          {/* ── List (rank 4+, or all when tab filtered) ── */}
          <div className="mt-3 space-y-1 px-4 pb-6">
            {(showPodium ? listEntries : filtered).map((entry, idx) => {
              const rank = showPodium ? idx + 4 : idx + 1;
              const isMe = myEntry?.id === entry.id;
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 animate-fade-in-up"
                  style={{
                    background: isMe
                      ? `linear-gradient(90deg, ${entry.tierColor}33 0%, ${entry.tierColor}11 100%)`
                      : rowGradient(idx, entry.tierColor),
                    border: isMe ? `1.5px solid ${entry.tierColor}66` : '1.5px solid transparent',
                    animationDelay: `${Math.min(idx * 40, 400)}ms`,
                  }}
                >
                  {/* Rank number */}
                  <div className="w-7 text-center shrink-0">
                    <span className="text-sm font-black text-neutral-400">{rank}</span>
                  </div>

                  {/* Avatar */}
                  <Avatar entry={entry} size={48} ringWidth={2} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-black text-accent truncate">
                        {entry.fullName}
                      </p>
                      {isMe && (
                        <span className="text-[9px] bg-primary text-white font-bold px-1.5 py-0.5 rounded-lg">
                          Kamu
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg"
                        style={{ color: entry.tierColor, backgroundColor: entry.tierColor + '20' }}
                      >
                        {entry.tierLabel}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {entry.city ?? 'Indonesia'}
                      </span>
                    </div>
                  </div>

                  {/* Metric */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-accent tabular">{entry.completedCampaigns}</p>
                    <p className="text-[10px] text-neutral-400 -mt-0.5">campaign</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
