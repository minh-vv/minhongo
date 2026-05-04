import { useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { flashcardApi } from '../api/flashcardApi';
import { systemApi } from '../api/systemApi';

const DEFAULT_DEMO_LIMIT = 5;

// ===== Flip Card =====
function FlipCard({ card, isFlipped, onFlip, onSpeak }) {
  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ height: 280, perspective: 1000 }}
      onClick={onFlip}
    >
      <div
        className="absolute inset-0 w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front — Japanese */}
        <div
          className="absolute inset-0 bg-surface-container-lowest flex flex-col items-center justify-center p-8"
          style={{
            backfaceVisibility: 'hidden',
            border: '2px solid rgba(26,35,126,0.15)',
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">
            Tiếng Nhật
          </p>
          <p className="font-jp text-5xl font-bold text-on-surface text-center leading-tight mb-3">
            {card.front}
          </p>
          {card.romaji && (
            <p className="text-lg text-on-surface-variant mt-1">{card.romaji}</p>
          )}
          {card.jlptLevel && (
            <span className="mt-4 px-3 py-1 text-xs font-bold uppercase tracking-wider"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#b45309' }}>
              JLPT N{card.jlptLevel}
            </span>
          )}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={(e) => { e.stopPropagation(); onSpeak(card.front); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{ border: '1px solid rgba(0,0,0,0.1)', color: 'var(--on-surface-variant)' }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              Nghe phát âm
            </button>
            <span className="text-xs text-on-surface-variant opacity-60">Nhấn để lật</span>
          </div>
        </div>

        {/* Back — Vietnamese */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-8"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'rgba(26,35,126,0.04)',
            border: '2px solid rgba(26,35,126,0.2)',
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">
            Nghĩa tiếng Việt
          </p>
          <p className="font-headline text-3xl font-bold text-on-surface text-center leading-tight mb-4">
            {card.back}
          </p>
          {card.example && (
            <div className="w-full p-4 bg-surface-container-lowest mt-2"
              style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
                Ví dụ
              </p>
              <p className="text-sm text-on-surface leading-relaxed">{card.example}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Demo Complete Screen =====
function DemoComplete({ deck, demoCount, onRestart }) {
  const totalCards = deck._count?.cards ?? deck.cards?.length ?? 0;
  const remaining = totalCards - demoCount;

  return (
    <div className="text-center py-8 animate-fade-up">
      {/* Celebration */}
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="font-headline text-2xl font-bold text-on-surface mb-2"
        style={{ letterSpacing: '-0.01em' }}>
        Bạn đã học thử {demoCount} từ!
      </h2>
      <p className="text-on-surface-variant text-sm mb-6 max-w-sm mx-auto">
        Bộ thẻ <strong>{deck.name}</strong> còn{' '}
        <strong className="text-secondary">{remaining} từ</strong> nữa.
        Đăng ký để học toàn bộ và lưu tiến độ của bạn!
      </p>

      {/* Feature bullets */}
      <div className="inline-flex flex-col gap-2 text-left mb-8 bg-surface-container-low p-5"
        style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
        {[
          ['💾', 'Lưu tiến độ học — không bao giờ mất'],
          ['🔁', 'Ôn tập SRS — nhớ bền vững lâu dài'],
          ['📊', 'Theo dõi thống kê học tập mỗi ngày'],
          ['🤖', 'Lộ trình AI cá nhân hóa theo trình độ'],
        ].map(([icon, text]) => (
          <div key={text} className="flex items-center gap-3 text-sm">
            <span className="text-base">{icon}</span>
            <span className="text-on-surface-variant">{text}</span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/register"
          className="px-8 py-3 text-sm font-bold uppercase tracking-wider text-on-secondary hover:bg-secondary-dim transition-colors"
          style={{ background: 'var(--secondary)' }}>
          Đăng ký miễn phí
        </Link>
        <button
          onClick={onRestart}
          className="px-8 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
          style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
          Học lại từ đầu
        </button>
        <Link to="/browse"
          className="px-8 py-3 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
          Xem bộ thẻ khác
        </Link>
      </div>
    </div>
  );
}

// ===== Main DemoPage =====
export default function DemoPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flippedSet, setFlippedSet] = useState(new Set());
  const [isDone, setIsDone] = useState(false);

  const { data: deck, isLoading, error } = useQuery({
    queryKey: ['publicDeck', deckId],
    queryFn: () => flashcardApi.getPublicDeck(deckId),
    staleTime: 60_000,
  });

  const { data: publicCfg } = useQuery({
    queryKey: ['publicSystemConfig'],
    queryFn: systemApi.getPublicConfig,
    staleTime: 60_000,
    retry: 1,
  });

  const demoLimit = typeof publicCfg?.guestDemoCards === 'number' && publicCfg.guestDemoCards > 0
    ? Math.min(50, publicCfg.guestDemoCards)
    : DEFAULT_DEMO_LIMIT;

  const demoCards = deck?.cards?.slice(0, demoLimit) ?? [];
  const current = demoCards[currentIndex];
  const progress = demoCards.length > 0
    ? Math.round((currentIndex / demoCards.length) * 100)
    : 0;

  const handleFlip = useCallback(() => {
    if (!isFlipped && current) {
      setFlippedSet((prev) => new Set([...prev, current.id]));
    }
    setIsFlipped((f) => !f);
  }, [isFlipped, current]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= demoCards.length) {
      setIsDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, demoCards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleSpeak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }, []);

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setFlippedSet(new Set());
    setIsDone(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-8 flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-outline-variant border-t-secondary animate-spin rounded-full" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center py-16">
        <p className="text-2xl mb-3">😢</p>
        <p className="font-semibold text-on-surface mb-4">Không tìm thấy bộ thẻ này</p>
        <Link to="/browse" className="text-secondary text-sm font-semibold hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (demoCards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center py-16">
        <p className="text-2xl mb-3">📭</p>
        <p className="font-semibold text-on-surface mb-4">Bộ thẻ này chưa có thẻ nào</p>
        <Link to="/browse" className="text-secondary text-sm font-semibold hover:underline">
          ← Xem bộ thẻ khác
        </Link>
      </div>
    );
  }

  const totalCards = deck._count?.cards ?? deck.cards?.length ?? 0;
  const CATEGORY_META = {
    HANTU:   { label: 'Hán tự',   color: 'var(--secondary)' },
    TUVUNG:  { label: 'Từ vựng',  color: 'var(--primary)' },
    NGUPHAP: { label: 'Ngữ pháp', color: '#00695c' },
    TUHOC:   { label: 'Tự học',   color: 'var(--on-surface-variant)' },
  };
  const meta = CATEGORY_META[deck.category] || CATEGORY_META.TUHOC;

  return (
    <div className="max-w-2xl mx-auto w-full p-6 md:p-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between animate-fade-up">
        <button
          onClick={() => navigate('/browse')}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Danh sách khóa học
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(198,40,40,0.1)', color: 'var(--secondary)' }}>
            Demo · {demoCards.length}/{totalCards} thẻ
          </span>
          <Link to="/register"
            className="px-3 py-1.5 text-xs font-bold text-on-secondary hover:bg-secondary-dim transition-colors"
            style={{ background: 'var(--secondary)' }}>
            Đăng ký để học đủ
          </Link>
        </div>
      </div>

      {/* ── Deck info ── */}
      <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: meta.color }}>{meta.label}</span>
          {deck.jlptLevel && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#b45309' }}>
              N{deck.jlptLevel}
            </span>
          )}
        </div>
        <h1 className="font-headline text-xl font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
          {deck.name}
        </h1>
        {deck.description && (
          <p className="text-xs text-on-surface-variant mt-1">{deck.description}</p>
        )}
      </div>

      {!isDone ? (
        <>
          {/* ── Progress ── */}
          <div className="flex items-center gap-3 animate-fade-up" style={{ animationDelay: '120ms' }}>
            <div className="flex-1 h-2 bg-surface-container overflow-hidden"
              style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'var(--secondary)' }}
              />
            </div>
            <span className="text-xs font-semibold text-on-surface-variant whitespace-nowrap tabular-nums">
              {currentIndex + 1} / {demoCards.length}
            </span>
          </div>

          {/* ── Flashcard ── */}
          <div className="animate-fade-up" style={{ animationDelay: '160ms' }}>
            <FlipCard
              card={current}
              isFlipped={isFlipped}
              onFlip={handleFlip}
              onSpeak={handleSpeak}
            />
          </div>

          {/* ── Controls ── */}
          <div className="flex items-center justify-between animate-fade-up" style={{ animationDelay: '200ms' }}>
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors disabled:opacity-30"
              style={{ border: '1px solid rgba(0,0,0,0.1)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Trước
            </button>

            <button
              onClick={handleFlip}
              className="px-7 py-2.5 text-sm font-bold text-on-secondary hover:bg-secondary-dim transition-colors"
              style={{ background: 'var(--secondary)' }}
            >
              {isFlipped ? 'Lật lại' : 'Xem nghĩa'}
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
              style={{ border: '1px solid rgba(0,0,0,0.1)' }}
            >
              {currentIndex + 1 >= demoCards.length ? 'Xem kết quả' : 'Tiếp theo'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* ── Progress dots ── */}
          <div className="flex justify-center gap-1.5">
            {demoCards.map((c, i) => (
              <button
                key={c.id}
                onClick={() => { setCurrentIndex(i); setIsFlipped(false); }}
                className="transition-all"
                style={{
                  width: i === currentIndex ? 20 : 8,
                  height: 8,
                  background: flippedSet.has(c.id)
                    ? 'var(--secondary)'
                    : i === currentIndex
                    ? 'var(--primary)'
                    : 'rgba(0,0,0,0.15)',
                }}
              />
            ))}
          </div>

          {/* ── Soft upsell ── */}
          <div className="text-center py-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            <p className="text-xs text-on-surface-variant">
              Đang xem bản demo ({demoCards.length}/{totalCards} thẻ) ·{' '}
              <Link to="/register" className="font-semibold transition-colors"
                style={{ color: 'var(--secondary)' }}>
                Đăng ký để học toàn bộ →
              </Link>
            </p>
          </div>
        </>
      ) : (
        <DemoComplete deck={deck} demoCount={demoCards.length} onRestart={handleRestart} />
      )}
    </div>
  );
}
