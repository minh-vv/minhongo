import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, RotateCw, Shuffle } from 'lucide-react';
import CollapsibleExample from './CollapsibleExample';
import { useSettings } from '../hooks/useSettings';

function speakJapanese(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  
  // Extract just the Japanese part if the block has translation in parentheses
  const jaText = text.split('\n')[0] || text;
  
  const utterance = new SpeechSynthesisUtterance(jaText);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

export default function FlashcardStudy({ deck, onComplete }) {
  const navigate = useNavigate();
  const { showRomaji, autoPlayAudio } = useSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState(new Set());
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  const [cards, setCards] = useState(() => deck.cards || []);

  useEffect(() => {
    const original = deck.cards || [];
    if (!isShuffled) {
      setCards(original);
    } else {
      const shuffled = [...original];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setCards(shuffled);
    }
  }, [deck.cards, isShuffled]);

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  // Auto-play audio when card changes if enabled
  useEffect(() => {
    if (autoPlayAudio && currentCard) {
      const t = setTimeout(() => {
        speakJapanese(currentCard.front);
      }, 400);
      return () => {
        clearTimeout(t);
        window.speechSynthesis?.cancel();
      };
    }
  }, [currentIndex, autoPlayAudio, currentCard]);

  const handleFlip = useCallback(() => {
    if (!currentCard) return;
    if (!isFlipped) {
      setStudiedCards((prev) => new Set([...prev, currentCard.id]));
    }
    setIsFlipped((prev) => !prev);
  }, [currentCard, isFlipped]);

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else if (isAutoplay) {
      setIsAutoplay(false);
    }
  }, [currentIndex, cards.length, isAutoplay]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

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

  // Autoplay feature
  useEffect(() => {
    if (!isAutoplay) return;

    const timer = setInterval(() => {
      if (!isFlipped) {
        handleFlip();
      } else {
        if (currentIndex < cards.length - 1) {
          handleNext();
        } else {
          setIsAutoplay(false);
        }
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [isAutoplay, isFlipped, currentIndex, cards.length, handleFlip, handleNext]);

  // Keyboard Navigation Hook
  useEffect(() => {
    if (!cards.length) return;

    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFlipped, cards, handleFlip, handleNext, handlePrev]);

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
      {/* Session Progress Block (Cohesive style) */}
      <div className="mb-6">
        <div className="flex items-end justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Tiến trình ôn tập
          </span>
          <div className="text-right">
            <span className="text-2xl font-black text-secondary">{currentIndex + 1}</span>
            <span className="text-on-surface-variant text-sm font-medium"> / {cards.length}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-surface-container border border-outline-variant/20 overflow-hidden">
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%`, background: 'var(--secondary)' }}
          />
        </div>
      </div>

      {/* ── 3D Flashcard with Sharp-Shadow (Template style) ── */}
      <div
        className="w-full cursor-pointer mb-8 relative group [perspective:1500px]"
        style={{ height: '384px' }}
        onClick={handleFlip}
      >
        {/* Inner rotating element */}
        <div
          className="w-full h-full"
          style={{
            position: 'relative',
            height: '100%',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* ── Front face (Clean White + Sharp Shadow) ── */}
          <div
            className="absolute inset-0 bg-surface-container-lowest border-2 border-outline-variant/80 sharp-shadow flex flex-col items-center justify-between p-8"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-secondary" />

            <div className="flex items-center justify-between w-full mt-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
                Mặt trước
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
            </div>

            {/* Bottom hint */}
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 hover:text-secondary transition-colors mt-auto">
              <RotateCw className="w-3.5 h-3.5" /> Nhấn để lật thẻ
            </div>
          </div>

          {/* ── Back face (Clean White + Sharp Shadow) ── */}
          <div
            className="absolute inset-0 bg-surface-container-lowest border-2 border-outline-variant/80 sharp-shadow flex flex-col items-center justify-between p-6 md:p-8"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

            <div className="flex items-center justify-between w-full mt-2 text-on-surface-variant/70">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Mặt sau
              </span>
              <span className="font-jp text-sm font-bold">
                {currentCard.front}
              </span>
            </div>

            {/* Middle Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md my-auto gap-4">
              <div className="text-center w-full">
                <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-1">Giải nghĩa & Cách đọc</p>
                {showRomaji && currentCard.romaji && (
                  <p className="font-jp text-lg text-secondary font-bold mb-2">
                    {currentCard.romaji}
                  </p>
                )}
                <p className="text-2xl md:text-3xl font-black text-on-surface tracking-wide leading-snug whitespace-pre-line">
                  {currentCard.back}
                </p>
              </div>

              {currentCard.example && (
                <CollapsibleExample 
                  example={currentCard.example} 
                  onSpeak={speakJapanese} 
                  maxHeightClass="max-h-[110px]"
                />
              )}
            </div>

            {/* Bottom hint */}
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 hover:text-primary transition-colors mt-auto">
              <RotateCw className="w-3.5 h-3.5" /> Nhấn để lật lại
            </div>
          </div>
        </div>
      </div>

      {/* Sleek rect controls with sharp shadow matching the project template */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Autoplay */}
          <button
            onClick={() => setIsAutoplay(!isAutoplay)}
            className={`flex-1 sm:flex-initial px-4 py-3 border-2 border-outline-variant bg-surface-container-lowest text-xs font-bold uppercase tracking-wider transition-all sharp-shadow-sm ${
              isAutoplay ? 'text-secondary border-secondary bg-secondary/5 font-black' : 'text-on-surface hover:bg-surface-container'
            }`}
          >
            {isAutoplay ? 'Dừng chạy' : 'Tự chạy'}
          </button>

          {/* Shuffle */}
          <button
            onClick={() => {
              setIsShuffled(!isShuffled);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`flex-1 sm:flex-initial px-4 py-3 border-2 border-outline-variant bg-surface-container-lowest text-xs font-bold uppercase tracking-wider transition-all sharp-shadow-sm flex items-center justify-center gap-1.5 ${
              isShuffled ? 'text-secondary border-secondary bg-secondary/5 font-black' : 'text-on-surface hover:bg-surface-container'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>{isShuffled ? 'Thứ tự gốc' : 'Tráo thẻ'}</span>
          </button>
        </div>

        <div className="flex gap-2 flex-1 w-full">
          {/* Prev */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all sharp-shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> <span>Trước</span>
          </button>

          {/* Next/Complete */}
          {currentIndex === cards.length - 1 ? (
            <button
              onClick={handleComplete}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-on-secondary hover:bg-secondary-dim text-xs font-bold uppercase tracking-wider transition-all sharp-shadow-sm"
              style={{ background: 'var(--secondary)' }}
            >
              <span>Hoàn thành</span> <Check className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider transition-all sharp-shadow-sm"
            >
              <span>Tiếp theo</span> <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Footer & Keyboard shortcuts hint */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 border border-outline-variant/30 bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-wider">
          Đã học: {studiedCards.size} / {cards.length} thẻ
        </span>
        <div className="text-[10px] text-on-surface-variant/60 font-semibold uppercase tracking-wider flex items-center gap-5">
          <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-white border border-outline-variant/40 rounded shadow-sm text-[9px]">⇦</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-outline-variant/40 rounded shadow-sm text-[9px]">⇨</kbd> Di chuyển</span>
          <span className="flex items-center gap-1.5"><kbd className="px-3 py-0.5 bg-white border border-outline-variant/40 rounded shadow-sm text-[9px]">Space / Enter</kbd> Lật thẻ</span>
        </div>
      </div>
    </div>
  );
}
