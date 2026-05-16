import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { flashcardApi } from '../api/flashcardApi';
import { IconLayers, IconUser, IconSearch } from '../components/Icons';

// ===== Helpers =====

const CATEGORY_META = {
  HANTU:   { label: 'Hán tự',    color: 'var(--secondary)',         bg: 'rgba(198,40,40,0.08)',   icon: '漢' },
  TUVUNG:  { label: 'Từ vựng',   color: 'var(--primary)',           bg: 'rgba(26,35,126,0.08)',   icon: '語' },
  NGUPHAP: { label: 'Ngữ pháp',  color: '#00695c',                  bg: 'rgba(0,105,92,0.08)',    icon: '文' },
  TUHOC:   { label: 'Tự học',    color: 'var(--on-surface-variant)', bg: 'rgba(0,0,0,0.05)',      icon: '📚' },
};

const JLPT_LEVELS = [5, 4, 3, 2, 1];

const CATEGORY_FILTERS = [
  { value: 'all',     label: 'Tất cả' },
  { value: 'HANTU',   label: 'Hán tự' },
  { value: 'TUVUNG',  label: 'Từ vựng' },
  { value: 'NGUPHAP', label: 'Ngữ pháp' },
  { value: 'TUHOC',   label: 'Tự học' },
];

// ===== Deck Card =====
function DeckCard({ deck, index }) {
  const navigate = useNavigate();
  const meta = CATEGORY_META[deck.category] || CATEGORY_META.TUHOC;
  const cardCount = deck._count?.cards ?? 0;
  const authorName = deck.user?.name || 'Minhongo';

  return (
    <div
      className="group relative bg-surface-container-lowest overflow-hidden animate-fade-up cursor-pointer transition-all hover:sharp-shadow"
      style={{ border: '1px solid rgba(0,0,0,0.07)', animationDelay: `${index * 50}ms` }}
      onClick={() => navigate(`/demo/${deck.id}`)}
    >
      {/* Top color accent — slides down on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-200"
        style={{ background: meta.color }} />

      {/* Ghost character background */}
      <div className="absolute -right-2 -bottom-3 font-jp font-bold leading-none select-none pointer-events-none opacity-[0.04] group-hover:opacity-[0.07] transition-opacity text-on-surface"
        style={{ fontSize: 80 }}>
        {meta.icon}
      </div>

      <div className="p-5 relative z-10">
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: meta.bg, color: meta.color }}>
            {meta.label}
          </span>
          {deck.jlptLevel && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#b45309' }}>
              N{deck.jlptLevel}
            </span>
          )}
        </div>

        {/* Deck name */}
        <h3 className="font-headline font-bold text-on-surface text-base leading-snug mb-1.5 group-hover:text-secondary transition-colors line-clamp-2">
          {deck.name}
        </h3>

        {deck.description && (
          <p className="text-xs text-on-surface-variant leading-relaxed mb-3 line-clamp-2">
            {deck.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t"
          style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <IconLayers className="w-3.5 h-3.5" />
              {cardCount} thẻ
            </span>
            <span className="flex items-center gap-1">
              <IconUser className="w-3.5 h-3.5" />
              {authorName}
            </span>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider transition-colors group-hover:text-secondary"
            style={{ color: 'var(--on-surface-variant)' }}>
            Thử ngay →
          </span>
        </div>
      </div>
    </div>
  );
}

// ===== Main BrowsePage =====
export default function BrowsePage() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [jlptFilter, setJlptFilter] = useState(null);
  const [search, setSearch] = useState('');

  const { data: decks = [], isLoading } = useQuery({
    queryKey: ['publicDecks'],
    queryFn: flashcardApi.getPublicDecks,
    staleTime: 60_000,
  });

  // Client-side filter
  const filtered = useMemo(() => {
    return decks.filter((d) => {
      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
      if (jlptFilter && d.jlptLevel !== jlptFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!d.name.toLowerCase().includes(q) && !d.description?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [decks, categoryFilter, jlptFilter, search]);

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-10">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden animate-fade-up" style={{ minHeight: 140 }}>
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
                Nội dung công khai · Không cần đăng nhập
              </span>
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-white leading-tight"
              style={{ letterSpacing: '-0.02em' }}>
              Khóa học & Flashcard
            </h1>
            <p className="text-white/50 text-sm mt-2 max-w-lg">
              Duyệt các bộ từ vựng, hán tự và ngữ pháp được biên soạn sẵn. Thử học ngay mà không cần đăng ký.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-4 flex-shrink-0">
            <div className="text-center bg-white/10 px-6 py-3"
              style={{ backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-3xl font-black text-white leading-none">{decks.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Bộ thẻ</p>
            </div>
            <div className="text-center bg-white/10 px-6 py-3"
              style={{ backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-3xl font-black text-white leading-none">
                {decks.reduce((sum, d) => sum + (d._count?.cards ?? 0), 0)}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Thẻ học</p>
            </div>
          </div>
        </div>

        <div className="absolute -right-4 -bottom-4 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none"
          style={{ fontSize: 160 }}>学</div>
      </section>

      {/* ── FILTERS ── */}
      <section className="bg-surface-container-lowest p-4 space-y-3"
        style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Category filter */}
          <div className="flex gap-0.5 bg-surface-container p-0.5 flex-wrap"
            style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setCategoryFilter(f.value)}
                className="px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap"
                style={{
                  background: categoryFilter === f.value ? 'var(--surface-container-lowest)' : 'transparent',
                  color: categoryFilter === f.value ? 'var(--secondary)' : 'var(--on-surface-variant)',
                  boxShadow: categoryFilter === f.value ? '1px 1px 0 0 rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm bộ thẻ..."
              className="pl-9 pr-4 py-2 bg-surface text-on-surface text-xs outline-none w-48"
              style={{ border: '1px solid rgba(0,0,0,0.12)' }}
            />
          </div>
        </div>

        {/* JLPT filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">JLPT:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setJlptFilter(null)}
              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all"
              style={{
                background: jlptFilter === null ? 'var(--secondary)' : 'transparent',
                color: jlptFilter === null ? 'var(--on-secondary)' : 'var(--on-surface-variant)',
                border: `1px solid ${jlptFilter === null ? 'var(--secondary)' : 'rgba(0,0,0,0.1)'}`,
              }}
            >
              Tất cả
            </button>
            {JLPT_LEVELS.map((n) => (
              <button
                key={n}
                onClick={() => setJlptFilter(jlptFilter === n ? null : n)}
                className="w-9 h-7 text-[10px] font-bold transition-all"
                style={{
                  background: jlptFilter === n ? 'rgba(245,158,11,0.15)' : 'transparent',
                  color: jlptFilter === n ? '#b45309' : 'var(--on-surface-variant)',
                  border: `1px solid ${jlptFilter === n ? '#d97706' : 'rgba(0,0,0,0.1)'}`,
                }}
              >
                N{n}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── DECK GRID ── */}
      <section>
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-on-surface-variant">
            <div className="w-5 h-5 border-2 border-outline-variant border-t-secondary animate-spin rounded-full" />
            <span className="text-sm">Đang tải...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex justify-center text-on-surface-variant mb-3"><IconSearch className="w-10 h-10" /></div>
            <p className="font-semibold text-on-surface text-sm mb-1">Không tìm thấy bộ thẻ nào</p>
            <p className="text-xs text-on-surface-variant">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-on-surface-variant mb-4">
              Hiển thị <span className="font-bold text-on-surface">{filtered.length}</span> bộ thẻ
              {search && ` · Tìm: "${search}"`}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((deck, i) => (
                <DeckCard key={deck.id} deck={deck} index={i} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── CTA ── */}
      <section>
        <div className="relative overflow-hidden p-8 md:p-10 text-center"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-container), #0d1b5e)' }}>
          <div className="absolute inset-0 asanoha-bg opacity-15" />
          <div className="relative z-10">
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">
              Tiếp tục hành trình của bạn
            </p>
            <h2 className="font-headline text-2xl font-bold text-white mb-2"
              style={{ letterSpacing: '-0.01em' }}>
              Đăng ký để lưu tiến độ và học không giới hạn
            </h2>
            <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
              Tạo tài khoản miễn phí để dùng SRS, tạo bộ thẻ riêng và nhận lộ trình AI cá nhân hóa.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/register"
                className="px-7 py-2.5 text-sm font-bold uppercase tracking-wider text-on-secondary hover:bg-secondary-dim transition-colors"
                style={{ background: 'var(--secondary)' }}>
                Đăng ký miễn phí
              </Link>
              <Link to="/login"
                className="px-7 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.3)' }}>
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
