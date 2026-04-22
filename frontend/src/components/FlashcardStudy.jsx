import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FlashcardStudy({ deck, onComplete }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState(new Set());

  const cards = deck.cards || [];
  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  const handleFlip = () => {
    if (!isFlipped) {
      setStudiedCards((prev) => new Set([...prev, currentCard.id]));
    }
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        deckId: deck.id,
        totalCards: cards.length,
        studiedCards: studiedCards.size,
      });
    }
    navigate('/dashboard');
  };

  if (!cards.length) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-gray-500">Bộ thẻ này chưa có thẻ nào.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Quay lại
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
          <h1 className="text-2xl font-bold text-gray-900">{deck.name}</h1>
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
      </div>

      {/* Flashcard */}
      <div
        className="relative h-80 cursor-pointer mb-6"
        onClick={handleFlip}
        style={{ perspective: '1000px' }}
      >
        <div
          className={`absolute inset-0 w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
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

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Trước
        </button>

        <button
          onClick={handleFlip}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          {isFlipped ? 'Lật lại' : 'Xem đáp án'}
        </button>

        {currentIndex === cards.length - 1 ? (
          <button
            onClick={handleComplete}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            Hoàn thành
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            Tiếp
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Đã học: {studiedCards.size} / {cards.length} thẻ
      </div>
    </div>
  );
}
