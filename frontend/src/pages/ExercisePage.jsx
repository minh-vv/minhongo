/**
 * ExercisePage — Bài tập luyện tập sau bài học (Riki-style complement)
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

// ===== Utilities =====

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Tách câu ví dụ thành mảng từ (split trên khoảng trắng, giữ dấu câu) */
function splitSentence(text) {
  return text.trim().split(/\s+/).filter(Boolean);
}

/** TTS phát âm tiếng Nhật */
function speakJP(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

// ===== Exercise generation =====

function buildExercise(card, allCards, type) {
  switch (type) {
    case 'multiple-choice': {
      const distractors = shuffleArray(allCards.filter((c) => c.id !== card.id))
        .slice(0, 3)
        .map((c) => c.back);
      while (distractors.length < 3) distractors.push(`Phương án ${distractors.length + 2}`);
      return { card, type, options: shuffleArray([card.back, ...distractors]) };
    }
    case 'fill-in-blank':
      return { card, type };
    case 'arrangement': {
      if (!card.example) return null; // cần câu ví dụ
      const words = splitSentence(card.example);
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

  // arrangement cần card có example
  const hasExamples = (deck?.cards || []).some((c) => c.example && splitSentence(c.example).length >= 3);

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

        {/* Loại bài tập */}
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

        {/* Số câu */}
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

  const handleSelect = (opt) => {
    if (answered) return;
    const correct = opt === exercise.card.back;
    setSelected(opt); setAnswered(true);
    if (correct) setTimeout(() => onAnswer(true), 1200);
    else onAnswer(false);
  };

  const style = (opt) => {
    if (!answered) return { border: '1px solid rgba(0,0,0,0.12)', background: 'var(--surface)', cursor: 'pointer' };
    if (opt === exercise.card.back) return { border: '2px solid #2e7d32', background: 'rgba(76,175,80,0.06)', color: '#2e7d32' };
    if (opt === selected) return { border: '2px solid var(--secondary)', background: 'rgba(198,40,40,0.06)', color: 'var(--secondary)' };
    return { border: '1px solid rgba(0,0,0,0.08)', background: 'var(--surface)', opacity: 0.4 };
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {exercise.options.map((opt, i) => (
          <button key={i} onClick={() => handleSelect(opt)}
            className="p-4 text-left transition-all text-xs font-bold flex gap-3 items-start"
            style={style(opt)}>
            <span className="inline-block w-5 h-5 text-center text-[10px] font-bold leading-5 shrink-0"
              style={{ background: 'rgba(0,0,0,0.06)' }}>
              {String.fromCharCode(65 + i)}
            </span>
            <p className="leading-relaxed text-inherit flex-1">{opt}</p>
          </button>
        ))}
      </div>
      {answered && !([exercise.card.back].includes(selected)) && (
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
  const [correct, setCorrect] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = () => {
    if (answered || !value.trim()) return;
    const ok = value.trim().toLowerCase() === exercise.card.back.trim().toLowerCase();
    setCorrect(ok); setAnswered(true);
    if (ok) setTimeout(() => onAnswer(true), 1200);
    else onAnswer(false);
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

  return (
    <div className="space-y-4">
      <input ref={inputRef} type="text" value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={answered}
        placeholder="Nhập nghĩa tiếng Việt..."
        className="w-full px-4 py-3 text-sm outline-none transition-all"
        style={{
          border: `2px solid ${!answered ? 'rgba(0,0,0,0.15)' : correct ? '#2e7d32' : 'var(--secondary)'}`,
          background: !answered ? 'var(--surface)' : correct ? 'rgba(76,175,80,0.04)' : 'rgba(198,40,40,0.04)',
          color: 'var(--on-surface)',
        }} />
      {answered && !correct && (
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
    if (ok) setTimeout(() => onAnswer(true), 1400);
    else onAnswer(false);
  };

  return (
    <div className="space-y-4">
      {/* Hint: show card front */}
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
  const [correct, setCorrect] = useState(null);
  const [played, setPlayed] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const inputRef = useRef(null);

  const handlePlay = () => {
    speakJP(exercise.card.front);
    setPlayed(true);
    setTimeout(() => inputRef.current?.focus(), 600);
  };

  const handleSubmit = () => {
    if (answered || !value.trim()) return;
    const ok = value.trim().toLowerCase() === exercise.card.back.trim().toLowerCase();
    setCorrect(ok); setAnswered(true);
    if (ok) setTimeout(() => onAnswer(true), 1200);
    else onAnswer(false);
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

  return (
    <div className="space-y-4">
      {/* Play button */}
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
        className="w-full px-4 py-3 text-sm outline-none transition-all"
        style={{
          border: `2px solid ${!answered ? 'rgba(0,0,0,0.15)' : correct ? '#2e7d32' : 'var(--secondary)'}`,
          background: !answered ? 'var(--surface)' : correct ? 'rgba(76,175,80,0.04)' : 'rgba(198,40,40,0.04)',
          color: 'var(--on-surface)',
        }} />

      {answered && (
        <div className="space-y-3 pt-2">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Từ vựng: <strong className="font-jp text-2xl font-bold text-on-surface ml-1">{exercise.card.front}</strong>
          </p>
          {!correct && (
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
  const [results, setResults] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(null);

  const current = exercises[idx];
  const progress = Math.round((idx / exercises.length) * 100);
  const correctSoFar = results.filter(Boolean).length;

  if (!current) return null;

  const handleAnswer = (correct) => {
    setLastCorrect(correct);
    setAnswered(true);
    setResults((r) => [...r, correct]);
  };

  const handleNext = () => {
    if (idx + 1 >= exercises.length) {
      onComplete([...results]);
    } else {
      setIdx((i) => i + 1);
      setAnswered(false);
      setLastCorrect(null);
    }
  };

  const typeLabel = {
    'multiple-choice': 'Trắc nghiệm',
    'fill-in-blank': 'Điền từ',
    'arrangement': 'Sắp xếp câu',
    'listening': 'Nghe - Điền',
  };

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
          {/* Exercise component */}
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

      {/* Feedback + Next */}
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
            {idx + 1 >= exercises.length ? 'Xem kết quả 🏁' : 'Câu tiếp theo →'}
          </button>
        </div>
      )}
    </div>
  );
}

// ===== Results Screen =====
function ResultsScreen({ results, total, deckId, deckName, onRetry }) {
  const correct = results.filter(Boolean).length;
  const pct = Math.round((correct / total) * 100);
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
      </div>

      <div className="grid grid-cols-2 gap-3 relative z-10">
        <button onClick={onRetry}
          className="py-3 text-xs font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all flex items-center justify-center gap-2"
          style={{ background: 'var(--secondary)' }}>
          <IconRefresh className="w-4 h-4" />
          Luyện tập lại
        </button>
        <Link to={`/deck/${deckId}`}
          className="py-3 text-xs font-bold uppercase tracking-wider text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 border border-outline-variant/30 bg-surface-container-lowest">
          <IconChevronLeft className="w-4 h-4" />
          Quay lại bộ thẻ
        </Link>
      </div>
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

  const { data: deck, isLoading, error } = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => flashcardApi.getDeck(deckId),
  });

  const handleStart = useCallback((config) => {
    const cards = deck?.cards || [];
    const selected = config.count === 'all'
      ? shuffleArray(cards)
      : shuffleArray(cards).slice(0, Math.min(parseInt(config.count), cards.length));

    const built = selected
      .map((card) => {
        for (const type of shuffleArray(config.types)) {
          const ex = buildExercise(card, cards, type);
          if (ex) return ex;
        }
        return buildExercise(card, cards, 'multiple-choice');
      })
      .filter(Boolean);

    setExercises(built);
    setSavedConfig(config);
    setPhase('exercises');
  }, [deck]);

  const handleComplete = useCallback((results) => {
    setFinalResults(results);
    setPhase('results');
  }, []);

  const handleRetry = useCallback(() => {
    if (savedConfig) handleStart(savedConfig);
  }, [savedConfig, handleStart]);

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
      total={exercises.length}
      deckId={deckId}
      deckName={deck.name}
      onRetry={handleRetry}
    />
  );
  return null;
}

