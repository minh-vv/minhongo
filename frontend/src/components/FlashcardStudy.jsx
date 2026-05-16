import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, RotateCw, ArrowLeftCircle } from 'lucide-react';

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
      <div className="text-center py-20 flex flex-col items-center">
        <p className="text-xl text-slate-500 font-medium mb-6">Bộ thẻ này chưa có thẻ nào.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
        >
          Quay lại Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-0">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-6"
        >
          <ArrowLeftCircle className="w-5 h-5" />
          Quay lại
        </button>

        <div className="flex items-end justify-between mb-3">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{deck.name}</h1>
            <p className="text-sm font-medium text-slate-400 mt-1">Ôn tập thẻ ghi nhớ</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-indigo-600">{currentIndex + 1}</span>
            <span className="text-slate-400 font-medium"> / {cards.length}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard 3D */}
      <div
        className="relative h-96 w-full cursor-pointer mb-8 group [perspective:1500px]"
        onClick={handleFlip}
      >
        <div
          className="relative w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] [transform-style:preserve-3d]"
          style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center p-8 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all [backface-visibility:hidden]"
          >
            <div className="absolute top-6 left-8 text-xs font-bold tracking-widest text-slate-400 uppercase">
              Mặt trước
            </div>
            {currentCard.jlptLevel && (
              <div className="absolute top-6 right-8 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100">
                N{currentCard.jlptLevel}
              </div>
            )}
            
            <p className="text-6xl md:text-7xl font-extrabold text-slate-800 text-center mb-6 tracking-tight">
              {currentCard.front}
            </p>
            {currentCard.romaji && (
              <p className="text-xl md:text-2xl text-slate-400 font-medium tracking-wide">
                {currentCard.romaji}
              </p>
            )}

            <div className="absolute bottom-8 flex items-center gap-2 text-sm font-semibold text-slate-300 group-hover:text-indigo-400 transition-colors">
              <RotateCw className="w-4 h-4" /> Nhấn để lật
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-[2rem] shadow-[0_8px_30px_rgb(79,70,229,0.3)] flex flex-col items-center justify-center p-8 text-white [backface-visibility:hidden]"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div className="absolute top-6 left-8 text-xs font-bold tracking-widest text-indigo-200 uppercase">
              Mặt sau
            </div>
            
            <p className="text-4xl md:text-5xl font-bold text-center mb-8 drop-shadow-sm">
              {currentCard.back}
            </p>
            
            {currentCard.example && (
              <div className="mt-2 p-5 bg-white/10 backdrop-blur-md rounded-2xl w-full max-w-sm border border-white/20 shadow-inner">
                <p className="text-xs text-indigo-200 uppercase font-bold mb-2 tracking-wider">Ví dụ</p>
                <p className="text-lg md:text-xl text-white font-medium leading-relaxed">
                  {currentCard.example}
                </p>
              </div>
            )}

            <div className="absolute bottom-8 flex items-center gap-2 text-sm font-medium text-indigo-200 group-hover:text-white transition-colors">
              <RotateCw className="w-4 h-4" /> Nhấn để lật lại
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 w-full">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" /> <span className="hidden sm:inline">Trước</span>
        </button>

        {currentIndex === cards.length - 1 ? (
          <button
            onClick={handleComplete}
            className="flex-[2] flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-[0_8px_20px_rgb(16,185,129,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Hoàn thành <Check className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-[2] flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-[0_8px_20px_rgb(79,70,229,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Tiếp theo <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Stats Footer */}
      <div className="mt-8 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-sm font-semibold">
          Đã học: {studiedCards.size} / {cards.length} thẻ
        </span>
      </div>
    </div>
  );
}

