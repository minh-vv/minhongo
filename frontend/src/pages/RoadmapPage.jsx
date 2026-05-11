import { useState } from 'react';
import axios from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import LoginPrompt from '../components/LoginPrompt';

const LEVELS = [
  { value: 'newbie', label: 'Mới bắt đầu', desc: '0 kinh nghiệm' },
  { value: 'n5',     label: 'JLPT N5',     desc: 'Cơ bản'      },
  { value: 'n4',     label: 'JLPT N4',     desc: 'Sơ cấp'      },
  { value: 'n3',     label: 'JLPT N3',     desc: 'Trung cấp'   },
  { value: 'n2',     label: 'JLPT N2',     desc: 'Cao cấp'     },
];

const STUDY_TIMES = [
  { value: '15',  label: '15 phút',  desc: 'Phù hợp bận' },
  { value: '30',  label: '30 phút',  desc: 'Cân bằng'    },
  { value: '60',  label: '1 giờ',    desc: 'Hiệu quả'    },
  { value: '90',  label: '1.5 giờ',  desc: 'Chuyên sâu'  },
  { value: '120', label: '2 giờ',    desc: 'Tối đa'      },
];

const ROADMAP_FEATURES = [
  { icon: '📅', text: 'Lịch học tập theo từng tuần' },
  { icon: '🎯', text: 'Mốc thời gian đạt mục tiêu' },
  { icon: '📚', text: 'Deck & tài liệu được đề xuất' },
  { icon: '💡', text: 'Tips và phương pháp học hiệu quả' },
];

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1.5 h-6 flex-shrink-0" style={{ background: 'var(--secondary)' }} />
      <h2 className="text-lg font-headline font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      <div className="flex-1 h-px ml-1"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)' }} />
    </div>
  );
}

function RoadmapResult({ roadmap, onReset }) {
  const lines = roadmap.split('\n').filter((l) => l.trim());

  return (
    <div className="max-w-4xl mx-auto w-full p-6 md:p-8 space-y-8">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden animate-fade-up" style={{ minHeight: 130 }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 60%, #0d1b5e 100%)'
        }} />
        <div className="absolute inset-0 asanoha-bg opacity-20" />
        <div className="absolute right-0 top-0 bottom-0 w-1" style={{ background: 'var(--secondary)' }} />

        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 mb-4"
              style={{ backdropFilter: 'blur(4px)' }}>
              <span className="w-1.5 h-1.5 rotate-45" style={{ background: 'var(--secondary)' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                Được tạo bởi AI · Cá nhân hóa
              </span>
            </div>
            <h1 className="font-headline text-3xl font-bold text-white"
              style={{ letterSpacing: '-0.02em' }}>
              Lộ trình của bạn
            </h1>
            <p className="text-white/50 text-sm mt-2">
              Phân tích dựa trên trình độ và mục tiêu bạn đã chọn
            </p>
          </div>

          <button onClick={onReset}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition-colors flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Tạo lại
          </button>
        </div>

        <div className="absolute -right-4 -bottom-4 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none"
          style={{ fontSize: 160 }}>道</div>
      </section>

      {/* ── ROADMAP CONTENT ── */}
      <section>
        <SectionHeader title="Lộ trình học tiếng Nhật" />
        <div className="bg-surface-container-lowest p-6 md:p-8 space-y-2 relative overflow-hidden"
          style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'var(--secondary)' }} />

          <div className="pl-3 space-y-2">
            {lines.map((line, i) => {
              const isMdHeading = line.startsWith('#');
              const cleanLine = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');

              if (isMdHeading) {
                return (
                  <h3 key={i} className="font-headline font-bold text-on-surface text-base mt-5 first:mt-0">
                    {cleanLine}
                  </h3>
                );
              }
              if (/^\d+\./.test(line)) {
                return (
                  <div key={i} className="flex gap-3 py-1">
                    <span className="flex-shrink-0 w-6 h-6 text-[10px] font-black flex items-center justify-center mt-0.5 text-on-secondary"
                      style={{ background: 'var(--secondary)' }}>
                      {line.match(/^(\d+)/)?.[1]}
                    </span>
                    <p className="text-on-surface text-sm leading-relaxed">
                      {line.replace(/^\d+\.\s*/, '')}
                    </p>
                  </div>
                );
              }
              if (line.startsWith('-') || line.startsWith('•')) {
                return (
                  <div key={i} className="flex gap-2.5 py-0.5">
                    <span className="mt-1 w-1 h-1 flex-shrink-0"
                      style={{ background: 'var(--secondary)' }} />
                    <p className="text-on-surface-variant text-sm leading-relaxed">
                      {line.replace(/^[-•]\s*/, '')}
                    </p>
                  </div>
                );
              }
              return (
                <p key={i} className="text-on-surface text-sm leading-relaxed">{cleanLine}</p>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function RoadmapPage() {
  const { isAuthenticated } = useAuth();
  const [goal, setGoal]                 = useState('');
  const [currentLevel, setCurrentLevel] = useState('newbie');
  const [studyTime, setStudyTime]       = useState('30');
  const [loading, setLoading]           = useState(false);
  const [roadmap, setRoadmap]           = useState(null);
  const [error, setError]               = useState('');

  if (!isAuthenticated) {
    return (
      <LoginPrompt
        title="Đăng nhập để dùng Lộ trình AI"
        description="Tính năng AI cá nhân hóa lộ trình học chỉ dành cho thành viên. Đăng ký miễn phí để bắt đầu."
        ghostChar="道"
      />
    );
  }

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRoadmap(null);
    try {
      const res = await axios.post('/ai/generate-roadmap', {
        goal,
        currentLevel,
        studyTimePerDay: parseInt(studyTime),
      });
      setRoadmap(res.data.roadmap);
    } catch {
      setError('Không thể tạo lộ trình. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (roadmap) {
    return <RoadmapResult roadmap={roadmap} onReset={() => setRoadmap(null)} />;
  }

  return (
    <div className="max-w-5xl mx-auto w-full p-6 md:p-8 space-y-10">

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
              Lộ trình AI
            </span>
            <span className="px-1.5 py-px bg-amber-400 text-amber-900 text-[9px] font-black leading-none">
              AI
            </span>
          </div>
          <h1 className="font-headline text-3xl font-bold text-white"
            style={{ letterSpacing: '-0.02em' }}>
            Lộ trình học cá nhân hóa
          </h1>
          <p className="text-white/50 text-sm mt-2 max-w-lg">
            AI phân tích mục tiêu và trình độ để tạo lộ trình học tối ưu dành riêng cho bạn.
          </p>
        </div>

        <div className="absolute -right-4 -bottom-4 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none"
          style={{ fontSize: 160 }}>道</div>
      </section>

      {/* ── FORM + INFO ── */}
      <section>
        <SectionHeader title="Cho AI biết về bạn" />
        <div className="grid lg:grid-cols-[1fr_280px] gap-4">

          {/* Form */}
          <div className="bg-surface-container-lowest"
            style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="px-6 py-3.5"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'var(--surface-container-low)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Thông tin cá nhân hóa
              </p>
            </div>

            <form onSubmit={handleGenerate} className="p-6 space-y-6">
              {/* Goal */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Mục tiêu của bạn là gì? <span style={{ color: 'var(--secondary)' }}>*</span>
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  required
                  rows={4}
                  placeholder="VD: Đạt JLPT N4 trong 6 tháng để đi làm tại Nhật. Hiện tại mình biết hiragana và katakana nhưng chưa học kanji..."
                  className="w-full px-3 py-2.5 bg-surface text-on-surface text-sm outline-none transition-colors resize-none focus:border-secondary"
                  style={{ border: '1px solid rgba(0,0,0,0.15)' }}
                />
                <p className="mt-1.5 text-xs text-on-surface-variant">
                  Càng chi tiết, lộ trình càng phù hợp với bạn.
                </p>
              </div>

              {/* Current level */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                  Trình độ hiện tại
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {LEVELS.map((l) => {
                    const active = currentLevel === l.value;
                    return (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setCurrentLevel(l.value)}
                        className="flex flex-col items-start px-3 py-2.5 text-left transition-all"
                        style={{
                          border: active
                            ? '2px solid var(--secondary)'
                            : '1px solid rgba(0,0,0,0.1)',
                          background: active ? 'rgba(198,40,40,0.06)' : 'var(--surface)',
                        }}
                      >
                        <span className="text-sm font-bold"
                          style={{ color: active ? 'var(--secondary)' : 'var(--on-surface)' }}>
                          {l.label}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">{l.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Study time */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                  Thời gian học mỗi ngày
                </label>
                <div className="flex gap-2 flex-wrap">
                  {STUDY_TIMES.map((t) => {
                    const active = studyTime === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setStudyTime(t.value)}
                        className="flex flex-col items-center px-4 py-2 transition-all"
                        style={{
                          border: active
                            ? '2px solid var(--secondary)'
                            : '1px solid rgba(0,0,0,0.1)',
                          background: active ? 'rgba(198,40,40,0.06)' : 'var(--surface)',
                        }}
                      >
                        <span className="text-sm font-bold"
                          style={{ color: active ? 'var(--secondary)' : 'var(--on-surface)' }}>
                          {t.label}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 text-sm"
                  style={{
                    border: '1px solid rgba(198,40,40,0.3)',
                    background: 'rgba(198,40,40,0.06)',
                    color: 'var(--secondary)',
                  }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !goal.trim()}
                className="w-full py-3 text-xs font-bold uppercase tracking-wider text-on-secondary hover:bg-secondary-dim disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                style={{ background: 'var(--secondary)' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    AI đang phân tích...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Tạo lộ trình với AI
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Info panel */}
          <div className="space-y-4">
            <div className="bg-surface-container-lowest p-5 relative overflow-hidden"
              style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="absolute left-0 top-0 bottom-0 w-1"
                style={{ background: 'var(--primary)' }} />
              <div className="pl-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  Lộ trình bao gồm
                </p>
                <ul className="space-y-2.5">
                  {ROADMAP_FEATURES.map((f) => (
                    <li key={f.text} className="flex items-start gap-2.5 text-sm text-on-surface">
                      <span className="flex-shrink-0 text-base leading-none mt-0.5">{f.icon}</span>
                      <span className="leading-snug">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 relative overflow-hidden"
              style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="absolute left-0 top-0 bottom-0 w-1"
                style={{ background: '#b45309' }} />
              <div className="pl-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">💡</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Mẹo nhỏ
                  </p>
                </div>
                <p className="text-on-surface-variant text-xs leading-relaxed">
                  Mô tả càng cụ thể (nghề nghiệp, lý do học, kỳ thi cần đạt...) thì AI sẽ tạo lộ trình phù hợp hơn.
                </p>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 text-center relative overflow-hidden"
              style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="font-jp font-black text-on-surface/10 mb-1 leading-none select-none"
                style={{ fontSize: 40 }}>
                頑張れ
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Ganbatte! Cố lên!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
