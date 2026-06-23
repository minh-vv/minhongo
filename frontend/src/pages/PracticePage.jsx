/**
 * PracticePage — Luyện tập (3 loại bài tập)
 *
 * 1. multiple-choice  — Trắc nghiệm: xem từ Nhật, chọn nghĩa Việt đúng
 * 2. type-japanese     — Gõ Kanji/Hiragana: xem nghĩa Việt → gõ tiếng Nhật
 * 3. fill-sentence     — Điền từ vào câu: câu khuyết từ, chọn từ đúng điền vào
 */
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { flashcardApi } from '../api/flashcardApi';
import { useSettings } from '../hooks/useSettings';
import {
  IconType, IconPen, IconChevronLeft, IconCheck, IconXCircle,
  IconTrophy, IconStar, IconBookMarked, IconTarget, IconVolume,
  IconRefresh,
} from '../components/Icons';
import {
  shuffleArray,
  fuzzyMatch,
  fuzzyMatchReading,
  normalizeToHiragana,
  generateDistractors,
} from '../utils/quizUtils';

// ===== TTS =====

function speakJP(text, rate = 0.85) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = rate;
  window.speechSynthesis.speak(u);
}

// ===== Exercise generation =====

function buildExercise(card, allCards, type) {
  const cleanMeaning = (txt) => {
    if (!txt) return '';
    const lines = txt.split('\n').map(l => l.trim());
    for (const line of lines) {
      const match = line.match(/^Ý\s*nghĩa\s*:\s*(.*)/i);
      if (match) {
        return match[1].trim();
      }
    }
    return txt;
  };

  switch (type) {
    case 'multiple-choice': {
      const displayAnswer = cleanMeaning(card.back);
      const cleanedCards = allCards.map(c => ({ ...c, backClean: cleanMeaning(c.back) }));
      const distractors = generateDistractors(displayAnswer, cleanedCards, card.id, 'backClean', 3);
      return {
        card, type,
        question: card.front,
        answer: displayAnswer,
        hint: card.romaji || null,
        options: shuffleArray([displayAnswer, ...distractors]),
      };
    }
    case 'type-japanese':
      return {
        card, type,
        question: cleanMeaning(card.back),
        answer: card.front,
        hint: card.romaji || null,
      };
    case 'fill-sentence': {
      if (!card.example) return null;
      // Tách phần tiếng Nhật ra khỏi câu ví dụ (dòng đầu tiên)
      const lines = card.example.split('\n');
      const jpSentence = lines[0] || '';
      // Tìm vị trí từ trong câu và thay bằng ____
      if (!jpSentence.includes(card.front)) return null;
      const blankedSentence = jpSentence.replace(card.front, '＿＿＿＿');
      const distractors = generateDistractors(card.front, allCards, card.id, 'front', 3);
      return {
        card, type,
        question: blankedSentence,
        answer: card.front,
        meaning: cleanMeaning(card.back),
        hint: lines[1] || null, // dòng 2 thường là nghĩa câu
        options: shuffleArray([card.front, ...distractors]),
      };
    }
    default:
      return null;
  }
}

// ===== EXERCISE TYPE CONFIG =====

const EXERCISE_TYPES = [
  {
    id: 'multiple-choice',
    icon: <IconType className="w-5 h-5" />,
    label: 'Trắc nghiệm',
    desc: 'Xem từ tiếng Nhật → chọn nghĩa Việt đúng',
  },
  {
    id: 'type-japanese',
    icon: <IconPen className="w-5 h-5" />,
    label: 'Tự luận (Điền Hiragana)',
    desc: 'Xem nghĩa tiếng Việt → điền cách đọc Hiragana / Romaji',
  },
  {
    id: 'fill-sentence',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
    </svg>,
    label: 'Hoàn thành câu',
    desc: 'Chọn từ tiếng Nhật phù hợp cho câu khuyết',
  },
];

// ===== Setup Screen =====

function SetupScreen({ deck, onStart }) {
  const [types, setTypes] = useState(['multiple-choice']);
  const [count, setCount] = useState('10');
  const [shuffle, setShuffle] = useState(true);
  const cardCount = deck?.cards?.length || 0;

  const toggle = (id) => setTypes((prev) =>
    prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
  );

  const hasExamples = (deck?.cards || []).some((c) => {
    if (!c.example) return false;
    const jpLine = c.example.split('\n')[0] || '';
    return jpLine.includes(c.front);
  });

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 space-y-6 animate-fade-up">
      <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 mb-8">
          <Link to={`/deck/${deck.id}`}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant hover:text-secondary mb-4 transition-colors">
            <IconChevronLeft className="w-3.5 h-3.5" />
            Quay lại bộ thẻ
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 bg-surface-container border border-outline-variant/30 flex items-center justify-center flex-shrink-0 text-primary">
              <IconTarget className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold text-on-surface">Luyện tập</h1>
              <p className="text-xs font-bold uppercase tracking-wider text-secondary mt-0.5">{deck.name} · {cardCount} thẻ</p>
            </div>
          </div>
        </div>

        {/* Exercise types */}
        <div className="relative z-10 mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
            Chọn loại bài tập
          </p>
          <div className="space-y-2.5">
            {EXERCISE_TYPES.map(({ id, icon, label, desc }) => {
              const disabled = id === 'fill-sentence' && !hasExamples;
              const active = types.includes(id);
              return (
                <button key={id}
                  onClick={() => !disabled && toggle(id)}
                  disabled={disabled}
                  className="w-full flex items-center gap-4 p-4 text-left transition-all border group"
                  style={{
                    borderColor: active ? 'var(--secondary)' : 'rgba(0,0,0,0.1)',
                    background: active ? 'rgba(198,40,40,0.03)' : 'var(--surface)',
                    opacity: disabled ? 0.4 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}>
                  <span className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-surface-container border border-outline-variant/20 transition-colors"
                    style={{ borderColor: active ? 'var(--secondary)' : undefined, color: active ? 'var(--secondary)' : 'var(--on-surface-variant)' }}>
                    {icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-on-surface flex items-center gap-1.5">{label}
                      {disabled && <span className="text-[9px] font-medium text-on-surface-variant">(cần câu ví dụ)</span>}
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">{desc}</p>
                  </div>
                  {active && (
                    <IconCheck className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--secondary)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question count */}
        <div className="relative z-10 mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
            Số lượng câu hỏi
          </p>
          <div className="flex gap-2">
            {['10', '20', 'all'].map((c) => {
              const label = c === 'all' ? `Tất cả (${cardCount})` : c;
              const disabled = c !== 'all' && parseInt(c) > cardCount;
              return (
                <button key={c}
                  onClick={() => !disabled && setCount(c)}
                  disabled={disabled}
                  className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border"
                  style={{
                    borderColor: count === c ? 'var(--secondary)' : 'rgba(0,0,0,0.1)',
                    background: count === c ? 'rgba(198,40,40,0.04)' : 'var(--surface)',
                    color: count === c ? 'var(--secondary)' : disabled ? 'rgba(0,0,0,0.25)' : 'var(--on-surface)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Shuffle Option */}
        <div className="relative z-10 mb-6 flex items-center gap-2 p-3 bg-surface border border-outline-variant/30 rounded-lg">
          <input
            type="checkbox"
            id="shuffleQuestions"
            checked={shuffle}
            onChange={(e) => setShuffle(e.target.checked)}
            className="w-4 h-4 border-outline-variant focus:ring-secondary text-secondary accent-secondary cursor-pointer"
          />
          <label htmlFor="shuffleQuestions" className="text-xs font-bold text-on-surface cursor-pointer select-none uppercase tracking-wider">
            Xáo trộn câu hỏi
          </label>
        </div>

        <button
          onClick={() => onStart({ types, count, shuffle })}
          disabled={types.length === 0 || cardCount < 2}
          className="w-full py-3.5 text-sm font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all disabled:opacity-40 relative z-10"
          style={{ background: 'var(--secondary)' }}>
          Bắt đầu luyện tập →
        </button>
        {cardCount < 2 && (
          <p className="text-center text-secondary text-[10px] font-bold uppercase tracking-wider mt-3 relative z-10">
            Cần ít nhất 2 thẻ để luyện tập
          </p>
        )}
      </div>
    </div>
  );
}

// ===== 1. Multiple Choice =====

function MultipleChoiceEx({ exercise, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = useCallback((opt) => {
    if (answered) return;
    const match = fuzzyMatch(opt, exercise.answer);
    setSelected(opt);
    setAnswered(true);
    onAnswer(match.isExact, opt);
  }, [answered, exercise.answer, onAnswer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (answered) return;
      const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
      const idx = keyMap[e.key.toLowerCase()];
      if (idx !== undefined && idx < exercise.options.length) {
        handleSelect(exercise.options[idx]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [answered, exercise.options, handleSelect]);

  const getButtonClass = (opt) => {
    const base = "w-full p-4 text-left transition-all text-sm font-semibold flex gap-3 items-center border rounded-lg duration-150 ";
    if (!answered) {
      return base + "border-outline-variant/60 bg-surface-container-lowest text-on-surface hover:border-primary hover:bg-surface-container-low hover:-translate-y-0.5 active:translate-y-0 sharp-shadow-sm";
    }
    if (opt === exercise.answer) {
      return base + "border-emerald-600 bg-emerald-50/50 text-emerald-800 font-bold";
    }
    if (opt === selected) {
      return base + "border-secondary bg-red-50/50 text-secondary font-bold";
    }
    return base + "border-outline-variant/30 bg-surface/50 text-on-surface-variant/40 opacity-50";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {exercise.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(opt)}
            className={getButtonClass(opt)}
          >
            <span className={`inline-flex items-center justify-center w-6 h-6 text-center text-[10px] font-black rounded-md shrink-0 border transition-colors ${
              !answered
                ? "bg-surface border-outline-variant text-on-surface-variant"
                : opt === exercise.answer
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : opt === selected
                    ? "bg-secondary border-secondary text-white"
                    : "bg-surface border-outline-variant/30 text-on-surface-variant/30"
            }`}>
              {opt === exercise.answer && answered ? "✓" : opt === selected && answered ? "✗" : String.fromCharCode(65 + i)}
            </span>
            <p className="leading-relaxed text-inherit flex-1">{opt}</p>
          </button>
        ))}
      </div>
      {answered && selected !== exercise.answer && (
        <div className="p-3 text-xs border bg-emerald-50/30 text-emerald-800 border-emerald-600/30 rounded-lg text-center font-semibold">
          Đáp án đúng: <strong className="text-sm font-bold">{exercise.answer}</strong>
        </div>
      )}
    </div>
  );
}

// ===== 2. Type Japanese (Gõ Kanji / Hiragana) =====

function TypeJapaneseEx({ exercise, onAnswer }) {
  const { showRomaji } = useSettings();
  const [value, setValue] = useState('');
  const [answered, setAnswered] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = () => {
    if (answered || !value.trim()) return;
    const match = fuzzyMatchReading(value.trim(), exercise.card);
    const correct = match.isExact || match.isFuzzy;
    setMatchResult(match);
    setAnswered(true);
    onAnswer(correct, value.trim());
  };

  const isCorrect = matchResult ? (matchResult.isExact || matchResult.isFuzzy) : null;
  const correctHiragana = normalizeToHiragana(exercise.card.romaji || exercise.card.front);

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={answered}
        placeholder="Gõ cách đọc Hiragana hoặc Romaji..."
        className={`w-full px-4 py-3.5 text-lg font-jp text-center font-bold outline-none transition-all rounded-lg border-2 focus:ring-4 ${
          !answered
            ? 'border-outline-variant/60 bg-surface text-on-surface focus:border-primary focus:ring-primary/10'
            : isCorrect
              ? 'border-emerald-600 bg-emerald-50/20 text-emerald-800'
              : 'border-secondary bg-red-50/20 text-secondary'
        }`}
      />

      {/* Fuzzy match notice */}
      {answered && matchResult?.isFuzzy && !matchResult?.isExact && isCorrect && (
        <div className="p-3 bg-amber-50 text-amber-800 border border-amber-500/20 rounded-lg text-xs font-semibold text-center">
          Gần đúng! Đáp án: <span className="font-jp text-base font-bold text-on-surface mx-1">{exercise.card.front}</span> 
          ({correctHiragana}{showRomaji && exercise.card.romaji && ` - ${exercise.card.romaji}`})
        </div>
      )}

      {answered && !isCorrect && (
        <div className="p-3 bg-red-50 text-secondary border border-secondary/20 rounded-lg text-xs font-semibold text-center">
          Đáp án đúng: <span className="font-jp text-base font-bold text-on-surface mx-1">{exercise.card.front}</span> 
          ({correctHiragana}{showRomaji && exercise.card.romaji && ` - ${exercise.card.romaji}`})
        </div>
      )}

      {answered && isCorrect && !matchResult?.isFuzzy && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-600/30 rounded-lg text-xs font-semibold text-center">
          Chính xác! Đáp án: <span className="font-jp text-base font-bold text-on-surface mx-1">{exercise.card.front}</span> 
          ({correctHiragana}{showRomaji && exercise.card.romaji && ` - ${exercise.card.romaji}`})
        </div>
      )}

      {answered && isCorrect && (
        <div className="flex items-center gap-2">
          <button onClick={() => speakJP(exercise.answer)}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant hover:text-secondary flex items-center gap-1.5 border border-outline-variant/30 bg-surface transition-colors rounded">
            <IconVolume className="w-3.5 h-3.5" />
            Nghe phát âm
          </button>
        </div>
      )}

      {!answered && (
        <button onClick={handleSubmit} disabled={!value.trim()}
          className="w-full py-3 text-xs font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim disabled:opacity-40 transition-all rounded"
          style={{ background: 'var(--secondary)' }}>
          Kiểm tra
        </button>
      )}
    </div>
  );
}

// ===== 3. Fill Sentence (Điền từ vào câu) =====

function FillSentenceEx({ exercise, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = useCallback((opt) => {
    if (answered) return;
    const correct = opt === exercise.answer;
    setSelected(opt);
    setAnswered(true);
    onAnswer(correct, opt);
  }, [answered, exercise.answer, onAnswer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (answered) return;
      const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
      const idx = keyMap[e.key.toLowerCase()];
      if (idx !== undefined && idx < exercise.options.length) {
        handleSelect(exercise.options[idx]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [answered, exercise.options, handleSelect]);

  const getButtonClass = (opt) => {
    const base = "w-full p-4 text-center transition-all font-jp font-bold text-base border rounded-lg duration-150 ";
    if (!answered) {
      return base + "border-outline-variant/60 bg-surface-container-lowest text-on-surface hover:border-primary hover:bg-surface-container-low hover:-translate-y-0.5 active:translate-y-0 sharp-shadow-sm";
    }
    if (opt === exercise.answer) {
      return base + "border-emerald-600 bg-emerald-50/50 text-emerald-800";
    }
    if (opt === selected) {
      return base + "border-secondary bg-red-50/50 text-secondary";
    }
    return base + "border-outline-variant/30 bg-surface/50 text-on-surface-variant/40 opacity-50";
  };

  return (
    <div className="space-y-5">
      {/* Sentence with blank */}
      <div className="bg-surface-container-low/30 border-2 border-dashed border-outline-variant/40 p-5 rounded-lg">
        <p className="font-jp text-xl md:text-2xl font-bold text-on-surface leading-relaxed tracking-wide">
          {exercise.question.split('＿＿＿＿').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className={`inline-block mx-1 px-3 py-0.5 border-b-2 border-dashed min-w-[3em] text-center transition-colors ${
                  !answered
                    ? 'border-primary'
                    : selected === exercise.answer
                      ? 'border-emerald-600'
                      : 'border-secondary'
                }`}>
                  {answered ? (
                    <span className={`font-bold ${selected === exercise.answer ? 'text-emerald-700' : 'text-secondary'}`}>
                      {exercise.answer}
                    </span>
                  ) : (
                    <span className="text-on-surface-variant/40 text-sm">？</span>
                  )}
                </span>
              )}
            </span>
          ))}
        </p>

      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {exercise.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(opt)}
            className={getButtonClass(opt)}
          >
            <span className={`inline-flex items-center justify-center w-5 h-5 text-center text-[9px] font-black rounded-md mb-2 mx-auto block border transition-colors ${
              !answered
                ? "bg-surface border-outline-variant text-on-surface-variant"
                : opt === exercise.answer
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : opt === selected
                    ? "bg-secondary border-secondary text-white"
                    : "bg-surface border-outline-variant/30 text-on-surface-variant/30"
            }`}>
              {opt === exercise.answer && answered ? "✓" : opt === selected && answered ? "✗" : String.fromCharCode(65 + i)}
            </span>
            {opt}
          </button>
        ))}
      </div>

      {answered && selected !== exercise.answer && (
        <div className="p-3 bg-red-50 text-secondary border border-secondary/20 rounded-lg text-xs font-semibold text-center">
          Đáp án đúng: <span className="font-jp text-base font-bold text-on-surface mx-1">{exercise.answer}</span> ({exercise.card.back})
        </div>
      )}
    </div>
  );
}

// ===== Exercise Runner =====

function ExerciseRunner({ exercises, deckId, onComplete }) {
  const { showRomaji, autoPlayAudio } = useSettings();
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(null);

  const current = exercises[idx];
  const progress = Math.round((idx / exercises.length) * 100);
  const correctSoFar = results.filter((r) => r.correct).length;

  // Auto-speak for multiple choice
  useEffect(() => {
    if (!current) return;
    if (autoPlayAudio && current.type === 'multiple-choice') {
      const t = setTimeout(() => speakJP(current.card.front), 400);
      return () => { clearTimeout(t); window.speechSynthesis?.cancel(); };
    }
  }, [idx, current, autoPlayAudio]);

  const handleAnswer = useCallback((correct, userAnswer = '') => {
    setLastCorrect(correct);
    setAnswered(true);
    setResults((r) => [...r, { correct, userAnswer, card: current?.card, type: current?.type }]);
  }, [current]);

  const handleNext = useCallback(() => {
    if (idx + 1 >= exercises.length) {
      onComplete([...results]);
    } else {
      setIdx((i) => i + 1);
      setAnswered(false);
      setLastCorrect(null);
    }
  }, [idx, exercises.length, onComplete, results]);

  // Enter to advance
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Enter' && answered) {
        // Không advance nếu đang focus input (type-japanese)
        if (document.activeElement?.tagName === 'INPUT') return;
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [answered, handleNext]);

  const typeLabel = {
    'multiple-choice': 'Trắc nghiệm',
    'type-japanese': 'Tự luận',
    'fill-sentence': 'Hoàn thành câu',
  };

  if (!current) return null;

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 space-y-6 animate-fade-up">
      <div>
        <Link
          to={`/deck/${deckId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <IconChevronLeft className="w-3.5 h-3.5" />
          Quay lại bộ thẻ
        </Link>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-surface-container border border-outline-variant/20 overflow-hidden rounded-full">
          <div className="h-full bg-secondary transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
          <span className="text-emerald-700 font-bold">{correctSoFar} ✓</span> · {idx + 1}/{exercises.length}
        </span>
      </div>

      {/* Question card */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />

        {/* Type badge */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <span className="text-[9px] font-bold uppercase tracking-widest text-secondary bg-secondary/5 border border-secondary/20 px-2.5 py-1">
            {typeLabel[current.type]}
          </span>
          {current.type === 'multiple-choice' && (
            <button onClick={() => speakJP(current.card.front)}
              className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant hover:text-secondary flex items-center gap-1.5 transition-colors">
              <IconVolume className="w-3.5 h-3.5" />
              Nghe
            </button>
          )}
        </div>

        {/* Question display */}
        {current.type === 'multiple-choice' && (
          <div className="text-center mb-6 relative z-10">
            <p className="font-jp text-4xl md:text-5xl font-bold text-on-surface leading-tight tracking-tight">{current.question}</p>
            {showRomaji && current.hint && (
              <p className="text-sm text-on-surface-variant font-medium tracking-wide mt-2">{current.hint}</p>
            )}
          </div>
        )}

        {current.type === 'type-japanese' && (
          <div className="text-center mb-6 relative z-10">
            <p className="text-3xl md:text-4xl font-bold text-on-surface leading-tight">{current.question}</p>
          </div>
        )}

        {/* Typing guide tip for type-japanese mode */}
        {current.type === 'type-japanese' && !answered && (() => {
          const dismissed = localStorage.getItem('minhongo_typing_tip_dismissed');
          if (dismissed) return null;
          return (
            <div className="relative z-10 mb-4 p-3 bg-primary/[0.04] border border-primary/20 rounded-lg flex items-start gap-3 text-xs text-on-surface-variant animate-fade-up">
              <span className="text-primary mt-0.5 flex-shrink-0">💡</span>
              <div className="flex-1 leading-relaxed">
                <strong className="text-on-surface">Mẹo:</strong> Bạn có thể gõ bằng <strong>Romaji</strong> (vd: <kbd className="px-1 py-0.5 bg-white border border-outline-variant/40 text-[10px] font-bold mx-0.5 rounded">sakura</kbd>) hoặc <strong>Hiragana</strong>.
                {' '}<a href="/kana" target="_blank" className="text-primary font-bold hover:underline">Xem hướng dẫn gõ tiếng Nhật →</a>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); localStorage.setItem('minhongo_typing_tip_dismissed', '1'); e.target.closest('[class*="bg-primary"]').remove(); }}
                className="text-on-surface-variant/50 hover:text-on-surface flex-shrink-0 p-0.5"
                title="Ẩn mẹo này"
              >✕</button>
            </div>
          );
        })()}

        {/* Exercise component */}
        <div className="relative z-10">
          {current.type === 'multiple-choice' && (
            <MultipleChoiceEx key={idx} exercise={current} onAnswer={handleAnswer} />
          )}
          {current.type === 'type-japanese' && (
            <TypeJapaneseEx key={idx} exercise={current} onAnswer={handleAnswer} />
          )}
          {current.type === 'fill-sentence' && (
            <FillSentenceEx key={idx} exercise={current} onAnswer={handleAnswer} />
          )}
        </div>
      </div>

      {/* Feedback + Next */}
      {answered && (
        <div className="animate-fade-up">
          <button onClick={handleNext}
            className="w-full py-3.5 text-xs font-bold text-on-secondary uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            style={{ background: lastCorrect ? '#2e7d32' : 'var(--secondary)' }}
          >
            <span>{lastCorrect ? 'Chính xác! Tiếp tục →' : 'Tiếp tục → (Enter)'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ===== Results Screen =====

function ResultsScreen({ results, total, deckId, deckName, onRetry, onRetryWrong, srsStatus }) {
  const { showRomaji } = useSettings();
  const correct = results.filter((r) => r.correct).length;
  const pct = Math.round((correct / total) * 100);
  const wrongResults = results.filter((r) => !r.correct);

  const [emoji, label, color] = pct >= 90 ? [<IconTrophy className="w-10 h-10" />, 'Xuất sắc!', '#b45309']
    : pct >= 75 ? [<IconStar className="w-10 h-10" />, 'Tốt lắm!', '#2e7d32']
    : pct >= 50 ? [<IconBookMarked className="w-10 h-10" />, 'Khá tốt!', 'var(--primary)']
    : [<IconTarget className="w-10 h-10" />, 'Cần luyện thêm!', 'var(--secondary)'];

  return (
    <div className="max-w-md mx-auto p-4 md:p-6 space-y-5 animate-fade-up">
      {/* Score card */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 md:p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />

        <div className="flex justify-center mb-4 relative z-10" style={{ color }}>{emoji}</div>
        <p className="text-lg font-bold mb-1 relative z-10" style={{ color }}>{label}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-6 relative z-10">{deckName}</p>

        <div className="relative z-10 my-6">
          <p className="text-6xl font-black text-on-surface leading-none tracking-tight">{pct}%</p>
          <p className="text-xs font-semibold text-on-surface-variant mt-2">
            Đạt <span className="font-bold" style={{ color: '#2e7d32' }}>{correct}</span> trên {total} câu trả lời đúng
          </p>
        </div>

        <div className="h-2 bg-surface-container border border-outline-variant/20 overflow-hidden relative z-10 mb-6 rounded-full">
          <div className="h-full bg-secondary transition-all duration-1000 rounded-full"
            style={{ width: `${pct}%` }} />
        </div>

        <div className="grid grid-cols-2 gap-3 relative z-10">
          <div className="bg-surface border border-outline-variant/25 p-3.5">
            <div className="text-2xl font-black tabular-nums" style={{ color: '#2e7d32' }}>{correct}</div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">Đúng</div>
          </div>
          <div className="bg-surface border border-outline-variant/25 p-3.5">
            <div className="text-2xl font-black tabular-nums" style={{ color: 'var(--secondary)' }}>{total - correct}</div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">Sai</div>
          </div>
        </div>

        {/* SRS sync status */}
        {srsStatus && (
          <div className="mt-4 p-3 border border-outline-variant/20 bg-surface text-center relative z-10">
            {srsStatus === 'syncing' && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-outline-variant border-t-secondary animate-spin rounded-full" />
                Đang đồng bộ tiến độ SRS...
              </p>
            )}
            {srsStatus === 'synced' && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-green-700 flex items-center justify-center gap-2">
                ✅ Đã cập nhật lịch ôn tập SRS
              </p>
            )}
            {srsStatus === 'error' && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center justify-center gap-2">
                ⚠️ Không thể đồng bộ SRS
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={`grid gap-3 ${wrongResults.length > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <button onClick={onRetry}
          className="py-3 text-xs font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all flex items-center justify-center gap-2"
          style={{ background: 'var(--secondary)' }}>
          <IconRefresh className="w-4 h-4" />
          Luyện lại
        </button>
        {wrongResults.length > 0 && (
          <button onClick={onRetryWrong}
            className="py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border-2 border-secondary text-secondary hover:bg-secondary/5">
            <IconXCircle className="w-4 h-4" />
            Ôn sai ({wrongResults.length})
          </button>
        )}
        <Link to={`/deck/${deckId}`}
          className="py-3 text-xs font-bold uppercase tracking-wider text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 border border-outline-variant/30 bg-surface-container-lowest">
          <IconChevronLeft className="w-4 h-4" />
          Quay lại
        </Link>
      </div>

      {/* Thống kê câu hỏi và câu trả lời */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 animate-fade-up space-y-4">
        <h3 className="font-headline text-sm font-bold text-on-surface border-b border-outline-variant/20 pb-2">
          Chi tiết bài làm
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {results.map((r, i) => (
            <div 
              key={i} 
              className={`p-3.5 border rounded-lg space-y-1.5 ${
                r.correct 
                  ? 'border-emerald-200 bg-emerald-500/5' 
                  : 'border-red-200 bg-secondary/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  r.correct ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {r.correct ? 'Đúng' : 'Sai'}
                </span>
                <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Câu {i + 1}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="font-jp text-lg font-bold text-on-surface">{r.card.front}</p>
                {showRomaji && r.card.romaji && <p className="text-on-surface-variant text-xs">({r.card.romaji})</p>}
              </div>
              <div className="text-xs pt-1 space-y-1">
                <p className="text-on-surface-variant">
                  <span className="font-medium text-on-surface-variant/70">Nghĩa tiếng Việt: </span>
                  <span className="font-semibold text-on-surface">{r.card.back}</span>
                </p>
                {!r.correct && (
                  <p className="text-secondary font-semibold">
                    <span className="text-on-surface-variant font-medium text-on-surface-variant/70">Bạn đã trả lời: </span>
                    {r.userAnswer || '(bỏ trống)'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {wrongResults.length === 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 text-center animate-fade-up rounded-lg">
          <p className="text-emerald-800 font-bold text-base uppercase tracking-wider">
            Hoàn hảo! Bạn trả lời đúng 100%!
          </p>
        </div>
      )}
    </div>
  );
}

// ===== Main PracticePage =====

export default function PracticePage() {
  const { deckId } = useParams();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type'); // 'multiple-choice' | 'type-japanese' | 'fill-sentence'

  const [phase, setPhase] = useState('setup');
  const [exercises, setExercises] = useState([]);
  const [finalResults, setFinalResults] = useState([]);
  const [savedConfig, setSavedConfig] = useState(null);
  const [srsStatus, setSrsStatus] = useState(null);

  const { data: deck, isLoading, error } = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => flashcardApi.getDeck(deckId),
  });

  // SRS sync
  const syncSRS = useCallback(async (results) => {
    setSrsStatus('syncing');
    try {
      const promises = results.map((r) =>
        flashcardApi.reviewCard(r.card.id, r.correct ? 2 : 0)
      );
      await Promise.allSettled(promises);
      setSrsStatus('synced');
    } catch {
      setSrsStatus('error');
    }
  }, []);

  const handleStart = useCallback((config) => {
    const cards = deck?.cards || [];
    const shouldShuffle = config.shuffle !== false;
    const processedCards = shouldShuffle ? shuffleArray(cards) : [...cards];
    const selected = config.count === 'all'
      ? processedCards
      : processedCards.slice(0, Math.min(parseInt(config.count), cards.length));

    const types = shouldShuffle ? shuffleArray(config.types) : [...config.types];
    const built = selected
      .map((card, i) => {
        const preferredType = types[i % types.length];
        const ex = buildExercise(card, cards, preferredType);
        if (ex) return ex;
        // Fallback: try other selected types
        for (const type of types) {
          const fallback = buildExercise(card, cards, type);
          if (fallback) return fallback;
        }
        // Final fallback: multiple-choice always works
        return buildExercise(card, cards, 'multiple-choice');
      })
      .filter(Boolean);

    setExercises(built);
    setSavedConfig(config);
    setSrsStatus(null);
    setPhase('exercises');
  }, [deck]);

  useEffect(() => {
    if (deck && typeParam && phase === 'setup') {
      handleStart({ types: [typeParam], count: '10' });
    }
  }, [deck, typeParam, phase, handleStart]);

  const handleComplete = useCallback((results) => {
    setFinalResults(results);
    setPhase('results');
    syncSRS(results);
  }, [syncSRS]);

  const handleRetry = useCallback(() => {
    if (savedConfig) handleStart(savedConfig);
  }, [savedConfig, handleStart]);

  const handleRetryWrong = useCallback(() => {
    if (!savedConfig || !deck?.cards) return;
    const wrongCardIds = new Set(finalResults.filter((r) => !r.correct).map((r) => r.card.id));
    const wrongCards = deck.cards.filter((c) => wrongCardIds.has(c.id));
    if (wrongCards.length === 0) return;

    const types = shuffleArray(savedConfig.types);
    const built = wrongCards
      .map((card, i) => {
        const preferredType = types[i % types.length];
        const ex = buildExercise(card, deck.cards, preferredType);
        if (ex) return ex;
        for (const type of types) {
          const fallback = buildExercise(card, deck.cards, type);
          if (fallback) return fallback;
        }
        return buildExercise(card, deck.cards, 'multiple-choice');
      })
      .filter(Boolean);

    setExercises(built);
    setSrsStatus(null);
    setPhase('exercises');
  }, [savedConfig, finalResults, deck]);

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto p-8 flex items-center justify-center py-24 animate-fade-up">
        <div className="w-8 h-8 border-2 border-outline-variant border-t-secondary animate-spin rounded-full" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center py-24 bg-surface-container-lowest border border-outline-variant/30 sharp-shadow animate-fade-up relative">
        <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />
        <p className="font-bold text-base text-on-surface mb-4">Không tìm thấy bộ thẻ hoặc lỗi xảy ra</p>
        <Link to="/dashboard" className="inline-block py-2 px-4 border border-outline-variant/30 bg-surface text-secondary hover:bg-surface-container text-xs font-bold uppercase tracking-wider transition-all">
          ← Quay lại Dashboard
        </Link>
      </div>
    );
  }

  if (phase === 'setup') return <SetupScreen deck={deck} onStart={handleStart} />;
  if (phase === 'exercises') return (
    <ExerciseRunner exercises={exercises} deckId={deckId} onComplete={handleComplete} />
  );
  if (phase === 'results') return (
    <ResultsScreen
      results={finalResults}
      total={exercises.length}
      deckId={deckId}
      deckName={deck.name}
      onRetry={handleRetry}
      onRetryWrong={handleRetryWrong}
      srsStatus={srsStatus}
    />
  );
  return null;
}
