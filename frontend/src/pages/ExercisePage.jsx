/**
 * ExercisePage — Bài tập luyện tập sau bài học
 *
 * 4 loại bài tập:
 *  1. multiple-choice  — Trắc nghiệm: chọn nghĩa đúng
 *  2. fill-in-blank    — Điền từ: gõ nghĩa tiếng Việt
 *  3. arrangement      — Sắp xếp câu: click từng từ đúng thứ tự
 *  4. listening        — Nghe-điền: nghe TTS rồi gõ nghĩa
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { flashcardApi } from '../api/flashcardApi';
import aiTutorApi from '../api/aiTutorApi';
import {
  IconType, IconPen, IconShuffle, IconHeadphones, IconRefresh,
  IconChevronLeft, IconCheckCircle, IconXCircle, IconCheck,
  IconTrophy, IconStar, IconBookMarked, IconTarget, IconVolume,
} from '../components/Icons';
import {
  shuffleArray,
  fuzzyMatch,
  generateDistractors,
} from '../utils/quizUtils';

// ===== Utilities =====

/** Tách câu ví dụ thành mảng từ (split trên khoảng trắng, giữ dấu câu) */
/** Tách câu ví dụ thành mảng cụm từ tiếng Nhật một cách chuẩn xác */
function segmentJapaneseSentence(rawText) {
  if (!rawText) return [];
  
  // 1. Clean parenthesized translation in Vietnamese or English
  const text = rawText
    .replace(/\s*[\(\uff08][^\)\uff09]*[A-Za-zà-ỹÀ-ỸđĐ\s,;.\-\?!]+[^\)\uff09]*[\)\uff09]/g, '')
    .trim();

  if (!text) return [];

  // If the text has spaces, split on spaces
  if (text.includes(' ') || text.includes('　')) {
    return text.split(/[\s\u3000]+/).filter(Boolean);
  }

  // 2. Identify splitting points using particles and punctuation
  const particles = ['は', 'が', 'を', 'に', 'と', 'で', 'も', 'へ', 'から', 'まで', '、', '。', '！', '？', '!', '?'];
  const chunks = [];
  let currentWord = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    currentWord += char;

    const isParticle = particles.includes(char);
    const nextChar = text[i + 1];
    const nextIsParticle = nextChar && particles.includes(nextChar);

    if (isParticle && !nextIsParticle) {
      chunks.push(currentWord);
      currentWord = '';
    }
  }
  if (currentWord) {
    chunks.push(currentWord);
  }

  // 3. Refine chunks: split any chunk that is too long (> 4 chars)
  let finalChunks = [];
  for (const chunk of chunks) {
    if (chunk.length > 4) {
      let temp = chunk;
      while (temp.length > 0) {
        if (temp.length <= 4) {
          finalChunks.push(temp);
          break;
        } else {
          const size = temp.length % 3 === 0 ? 3 : 2;
          finalChunks.push(temp.slice(0, size));
          temp = temp.slice(size);
        }
      }
    } else {
      finalChunks.push(chunk);
    }
  }

  // If total chunks is still < 3, split the whole text into characters
  if (finalChunks.length < 3) {
    finalChunks = text.split('');
  }

  return finalChunks.filter(Boolean);
}

/** TTS phát âm tiếng Nhật */
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
  switch (type) {
    case 'multiple-choice': {
      const distractors = generateDistractors(card.back, allCards, card.id, 'back', 3);
      return { card, type, options: shuffleArray([card.back, ...distractors]) };
    }
    case 'fill-in-blank':
      return { card, type };
    case 'arrangement': {
      if (!card.example) return null;
      const words = segmentJapaneseSentence(card.example);
      if (words.length < 3) return null;
      return { card, type, correct: words, shuffled: shuffleArray(words) };
    }
    case 'listening':
      return { card, type };
    default:
      return null;
  }
}

// ===== Setup Screen =====

const EXERCISE_TYPES = [
  { id: 'multiple-choice', icon: <IconType className="w-5 h-5" />, label: 'Trắc nghiệm',   desc: 'Chọn nghĩa đúng trong 4 đáp án' },
  { id: 'fill-in-blank',   icon: <IconPen className="w-5 h-5" />,  label: 'Điền từ',      desc: 'Gõ nghĩa tiếng Việt của từ' },
  { id: 'arrangement',     icon: <IconShuffle className="w-5 h-5" />,  label: 'Sắp xếp câu',  desc: 'Sắp xếp từ thành câu hoàn chỉnh' },
  { id: 'listening',       icon: <IconHeadphones className="w-5 h-5" />,  label: 'Nghe - Điền',  desc: 'Nghe phát âm rồi điền nghĩa' },
];

function SetupScreen({ deck, onStart }) {
  const [types, setTypes] = useState(['multiple-choice', 'fill-in-blank']);
  const [count, setCount] = useState('10');
  const cardCount = deck?.cards?.length || 0;

  const toggle = (id) => setTypes((prev) =>
    prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
  );

  const hasExamples = (deck?.cards || []).some((c) => c.example && segmentJapaneseSentence(c.example).length >= 3);

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 space-y-6 animate-fade-up">
      <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />
        
        {/* Header */}
        <div className="relative z-10 mb-6">
          <Link to={`/deck/${deck.id}`}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant hover:text-secondary mb-4 transition-colors">
            <IconChevronLeft className="w-3.5 h-3.5" />
            Quay lại bộ thẻ
          </Link>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Bài tập luyện tập
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary mt-1">{deck.name} · {cardCount} thẻ</p>
        </div>

        {/* Exercise types */}
        <div className="relative z-10 mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
            Chọn loại bài tập (có thể chọn nhiều)
          </p>
          <div className="space-y-2">
            {EXERCISE_TYPES.map(({ id, icon, label, desc }) => {
              const disabled = id === 'arrangement' && !hasExamples;
              const active = types.includes(id);
              return (
                <button key={id}
                  onClick={() => !disabled && toggle(id)}
                  disabled={disabled}
                  className="w-full flex items-center gap-4 p-4 text-left transition-all border"
                  style={{
                    borderColor: active ? 'var(--secondary)' : 'rgba(0,0,0,0.1)',
                    background: active ? 'rgba(198,40,40,0.03)' : 'var(--surface)',
                    opacity: disabled ? 0.4 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}>
                  <span className="flex-shrink-0 text-on-surface-variant" style={{ color: active ? 'var(--secondary)' : 'inherit' }}>{icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-xs text-on-surface flex items-center gap-1">{label}
                      {disabled && <span className="text-[9px] font-medium text-on-surface-variant">(cần câu ví dụ)</span>}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 leading-snug">{desc}</p>
                  </div>
                  {active && (
                    <IconCheck className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--secondary)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question count */}
        <div className="relative z-10 mb-6">
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

        <button
          onClick={() => onStart({ types, count })}
          disabled={types.length === 0}
          className="w-full py-3.5 text-xs font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all disabled:opacity-40 relative z-10"
          style={{ background: 'var(--secondary)' }}>
          Bắt đầu luyện tập →
        </button>
      </div>
    </div>
  );
}

// ===== Multiple Choice Exercise =====
function MultipleChoiceEx({ exercise, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = useCallback((opt) => {
    if (answered) return;
    const match = fuzzyMatch(opt, exercise.card.back);
    setSelected(opt);
    setAnswered(true);
    onAnswer(match.isExact, opt);
  }, [answered, exercise.card.back, onAnswer]);

  const style = (opt) => {
    if (!answered) return { border: '2px solid rgba(0,0,0,0.15)', background: 'var(--surface)', cursor: 'pointer' };
    if (opt === exercise.card.back) return { border: '2px solid #2e7d32', background: 'rgba(76,175,80,0.06)', color: '#2e7d32', boxShadow: 'none' };
    if (opt === selected) return { border: '2px solid var(--secondary)', background: 'rgba(198,40,40,0.06)', color: 'var(--secondary)', boxShadow: 'none' };
    return { border: '1px solid rgba(0,0,0,0.08)', background: 'var(--surface)', opacity: 0.4, boxShadow: 'none' };
  };

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {exercise.options.map((opt, i) => (
          <button key={i} onClick={() => handleSelect(opt)}
            className="p-4 text-left transition-all text-xs font-bold flex gap-3 items-start sharp-shadow-sm hover:-translate-y-0.5 active:translate-y-0 hover:shadow-md transition-all duration-150"
            style={style(opt)}>
            <span className="inline-flex items-center justify-center w-5 h-5 text-center text-[10px] font-black leading-5 shrink-0 bg-surface border-2 border-secondary text-secondary sharp-shadow-sm">
              {String.fromCharCode(65 + i)}
            </span>
            <p className="leading-relaxed text-inherit flex-1 pt-0.5">{opt}</p>
          </button>
        ))}
      </div>
      {answered && selected !== exercise.card.back && (
        <div className="p-3.5 text-xs border bg-surface" style={{ borderColor: 'rgba(76,175,80,0.3)', color: '#2e7d32' }}>
          Đáp án đúng: <strong className="text-sm font-bold">{exercise.card.back}</strong>
        </div>
      )}
    </div>
  );
}

// ===== Fill in Blank Exercise =====
function FillInBlankEx({ exercise, onAnswer }) {
  const [value, setValue] = useState('');
  const [answered, setAnswered] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = () => {
    if (answered || !value.trim()) return;
    const match = fuzzyMatch(value.trim(), exercise.card.back);
    const correct = match.isExact || match.isFuzzy;
    setMatchResult(match);
    setAnswered(true);
    onAnswer(correct, value.trim());
  };

  const handleAskAI = async () => {
    setIsEvaluating(true);
    try {
      const res = await aiTutorApi.evaluate({ 
        userAnswer: value, 
        question: exercise.card.front, 
        expectedAnswer: exercise.card.back 
      });
      setAiFeedback(res.feedback + (res.suggestion ? `\n\n**Gợi ý:** ${res.suggestion}` : ''));
    } catch {
      setAiFeedback('Xin lỗi, Sensei không thể chấm điểm lúc này.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const isCorrect = matchResult ? (matchResult.isExact || matchResult.isFuzzy) : null;

  return (
    <div className="space-y-4">
      <input ref={inputRef} type="text" value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={answered}
        placeholder="Nhập nghĩa tiếng Việt..."
        className="w-full px-4 py-3 text-sm outline-none transition-all focus:border-secondary focus:ring-1 focus:ring-secondary/50 sharp-shadow-sm"
        style={{
          border: `2px solid ${!answered ? 'rgba(0,0,0,0.15)' : isCorrect ? '#2e7d32' : 'var(--secondary)'}`,
          background: !answered ? 'var(--surface)' : isCorrect ? 'rgba(76,175,80,0.04)' : 'rgba(198,40,40,0.04)',
          color: 'var(--on-surface)',
        }} />

      {/* Fuzzy match notice */}
      {answered && matchResult?.isFuzzy && !matchResult?.isExact && isCorrect && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-semibold flex items-center gap-2">
          <span>✨</span>
          <span>Gần đúng! Đáp án chính xác: <strong>{exercise.card.back}</strong></span>
        </div>
      )}

      {answered && !isCorrect && (
        <div className="space-y-3">
          <p className="text-xs px-1" style={{ color: '#2e7d32' }}>
            Đáp án đúng: <strong className="text-sm font-bold">{exercise.card.back}</strong>
          </p>
          <div className="bg-surface border border-outline-variant/30 p-4 sharp-shadow-sm">
            <div className="flex items-center justify-between mb-2 border-b border-outline-variant/20 pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1">✨ Giải thích từ Sensei</span>
              {!aiFeedback && (
                <button 
                  onClick={handleAskAI}
                  disabled={isEvaluating}
                  className="text-[9px] px-2.5 py-1 border border-outline-variant bg-surface-container-lowest text-on-surface font-bold uppercase tracking-wider hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  {isEvaluating ? 'Đang phân tích...' : 'Vì sao sai?'}
                </button>
              )}
            </div>
            {aiFeedback && (
              <div className="prose prose-sm max-w-none text-on-surface text-xs leading-relaxed">
                <ReactMarkdown>{aiFeedback}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
      {!answered && (
        <button onClick={handleSubmit} disabled={!value.trim()}
          className="w-full py-2.5 text-xs font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim disabled:opacity-40 transition-all"
          style={{ background: 'var(--secondary)' }}>
          Kiểm tra
        </button>
      )}
    </div>
  );
}

// ===== Arrangement Exercise =====
function ArrangementEx({ exercise, onAnswer }) {
  const [placed, setPlaced] = useState([]);
  const [remaining, setRemaining] = useState(exercise.shuffled);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(null);

  const addWord = (word, idx) => {
    if (answered) return;
    setPlaced((p) => [...p, word]);
    setRemaining((r) => r.filter((_, i) => i !== idx));
  };
  const removeWord = (idx) => {
    if (answered) return;
    setRemaining((r) => [...r, placed[idx]]);
    setPlaced((p) => p.filter((_, i) => i !== idx));
  };

  const handleCheck = () => {
    const ok = placed.join(' ') === exercise.correct.join(' ');
    setCorrect(ok); setAnswered(true);
    onAnswer(ok, placed.join(' '));
  };

  return (
    <div className="space-y-4">
      {/* Hint */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Sắp xếp câu ví dụ cho từ <strong className="text-on-surface text-xs underline">{exercise.card.front}</strong>:</p>

      {/* Drop zone */}
      <div className="min-h-16 p-3 flex flex-wrap gap-2 transition-all border border-dashed"
        style={{ borderColor: answered ? (correct ? '#2e7d32' : 'var(--secondary)') : 'rgba(0,0,0,0.2)', background: 'var(--surface)' }}>
        {placed.length === 0 && (
          <span className="text-xs text-on-surface-variant italic self-center pl-1">Nhấn vào các từ bên dưới để sắp xếp...</span>
        )}
        {placed.map((word, i) => (
          <button key={i} onClick={() => removeWord(i)}
            className="px-3 py-1.5 text-xs font-bold transition-all hover:opacity-75"
            style={{ background: answered ? (correct ? 'rgba(76,175,80,0.08)' : 'rgba(198,40,40,0.08)') : 'var(--surface-container-lowest)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--on-surface)' }}>
            {word}
          </button>
        ))}
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap gap-2 p-3 bg-surface-container-low border border-outline-variant/30">
        {remaining.map((word, i) => (
          <button key={i} onClick={() => addWord(word, i)}
            className="px-3 py-1.5 text-xs font-bold bg-surface-container-lowest hover:bg-surface-container transition-all"
            style={{ border: '1px solid rgba(0,0,0,0.12)', color: 'var(--on-surface)' }}>
            {word}
          </button>
        ))}
        {remaining.length === 0 && <span className="text-xs text-on-surface-variant italic pl-1">Đã sử dụng tất cả các từ</span>}
      </div>

      {answered && !correct && (
        <p className="text-xs px-1" style={{ color: '#2e7d32' }}>
          Đáp án đúng: <strong className="text-sm font-bold font-jp">{exercise.correct.join(' ')}</strong>
        </p>
      )}

      {!answered && placed.length === exercise.correct.length && (
        <button onClick={handleCheck}
          className="w-full py-2.5 text-xs font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all"
          style={{ background: 'var(--secondary)' }}>
          Kiểm tra thứ tự
        </button>
      )}
    </div>
  );
}

// ===== Listening Exercise =====
function ListeningEx({ exercise, onAnswer }) {
  const [value, setValue] = useState('');
  const [answered, setAnswered] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [played, setPlayed] = useState(false);
  const [speed, setSpeed] = useState(0.85);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const inputRef = useRef(null);

  const handlePlay = () => {
    speakJP(exercise.card.front, speed);
    setPlayed(true);
    setTimeout(() => inputRef.current?.focus(), 600);
  };

  // Tự động phát âm ngay khi dạng bài nghe tải lên
  useEffect(() => {
    const t = setTimeout(() => {
      handlePlay();
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = () => {
    if (answered || !value.trim()) return;
    const match = fuzzyMatch(value.trim(), exercise.card.back);
    const correct = match.isExact || match.isFuzzy;
    setMatchResult(match);
    setAnswered(true);
    onAnswer(correct, value.trim());
  };

  const handleAskAI = async () => {
    setIsEvaluating(true);
    try {
      const res = await aiTutorApi.evaluate({ 
        userAnswer: value, 
        question: exercise.card.front, 
        expectedAnswer: exercise.card.back 
      });
      setAiFeedback(res.feedback + (res.suggestion ? `\n\n**Gợi ý:** ${res.suggestion}` : ''));
    } catch {
      setAiFeedback('Xin lỗi, Sensei không thể chấm điểm lúc này.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const isCorrect = matchResult ? (matchResult.isExact || matchResult.isFuzzy) : null;

  return (
    <div className="space-y-4">
      {/* Play button + speed control */}
      <div className="flex flex-col items-center py-6 gap-3">
        <button onClick={handlePlay}
          className="w-20 h-20 flex flex-col items-center justify-center gap-1 transition-all hover:opacity-85 active:scale-95 border"
          style={{
            borderColor: played ? 'var(--secondary)' : 'rgba(0,0,0,0.12)',
            background: played ? 'rgba(198,40,40,0.03)' : 'var(--secondary)',
            color: played ? 'var(--secondary)' : '#fff'
          }}>
          <IconVolume className="w-8 h-8" />
          <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">
            {played ? 'Nghe lại' : 'Phát âm'}
          </span>
        </button>

        {/* Speed control */}
        <div className="flex items-center gap-1.5">
          {[
            { value: 0.6, label: '0.7×' },
            { value: 0.85, label: '1×' },
            { value: 1.2, label: '1.2×' },
          ].map(({ value: v, label }) => (
            <button
              key={v}
              onClick={() => setSpeed(v)}
              className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all border"
              style={{
                borderColor: speed === v ? 'var(--secondary)' : 'rgba(0,0,0,0.1)',
                background: speed === v ? 'rgba(198,40,40,0.05)' : 'transparent',
                color: speed === v ? 'var(--secondary)' : 'var(--on-surface-variant)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
          {played ? 'Bạn nghe được gì? Nhập nghĩa tiếng Việt dưới đây ↓' : 'Bấm để nghe âm thanh rồi nhập nghĩa'}
        </p>
      </div>

      {/* Input */}
      <input ref={inputRef} type="text" value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={answered || !played}
        placeholder={played ? 'Nghĩa tiếng Việt...' : 'Vui lòng nghe trước...'}
        className="w-full px-4 py-3 text-sm outline-none transition-all focus:border-secondary focus:ring-1 focus:ring-secondary/50 sharp-shadow-sm"
        style={{
          border: `2px solid ${!answered ? 'rgba(0,0,0,0.15)' : isCorrect ? '#2e7d32' : 'var(--secondary)'}`,
          background: !answered ? 'var(--surface)' : isCorrect ? 'rgba(76,175,80,0.04)' : 'rgba(198,40,40,0.04)',
          color: 'var(--on-surface)',
        }} />

      {/* Fuzzy match notice */}
      {answered && matchResult?.isFuzzy && !matchResult?.isExact && isCorrect && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-semibold flex items-center gap-2">
          <span>✨</span>
          <span>Gần đúng! Đáp án chính xác: <strong>{exercise.card.back}</strong></span>
        </div>
      )}

      {answered && (
        <div className="space-y-3 pt-2">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Từ vựng: <strong className="font-jp text-2xl font-bold text-on-surface ml-1">{exercise.card.front}</strong>
          </p>
          {!isCorrect && (
            <div className="space-y-3">
              <p className="text-xs px-1" style={{ color: '#2e7d32' }}>
                Đáp án đúng: <strong className="text-sm font-bold">{exercise.card.back}</strong>
              </p>
              <div className="bg-surface border border-outline-variant/30 p-4 sharp-shadow-sm">
                <div className="flex items-center justify-between mb-2 border-b border-outline-variant/20 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1">✨ Giải thích từ Sensei</span>
                  {!aiFeedback && (
                    <button 
                      onClick={handleAskAI}
                      disabled={isEvaluating}
                      className="text-[9px] px-2.5 py-1 border border-outline-variant bg-surface-container-lowest text-on-surface font-bold uppercase tracking-wider hover:bg-surface-container transition-colors disabled:opacity-50"
                    >
                      {isEvaluating ? 'Đang phân tích...' : 'Vì sao sai?'}
                    </button>
                  )}
                </div>
                {aiFeedback && (
                  <div className="prose prose-sm max-w-none text-on-surface text-xs leading-relaxed">
                    <ReactMarkdown>{aiFeedback}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!answered && played && (
        <button onClick={handleSubmit} disabled={!value.trim()}
          className="w-full py-2.5 text-xs font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all"
          style={{ background: 'var(--secondary)' }}>
          Kiểm tra
        </button>
      )}
    </div>
  );
}

// ===== Exercise Runner =====
function ExerciseRunner({ exercises, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]);     // { correct, userAnswer, card }
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(null);

  const current = exercises[idx];
  const progress = Math.round((idx / exercises.length) * 100);
  const correctSoFar = results.filter((r) => r.correct).length;

  // Tự động phát âm khi câu hỏi mới hiển thị (nếu là trắc nghiệm hoặc điền từ)
  useEffect(() => {
    if (!current) return;
    if (current.type === 'multiple-choice' || current.type === 'fill-in-blank') {
      const t = setTimeout(() => {
        speakJP(current.card.front);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [idx, current]);

  // --- Declare handlers BEFORE useEffect ---

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

  // Keyboard: Enter to advance
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Enter' && answered) {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [answered, handleNext]);

  const typeLabel = {
    'multiple-choice': 'Trắc nghiệm',
    'fill-in-blank': 'Điền từ',
    'arrangement': 'Sắp xếp câu',
    'listening': 'Nghe - Điền',
  };

  // Early return AFTER all hooks
  if (!current) return null;

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 space-y-6 animate-fade-up">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-surface-container border border-outline-variant/20 overflow-hidden">
          <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: 'var(--secondary)' }} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
          <span className="text-emerald-700 font-bold">{correctSoFar} ✓</span> · {idx + 1}/{exercises.length}
        </span>
      </div>

      {/* Type badge + question */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <span className="text-[9px] font-bold uppercase tracking-widest text-secondary bg-secondary/5 border border-secondary/20 px-2 py-0.5">
            {typeLabel[current.type]}
          </span>
          {current.type !== 'arrangement' && current.type !== 'listening' && (
            <button onClick={() => speakJP(current.card.front)}
              className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant hover:text-secondary flex items-center gap-1.5 transition-colors">
              <IconVolume className="w-3.5 h-3.5" />
              Nghe phát âm
            </button>
          )}
        </div>

        {/* Question word */}
        {current.type !== 'arrangement' && current.type !== 'listening' && (
          <div className="text-center mb-6 relative z-10">
            <p className="font-jp text-5xl md:text-6xl font-bold text-on-surface leading-tight tracking-tight">{current.card.front}</p>
            {current.card.romaji && <p className="text-sm text-on-surface-variant font-medium tracking-wide mt-1.5">{current.card.romaji}</p>}
          </div>
        )}

        <div className="relative z-10">
          {current.type === 'multiple-choice' && (
            <MultipleChoiceEx key={idx} exercise={current} onAnswer={handleAnswer} />
          )}
          {current.type === 'fill-in-blank' && (
            <FillInBlankEx key={idx} exercise={current} onAnswer={handleAnswer} />
          )}
          {current.type === 'arrangement' && (
            <ArrangementEx key={idx} exercise={current} onAnswer={handleAnswer} />
          )}
          {current.type === 'listening' && (
            <ListeningEx key={idx} exercise={current} onAnswer={handleAnswer} />
          )}
        </div>
      </div>

      {/* Feedback + Next — always show button, never auto-advance */}
      {answered && (
        <div className="space-y-3 animate-fade-up">
          <div className="flex items-center gap-2.5 p-3.5 text-xs font-bold border uppercase tracking-wider"
            style={{
              background: lastCorrect ? 'rgba(76,175,80,0.06)' : 'rgba(198,40,40,0.06)',
              borderColor: lastCorrect ? '#2e7d32' : 'var(--secondary)',
              color: lastCorrect ? '#2e7d32' : 'var(--secondary)',
            }}>
            {lastCorrect ? <IconCheck className="w-4 h-4 shrink-0" /> : <IconXCircle className="w-4 h-4 shrink-0" />}
            {lastCorrect ? 'Chính xác!' : 'Chưa chính xác rồi!'}
          </div>
          <button onClick={handleNext}
            className="w-full py-3 text-xs font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all"
            style={{ background: 'var(--secondary)' }}>
            {idx + 1 >= exercises.length ? 'Xem kết quả 🏁' : 'Câu tiếp theo → (Enter)'}
          </button>
        </div>
      )}
    </div>
  );
}

// ===== Results Screen =====
function ResultsScreen({ results, exercises, total, deckId, deckName, onRetry, onRetryWrong, srsStatus }) {
  const correct = results.filter((r) => r.correct).length;
  const pct = Math.round((correct / total) * 100);
  const wrongResults = results.filter((r) => !r.correct);

  const [emoji, label, color] = pct >= 90 ? [<IconTrophy className="w-10 h-10" />, 'Xuất sắc!', '#b45309']
    : pct >= 75 ? [<IconStar className="w-10 h-10" />, 'Tốt lắm!', '#2e7d32']
    : pct >= 50 ? [<IconBookMarked className="w-10 h-10" />, 'Khá tốt!', 'var(--primary)']
    : [<IconTarget className="w-10 h-10" />, 'Cần luyện thêm!', 'var(--secondary)'];

  return (
    <div className="max-w-md mx-auto p-4 md:p-6 space-y-5 animate-fade-up">
      <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 md:p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />
        
        <div className="flex justify-center mb-4 relative z-10" style={{ color }}>
          {emoji}
        </div>
        <p className="text-lg font-bold mb-1 relative z-10" style={{ color }}>{label}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-6 relative z-10">{deckName}</p>
        
        <div className="relative z-10 my-6">
          <p className="text-6xl font-black text-on-surface leading-none tracking-tight">{pct}%</p>
          <p className="text-xs font-semibold text-on-surface-variant mt-2">
            Đạt <span className="font-bold" style={{ color: '#2e7d32' }}>{correct}</span> trên {total} câu trả lời đúng
          </p>
        </div>
        
        <div className="h-2 bg-surface-container border border-outline-variant/20 overflow-hidden relative z-10 mb-6">
          <div className="h-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: 'var(--secondary)' }} />
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
      <div className={`grid gap-3 relative z-10 ${wrongResults.length > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <button onClick={onRetry}
          className="py-3 text-xs font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all flex items-center justify-center gap-2"
          style={{ background: 'var(--secondary)' }}>
          <IconRefresh className="w-4 h-4" />
          Luyện lại
        </button>
        {wrongResults.length > 0 && (
          <button onClick={onRetryWrong}
            className="py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border-2 border-secondary text-secondary hover:bg-secondary/5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            Ôn sai ({wrongResults.length})
          </button>
        )}
        <Link to={`/deck/${deckId}`}
          className="py-3 text-xs font-bold uppercase tracking-wider text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 border border-outline-variant/30 bg-surface-container-lowest">
          <IconChevronLeft className="w-4 h-4" />
          Quay lại
        </Link>
      </div>

      {/* Wrong answers detail */}
      {wrongResults.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 animate-fade-up">
          <h3 className="font-headline text-sm font-bold text-on-surface mb-4 border-b border-outline-variant/20 pb-2 flex items-center gap-2">
            <span>❌</span> Các từ cần ôn lại ({wrongResults.length} từ)
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {wrongResults.map((r, i) => (
              <div key={i} className="p-3.5 border border-secondary/20 bg-secondary/5 space-y-1.5">
                <p className="font-jp text-lg font-bold text-on-surface">{r.card.front}</p>
                {r.card.romaji && <p className="text-on-surface-variant text-xs font-medium">{r.card.romaji}</p>}
                <div className="text-xs pt-1 space-y-0.5">
                  <p className="text-secondary font-semibold">
                    <span className="text-on-surface-variant font-medium">Bạn nhập: </span>
                    {r.userAnswer || '(bỏ trống)'}
                  </p>
                  <p className="text-green-700 font-semibold">
                    <span className="text-on-surface-variant font-medium">Nghĩa đúng: </span>
                    {r.card.back}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {wrongResults.length === 0 && (
        <div className="bg-green-500/10 border border-green-500/30 p-6 text-center animate-fade-up">
          <p className="text-green-800 font-bold text-base uppercase tracking-wider">
            🎉 Hoàn hảo! Bạn trả lời đúng 100% câu hỏi!
          </p>
        </div>
      )}
    </div>
  );
}

// ===== Main ExercisePage =====
export default function ExercisePage() {
  const { deckId } = useParams();

  // phase: 'setup' | 'exercises' | 'results'
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

  /**
   * Build exercises with round-robin type distribution.
   * When multiple types are selected, each card cycles through
   * the chosen types to ensure even distribution.
   */
  const handleStart = useCallback((config) => {
    const cards = deck?.cards || [];
    const selected = config.count === 'all'
      ? shuffleArray(cards)
      : shuffleArray(cards).slice(0, Math.min(parseInt(config.count), cards.length));

    // Round-robin type assignment for even distribution
    const types = shuffleArray(config.types);
    const built = selected
      .map((card, i) => {
        const preferredType = types[i % types.length];
        // Try preferred type first, fallback to other types
        const ex = buildExercise(card, cards, preferredType);
        if (ex) return ex;
        // Fallback: try all selected types
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
    <ExerciseRunner
      exercises={exercises}
      onComplete={handleComplete}
    />
  );
  if (phase === 'results') return (
    <ResultsScreen
      results={finalResults}
      exercises={exercises}
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
