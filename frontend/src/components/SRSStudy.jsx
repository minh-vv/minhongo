import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { flashcardApi } from '../api/flashcardApi';

const REVIEW_QUALITY = {
  AGAIN: 0,
  HARD: 1,
  GOOD: 2,
  EASY: 3,
};

export default function SRSStudy({ dueData, onComplete }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const cards = dueData?.dueCards ?? [];
  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  const reviewMutation = useMutation({
    mutationFn: ({ cardId, quality }) => flashcardApi.reviewCard(cardId, quality),
    onSuccess: (data) => {
      setLastResult(data);
      setShowResult(true);

      // Tự động chuyển sang thẻ tiếp theo sau 1.5s
      setTimeout(() => {
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
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tuyệt vời!</h2>
        <p className="text-gray-500 mb-6">Bạn đã hoàn thành tất cả thẻ cần ôn tập hôm nay.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Quay lại Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>

        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{dueData.deck.name}</h1>
            <p className="text-sm text-gray-500">Spaced Repetition</p>
          </div>
          <span className="text-gray-500">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-3 text-sm">
          <span className="text-gray-500">
            Tổng: {dueData.deck.totalCards} thẻ
          </span>
          <span className="text-blue-600 font-medium">
            Cần ôn: {cards.length - currentIndex} thẻ
          </span>
        </div>
      </div>

      {/* Result Message */}
      {showResult && lastResult && (
        <div
          className={`mb-4 p-4 rounded-xl text-center font-medium ${
            lastResult.quality === REVIEW_QUALITY.AGAIN
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {lastResult.message}
        </div>
      )}

      {/* Flashcard */}
      <div
        className="relative h-80 cursor-pointer mb-6"
        onClick={handleFlip}
        style={{ perspective: '1000px' }}
      >
        <div
          className={`absolute inset-0 w-full h-full transition-transform duration-500 ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white border-2 border-blue-200 rounded-2xl shadow-lg flex flex-col items-center justify-center p-6"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-sm text-blue-500 mb-2">Tiếng Nhật</p>
            <p className="text-4xl font-bold text-gray-900 text-center mb-2">
              {currentCard.front}
            </p>
            {currentCard.romaji && (
              <p className="text-lg text-gray-500">{currentCard.romaji}</p>
            )}
            {currentCard.jlptLevel && (
              <span className="mt-4 px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
                JLPT N{currentCard.jlptLevel}
              </span>
            )}
            <p className="mt-6 text-sm text-gray-400">Nhấn để lật</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-blue-50 border-2 border-blue-200 rounded-2xl shadow-lg flex flex-col items-center justify-center p-6"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="text-sm text-blue-500 mb-2">Nghĩa tiếng Việt</p>
            <p className="text-3xl font-bold text-gray-900 text-center mb-4">
              {currentCard.back}
            </p>
            {currentCard.example && (
              <div className="mt-4 p-4 bg-white rounded-lg w-full">
                <p className="text-sm text-gray-500 mb-1">Ví dụ:</p>
                <p className="text-gray-700">{currentCard.example}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Buttons */}
      <div className="space-y-4">
        {!isFlipped ? (
          <button
            onClick={handleFlip}
            className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-lg"
          >
            Xem đáp án
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => handleReview(REVIEW_QUALITY.AGAIN)}
              disabled={reviewMutation.isPending}
              className="py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium disabled:opacity-50"
            >
              <span className="block text-lg font-bold">Again</span>
              <span className="block text-xs opacity-80">&lt;1 phút</span>
            </button>
            <button
              onClick={() => handleReview(REVIEW_QUALITY.HARD)}
              disabled={reviewMutation.isPending}
              className="py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-medium disabled:opacity-50"
            >
              <span className="block text-lg font-bold">Hard</span>
              <span className="block text-xs opacity-80">
                {lastResult?.interval || '?'} ngày
              </span>
            </button>
            <button
              onClick={() => handleReview(REVIEW_QUALITY.GOOD)}
              disabled={reviewMutation.isPending}
              className="py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 font-medium disabled:opacity-50"
            >
              <span className="block text-lg font-bold">Good</span>
              <span className="block text-xs opacity-80">
                {lastResult?.interval || '?'} ngày
              </span>
            </button>
            <button
              onClick={() => handleReview(REVIEW_QUALITY.EASY)}
              disabled={reviewMutation.isPending}
              className="py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium disabled:opacity-50"
            >
              <span className="block text-lg font-bold">Easy</span>
              <span className="block text-xs opacity-80">
                {lastResult?.interval || '?'} ngày
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 text-center text-sm text-gray-500">
        {!isFlipped ? (
          <p>Nhấn vào thẻ hoặc nút "Xem đáp án" để lật thẻ</p>
        ) : (
          <p>Chọn mức độ nhớ của bạn để hệ thống lên lịch ôn tập phù hợp</p>
        )}
      </div>
    </div>
  );
}
