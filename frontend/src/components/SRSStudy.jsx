import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCw } from 'lucide-react';
import { flashcardApi } from '../api/flashcardApi';

const REVIEW_QUALITY = {
  AGAIN: 0,
  HARD: 1,
  GOOD: 2,
  EASY: 3,
};

const getNextInterval = (card, quality) => {
  const progress = card?.progress;
  const easeFactor = progress?.easeFactor ?? 2.5;
  const interval = progress?.interval ?? 0;
  const repetitions = progress?.repetitions ?? 0;

  if (quality < 2) {
    return 1;
  } else {
    if (repetitions === 0) {
      return 1;
    } else if (repetitions === 1) {
      return 6;
    } else {
      return Math.max(1, Math.round(interval * easeFactor));
    }
  }
};

export default function SRSStudy({ dueData, onComplete }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const cards = dueData?.dueCards ?? [];
  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  const reviewMutation = useMutation({
    mutationFn: ({ cardId, quality }) => flashcardApi.reviewCard(cardId, quality),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deckStats', dueData?.deck?.id] });
      queryClient.invalidateQueries({ queryKey: ['dueCards', dueData?.deck?.id] });

      setLastResult(data);
      setShowResult(true);

      timerRef.current = setTimeout(() => {
        setShowResult(false);
        setLastResult(null);
        setIsFlipped(false);

        if (currentIndex < cards.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          if (onComplete) {
            onComplete({
              deckId: dueData?.deck?.id,
              totalCards: cards.length,
              reviewedCards: cards.length,
            });
          }
          navigate('/dashboard');
        }
      }, 1200);
    },
  });

  const handleReview = (quality) => {
    if (!currentCard || reviewMutation.isPending || showResult) return;
    if (!isFlipped) {
      setIsFlipped(true);
    }
    reviewMutation.mutate({ cardId: currentCard.id, quality });
  };

  const handleFlip = () => {
    if (showResult) return;
    setIsFlipped(!isFlipped);
  };

  // Keyboard navigation & Anki style shortcuts
  useEffect(() => {
    if (!cards.length || !currentCard) return;

    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!isFlipped) {
          handleFlip();
        } else {
          handleReview(REVIEW_QUALITY.GOOD);
        }
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault();
          handleReview(REVIEW_QUALITY.AGAIN);
        } else if (e.key === '2') {
          e.preventDefault();
          handleReview(REVIEW_QUALITY.HARD);
        } else if (e.key === '3') {
          e.preventDefault();
          handleReview(REVIEW_QUALITY.GOOD);
        } else if (e.key === '4') {
          e.preventDefault();
          handleReview(REVIEW_QUALITY.EASY);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFlipped, currentCard, cards]);

  if (!cards.length) {
    return (
      <div className="text-center py-20 animate-fade-up">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Tuyệt vời!</h2>
        <p className="text-on-surface-variant text-sm mb-6">Bạn đã hoàn thành tất cả thẻ cần ôn tập hôm nay.</p>
        <button
          onClick={() => navigate(`/deck/${dueData.deck.id}`)}
          className="px-5 py-2.5 text-on-secondary hover:bg-secondary-dim text-xs font-bold uppercase tracking-wider transition-all"
          style={{ background: 'var(--secondary)' }}
        >
          Quay lại bộ thẻ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      {/* Session Progress Block */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Tiến trình ôn tập
          </span>
          <span className="text-on-surface-variant text-sm font-semibold">
            {currentIndex + 1} / {cards.length} due
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-surface-container border border-outline-variant/20 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${progress}%`, background: 'var(--secondary)' }}
          />
        </div>
      </div>

      {/* Result Message Banner */}
      {showResult && lastResult && (
        <div
          className={`mb-4 p-3 border text-center text-xs font-bold uppercase tracking-wider transition-all animate-fade-up ${
            lastResult.quality === REVIEW_QUALITY.AGAIN
              ? 'bg-red-500/10 border-red-500/30 text-red-800'
              : 'bg-green-500/10 border-green-500/30 text-green-800'
          }`}
        >
          {lastResult.message}
        </div>
      )}

      {/* 3D Flashcard with Sharp-Shadow (Template style) */}
      <div
        className="relative cursor-pointer mb-6 group [perspective:1500px]"
        style={{ height: '384px' }}
        onClick={handleFlip}
      >
        {/* Inner rotating element */}
        <div
          className="relative w-full h-full transition-transform duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] [transform-style:preserve-3d]"
          style={{
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* ── Front face (Clean White + Sharp Shadow) ── */}
          <div
            className="absolute inset-0 bg-surface-container-lowest border-2 border-outline-variant/80 sharp-shadow flex flex-col items-center justify-between p-8 [backface-visibility:hidden]"
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-secondary" />

            <div className="flex items-center justify-between w-full mt-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
                Tiếng Nhật
              </span>
              {currentCard.jlptLevel && (
                <span className="px-2.5 py-0.5 bg-primary/5 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                  JLPT N{currentCard.jlptLevel}
                </span>
              )}
            </div>

            {/* Middle Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <p className="font-jp text-5xl md:text-6xl font-bold text-on-surface text-center tracking-tight leading-snug">
                {currentCard.front}
              </p>
              {currentCard.romaji && (
                <p className="text-lg md:text-xl text-on-surface-variant font-medium tracking-wide mt-3">
                  {currentCard.romaji}
                </p>
              )}
            </div>

            {/* Bottom hint */}
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant/85 hover:text-secondary transition-colors mt-auto">
              <RotateCw className="w-3.5 h-3.5" /> Nhấn để lật thẻ
            </p>
          </div>

          {/* ── Back face (Clean White + Sharp Shadow) ── */}
          <div
            className="absolute inset-0 bg-surface-container-lowest border-2 border-outline-variant/80 sharp-shadow flex flex-col items-center justify-between p-6 md:p-8 [backface-visibility:hidden]"
            style={{
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

            <div className="flex items-center justify-between w-full mt-2 text-on-surface-variant/70">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Đáp án
              </span>
              <span className="font-jp text-sm font-bold">
                {currentCard.front}
              </span>
            </div>

            {/* Middle Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md my-auto gap-4">
              <div className="text-center w-full">
                <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-1">Giải nghĩa</p>
                <p className="text-2xl md:text-3xl font-black text-on-surface tracking-wide leading-snug">
                  {currentCard.back}
                </p>
              </div>

              {currentCard.example && (
                <div 
                  className="w-full p-4 bg-surface-container-low/50 border border-outline-variant/30 overflow-y-auto max-h-[110px] custom-scrollbar border-l-4 border-l-secondary text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase mb-1 tracking-wider">Ví dụ câu</p>
                  <p className="text-sm font-medium leading-relaxed font-jp text-on-surface">
                    {currentCard.example}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom hint */}
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 hover:text-primary transition-colors mt-auto">
              <RotateCw className="w-3.5 h-3.5" /> Nhấn để lật lại
            </p>
          </div>
        </div>
      </div>

      {/* Review Action Buttons styled with sharp-shadow and solid colors matching the template */}
      <div className="space-y-4">
        {!isFlipped ? (
          <button
            onClick={handleFlip}
            className="w-full py-4 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider transition-all sharp-shadow hover:sharp-shadow-sm shadow-sm"
          >
            Xem đáp án
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {/* AGAIN */}
            <button
              onClick={() => handleReview(REVIEW_QUALITY.AGAIN)}
              disabled={reviewMutation.isPending || showResult}
              className="relative py-3 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white transition-all sharp-shadow hover:sharp-shadow-sm hover:-translate-y-0.5 border border-red-800 flex flex-col items-center justify-center"
            >
              <span className="text-[9px] font-black opacity-55 absolute top-1 right-2 bg-black/20 px-1 rounded">1</span>
              <span className="text-sm font-bold uppercase tracking-wider">Again</span>
              <span className="text-[10px] opacity-80 mt-0.5">&lt;1 phút</span>
            </button>

            {/* HARD */}
            <button
              onClick={() => handleReview(REVIEW_QUALITY.HARD)}
              disabled={reviewMutation.isPending || showResult}
              className="relative py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white transition-all sharp-shadow hover:sharp-shadow-sm hover:-translate-y-0.5 border border-amber-700 flex flex-col items-center justify-center"
            >
              <span className="text-[9px] font-black opacity-55 absolute top-1 right-2 bg-black/20 px-1 rounded">2</span>
              <span className="text-sm font-bold uppercase tracking-wider">Hard</span>
              <span className="text-[10px] opacity-80 mt-0.5">
                {getNextInterval(currentCard, REVIEW_QUALITY.HARD)} ngày
              </span>
            </button>

            {/* GOOD */}
            <button
              onClick={() => handleReview(REVIEW_QUALITY.GOOD)}
              disabled={reviewMutation.isPending || showResult}
              className="relative py-3 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white transition-all sharp-shadow hover:sharp-shadow-sm hover:-translate-y-0.5 border border-green-800 flex flex-col items-center justify-center font-black"
            >
              <span className="text-[9px] font-black opacity-55 absolute top-1 right-2 bg-black/20 px-1 rounded">3</span>
              <span className="text-sm font-bold uppercase tracking-wider">Good</span>
              <span className="text-[10px] opacity-80 mt-0.5">
                {getNextInterval(currentCard, REVIEW_QUALITY.GOOD)} ngày
              </span>
            </button>

            {/* EASY */}
            <button
              onClick={() => handleReview(REVIEW_QUALITY.EASY)}
              disabled={reviewMutation.isPending || showResult}
              className="relative py-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white transition-all sharp-shadow hover:sharp-shadow-sm hover:-translate-y-0.5 border border-blue-800 flex flex-col items-center justify-center"
            >
              <span className="text-[9px] font-black opacity-55 absolute top-1 right-2 bg-black/20 px-1 rounded">4</span>
              <span className="text-sm font-bold uppercase tracking-wider">Easy</span>
              <span className="text-[10px] opacity-80 mt-0.5">
                {getNextInterval(currentCard, REVIEW_QUALITY.EASY)} ngày
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Keyboard Hint Block */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="text-[10px] text-on-surface-variant/60 font-semibold uppercase tracking-wider flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
          {!isFlipped ? (
            <span className="flex items-center gap-1.5">
              <kbd className="px-2.5 py-0.5 bg-white border border-outline-variant/40 shadow-sm rounded text-[9px]">Space / Enter</kbd> 
              Xem đáp án
            </span>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-outline-variant/40 shadow-sm rounded text-[9px]">1</kbd> 
                Again
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-outline-variant/40 shadow-sm rounded text-[9px]">2</kbd> 
                Hard
              </span>
              <span className="flex items-center gap-1 text-primary font-bold">
                <kbd className="px-2.5 py-0.5 bg-white border border-outline-variant/40 shadow-sm rounded text-[9px] text-primary">Space / 3</kbd> 
                Good
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-outline-variant/40 shadow-sm rounded text-[9px]">4</kbd> 
                Easy
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
