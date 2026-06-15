import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { flashcardApi } from '../api/flashcardApi';
import PageHeader from '../components/PageHeader';

const PERIODS = [
  { value: 7, label: '7 ngày' },
  { value: 30, label: '30 ngày' },
  { value: 90, label: '90 ngày' },
];

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1.5 h-6 flex-shrink-0" style={{ background: 'var(--secondary)' }} />
      <h2 className="text-lg font-headline font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      <div className="flex-1 h-px ml-1" style={{ background: 'linear-gradient(to right,rgba(0,0,0,0.08),transparent)' }} />
    </div>
  );
}

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="text-xs font-bold text-on-surface-variant">#{rank}</span>;
}

export default function LeaderboardPage() {
  const { isAuthenticated, user } = useAuth();
  const [period, setPeriod] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => flashcardApi.getLeaderboard(period, 20),
    staleTime: 60_000,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const rows = data?.leaderboard || [];
  const me = rows.find((r) => r.userId === user?.id);

  return (
    <div className="max-w-4xl mx-auto w-full p-6 md:p-8 space-y-8">
      {/* Hero */}
      <PageHeader
        tag="Gamification"
        title="Bảng xếp hạng"
        subtitle="Xếp hạng theo XP tích lũy từ lượt ôn tập"
        ghostChar="位"
      />

      {/* My rank summary */}
      {me && (
        <section>
          <SectionHeader title="Vị trí của bạn" />
          <div className="bg-surface-container-lowest p-5" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RankBadge rank={me.rank} />
                <div>
                  <p className="text-sm font-bold text-on-surface">#{me.rank} · {me.name}</p>
                  <p className="text-xs text-on-surface-variant">Level {me.level} · {me.reviews} lượt ôn</p>
                </div>
              </div>
              <p className="text-lg font-black" style={{ color: 'var(--secondary)' }}>{me.xp} XP</p>
            </div>
          </div>
        </section>
      )}

      {/* Leaderboard */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <SectionHeader title="Top người học" />
          <div className="flex gap-1 bg-surface-container p-0.5" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className="px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  background: period === p.value ? 'var(--surface-container-lowest)' : 'transparent',
                  color: period === p.value ? 'var(--secondary)' : 'var(--on-surface-variant)',
                  boxShadow: period === p.value ? '1px 1px 0 0 rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-5 h-5 border-2 border-outline-variant border-t-secondary animate-spin rounded-full" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <p className="text-3xl mb-2">🏁</p>
              <p className="text-sm">Chưa có dữ liệu xếp hạng</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              {rows.map((row) => (
                <div
                  key={row.userId}
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{ background: row.userId === user?.id ? 'rgba(198,40,40,0.06)' : 'transparent' }}
                >
                  <div className="flex items-center gap-3">
                    <RankBadge rank={row.rank} />
                    {row.avatarUrl ? (
                      <img src={row.avatarUrl} alt={row.name} className="w-8 h-8 object-cover" />
                    ) : (
                      <div
                        className="w-8 h-8 flex items-center justify-center text-xs font-black"
                        style={{ background: 'rgba(26,35,126,0.08)', color: 'var(--primary)' }}
                      >
                        {(row.name?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{row.name}</p>
                      <p className="text-xs text-on-surface-variant">Lv.{row.level} · {row.reviews} lượt ôn</p>
                    </div>
                  </div>
                  <p className="text-sm font-black" style={{ color: 'var(--secondary)' }}>{row.xp} XP</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
