import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { flashcardApi } from '../api/flashcardApi';
import {
  shuffleArray,
  fuzzyMatch,
  generateDistractors,
  formatTime,
  getDirectionLabels,
} from '../utils/quizUtils';

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

// ===== Question generation =====

/**
 * Sinh danh sách câu hỏi từ cards.
 *
 * @param {object[]} cards
 * @param {'multiple-choice'|'fill-in-blank'} mode
 * @param {'normal'|'reverse'} direction
 * @param {'10'|'20'|'all'} count
 */
function generateQuestions(cards, mode, direction, count) {
  if (!cards || cards.length === 0) return [];

  const shuffled = shuffleArray(cards);
  const selected =
    count === 'all'
      ? shuffled
      : shuffled.slice(0, Math.min(parseInt(count, 10), shuffled.length));

  const answerField = direction === 'normal' ? 'back' : 'front';

  return selected.map((card) => {
    const question = direction === 'normal' ? card.front : card.back;
    const answer = direction === 'normal' ? card.back : card.front;
    // Romaji hint chỉ hiển thị khi question là tiếng Nhật (normal mode)
    const hint = direction === 'normal' ? card.romaji || null : null;

    if (mode === 'multiple-choice') {
      const distractors = generateDistractors(answer, cards, card.id, answerField, 3);
      return {
        id: card.id,
        question,
        answer,
        hint,
        options: shuffleArray([answer, ...distractors]),
        mode: 'multiple-choice',
      };
    }

    return { id: card.id, question, answer, hint, mode: 'fill-in-blank' };
  });
}

// ===== Setup Screen =====

function SetupScreen({ deck, onStart }) {
  const [mode, setMode] = useState('multiple-choice');
  const [direction, setDirection] = useState('normal');
  const [count, setCount] = useState('10');
  const [timer, setTimer] = useState('off');
  const cardCount = deck?.cards?.length || 0;

  return (
    <div className="max-w-md mx-auto p-4 md:p-8 space-y-6 animate-fade-up">
      <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 md:p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />
        {/* Title */}
        <div className="mb-6 relative z-10">
          <div className="w-14 h-14 bg-surface-container border border-outline-variant/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-secondary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <h1 className="font-headline text-xl font-bold text-on-surface">Làm Quiz kiểm tra</h1>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary mt-1">{deck.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">Sẵn có {cardCount} thẻ trong bộ</p>
        </div>

        {/* Question type */}
        <div className="mb-5 text-left relative z-10">
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Dạng câu hỏi</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'multiple-choice', icon: '🔤', label: 'Trắc nghiệm' },
              { value: 'fill-in-blank', icon: '✏️', label: 'Điền từ' },
            ].map(({ value, icon, label }) => {
              const active = mode === value;
              return (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className="p-3 border text-center transition-all cursor-pointer"
                  style={{
                    border: `2px solid ${active ? 'var(--secondary)' : 'rgba(0,0,0,0.1)'}`,
                    background: active ? 'rgba(198,40,40,0.05)' : 'var(--surface)',
                  }}
                >
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-xs font-bold text-on-surface">{label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Direction */}
        <div className="mb-5 text-left relative z-10">
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Hướng kiểm tra</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'normal', label: 'Nhật → Việt', sub: 'Xem chữ Nhật, đoán nghĩa' },
              { value: 'reverse', label: 'Việt → Nhật', sub: 'Xem nghĩa, đoán chữ Nhật' },
            ].map(({ value, label, sub }) => {
              const active = direction === value;
              return (
                <button
                  key={value}
                  onClick={() => setDirection(value)}
                  className="p-3 border text-center transition-all cursor-pointer"
                  style={{
                    border: `2px solid ${active ? 'var(--secondary)' : 'rgba(0,0,0,0.1)'}`,
                    background: active ? 'rgba(198,40,40,0.05)' : 'var(--surface)',
                  }}
                >
                  <div className="text-xs font-bold text-on-surface">{label}</div>
                  <div className="text-[9px] text-on-surface-variant mt-0.5 leading-normal">{sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question count */}
        <div className="mb-5 text-left relative z-10">
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Số câu hỏi</label>
          <div className="flex gap-2">
            {['10', '20', 'all'].map((c) => {
              const label = c === 'all' ? `Tất cả (${cardCount})` : c;
              const disabled = c !== 'all' && parseInt(c, 10) > cardCount;
              const active = count === c;
              return (
                <button
                  key={c}
                  onClick={() => !disabled && setCount(c)}
                  disabled={disabled}
                  className="flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all"
                  style={{
                    border: `2px solid ${active ? 'var(--secondary)' : 'rgba(0,0,0,0.1)'}`,
                    background: active ? 'rgba(198,40,40,0.05)' : 'var(--surface)',
                    color: active ? 'var(--secondary)' : disabled ? 'rgba(0,0,0,0.25)' : 'var(--on-surface)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timer option */}
        <div className="mb-6 text-left relative z-10">
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
            ⏱️ Giới hạn thời gian mỗi câu
          </label>
          <div className="flex gap-2">
            {[
              { value: 'off', label: 'Tắt' },
              { value: '15', label: '15s' },
              { value: '30', label: '30s' },
              { value: '60', label: '60s' },
            ].map(({ value, label }) => {
              const active = timer === value;
              return (
                <button
                  key={value}
                  onClick={() => setTimer(value)}
                  className="flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all"
                  style={{
                    border: `2px solid ${active ? 'var(--secondary)' : 'rgba(0,0,0,0.1)'}`,
                    background: active ? 'rgba(198,40,40,0.05)' : 'var(--surface)',
                    color: active ? 'var(--secondary)' : 'var(--on-surface)',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={() => onStart({ mode, direction, count, timer })}
          disabled={cardCount < 2}
          className="w-full py-3 text-sm font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all disabled:opacity-40"
          style={{ background: 'var(--secondary)' }}
        >
          Bắt đầu Quiz →
        </button>
        {cardCount < 2 && (
          <p className="text-center text-secondary text-[10px] font-bold uppercase tracking-wider mt-3">
            Cần ít nhất 2 thẻ để làm quiz
          </p>
        )}

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

// ===== Quiz Screen =====

function QuizScreen({ questions, onFinish, timerSeconds, direction }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [matchResult, setMatchResult] = useState(null); // { isExact, isFuzzy, distance }
  const [results, setResults] = useState([]);
  const [timeLeft, setTimeLeft] = useState(timerSeconds || 0);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  const current = questions[currentIndex];
  const progressPct = (currentIndex / questions.length) * 100;
  const correctSoFar = results.filter((r) => r.isCorrect).length;
  const labels = getDirectionLabels(direction);

  // --- Declare all handler functions BEFORE useEffects that reference them ---

  const recordResult = useCallback(
    (userAnswer, correct, match) => {
      setMatchResult(match);
      setIsAnswered(true);
      clearInterval(timerRef.current);
      setResults((prev) => [
        ...prev,
        {
          cardId: current.id,
          question: current.question,
          answer: current.answer,
          userAnswer,
          isCorrect: correct,
          isFuzzy: match?.isFuzzy && !match?.isExact,
          hint: current.hint,
        },
      ]);
    },
    [current],
  );

  const handleMultipleChoiceSelect = useCallback((option) => {
    if (isAnswered) return;
    setSelectedOption(option);
    const match = fuzzyMatch(option, current.answer);
    recordResult(option, match.isExact, match);
  }, [isAnswered, current, recordResult]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      onFinish([...results]);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setInputValue('');
      setIsAnswered(false);
      setMatchResult(null);
    }
  }, [currentIndex, questions.length, onFinish, results]);

  const handleFillInBlankSubmit = () => {
    if (isAnswered || !inputValue.trim()) return;
    const match = fuzzyMatch(inputValue.trim(), current.answer);
    // Accept both exact and fuzzy matches as correct
    recordResult(inputValue.trim(), match.isExact || match.isFuzzy, match);
  };

  // --- useEffects (all handlers are now declared above) ---

  // Timer countdown
  useEffect(() => {
    if (!timerSeconds || isAnswered) {
      clearInterval(timerRef.current);
      return;
    }
    setTimeLeft(timerSeconds);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentIndex, timerSeconds, isAnswered]);

  // When timer hits 0, record as wrong
  useEffect(() => {
    if (timerSeconds && timeLeft === 0 && !isAnswered) {
      recordResult('(hết giờ)', false, null);
    }
  }, [timeLeft, timerSeconds, isAnswered, recordResult]);

  // Focus input on new fill-in-blank question
  useEffect(() => {
    if (current?.mode === 'fill-in-blank' && !isAnswered) {
      inputRef.current?.focus();
    }
  }, [currentIndex, isAnswered, current?.mode]);

  // Tự động phát âm tiếng Nhật khi câu hỏi mới hiển thị (nếu là trắc nghiệm / điền từ ở chiều Nhật -> Việt)
  useEffect(() => {
    if (direction === 'normal' && current?.question) {
      const t = setTimeout(() => {
        speakJapanese(current.question);
      }, 400);
      return () => {
        clearTimeout(t);
        window.speechSynthesis?.cancel();
      };
    }
  }, [currentIndex, current?.question, direction]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (current?.mode === 'multiple-choice' && !isAnswered) {
        const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
        const idx = keyMap[e.key.toLowerCase()];
        if (idx !== undefined && idx < current.options.length) {
          handleMultipleChoiceSelect(current.options[idx]);
        }
      }
      if (e.key === 'Enter' && isAnswered) {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [current, isAnswered, handleMultipleChoiceSelect, handleNext]);

  const isCorrect = results.length > 0 ? results[results.length - 1]?.isCorrect : null;

  const getOptionStyle = (option) => {
    if (!isAnswered)
      return { border: '2px solid rgba(0,0,0,0.15)', bg: 'bg-surface-container-lowest text-on-surface hover:border-secondary hover:bg-secondary/5 hover:translate-y-[-1px] transition-all duration-150 sharp-shadow-sm' };
    if (option === current.answer)
      return { border: '2px solid #4caf50', bg: 'bg-green-500/10 text-green-800 sharp-shadow-sm' };
    if (option === selectedOption && option !== current.answer)
      return { border: '2px solid var(--secondary)', bg: 'bg-secondary/10 text-secondary sharp-shadow-sm' };
    return { border: '1px solid rgba(0,0,0,0.06)', bg: 'bg-surface-container-low text-on-surface-variant/40 opacity-50' };
  };

  const timerPct = timerSeconds ? (timeLeft / timerSeconds) * 100 : 0;
  const timerUrgent = timerSeconds && timeLeft <= 5;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6 animate-fade-up">
      {/* Header: progress + score */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-surface-container border border-outline-variant/20 overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: 'var(--secondary)' }}
            />
          </div>
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant whitespace-nowrap">
            <span className="text-green-600">{correctSoFar} ✓</span>
            <span>{currentIndex + 1} / {questions.length}</span>
          </div>
        </div>

        {/* Timer bar */}
        {timerSeconds > 0 && !isAnswered && (
          <div className="h-1.5 bg-surface-container border border-outline-variant/10 overflow-hidden">
            <div
              className="h-full transition-all duration-1000 ease-linear"
              style={{
                width: `${timerPct}%`,
                background: timerUrgent ? '#ef4444' : 'var(--secondary)',
              }}
            />
          </div>
        )}
        {timerSeconds > 0 && !isAnswered && (
          <p className={`text-right text-[10px] font-bold uppercase tracking-widest ${timerUrgent ? 'text-red-600 animate-pulse' : 'text-on-surface-variant'}`}>
            ⏱️ {formatTime(timeLeft)}
          </p>
        )}
      </div>

      {/* Question card */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 md:p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">
          {current.mode === 'multiple-choice' ? labels.questionLabel : labels.answerInstruction}
        </p>
        <p className={`${direction === 'normal' ? 'font-jp' : ''} text-4xl font-bold text-on-surface leading-tight break-words mb-3 relative z-10`}>
          {current.question}
        </p>
        {current.hint && (
          <p className="text-on-surface-variant text-sm font-medium relative z-10">{current.hint}</p>
        )}
      </div>

      {/* Answer area — Multiple Choice */}
      {current.mode === 'multiple-choice' && (
        <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
          {current.options.map((option, i) => {
            const optStyle = getOptionStyle(option);
            const shortcutKey = String.fromCharCode(65 + i);
            return (
              <button
                key={i}
                onClick={() => handleMultipleChoiceSelect(option)}
                className={`p-4 text-left transition-all ${optStyle.bg}`}
                style={{ border: optStyle.border }}
              >
                <span className="inline-flex items-center justify-center w-8 h-5 bg-surface border-2 border-secondary text-secondary text-[10px] font-black tracking-wider sharp-shadow-sm mb-2 mr-1">
                  {shortcutKey} / {i + 1}
                </span>
                <p className="text-xs font-semibold leading-relaxed">{option}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Answer area — Fill in blank */}
      {current.mode === 'fill-in-blank' && (
        <div className="mb-6 space-y-3 relative z-10">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isAnswered && handleFillInBlankSubmit()}
            disabled={isAnswered}
            placeholder={labels.answerPlaceholder}
            className="w-full px-4 py-3 text-base border bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant outline-none transition-all focus:border-secondary focus:ring-1 focus:ring-secondary/50 sharp-shadow-sm"
            style={{
              border: isAnswered
                ? isCorrect
                  ? '2px solid #4caf50'
                  : '2px solid var(--secondary)'
                : '2px solid rgba(0,0,0,0.15)',
              background: isAnswered
                ? isCorrect
                  ? 'rgba(76,175,80,0.06)'
                  : 'rgba(198,40,40,0.06)'
                : 'var(--surface-container-lowest)',
            }}
          />
          {/* Fuzzy match feedback */}
          {isAnswered && matchResult?.isFuzzy && !matchResult?.isExact && isCorrect && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <span>✨</span>
              <span>Gần đúng! Đáp án chính xác: <strong className="normal-case">{current.answer}</strong></span>
            </div>
          )}
          {isAnswered && !isCorrect && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-800 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <span>✓</span>
              <span>
                Đáp án đúng: {current.answer}
              </span>
            </div>
          )}
          {!isAnswered && (
            <button
              onClick={handleFillInBlankSubmit}
              disabled={!inputValue.trim()}
              className="w-full py-3 bg-secondary hover:bg-secondary-dim text-on-secondary text-xs font-bold uppercase tracking-wider disabled:opacity-40 transition-colors"
              style={{ background: 'var(--secondary)' }}
            >
              Kiểm tra
            </button>
          )}
        </div>
      )}

      {/* Feedback + Next button */}
      {isAnswered && (
        <div className="space-y-3 relative z-10 animate-fade-up">
          <div className="flex items-center gap-2 p-3 border font-semibold text-xs uppercase tracking-wider"
               style={{
                 background: isCorrect ? 'rgba(76,175,80,0.1)' : 'rgba(198,40,40,0.08)',
                 borderColor: isCorrect ? 'rgba(76,175,80,0.3)' : 'var(--outline-variant)',
                 color: isCorrect ? '#2e7d32' : 'var(--secondary)',
               }}>
            <span className="text-sm">{isCorrect ? '✅' : '❌'}</span>
            <span>{isCorrect ? 'Chính xác!' : 'Chưa đúng rồi!'}</span>
          </div>
          <button
            onClick={handleNext}
            className="w-full py-3.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider transition-all"
          >
            {currentIndex + 1 >= questions.length ? 'Xem kết quả 🏁' : 'Câu tiếp theo → (Enter)'}
          </button>
        </div>
      )}
    </div>
  );
}

// ===== Results Screen =====

function ResultsScreen({ results, deckId, deckName, onRetry, onRetryWrong, srsStatus }) {
  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalCount = results.length;
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const wrongAnswers = results.filter((r) => !r.isCorrect);

  const grade = (() => {
    if (percentage >= 90) return { label: 'Xuất sắc!', emoji: '🏆', color: 'text-amber-800' };
    if (percentage >= 75) return { label: 'Tốt lắm!', emoji: '⭐', color: 'text-green-800' };
    if (percentage >= 50) return { label: 'Khá tốt!', emoji: '📚', color: 'text-primary' };
    return { label: 'Cần ôn tập thêm!', emoji: '💪', color: 'text-secondary' };
  })();

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-5 animate-fade-up">
      {/* Score card */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 md:p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />
        <div className="text-4xl mb-3 relative z-10">{grade.emoji}</div>
        <h2 className={`font-headline text-xl font-bold mb-1 relative z-10 ${grade.color}`}>{grade.label}</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4 relative z-10">{deckName}</p>

        <div className="text-6xl font-black text-on-surface my-4 relative z-10">{percentage}%</div>

        <p className="text-xs font-semibold text-on-surface-variant relative z-10">
          Trả lời đúng <span className="font-black text-green-700">{correctCount}</span> / {totalCount} câu hỏi
        </p>

        <div className="h-2.5 bg-surface-container border border-outline-variant/20 overflow-hidden mt-4 relative z-10">
          <div
            className="h-full transition-all duration-1000"
            style={{ width: `${percentage}%`, background: 'var(--secondary)' }}
          />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3 mt-5 relative z-10">
          <div className="bg-surface border border-outline-variant/20 p-3 text-center">
            <div className="text-xl font-black text-green-700">{correctCount}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant mt-0.5">Đúng</div>
          </div>
          <div className="bg-surface border border-outline-variant/20 p-3 text-center">
            <div className="text-xl font-black text-secondary">{totalCount - correctCount}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant mt-0.5">Sai</div>
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
                ⚠️ Không thể đồng bộ SRS (kết quả quiz vẫn được lưu)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={`grid gap-3 ${wrongAnswers.length > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <button
          onClick={onRetry}
          className="py-3 text-xs font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-all flex items-center justify-center gap-1.5"
          style={{ background: 'var(--secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm lại
        </button>
        {wrongAnswers.length > 0 && (
          <button
            onClick={onRetryWrong}
            className="py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border-2 border-secondary text-secondary hover:bg-secondary/5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            Ôn câu sai ({wrongAnswers.length})
          </button>
        )}
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

      {/* Wrong answers list */}
      {wrongAnswers.length > 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 animate-fade-up">
          <h3 className="font-headline text-sm font-bold text-on-surface mb-4 border-b border-outline-variant/20 pb-2 flex items-center gap-2">
            <span>❌</span> Danh sách các từ cần ôn lại ({wrongAnswers.length} từ)
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {wrongAnswers.map((r, i) => (
              <div key={i} className="p-3.5 border border-secondary/20 bg-secondary/5 space-y-1.5">
                <p className="font-jp text-lg font-bold text-on-surface">{r.question}</p>
                {r.hint && <p className="text-on-surface-variant text-xs font-medium">{r.hint}</p>}
                <div className="text-xs pt-1 space-y-0.5">
                  <p className="text-secondary font-semibold">
                    <span className="text-on-surface-variant font-medium">Bạn chọn: </span>
                    {r.userAnswer || '(bỏ trống)'}
                  </p>
                  <p className="text-green-700 font-semibold">
                    <span className="text-on-surface-variant font-medium">Nghĩa đúng: </span>
                    {r.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-500/30 p-6 text-center animate-fade-up">
          <p className="text-green-800 font-bold text-base uppercase tracking-wider">
            🎉 Hoàn hảo! Bạn trả lời đúng 100% câu hỏi!
          </p>
        </div>
      )}
    </div>
  );
}

// ===== Main QuizPage =====

export default function QuizPage() {
  const { deckId } = useParams();

  // phase: 'setup' | 'quiz' | 'results'
  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [quizConfig, setQuizConfig] = useState(null);
  const [quizResults, setQuizResults] = useState([]);
  const [srsStatus, setSrsStatus] = useState(null); // null | 'syncing' | 'synced' | 'error'

  const { data: deck, isLoading, error } = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => flashcardApi.getDeck(deckId),
  });

  // Sync quiz results to SRS
  const syncSRS = useCallback(async (results) => {
    setSrsStatus('syncing');
    try {
      const promises = results.map((r) =>
        flashcardApi.reviewCard(r.cardId, r.isCorrect ? 2 : 0) // GOOD=2, AGAIN=0
      );
      await Promise.allSettled(promises);
      setSrsStatus('synced');
    } catch {
      setSrsStatus('error');
    }
  }, []);

  const handleStart = useCallback(
    (config) => {
      const generated = generateQuestions(
        deck?.cards,
        config.mode,
        config.direction,
        config.count,
      );
      setQuestions(generated);
      setQuizConfig(config);
      setSrsStatus(null);
      setPhase('quiz');
    },
    [deck],
  );

  const handleFinish = useCallback((results) => {
    setQuizResults(results);
    setPhase('results');
    syncSRS(results);
  }, [syncSRS]);

  const handleRetry = () => {
    if (quizConfig) handleStart(quizConfig);
  };

  const handleRetryWrong = useCallback(() => {
    if (!quizConfig || !deck?.cards) return;
    const wrongCardIds = new Set(quizResults.filter((r) => !r.isCorrect).map((r) => r.cardId));
    const wrongCards = deck.cards.filter((c) => wrongCardIds.has(c.id));
    if (wrongCards.length < 2) {
      // If only 1 wrong, still create quiz with that card + 1 random
      const otherCards = deck.cards.filter((c) => !wrongCardIds.has(c.id));
      if (otherCards.length > 0) wrongCards.push(otherCards[0]);
    }
    const generated = generateQuestions(
      wrongCards,
      quizConfig.mode,
      quizConfig.direction,
      'all',
    );
    setQuestions(generated);
    setSrsStatus(null);
    setPhase('quiz');
  }, [quizConfig, quizResults, deck]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-fade-up">
        <div className="animate-spin w-8 h-8 border-2 border-outline-variant border-t-secondary rounded-full" />
        <p className="text-on-surface-variant text-sm font-semibold mt-4">Đang tải câu hỏi quiz...</p>
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

  const timerSeconds = quizConfig?.timer && quizConfig.timer !== 'off' ? parseInt(quizConfig.timer, 10) : 0;

  return (
    <>
      {phase === 'setup' && <SetupScreen deck={deck} onStart={handleStart} />}
      {phase === 'quiz' && (
        <QuizScreen
          questions={questions}
          onFinish={handleFinish}
          timerSeconds={timerSeconds}
          direction={quizConfig?.direction || 'normal'}
        />
      )}
      {phase === 'results' && (
        <ResultsScreen
          results={quizResults}
          deckId={deckId}
          deckName={deck.name}
          onRetry={handleRetry}
          onRetryWrong={handleRetryWrong}
          srsStatus={srsStatus}
        />
      )}
    </>
  );
}
