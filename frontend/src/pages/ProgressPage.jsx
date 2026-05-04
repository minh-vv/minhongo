import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { flashcardApi } from '../api/flashcardApi';

// ===== Helpers =====

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatDateFull(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' });
}

const PERIODS = [
  { value: 7,  label: '7 ngày' },
  { value: 14, label: '14 ngày' },
  { value: 30, label: '30 ngày' },
];

// ===== Bar Chart (SVG, không cần thư viện) =====
function BarChart({ data, accentColor = 'var(--secondary)' }) {
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const CHART_H = 120;
  const BAR_W = 100 / data.length;

  if (data.every((d) => d.total === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant">
        <p className="text-3xl mb-2">📊</p>
        <p className="text-sm">Chưa có dữ liệu ôn tập</p>
        <p className="text-xs mt-1">Bắt đầu ôn thẻ SRS để xem biểu đồ</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 100 ${CHART_H + 20}`} className="w-full" style={{ height: 160 }}
        preserveAspectRatio="none">
        {data.map((day, i) => {
          const remembered = (day.remembered / maxVal) * CHART_H;
          const forgot = (day.forgot / maxVal) * CHART_H;
          const x = i * BAR_W + BAR_W * 0.1;
          const w = BAR_W * 0.8;
          const hasData = day.total > 0;

          return (
            <g key={day.date}>
              {/* Forgot (đỏ, bên dưới) */}
              {forgot > 0 && (
                <rect x={x} y={CHART_H - forgot} width={w} height={forgot}
                  fill="rgba(198,40,40,0.25)" />
              )}
              {/* Remembered (xanh, bên trên) */}
              {remembered > 0 && (
                <rect x={x} y={CHART_H - forgot - remembered} width={w} height={remembered}
                  fill={accentColor} fillOpacity={0.8} />
              )}
              {/* Empty day */}
              {!hasData && (
                <rect x={x} y={CHART_H - 1} width={w} height={1} fill="rgba(0,0,0,0.08)" />
              )}
            </g>
          );
        })}
        {/* Baseline */}
        <line x1="0" y1={CHART_H} x2="100" y2={CHART_H} stroke="rgba(0,0,0,0.1)" strokeWidth="0.3" />
      </svg>

      {/* X-axis labels — chỉ hiện ngày đầu, giữa, cuối */}
      <div className="flex justify-between text-[10px] text-on-surface-variant px-1">
        <span>{formatDate(data[0]?.date)}</span>
        <span>{formatDate(data[Math.floor(data.length / 2)]?.date)}</span>
        <span>{formatDate(data[data.length - 1]?.date)}</span>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 text-xs text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 inline-block" style={{ background: accentColor, opacity: 0.8 }} />
          Nhớ được
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 inline-block bg-red-300" />
          Quên
        </span>
      </div>
    </div>
  );
}

// ===== Heatmap (GitHub-style) =====
function Heatmap({ data }) {
  // Chia data thành các cột tuần
  const weeks = [];
  let week = [];
  data.forEach((d, i) => {
    week.push(d);
    if (week.length === 7 || i === data.length - 1) {
      weeks.push(week);
      week = [];
    }
  });

  const maxVal = Math.max(...data.map((d) => d.total), 1);

  const getColor = (total) => {
    if (total === 0) return 'rgba(0,0,0,0.06)';
    const intensity = Math.min(total / maxVal, 1);
    if (intensity < 0.25) return 'rgba(198,40,40,0.2)';
    if (intensity < 0.5)  return 'rgba(198,40,40,0.4)';
    if (intensity < 0.75) return 'rgba(198,40,40,0.65)';
    return 'var(--secondary)';
  };

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {w.map((day) => (
              <div key={day.date}
                title={`${formatDateFull(day.date)}: ${day.total} thẻ (${day.rate}% nhớ)`}
                className="w-3.5 h-3.5 transition-all cursor-default"
                style={{ background: getColor(day.total), minWidth: 14, minHeight: 14 }} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-on-surface-variant">
        <span>Ít</span>
        {[0.06, 0.2, 0.4, 0.65, 1].map((o, i) => (
          <span key={i} className="w-3 h-3 inline-block"
            style={{ background: i === 0 ? 'rgba(0,0,0,0.06)' : `rgba(198,40,40,${o})` }} />
        ))}
        <span>Nhiều</span>
      </div>
    </div>
  );
}

// ===== Section Header =====
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

// ===== Main ProgressPage =====
export default function ProgressPage() {
  const { isAuthenticated } = useAuth();
  const [period, setPeriod] = useState(30);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const { data, isLoading } = useQuery({
    queryKey: ['studyHistory', period],
    queryFn: () => flashcardApi.getStudyHistory(period),
    staleTime: 60_000,
  });

  const summary = data?.summary;
  const history = data?.history || [];
  const peakDay = history.reduce((a, b) => (b.total > a.total ? b : a), { total: 0, date: '' });

  return (
    <div className="max-w-4xl mx-auto w-full p-6 md:p-8 space-y-10">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden animate-fade-up" style={{ minHeight: 130 }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 60%, #0d1b5e 100%)'
        }} />
        <div className="absolute inset-0 asanoha-bg opacity-20" />
        <div className="absolute right-0 top-0 bottom-0 w-1" style={{ background: 'var(--secondary)' }} />
        <div className="relative z-10 p-8 md:p-10">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 mb-4"
            style={{ backdropFilter: 'blur(4px)' }}>
            <span className="w-1.5 h-1.5 rotate-45" style={{ background: 'var(--secondary)' }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
              Theo dõi tiến độ
            </span>
          </div>
          <h1 className="font-headline text-3xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
            Lịch sử & Tiến độ học
          </h1>
          <p className="text-white/50 text-sm mt-2">Biểu đồ số từ đã ôn, tỉ lệ ghi nhớ theo ngày</p>
        </div>
        <div className="absolute -right-4 -bottom-4 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none"
          style={{ fontSize: 160 }}>進</div>
      </section>

      {/* ── SUMMARY STATS ── */}
      <section>
        <SectionHeader title="Tổng quan" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Tổng lượt ôn',   value: summary?.totalReviewed ?? '—', icon: '📚', color: 'var(--primary)' },
            { label: 'Tỉ lệ ghi nhớ',  value: summary?.totalReviewed ? `${summary.overallRate}%` : '—', icon: '🧠', color: '#2e7d32' },
            { label: 'Streak hiện tại', value: summary?.streak ? `${summary.streak} ngày` : '—', icon: '🔥', color: '#e65100' },
            { label: 'Ngày học tích cực', value: summary?.activeDays ?? '—', icon: '📅', color: 'var(--secondary)' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-surface-container-lowest p-5 relative overflow-hidden animate-fade-up"
              style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: color }} />
              <div className="pl-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">{label}</p>
                <p className="text-2xl font-black text-on-surface leading-none">{value}</p>
              </div>
              <div className="absolute -right-1 -bottom-1 text-4xl opacity-[0.05] select-none pointer-events-none">{icon}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BAR CHART ── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 flex-shrink-0" style={{ background: 'var(--secondary)' }} />
            <h2 className="text-lg font-headline font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
              Số thẻ ôn mỗi ngày
            </h2>
          </div>
          {/* Period selector */}
          <div className="flex gap-1 bg-surface-container p-0.5"
            style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
            {PERIODS.map(({ value, label }) => (
              <button key={value} onClick={() => setPeriod(value)}
                className="px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  background: period === value ? 'var(--surface-container-lowest)' : 'transparent',
                  color: period === value ? 'var(--secondary)' : 'var(--on-surface-variant)',
                  boxShadow: period === value ? '1px 1px 0 0 rgba(0,0,0,0.06)' : 'none',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6"
          style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-outline-variant border-t-secondary animate-spin rounded-full" />
            </div>
          ) : (
            <BarChart data={history} />
          )}
        </div>
      </section>

      {/* ── HEATMAP ── */}
      <section>
        <SectionHeader title="Heatmap hoạt động" />
        <div className="bg-surface-container-lowest p-6"
          style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-outline-variant border-t-secondary animate-spin rounded-full" />
            </div>
          ) : (
            <Heatmap data={history} />
          )}
        </div>
      </section>

      {/* ── PEAK DAY ── */}
      {peakDay.total > 0 && (
        <section>
          <SectionHeader title="Kỷ lục & Điểm nổi bật" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest p-5"
              style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Ngày học nhiều nhất
              </p>
              <p className="text-2xl font-black text-on-surface">{peakDay.total} thẻ</p>
              <p className="text-sm text-on-surface-variant mt-1">{formatDateFull(peakDay.date)}</p>
            </div>
            <div className="bg-surface-container-lowest p-5"
              style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Tỉ lệ ghi nhớ tốt nhất ({period} ngày)
              </p>
              {(() => {
                const best = history.filter((d) => d.total >= 5).sort((a, b) => b.rate - a.rate)[0];
                return best ? (
                  <>
                    <p className="text-2xl font-black" style={{ color: '#2e7d32' }}>{best.rate}%</p>
                    <p className="text-sm text-on-surface-variant mt-1">{formatDateFull(best.date)}</p>
                  </>
                ) : <p className="text-sm text-on-surface-variant">Chưa đủ dữ liệu</p>;
              })()}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
