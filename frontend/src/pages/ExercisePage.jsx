/**
 * ExercisePage — Bài tập luyện tập sau bài học (Riki-style complement)
 *
 * 4 loại bài tập:
 *  1. multiple-choice  — Trắc nghiệm: chọn nghĩa đúng
 *  2. fill-in-blank    — Điền từ: gõ nghĩa tiếng Việt
 *  3. arrangement      — Sắp xếp câu: click từng từ đúng thứ tự
 *  4. listening        — Nghe-điền: nghe TTS rồi gõ nghĩa
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { flashcardApi } from '../api/flashcardApi';
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
  { id: 'multiple-choice', icon: <IconType className="w-6 h-6" />, label: 'Trắc nghiệm',   desc: 'Chọn nghĩa đúng trong 4 đáp án' },
  { id: 'fill-in-blank',   icon: <IconPen className="w-6 h-6" />,  label: 'Điền từ',      desc: 'Gõ nghĩa tiếng Việt của từ' },
  { id: 'arrangement',     icon: <IconShuffle className="w-6 h-6" />,  label: 'Sắp xếp câu',  desc: 'Sắp xếp từ thành câu hoàn chỉnh' },
  { id: 'listening',       icon: <IconHeadphones className="w-6 h-6" />,  label: 'Nghe - Điền',  desc: 'Nghe phát âm rồi điền nghĩa' },
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
    <div className="max-w-lg mx-auto p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <Link to={`/deck/${deck.id}`}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface mb-4">
          <IconChevronLeft className="w-4 h-4" />
          Quay lại bộ thẻ
        </Link>
        <h1 className="font-headline text-2xl font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
          Bài tập luyện tập
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">{deck.name} · {cardCount} thẻ</p>
      </div>

      {/* Loại bài tập */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
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
                className="w-full flex items-center gap-4 p-4 text-left transition-all"
                style={{
                  border: `2px solid ${active ? 'var(--secondary)' : 'rgba(0,0,0,0.1)'}`,
                  background: active ? 'rgba(198,40,40,0.05)' : 'var(--surface)',
                  opacity: disabled ? 0.4 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}>
                <span className="flex-shrink-0 text-on-surface-variant">{icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-on-surface">{label}
                    {disabled && <span className="ml-2 text-[10px] text-on-surface-variant">(cần có câu ví dụ)</span>}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{desc}</p>
                </div>
                {active && (
                  <IconCheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--secondary)' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Số câu */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
          Số câu hỏi
        </p>
        <div className="flex gap-2">
          {['10', '20', 'all'].map((c) => {
            const label = c === 'all' ? `Tất cả (${cardCount})` : c;
            const disabled = c !== 'all' && parseInt(c) > cardCount;
            return (
              <button key={c}
                onClick={() => !disabled && setCount(c)}
                disabled={disabled}
                className="flex-1 py-2.5 text-sm font-semibold transition-all"
                style={{
                  border: `2px solid ${count === c ? 'var(--secondary)' : 'rgba(0,0,0,0.1)'}`,
                  background: count === c ? 'rgba(198,40,40,0.06)' : 'var(--surface)',
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
        className="w-full py-3 text-sm font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all disabled:opacity-40"
        style={{ background: 'var(--secondary)' }}>
        Bắt đầu luyện tập →
      </button>
    </div>
  );
}

// ===== Multiple Choice Exercise =====
function MultipleChoiceEx({ exercise, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  useEffect(() => { setSelected(null); setAnswered(false); }, [exercise.card.id]);

  const handleSelect = (opt) => {
    if (answered) return;
    const correct = opt === exercise.card.back;
    setSelected(opt); setAnswered(true);
    if (correct) setTimeout(() => onAnswer(true), 1200);
    else onAnswer(false);
  };

  const style = (opt) => {
    if (!answered) return { border: '2px solid rgba(0,0,0,0.1)', background: 'var(--surface-container-lowest)', cursor: 'pointer' };
    if (opt === exercise.card.back) return { border: '2px solid #4caf50', background: 'rgba(76,175,80,0.08)' };
    if (opt === selected) return { border: '2px solid var(--secondary)', background: 'rgba(198,40,40,0.08)' };
    return { border: '2px solid rgba(0,0,0,0.06)', background: 'var(--surface-container-low)', opacity: 0.5 };
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {exercise.options.map((opt, i) => (
          <button key={i} onClick={() => handleSelect(opt)}
            className="p-4 text-left transition-all text-sm font-medium"
            style={style(opt)}>
            <span className="inline-block w-5 h-5 text-center text-[10px] font-bold mb-1.5 leading-5"
              style={{ background: 'rgba(0,0,0,0.06)' }}>
              {String.fromCharCode(65 + i)}
            </span>
            <p className="leading-snug">{opt}</p>
          </button>
        ))}
      </div>
      {answered && !([exercise.card.back].includes(selected)) && (
        <div className="p-3 text-sm" style={{ background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)', color: '#2e7d32' }}>
          Đáp án đúng: <strong>{exercise.card.back}</strong>
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
  const inputRef = useRef(null);
  useEffect(() => { setValue(''); setAnswered(false); setCorrect(null); inputRef.current?.focus(); }, [exercise.card.id]);

  const handleSubmit = () => {
    if (answered || !value.trim()) return;
    const ok = value.trim().toLowerCase() === exercise.card.back.trim().toLowerCase();
    setCorrect(ok); setAnswered(true);
    if (ok) setTimeout(() => onAnswer(true), 1200);
    else onAnswer(false);
  };

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="text" value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={answered}
        placeholder="Nhập nghĩa tiếng Việt..."
        className="w-full px-4 py-3 text-base outline-none transition-all"
        style={{
          border: `2px solid ${!answered ? 'rgba(0,0,0,0.15)' : correct ? '#4caf50' : 'var(--secondary)'}`,
          background: !answered ? 'var(--surface-container-lowest)' : correct ? 'rgba(76,175,80,0.06)' : 'rgba(198,40,40,0.06)',
        }} />
      {answered && !correct && (
        <p className="text-sm px-1" style={{ color: '#2e7d32' }}>
          Đáp án đúng: <strong>{exercise.card.back}</strong>
        </p>
      )}
      {!answered && (
        <button onClick={handleSubmit} disabled={!value.trim()}
          className="w-full py-2.5 text-sm font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim disabled:opacity-40 transition-all"
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
  useEffect(() => { setPlaced([]); setRemaining(exercise.shuffled); setAnswered(false); setCorrect(null); }, [exercise.card.id]);

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
      <p className="text-xs text-on-surface-variant px-1">Sắp xếp câu ví dụ cho từ <strong className="text-on-surface">{exercise.card.front}</strong>:</p>

      {/* Drop zone */}
      <div className="min-h-14 p-3 flex flex-wrap gap-2"
        style={{ border: `2px dashed ${answered ? (correct ? '#4caf50' : 'var(--secondary)') : 'rgba(0,0,0,0.15)'}`, background: 'var(--surface)' }}>
        {placed.length === 0 && (
          <span className="text-xs text-on-surface-variant italic self-center">Nhấn vào từ bên dưới để sắp xếp...</span>
        )}
        {placed.map((word, i) => (
          <button key={i} onClick={() => removeWord(i)}
            className="px-3 py-1.5 text-sm font-medium transition-all hover:opacity-70"
            style={{ background: answered ? (correct ? 'rgba(76,175,80,0.12)' : 'rgba(198,40,40,0.1)') : 'var(--surface-container)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--on-surface)' }}>
            {word}
          </button>
        ))}
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap gap-2 p-3 bg-surface-container-low"
        style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
        {remaining.map((word, i) => (
          <button key={i} onClick={() => addWord(word, i)}
            className="px-3 py-1.5 text-sm font-medium bg-surface-container-lowest hover:bg-surface-container transition-all"
            style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
            {word}
          </button>
        ))}
        {remaining.length === 0 && <span className="text-xs text-on-surface-variant italic">Đã dùng hết từ</span>}
      </div>

      {answered && !correct && (
        <p className="text-sm px-1" style={{ color: '#2e7d32' }}>
          Đáp án đúng: <strong>{exercise.correct.join(' ')}</strong>
        </p>
      )}

      {!answered && placed.length === exercise.correct.length && (
        <button onClick={handleCheck}
          className="w-full py-2.5 text-sm font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all"
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
  const inputRef = useRef(null);
  useEffect(() => { setValue(''); setAnswered(false); setCorrect(null); setPlayed(false); }, [exercise.card.id]);

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

  return (
    <div className="space-y-4">
      {/* Play button */}
      <div className="flex flex-col items-center py-4 gap-4">
        <button onClick={handlePlay}
          className="w-20 h-20 flex flex-col items-center justify-center gap-1 transition-all hover:opacity-80 active:scale-95"
          style={{ background: played ? 'rgba(26,35,126,0.08)' : 'var(--primary)', color: played ? 'var(--primary)' : '#fff' }}>
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {played ? 'Nghe lại' : 'Nghe'}
          </span>
        </button>
        <p className="text-xs text-on-surface-variant">
          {played ? 'Bạn nghe được gì? Điền nghĩa bên dưới ↓' : 'Nhấn để nghe phát âm rồi điền nghĩa'}
        </p>
      </div>

      {/* Input */}
      <input ref={inputRef} type="text" value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={answered || !played}
        placeholder={played ? 'Nghĩa tiếng Việt...' : 'Hãy nghe trước...'}
        className="w-full px-4 py-3 text-base outline-none transition-all"
        style={{
          border: `2px solid ${!answered ? 'rgba(0,0,0,0.15)' : correct ? '#4caf50' : 'var(--secondary)'}`,
          background: !answered ? 'var(--surface-container-lowest)' : correct ? 'rgba(76,175,80,0.06)' : 'rgba(198,40,40,0.06)',
        }} />

      {answered && (
        <div className="space-y-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
            Từ: <strong className="font-jp text-xl">{exercise.card.front}</strong>
          </p>
          {!correct && (
            <p className="text-sm" style={{ color: '#2e7d32' }}>
              Đáp án đúng: <strong>{exercise.card.back}</strong>
            </p>
          )}
        </div>
      )}

      {!answered && played && (
        <button onClick={handleSubmit} disabled={!value.trim()}
          className="w-full py-2.5 text-sm font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim disabled:opacity-40 transition-all"
          style={{ background: 'var(--secondary)' }}>
          Kiểm tra
        </button>
      )}
    </div>
  );
}

// ===== Exercise Runner =====
function ExerciseRunner({ exercises, deckId, deckName, onComplete }) {
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
    const newResults = [...results];
    if (idx + 1 >= exercises.length) {
      onComplete(newResults);
    } else {
      setIdx((i) => i + 1);
      setAnswered(false);
      setLastCorrect(null);
    }
  };

  const typeLabel = {
    'multiple-choice': <><IconType className="w-4 h-4 inline mr-1" /> Trắc nghiệm</>,
    'fill-in-blank': <><IconPen className="w-4 h-4 inline mr-1" /> Điền từ</>,
    'arrangement': <><IconShuffle className="w-4 h-4 inline mr-1" /> Sắp xếp câu</>,
    'listening': <><IconHeadphones className="w-4 h-4 inline mr-1" /> Nghe - Điền</>,
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 bg-surface-container overflow-hidden"
          style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: 'var(--secondary)' }} />
        </div>
        <span className="text-xs font-semibold text-on-surface-variant tabular-nums whitespace-nowrap">
          <span className="text-green-600 font-bold">{correctSoFar} ✓</span> · {idx + 1}/{exercises.length}
        </span>
      </div>

      {/* Type badge + question */}
      <div className="bg-surface-container-lowest p-6"
        style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            {typeLabel[current.type]}
          </span>
          {current.type !== 'arrangement' && current.type !== 'listening' && (
            <button onClick={() => speakJP(current.card.front)}
              className="text-xs text-on-surface-variant hover:text-primary flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              Nghe
            </button>
          )}
        </div>

        {/* Question word */}
        {current.type !== 'arrangement' && current.type !== 'listening' && (
          <div className="text-center mb-5">
            <p className="font-jp text-4xl font-bold text-on-surface">{current.card.front}</p>
            {current.card.romaji && <p className="text-on-surface-variant mt-1">{current.card.romaji}</p>}
          </div>
        )}

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

      {/* Feedback + Next */}
      {answered && (
        <div className="space-y-3">
          <div className={`flex items-center gap-3 p-3 text-sm font-semibold`}
            style={{
              background: lastCorrect ? 'rgba(76,175,80,0.1)' : 'rgba(198,40,40,0.08)',
              color: lastCorrect ? '#2e7d32' : 'var(--secondary)',
            }}>
            <span className="text-xl">{lastCorrect ? <IconCheckCircle className="w-5 h-5" /> : <IconXCircle className="w-5 h-5" />}</span>
            {lastCorrect ? 'Chính xác!' : 'Chưa đúng rồi!'}
          </div>
          <button onClick={handleNext}
            className="w-full py-3 text-sm font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all"
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
    <div className="max-w-md mx-auto p-6 space-y-5">
      <div className="bg-surface-container-lowest p-8 text-center"
        style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="flex justify-center mb-3" style={{ color }}>{emoji}</div>
        <p className="text-xl font-bold mb-1" style={{ color }}>{label}</p>
        <p className="text-sm text-on-surface-variant mb-4">{deckName}</p>
        <p className="text-5xl font-black text-on-surface my-4">{pct}%</p>
        <p className="text-sm text-on-surface-variant">
          Đúng <span className="font-bold" style={{ color: '#2e7d32' }}>{correct}</span> / {total} câu
        </p>
        <div className="h-2.5 bg-surface-container mt-4 overflow-hidden"
          style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="h-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: 'var(--secondary)' }} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-surface-container p-3">
            <div className="text-2xl font-black" style={{ color: '#2e7d32' }}>{correct}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Đúng</div>
          </div>
          <div className="bg-surface-container p-3">
            <div className="text-2xl font-black" style={{ color: 'var(--secondary)' }}>{total - correct}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Sai</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={onRetry}
          className="py-3 text-sm font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all flex items-center justify-center gap-2"
          style={{ background: 'var(--secondary)' }}>
          <IconRefresh className="w-4 h-4" />
          Luyện lại
        </button>
        <Link to={`/deck/${deckId}`}
          className="py-3 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
          style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Về bộ thẻ
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
      <div className="max-w-2xl mx-auto p-8 flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-outline-variant border-t-secondary animate-spin rounded-full" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center py-16">
        <p className="font-semibold text-on-surface mb-4">Không tìm thấy bộ thẻ</p>
        <Link to="/dashboard" className="text-secondary text-sm font-semibold">← Dashboard</Link>
      </div>
    );
  }

  if (phase === 'setup') return <SetupScreen deck={deck} onStart={handleStart} />;
  if (phase === 'exercises') return (
    <ExerciseRunner
      exercises={exercises}
      deckId={deckId}
      deckName={deck.name}
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
