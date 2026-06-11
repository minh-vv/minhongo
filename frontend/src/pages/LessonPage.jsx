import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { flashcardApi } from '../api/flashcardApi';
import aiTutorApi from '../api/aiTutorApi';
import CollapsibleExample from '../components/CollapsibleExample';

// ===== Utilities =====

/** Fisher-Yates shuffle */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Phát âm tiếng Nhật qua Web Speech API */
function speakJapanese(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

/**
 * Tạo danh sách slide cho một bài học.
 * Cấu trúc: overview → learn×N → checkpoint → quiz×N
 */
function buildLessonSlides(cards) {
  const slides = [{ type: 'overview' }];

  cards.forEach((card, i) => {
    slides.push({ type: 'learn', card, index: i });
  });

  slides.push({ type: 'checkpoint' });

  // Shuffle thứ tự quiz để buộc não nhớ thật sự
  shuffleArray(cards).forEach((card, i) => {
    slides.push({ type: 'quiz', card, index: i });
  });

  return slides;
}

// ===== Setup Screen =====

function SetupScreen({ deck, onStart }) {
  const [count, setCount] = useState('5');
  const cardCount = deck?.cards?.length || 0;

  const options = [
    { value: '5', label: '5 từ vựng', sub: 'Nhanh ~5 phút' },
    { value: '10', label: '10 từ vựng', sub: 'Chuẩn ~10 phút' },
    { value: 'all', label: `Tất cả (${cardCount} từ)`, sub: 'Toàn bộ thẻ học' },
  ];

  return (
    <div className="max-w-md mx-auto p-4 md:p-8 space-y-6 animate-fade-up">
      <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 md:p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />
        {/* Header */}
        <div className="mb-6 relative z-10">
          <div className="w-14 h-14 bg-surface-container border border-outline-variant/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📖</span>
          </div>
          <h1 className="font-headline text-xl font-bold text-on-surface">Học bài tương tác</h1>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary mt-1">{deck.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">Sẵn có {cardCount} thẻ trong bộ</p>
        </div>

        {/* Giới thiệu flow */}
        <div className="bg-surface border border-outline-variant/30 p-4 mb-6 space-y-2 text-left relative z-10">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Quy trình học bài:</p>
          {[
            { icon: '📚', text: 'Học từng từ kèm phát âm, ví dụ & trợ lý AI' },
            { icon: '🧠', text: 'Quiz trắc nghiệm ngắn xen kẽ kiểm tra phản xạ' },
            { icon: '🏆', text: 'Tóm tắt kết quả chi tiết & đề xuất học tập' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-2.5 text-xs text-on-surface-variant leading-relaxed">
              <span className="text-sm shrink-0">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Số từ mỗi buổi */}
        <div className="mb-6 text-left relative z-10">
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5">
            Số lượng từ học buổi này
          </label>
          <div className="space-y-2">
            {options.map(({ value, label, sub }) => {
              const disabled = value !== 'all' && parseInt(value, 10) > cardCount;
              const active = count === value;
              return (
                <button
                  key={value}
                  onClick={() => !disabled && setCount(value)}
                  disabled={disabled}
                  className="w-full flex items-center justify-between p-3 border text-left transition-all"
                  style={{
                    border: `2px solid ${active ? 'var(--secondary)' : 'rgba(0,0,0,0.1)'}`,
                    background: active ? 'rgba(198,40,40,0.05)' : 'var(--surface)',
                    opacity: disabled ? 0.4 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span className={`font-semibold text-xs ${active ? 'text-secondary' : 'text-on-surface'}`}>
                    {label}
                  </span>
                  <span className={`text-[10px] font-medium ${active ? 'text-secondary/80' : 'text-on-surface-variant'}`}>
                    {sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bắt đầu */}
        <button
          onClick={() => onStart(count)}
          disabled={cardCount === 0}
          className="w-full py-3 text-sm font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all disabled:opacity-40"
          style={{ background: 'var(--secondary)' }}
        >
          Bắt đầu học →
        </button>

        <Link
          to={`/deck/${deck.id}`}
          className="block text-center text-xs font-semibold text-on-surface-variant hover:text-on-surface mt-4 transition-colors"
        >
          ← Quay lại bộ thẻ
        </Link>
      </div>
    </div>
  );
}

// ===== Overview Slide =====

function OverviewSlide({ words, onNext }) {
  return (
    <div className="max-w-md mx-auto p-4 md:p-8 space-y-6 animate-fade-up">
      <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 md:p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />
        <div className="text-4xl mb-3 relative z-10">🎯</div>
        <h2 className="font-headline text-lg font-bold text-on-surface relative z-10">Bài học hôm nay</h2>
        <p className="text-xs font-bold uppercase tracking-wider text-secondary mt-1 mb-6 relative z-10">
          Chuẩn bị học {words.length} từ vựng mới
        </p>

        {/* Preview các từ sẽ học */}
        <div className="grid grid-cols-2 gap-2 mb-6 max-h-52 overflow-y-auto pr-1 text-left relative z-10 border border-outline-variant/20 p-2 bg-surface">
          {words.map((card, i) => (
            <div key={card.id} className="bg-surface-container-lowest border border-outline-variant/30 p-2.5 flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant tabular-nums">{i + 1}.</span>
                <span className="font-jp font-bold text-sm text-on-surface truncate">{card.front}</span>
              </div>
              {card.romaji && (
                <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{card.romaji}</p>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onNext}
          className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider transition-all relative z-10"
        >
          Bắt đầu học từng từ →
        </button>
      </div>
    </div>
  );
}

// ===== Learn Slide =====

function LearnSlide({ card, index, total, onNext }) {
  const [revealed, setRevealed] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const handleAskAI = async () => {
    setIsExplaining(true);
    try {
      const res = await aiTutorApi.explain({ text: card.front, context: card.example });
      setAiExplanation(res.explanation);
    } catch (err) {
      setAiExplanation('Xin lỗi, Sensei đang bận. Bạn vui lòng thử lại sau nhé!');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleSpeak = useCallback(() => {
    speakJapanese(card.front);
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 2000);
  }, [card.front]);

  // Tự động phát âm khi slide hiện ra
  useEffect(() => {
    setRevealed(false);
    setIsSpeaking(false);
    setAiExplanation(null);
    const t = setTimeout(() => {
      handleSpeak();
    }, 400);
    return () => {
      clearTimeout(t);
      window.speechSynthesis?.cancel();
    };
  }, [card.id, handleSpeak]);

  // Hỗ trợ phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (!revealed) {
          setRevealed(true);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!revealed) {
          setRevealed(true);
        } else {
          onNext();
        }
      } else if (e.key === 'ArrowRight') {
        if (revealed) {
          e.preventDefault();
          onNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [revealed, onNext]);

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 space-y-6 animate-fade-up">
      {/* Progress header */}
      <div className="w-full">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-surface-container border border-outline-variant/20 overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${(index / total) * 100}%`, background: 'var(--secondary)' }}
            />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
            Bài học: {index + 1} / {total}
          </span>
        </div>
      </div>

      {/* Nội dung từ */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />
        {/* Từ Nhật lớn */}
        <div className="text-center mb-6 relative z-10">
          <p className="font-jp text-5xl md:text-6xl font-bold text-on-surface leading-tight mb-2 tracking-tight">
            {card.front}
          </p>
          {card.romaji && (
            <p className="text-base text-on-surface-variant font-medium tracking-wide">{card.romaji}</p>
          )}
          {card.jlptLevel && (
            <span className="inline-block mt-2.5 px-2.5 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
              N{card.jlptLevel}
            </span>
          )}
        </div>

        {/* Nút phát âm */}
        <div className="flex justify-center mb-6 relative z-10">
          <button
            onClick={handleSpeak}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all"
            style={{
              border: isSpeaking ? '2px solid var(--secondary)' : '1px solid rgba(0,0,0,0.15)',
              background: isSpeaking ? 'rgba(198,40,40,0.05)' : 'var(--surface)',
              color: isSpeaking ? 'var(--secondary)' : 'var(--on-surface-variant)',
            }}
          >
            <svg className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
            {isSpeaking ? 'Đang phát âm...' : 'Nghe phát âm'}
          </button>
        </div>

        <hr className="border-outline-variant/30 mb-5 relative z-10" />

        {/* Nút xem nghĩa hoặc nội dung đã reveal */}
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full py-3.5 border border-dashed border-secondary/50 text-secondary hover:bg-secondary/5 transition-all text-xs font-bold uppercase tracking-wider relative z-10"
          >
            👁 Xem nghĩa & câu ví dụ
          </button>
        ) : (
          <div className="space-y-4 relative z-10 animate-fade-up">
            {/* Nghĩa */}
            <div className="bg-surface border border-outline-variant/30 p-4 sharp-shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Nghĩa tiếng Việt
              </p>
              <p className="text-xl font-bold text-on-surface leading-snug">{card.back}</p>
            </div>

            {/* Ví dụ câu */}
            {card.example && (
              <CollapsibleExample 
                example={card.example} 
                onSpeak={speakJapanese} 
                containerClass="bg-surface border border-outline-variant/30 p-4 sharp-shadow-sm text-left"
                maxHeightClass="max-h-[150px]"
              />
            )}

            {/* AI Explain Area */}
            <div className="bg-surface border border-outline-variant/30 p-4 sharp-shadow-sm">
              <div className="flex items-center justify-between mb-2 border-b border-outline-variant/20 pb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                  ✨ Giải thích từ Sensei
                </p>
                {!aiExplanation && (
                  <button 
                    onClick={handleAskAI}
                    disabled={isExplaining}
                    className="text-[9px] px-2.5 py-1 border border-outline-variant bg-surface-container-lowest text-on-surface font-bold uppercase tracking-wider hover:bg-surface-container transition-colors disabled:opacity-50"
                  >
                    {isExplaining ? 'Đang hỏi...' : 'Giải thích chi tiết'}
                  </button>
                )}
              </div>
              {aiExplanation && (
                <div className="prose prose-sm max-w-none text-on-surface text-xs leading-relaxed">
                  <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                </div>
              )}
            </div>

            <button
              onClick={onNext}
              className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider transition-all"
            >
              {index + 1 >= total ? 'Hoàn thành giai đoạn học →' : 'Từ tiếp theo →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Checkpoint Slide =====

function CheckpointSlide({ wordCount, onNext }) {
  return (
    <div className="max-w-md mx-auto p-4 md:p-8 space-y-6 animate-fade-up">
      <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 md:p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />
        <div className="text-4xl mb-3 relative z-10">🧠</div>
        <h2 className="font-headline text-lg font-bold text-on-surface relative z-10">Tốt lắm!</h2>
        <p className="text-xs font-medium text-on-surface-variant mt-1.5 relative z-10">
          Bạn vừa học xong <span className="font-bold text-secondary">{wordCount} từ vựng mới</span>
        </p>
        <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest mt-1 mb-6 relative z-10">
          Bây giờ, hãy làm quiz ngắn để ghi nhớ sâu hơn!
        </p>

        <div className="bg-surface border border-outline-variant/30 p-4 mb-6 text-left space-y-2 relative z-10">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Thử thách tiếp theo:</p>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span>❓</span>
            <span>{wordCount} câu hỏi kiểm tra nhanh phản xạ</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span>⚡</span>
            <span>Lựa chọn nghĩa tiếng Việt chính xác</span>
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full py-3 text-sm font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all relative z-10"
          style={{ background: 'var(--secondary)' }}
        >
          Bắt đầu kiểm tra →
        </button>
      </div>
    </div>
  );
}

// ===== Quiz Slide =====

function QuizSlide({ card, allCards, index, total, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const autoAdvanceTimer = useRef(null);

  // Tạo 4 lựa chọn: 1 đúng + 3 nhiễu
  const options = useMemo(() => {
    const distractors = shuffleArray(allCards.filter((c) => c.id !== card.id))
      .slice(0, 3)
      .map((c) => c.back);
    while (distractors.length < 3) distractors.push(`Phương án ${distractors.length + 2}`);
    return shuffleArray([card.back, ...distractors]);
  }, [card, allCards]);

  // Reset khi đổi slide
  useEffect(() => {
    setSelected(null);
    setAnswered(false);
    return () => clearTimeout(autoAdvanceTimer.current);
  }, [card.id]);

  const handleSelect = (option) => {
    if (answered) return;
    const correct = option === card.back;
    setSelected(option);
    setAnswered(true);

    // Tự động chuyển sang câu tiếp theo sau 1.4s nếu đúng
    if (correct) {
      autoAdvanceTimer.current = setTimeout(() => onAnswer(true), 1400);
    }
    // Nếu sai, chờ user nhấn nút (để có thời gian xem đáp án đúng)
    else {
      onAnswer(false);
    }
  };

  const getOptionStyle = (option) => {
    if (!answered) return { border: '1px solid rgba(0,0,0,0.12)', bg: 'bg-surface-container-lowest text-on-surface hover:border-secondary hover:bg-secondary/5' };
    if (option === card.back) return { border: '2px solid #4caf50', bg: 'bg-green-500/10 text-green-800' };
    if (option === selected) return { border: '2px solid var(--secondary)', bg: 'bg-secondary/10 text-secondary' };
    return { border: '1px solid rgba(0,0,0,0.06)', bg: 'bg-surface-container-low text-on-surface-variant/40 opacity-50' };
  };

  const progressPct = (index / total) * 100;

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 space-y-6 animate-fade-up">
      {/* Progress header */}
      <div className="w-full">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-surface-container border border-outline-variant/20 overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: 'var(--secondary)' }}
            />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
            Quiz: {index + 1} / {total}
          </span>
        </div>
      </div>

      {/* Nội dung quiz */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4 text-center relative z-10">
          Chọn nghĩa tiếng Việt đúng
        </p>

        {/* Từ cần đoán */}
        <div className="text-center mb-6 relative z-10">
          <p className="font-jp text-5xl font-bold text-on-surface mb-2 tracking-tight leading-normal">
            {card.front}
          </p>
          {card.romaji && (
            <p className="text-sm text-on-surface-variant font-medium tracking-wide mb-2">{card.romaji}</p>
          )}
          <button
            onClick={() => speakJapanese(card.front)}
            className="text-[10px] font-bold uppercase tracking-wider text-secondary hover:underline flex items-center gap-1 mx-auto"
          >
            🔊 Nghe phát âm
          </button>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
          {options.map((option, i) => {
            const optStyle = getOptionStyle(option);
            return (
              <button
                key={i}
                onClick={() => handleSelect(option)}
                className={`p-4 text-left transition-all ${optStyle.bg}`}
                style={{ border: optStyle.border }}
              >
                <span className="inline-block w-5 h-5 bg-surface border border-outline-variant/30 text-on-surface-variant text-[10px] font-bold text-center leading-5 mb-2">
                  {String.fromCharCode(65 + i)}
                </span>
                <p className="text-xs font-semibold leading-relaxed">{option}</p>
              </button>
            );
          })}
        </div>

        {/* Feedback sau khi trả lời */}
        {answered && (
          <div className="relative z-10 animate-fade-up">
            <div className="flex items-center gap-2 p-3 border font-semibold text-xs uppercase tracking-wider mb-4"
                 style={{
                   background: selected === card.back ? 'rgba(76,175,80,0.1)' : 'rgba(198,40,40,0.08)',
                   borderColor: selected === card.back ? 'rgba(76,175,80,0.3)' : 'var(--outline-variant)',
                   color: selected === card.back ? '#2e7d32' : 'var(--secondary)',
                 }}>
              <span className="text-sm">{selected === card.back ? '✅' : '❌'}</span>
              <span>
                {selected === card.back
                  ? 'Chính xác!'
                  : `Chưa đúng. Đáp án: ${card.back}`}
              </span>
            </div>
            
            {selected !== card.back && (
              <button
                onClick={() => onAnswer(false)}
                className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider transition-all"
              >
                Tiếp theo →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Results Screen =====

function ResultsScreen({ results, deckId, deckName, wordCount, onRetry }) {
  const correctCount = results.filter((r) => r).length;
  const percentage = wordCount > 0 ? Math.round((correctCount / wordCount) * 100) : 0;

  const grade = (() => {
    if (percentage >= 90) return { label: 'Xuất sắc!', emoji: '🏆', color: 'text-amber-800' };
    if (percentage >= 75) return { label: 'Tốt lắm!', emoji: '⭐', color: 'text-green-800' };
    if (percentage >= 50) return { label: 'Khá tốt!', emoji: '📚', color: 'text-primary' };
    return { label: 'Cần ôn tập thêm!', emoji: '💪', color: 'text-secondary' };
  })();

  return (
    <div className="max-w-md mx-auto p-4 md:p-8 space-y-5 animate-fade-up">
      {/* Score card */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 md:p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />
        <div className="text-4xl mb-3 relative z-10">{grade.emoji}</div>
        <h2 className={`font-headline text-xl font-bold mb-1 relative z-10 ${grade.color}`}>{grade.label}</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4 relative z-10">{deckName}</p>

        <div className="text-6xl font-black text-on-surface my-4 relative z-10">{percentage}%</div>

        <p className="text-xs font-semibold text-on-surface-variant relative z-10">
          Trả lời đúng <span className="font-black text-green-700">{correctCount}</span> / {wordCount} câu hỏi
        </p>

        <div className="h-2.5 bg-surface-container border border-outline-variant/20 overflow-hidden mt-4 relative z-10">
          <div
            className="h-full transition-all duration-1000"
            style={{ width: `${percentage}%`, background: 'var(--secondary)' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5 relative z-10">
          <div className="bg-surface border border-outline-variant/20 p-3 text-center">
            <div className="text-xl font-black text-green-700">{correctCount}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant mt-0.5">Đúng</div>
          </div>
          <div className="bg-surface border border-outline-variant/20 p-3 text-center">
            <div className="text-xl font-black text-secondary">{wordCount - correctCount}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant mt-0.5">Sai</div>
          </div>
        </div>
      </div>

      {/* Nút hành động */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRetry}
          className="py-3 text-xs font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all flex items-center justify-center gap-1.5"
          style={{ background: 'var(--secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Học lại
        </button>
        <Link
          to={`/deck/${deckId}`}
          className="py-3 border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Về bộ thẻ
        </Link>
      </div>

      {/* Gợi ý luyện tập tiếp */}
      {percentage < 80 && (
        <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-5 text-center">
          <p className="text-xs font-medium text-on-surface-variant mb-3">
            Muốn củng cố những từ chưa nhớ sâu?
          </p>
          <Link
            to={`/practice/${deckId}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            🧪 Luyện tập ngay
          </Link>
        </div>
      )}
    </div>
  );
}

// ===== Main LessonPage =====

export default function LessonPage() {
  const { deckId } = useParams();

  const [phase, setPhase] = useState('setup'); // setup | lesson | done
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lessonWords, setLessonWords] = useState([]);
  // Mảng boolean kết quả quiz: true = đúng, false = sai
  const [quizResults, setQuizResults] = useState([]);
  const [savedCount, setSavedCount] = useState(0);

  const { data: deck, isLoading, error } = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => flashcardApi.getDeck(deckId),
  });

  const handleStart = useCallback(
    (count) => {
      const cards = deck?.cards || [];
      const selected =
        count === 'all'
          ? shuffleArray(cards)
          : shuffleArray(cards).slice(0, Math.min(parseInt(count, 10), cards.length));

      const built = buildLessonSlides(selected);
      setLessonWords(selected);
      setSlides(built);
      setCurrentSlide(0);
      setQuizResults([]);
      setSavedCount(selected.length);
      setPhase('lesson');
    },
    [deck],
  );

  const handleSlideNext = useCallback(
    (quizCorrect) => {
      const next = currentSlide + 1;

      if (slides[currentSlide]?.type === 'quiz') {
        setQuizResults((prev) => [...prev, quizCorrect ?? false]);
      }

      if (next >= slides.length) {
        setPhase('done');
      } else {
        setCurrentSlide(next);
      }
    },
    [currentSlide, slides],
  );

  const handleRetry = () => {
    if (lessonWords.length > 0) {
      const built = buildLessonSlides(lessonWords);
      setSlides(built);
      setCurrentSlide(0);
      setQuizResults([]);
      setPhase('lesson');
    }
  };

  // ---- Loading / error states ----
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-fade-up">
        <div className="animate-spin w-8 h-8 border-2 border-outline-variant border-t-secondary rounded-full" />
        <p className="text-on-surface-variant text-sm font-semibold mt-4">Đang tải bài học...</p>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="max-w-md mx-auto p-8 text-center py-16 animate-fade-up">
        <p className="font-headline text-lg font-bold text-secondary mb-4">Không tìm thấy bộ thẻ!</p>
        <Link to="/dashboard" className="px-4 py-2 border border-outline-variant bg-surface hover:bg-surface-container text-on-surface text-xs font-bold uppercase tracking-wider transition-all">
          Quay lại Dashboard
        </Link>
      </div>
    );
  }

  // ---- Setup phase ----
  if (phase === 'setup') {
    return <SetupScreen deck={deck} onStart={handleStart} />;
  }

  // ---- Done phase ----
  if (phase === 'done') {
    return (
      <ResultsScreen
        results={quizResults}
        deckId={deckId}
        deckName={deck.name}
        wordCount={savedCount}
        onRetry={handleRetry}
      />
    );
  }

  // ---- Lesson phase: render current slide ----
  const slide = slides[currentSlide];
  if (!slide) return null;

  let slideContent = null;
  if (slide.type === 'overview') {
    slideContent = <OverviewSlide words={lessonWords} onNext={handleSlideNext} />;
  } else if (slide.type === 'learn') {
    slideContent = (
      <LearnSlide
        key={slide.card.id + '-learn-' + currentSlide}
        card={slide.card}
        index={slide.index}
        total={lessonWords.length}
        onNext={handleSlideNext}
      />
    );
  } else if (slide.type === 'checkpoint') {
    slideContent = <CheckpointSlide wordCount={lessonWords.length} onNext={handleSlideNext} />;
  } else if (slide.type === 'quiz') {
    slideContent = (
      <QuizSlide
        key={slide.card.id + '-quiz-' + currentSlide}
        card={slide.card}
        allCards={lessonWords}
        index={slide.index}
        total={lessonWords.length}
        onAnswer={handleSlideNext}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xl mx-auto px-4 md:px-6 pt-4 flex items-center justify-between">
        <Link
          to={`/deck/${deckId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs font-bold uppercase tracking-wider transition-colors sharp-shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Thoát học bài
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface border border-outline-variant/30 px-2 py-1">
          {deck.name}
        </span>
      </div>
      {slideContent}
    </div>
  );
}
