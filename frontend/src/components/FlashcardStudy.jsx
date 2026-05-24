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
        <p className="text-sm font-medium text-on-surface-variant mb-6">Bộ thẻ này chưa có thẻ ghi nhớ nào.</p>
        <button
          onClick={() => navigate(`/deck/${deck.id}`)}
          className="px-5 py-2.5 text-on-secondary hover:bg-secondary-dim text-xs font-bold uppercase tracking-wider transition-all"
          style={{ background: 'var(--secondary)' }}
        >
          Quay lại bộ thẻ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-0">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/deck/${deck.id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors mb-6"
        >
          <ArrowLeftCircle className="w-4 h-4" />
          Quay lại bộ thẻ
        </button>

        <div className="flex items-end justify-between mb-3">
          <div>
            <h1 className="font-headline text-2xl font-bold text-on-surface tracking-tight">{deck.name}</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-1">Ôn tập thẻ ghi nhớ</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-secondary">{currentIndex + 1}</span>
            <span className="text-on-surface-variant text-sm font-medium"> / {cards.length}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-surface-container border border-outline-variant/20 overflow-hidden">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, background: 'var(--secondary)' }}
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
            className="absolute inset-0 bg-surface-container-lowest border border-outline-variant sharp-shadow flex flex-col items-center justify-center p-8 transition-all [backface-visibility:hidden]"
          >
            <div className="absolute top-6 left-8 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Mặt trước
            </div>
            {currentCard.jlptLevel && (
              <div className="absolute top-6 right-8 px-2.5 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                N{currentCard.jlptLevel}
              </div>
            )}
            
            <p className="font-jp text-5xl md:text-6xl font-bold text-on-surface text-center mb-4 tracking-tight leading-normal">
              {currentCard.front}
            </p>
            {currentCard.romaji && (
              <p className="text-lg md:text-xl text-on-surface-variant font-medium tracking-wide">
                {currentCard.romaji}
              </p>
            )}

            <div className="absolute bottom-8 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-secondary transition-colors">
              <RotateCw className="w-3.5 h-3.5" /> Nhấn để lật
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#801c1c] to-[#c62828] sharp-shadow flex flex-col items-center justify-center p-8 text-white [backface-visibility:hidden] relative overflow-hidden"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div className="absolute inset-0 asanoha-bg opacity-10 pointer-events-none" />
            <div className="absolute top-6 left-8 text-[10px] font-bold uppercase tracking-widest text-white/60" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Mặt sau
            </div>
            
            <p className="text-3xl md:text-4xl font-bold text-center mb-6 leading-relaxed text-white" style={{ color: '#ffffff' }}>
              {currentCard.back}
            </p>
            
            {currentCard.example && (
              <div className="mt-2 p-5 bg-white/10 backdrop-blur-md border border-white/20 shadow-inner w-full max-w-sm">
                <p className="text-[10px] text-white/60 uppercase font-bold mb-1.5 tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>Ví dụ câu</p>
                <p className="text-base md:text-lg text-white font-medium leading-relaxed font-jp" style={{ color: '#ffffff' }}>
                  {currentCard.example}
                </p>
              </div>
            )}

            <div className="absolute bottom-8 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <RotateCw className="w-3.5 h-3.5" /> Nhấn để lật lại
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 w-full">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Trước</span>
        </button>

        {currentIndex === cards.length - 1 ? (
          <button
            onClick={handleComplete}
            className="flex-[2] flex items-center justify-center gap-2 px-8 py-3.5 text-on-secondary hover:bg-secondary-dim text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            style={{ background: 'var(--secondary)' }}
          >
            Hoàn thành <Check className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-[2] flex items-center justify-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
          >
            Tiếp theo <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats Footer */}
      <div className="mt-8 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 border border-outline-variant/30 bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-wider">
          Đã học: {studiedCards.size} / {cards.length} thẻ
        </span>
      </div>
    </div>
  );
}

