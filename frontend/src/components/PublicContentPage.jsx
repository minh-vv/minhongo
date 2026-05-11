/**
 * PublicContentPage — shared layout for admin-curated content pages
 * (Kanji, Vocabulary, Grammar). Admin can upload Anki decks; all users can study.
 */
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import ImportAnkiModal from './ImportAnkiModal';

const JLPT_LEVELS = [5, 4, 3, 2, 1];

/** Chủ đề học — keyword matching trên tên/mô tả deck */
const THEMES = [
  { id: 'travel',   icon: '✈️',  label: 'Du lịch',   keywords: ['du lịch', 'travel', 'airport', 'sân bay', 'khách sạn', 'hotel'] },
  { id: 'work',     icon: '💼',  label: 'Công việc', keywords: ['công việc', 'business', 'work', 'văn phòng', 'office', 'phỏng vấn'] },
  { id: 'food',     icon: '🍱',  label: 'Ẩm thực',  keywords: ['ẩm thực', 'đồ ăn', 'food', 'nhà hàng', 'restaurant', 'nấu ăn'] },
  { id: 'family',   icon: '👨‍👩‍👧', label: 'Gia đình', keywords: ['gia đình', 'family', 'bố', 'mẹ', 'anh', 'chị', 'em'] },
  { id: 'school',   icon: '🏫',  label: 'Học đường', keywords: ['trường', 'school', 'học sinh', 'giáo viên', 'lớp học', 'education'] },
  { id: 'shopping', icon: '🛍️', label: 'Mua sắm',   keywords: ['mua sắm', 'shopping', 'chợ', 'cửa hàng', 'store', 'price'] },
  { id: 'health',   icon: '🏥',  label: 'Sức khỏe', keywords: ['bệnh viện', 'sức khỏe', 'health', 'bác sĩ', 'doctor', 'thuốc'] },
  { id: 'nature',   icon: '🌿',  label: 'Thiên nhiên', keywords: ['thiên nhiên', 'nature', 'động vật', 'animal', 'thời tiết', 'weather'] },
  { id: 'daily',    icon: '🏠',  label: 'Hằng ngày', keywords: ['hằng ngày', 'daily', 'thói quen', 'routine', 'sinh hoạt', 'nhà'] },
];

/** Kiểm tra deck có thuộc theme không dựa trên keyword matching */
function deckMatchesTheme(deck, theme) {
  const text = `${deck.name} ${deck.description || ''}`.toLowerCase();
  return theme.keywords.some((kw) => text.includes(kw.toLowerCase()));
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'az',     label: 'A đến Z'  },
  { value: 'za',     label: 'Z đến A'  },
  { value: 'cards',  label: 'Nhiều thẻ nhất' },
];

function sortDecks(decks, sort) {
  const copy = [...decks];
  switch (sort) {
    case 'oldest': return copy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case 'az':     return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'za':     return copy.sort((a, b) => b.name.localeCompare(a.name));
    case 'cards':  return copy.sort((a, b) => (b._count?.cards || 0) - (a._count?.cards || 0));
    default:       return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

function DeckCard({ deck, accentColor }) {
  return (
    <Link
      to={`/deck/${deck.id}`}
      className="group relative bg-surface-container-lowest p-6 flex flex-col gap-4 transition-all hover:sharp-shadow-sm overflow-hidden"
      style={{ border: '1px solid rgba(0,0,0,0.07)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: accentColor }} />

      <div className="flex items-start justify-between">
        <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
          style={{ background: `color-mix(in srgb, ${accentColor} 10%, transparent)`, color: accentColor }}>
          JLPT N{deck.jlptLevel || '?'}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-on-surface-variant">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          {deck._count?.cards || 0} thẻ
        </span>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-on-surface text-base mb-1.5 leading-snug">{deck.name}</h3>
        {deck.description && (
          <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">{deck.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity mt-auto"
        style={{ color: accentColor }}>
        Học ngay
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function EmptyState({ hasFilter, onClear, ghostChar, accentColor }) {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="font-black mb-4 select-none leading-none" style={{ fontFamily: 'serif', fontSize: 72, color: `color-mix(in srgb, ${accentColor} 10%, transparent)` }}>
        {ghostChar}
      </div>
      <p className="text-on-surface-variant font-medium mb-3">
        {hasFilter ? 'Không có deck ở cấp độ này' : 'Admin sẽ cập nhật nội dung sớm.'}
      </p>
      {hasFilter && (
        <button onClick={onClear}
          className="text-xs font-bold uppercase tracking-wider px-4 py-1.5 transition-colors"
          style={{ color: accentColor, border: `1px solid ${accentColor}` }}>
          Xem tất cả cấp độ
        </button>
      )}
    </div>
  );
}

/**
 * Props:
 *  - title: string          — tên trang ("Hán tự", "Từ vựng", "Ngữ pháp")
 *  - subtitle: string       — mô tả ngắn
 *  - category: string       — 'HANTU' | 'TUVUNG' | 'NGUPHAP'
 *  - accentColor: string    — CSS color string
 *  - ghostChar: string      — ký tự trang trí nền ("漢", "語", "文")
 */
export default function PublicContentPage({ title, subtitle, category, accentColor, ghostChar }) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;

  const [decks, setDecks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [search, setSearch]   = useState('');
  const [sort, setSort]       = useState('newest');
  const [showUpload, setShowUpload] = useState(false);

  const fetchDecks = () => {
    setLoading(true);
    axios.get('/flashcards/public')
      .then((res) => setDecks(res.data.filter((d) => d.category === category)))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDecks(); }, []);

  // Danh sách theme có ít nhất 1 deck phù hợp (để ẩn theme trống)
  const activeThemes = useMemo(
    () => THEMES.filter((t) => decks.some((d) => deckMatchesTheme(d, t))),
    [decks],
  );

  const filtered = useMemo(() => {
    let result = decks;
    if (selectedLevel) result = result.filter((d) => d.jlptLevel === selectedLevel);
    if (selectedTheme) {
      const theme = THEMES.find((t) => t.id === selectedTheme);
      if (theme) result = result.filter((d) => deckMatchesTheme(d, theme));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((d) =>
        d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)
      );
    }
    return sortDecks(result, sort);
  }, [decks, selectedLevel, selectedTheme, search, sort]);

  const totalCards = decks.reduce((sum, d) => sum + (d._count?.cards || 0), 0);

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden animate-fade-up" style={{ minHeight: 130 }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 60%, #0d1b5e 100%)'
        }} />
        <div className="absolute inset-0 asanoha-bg opacity-20" />
        <div className="absolute right-0 top-0 bottom-0 w-1" style={{ background: 'var(--secondary)' }} />

        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 mb-4"
              style={{ backdropFilter: 'blur(4px)' }}>
              <span className="w-1.5 h-1.5 rotate-45" style={{ background: 'var(--secondary)' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                JLPT N5 → N1
              </span>
            </div>
            <h1 className="font-headline text-3xl font-bold text-white"
              style={{ letterSpacing: '-0.02em' }}>
              {title}
            </h1>
            <p className="text-white/50 text-sm mt-2 max-w-lg">{subtitle}</p>
          </div>

          {/* Stats */}
          <div className="flex gap-3 flex-shrink-0">
            <div className="text-center bg-white/10 px-5 py-3"
              style={{ backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-2xl font-black text-white leading-none">{decks.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Bộ thẻ</p>
            </div>
            <div className="text-center bg-white/10 px-5 py-3"
              style={{ backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-2xl font-black text-white leading-none">{totalCards}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Thẻ học</p>
            </div>
          </div>
        </div>

        <div className="absolute -right-4 -bottom-4 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none"
          style={{ fontSize: 160 }}>
          {ghostChar}
        </div>
      </section>

      {/* ── Search + Admin upload ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.34-4.34"/>
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm bộ thẻ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant focus:outline-none"
            style={{ border: '1px solid rgba(0,0,0,0.12)' }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSearch(''); setSelectedLevel(null); setSelectedTheme(null); }}
            className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:bg-surface-container transition-colors"
            style={{ border: '1px solid rgba(0,0,0,0.12)' }}
            title="Xoá bộ lọc"
          >
            Xoá lọc
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-on-secondary hover:bg-secondary-dim transition-colors"
              style={{ background: 'var(--secondary)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              Upload Anki
            </button>
          )}
        </div>
      </div>

      {/* ── Filter + Sort bar ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between pb-5"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>

        <div className="flex gap-1 overflow-x-auto w-full min-w-0 md:w-auto pb-1 md:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedLevel(null)}
            className="whitespace-nowrap px-3.5 py-1.5 text-xs font-bold transition-colors uppercase tracking-wider shrink-0"
            style={selectedLevel === null
              ? { background: accentColor, color: '#fff' }
              : { background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)', border: '1px solid rgba(0,0,0,0.06)' }
            }
          >
            Tất cả
          </button>
          {JLPT_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className="whitespace-nowrap px-3.5 py-1.5 text-xs font-bold transition-colors uppercase tracking-wider shrink-0"
              style={selectedLevel === level
                ? { background: accentColor, color: '#fff' }
                : { background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)', border: '1px solid rgba(0,0,0,0.06)' }
              }
            >
              N{level}
            </button>
          ))}
        </div>

        {/* Theme chips — chỉ hiện khi có ít nhất 1 theme có data */}
        {activeThemes.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-3 md:mt-0 w-full md:w-auto">
            {activeThemes.map((theme) => {
              const isActive = selectedTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(isActive ? null : theme.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    border: `1px solid ${isActive ? accentColor : 'rgba(0,0,0,0.1)'}`,
                    background: isActive ? `color-mix(in srgb, ${accentColor} 10%, transparent)` : 'var(--surface)',
                    color: isActive ? accentColor : 'var(--on-surface-variant)',
                  }}
                >
                  <span>{theme.icon}</span>
                  {theme.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Sắp xếp</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-surface text-on-surface focus:outline-none transition-colors cursor-pointer uppercase tracking-wider appearance-none pr-8"
            style={{
              border: '1px solid rgba(0,0,0,0.15)',
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1em',
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="animate-spin font-black text-7xl" style={{ color: accentColor, animationDuration: '2s' }}>
            {ghostChar}
          </div>
          <p className="text-on-surface-variant font-medium mt-4">Đang tải...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          hasFilter={selectedLevel !== null || selectedTheme !== null || search.trim() !== ''}
          onClear={() => { setSelectedLevel(null); setSelectedTheme(null); setSearch(''); }}
          ghostChar={ghostChar}
          accentColor={accentColor}
        />
      ) : (
        <>
          <div className="flex items-center gap-3 mb-5">
            <p className="text-sm text-on-surface-variant">
              Hiển thị <span className="font-bold text-on-surface">{filtered.length}</span> / {decks.length} deck
            </p>
            {selectedTheme && (
              <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold"
                style={{ background: `color-mix(in srgb, ${accentColor} 12%, transparent)`, color: accentColor }}>
                {THEMES.find((t) => t.id === selectedTheme)?.icon}{' '}
                {THEMES.find((t) => t.id === selectedTheme)?.label}
                <button onClick={() => setSelectedTheme(null)} className="ml-1 opacity-60 hover:opacity-100">×</button>
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((deck) => (
              <DeckCard key={deck.id} deck={deck} accentColor={accentColor} />
            ))}
          </div>
        </>
      )}

      {/* Admin: Import Anki Modal */}
      {isAdmin && (
        <ImportAnkiModal
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); fetchDecks(); }}
          isAdmin={true}
          defaultCategory={category}
        />
      )}
    </div>
  );
}
