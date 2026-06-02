import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
      // Invalidate queries to update stats and due cards count in real-time
      queryClient.invalidateQueries({ queryKey: ['deckStats', dueData?.deck?.id] });
      queryClient.invalidateQueries({ queryKey: ['dueCards', dueData?.deck?.id] });

      setLastResult(data);
      setShowResult(true);

      // Tự động chuyển sang thẻ tiếp theo sau 1.5s
      timerRef.current = setTimeout(() => {
        setShowResult(false);
        setLastResult(null);
        setIsFlipped(false);

        if (currentIndex < cards.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // Hoàn thành tất cả thẻ
          if (onComplete) {
            onComplete({
              deckId: dueData?.deck?.id,
              totalCards: cards.length,
              reviewedCards: cards.length,
            });
          }
          navigate('/dashboard');
        }
      }, 1500);
    },
  });

  const handleReview = (quality) => {
    if (!currentCard) return;
    if (!isFlipped) {
      setIsFlipped(true);
    }
    reviewMutation.mutate({ cardId: currentCard.id, quality });
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

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
      {/* Header - Session Progress Only */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Tiến trình ôn tập
          </span>
          <span className="text-on-surface-variant text-sm font-semibold">
            {currentIndex + 1} / {cards.length}
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

      {/* Result Message */}
      {showResult && lastResult && (
        <div
          className={`mb-4 p-3 border text-center text-sm font-semibold uppercase tracking-wider ${
            lastResult.quality === REVIEW_QUALITY.AGAIN
              ? 'bg-red-500/10 border-red-500/30 text-red-800'
              : 'bg-green-500/10 border-green-500/30 text-green-800'
          }`}
        >
          {lastResult.message}
        </div>
      )}

      {/* Flashcard */}
      <div
        className="relative h-80 cursor-pointer mb-6 group [perspective:1500px]"
        onClick={handleFlip}
      >
        <div
          className="relative w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] [transform-style:preserve-3d]"
          style={{
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-surface-container-lowest border border-outline-variant sharp-shadow flex flex-col items-center justify-center p-6 [backface-visibility:hidden]"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Tiếng Nhật</p>
            <p className="font-jp text-4xl md:text-5xl font-bold text-on-surface text-center mb-2 tracking-tight leading-normal">
              {currentCard.front}
            </p>
            {currentCard.romaji && (
              <p className="text-base text-on-surface-variant font-medium tracking-wide">{currentCard.romaji}</p>
            )}
            {currentCard.jlptLevel && (
              <span className="mt-4 px-2.5 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                JLPT N{currentCard.jlptLevel}
              </span>
            )}
            <p className="absolute bottom-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-secondary transition-colors">
              Nhấn để lật
            </p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#801c1c] to-[#c62828] sharp-shadow flex flex-col items-center justify-center p-6 text-white [backface-visibility:hidden] relative overflow-hidden"
            style={{
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="absolute inset-0 asanoha-bg opacity-10 pointer-events-none" />
            
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Tiếng Nhật</p>
            <p className="font-jp text-3xl md:text-4xl font-bold text-center mb-1 leading-normal text-white" style={{ color: '#ffffff' }}>
              {currentCard.front}
            </p>
            {currentCard.romaji && (
              <p className="text-xs text-white/70 tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>{currentCard.romaji}</p>
            )}

            <div className="w-12 h-px bg-white/20 mb-3" />

            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Nghĩa tiếng Việt</p>
            <p className="text-2xl md:text-3xl font-bold text-center mb-4 leading-relaxed text-white" style={{ color: '#ffffff' }}>
              {currentCard.back}
            </p>
            {currentCard.example && (
              <div className="mt-2 p-4 bg-white/10 backdrop-blur-md border border-white/20 shadow-inner w-full max-w-md">
                <p className="text-[10px] text-white/60 uppercase font-bold mb-1 tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>Ví dụ</p>
                <p className="text-sm md:text-base text-white font-medium leading-relaxed font-jp" style={{ color: '#ffffff' }}>{currentCard.example}</p>
              </div>
            )}
            <p className="absolute bottom-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Nhấn để lật lại
            </p>
          </div>
        </div>
      </div>

      {/* Review Buttons */}
      <div className="space-y-4">
        {!isFlipped ? (
          <button
            onClick={handleFlip}
            className="w-full py-4 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
          >
            Xem đáp án
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleReview(REVIEW_QUALITY.AGAIN)}
              disabled={reviewMutation.isPending || showResult}
              className="py-3 bg-red-700 text-white hover:bg-red-800 disabled:opacity-50 transition-colors sharp-shadow-sm border border-red-800"
            >
              <span className="block text-sm font-bold uppercase tracking-wider">Again</span>
              <span className="block text-[10px] opacity-80 mt-0.5">&lt;1 phút</span>
            </button>
            <button
              onClick={() => handleReview(REVIEW_QUALITY.HARD)}
              disabled={reviewMutation.isPending || showResult}
              className="py-3 bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors sharp-shadow-sm border border-amber-700"
            >
              <span className="block text-sm font-bold uppercase tracking-wider">Hard</span>
              <span className="block text-[10px] opacity-80 mt-0.5">
                {getNextInterval(currentCard, REVIEW_QUALITY.HARD)} ngày
              </span>
            </button>
            <button
              onClick={() => handleReview(REVIEW_QUALITY.GOOD)}
              disabled={reviewMutation.isPending || showResult}
              className="py-3 bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 transition-colors sharp-shadow-sm border border-green-800"
            >
              <span className="block text-sm font-bold uppercase tracking-wider">Good</span>
              <span className="block text-[10px] opacity-80 mt-0.5">
                {getNextInterval(currentCard, REVIEW_QUALITY.GOOD)} ngày
              </span>
            </button>
            <button
              onClick={() => handleReview(REVIEW_QUALITY.EASY)}
              disabled={reviewMutation.isPending || showResult}
              className="py-3 bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50 transition-colors sharp-shadow-sm border border-blue-800"
            >
              <span className="block text-sm font-bold uppercase tracking-wider">Easy</span>
              <span className="block text-[10px] opacity-80 mt-0.5">
                {getNextInterval(currentCard, REVIEW_QUALITY.EASY)} ngày
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 text-center text-xs font-medium uppercase tracking-wider text-on-surface-variant">
        {!isFlipped ? (
          <p>Nhấn vào thẻ hoặc nút "Xem đáp án" để lật thẻ</p>
        ) : (
          <p>Chọn mức độ nhớ để lên lịch ôn tập</p>
        )}
      </div>
    </div>
  );
}
