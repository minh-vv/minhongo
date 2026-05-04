import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { flashcardApi } from '../api/flashcardApi';

// ===== Utilities =====

/** Fisher-Yates shuffle — trả về mảng mới, không mutate đầu vào */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sinh danh sách câu hỏi từ cards của deck.
 *
 * @param {object[]} cards   - Mảng card từ API
 * @param {'multiple-choice'|'fill-in-blank'} mode
 * @param {'normal'|'reverse'} direction  - normal: JP→VI, reverse: VI→JP
 * @param {'10'|'20'|'all'} count
 */
function generateQuestions(cards, mode, direction, count) {
  if (!cards || cards.length === 0) return [];

  const shuffled = shuffleArray(cards);
  const selected =
    count === 'all'
      ? shuffled
      : shuffled.slice(0, Math.min(parseInt(count, 10), shuffled.length));

  return selected.map((card) => {
    const question = direction === 'normal' ? card.front : card.back;
    const answer = direction === 'normal' ? card.back : card.front;
    // Romaji chỉ hiển thị khi hướng normal (câu hỏi là tiếng Nhật)
    const hint = direction === 'normal' ? card.romaji || null : null;

    if (mode === 'multiple-choice') {
      // 3 lựa chọn nhiễu từ các card khác trong deck
      const otherCards = cards.filter((c) => c.id !== card.id);
      const distractors = shuffleArray(otherCards)
        .slice(0, 3)
        .map((c) => (direction === 'normal' ? c.back : c.front));

      // Pad nếu deck < 4 thẻ
      while (distractors.length < 3) {
        distractors.push(`Phương án ${distractors.length + 2}`);
      }

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
  const cardCount = deck?.cards?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Tiêu đề */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Làm Quiz</h1>
          <p className="text-gray-500 mt-1 font-medium">{deck.name}</p>
          <p className="text-sm text-gray-400 mt-0.5">{cardCount} thẻ</p>
        </div>

        {/* Dạng câu hỏi */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Dạng câu hỏi</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'multiple-choice', icon: '🔤', label: 'Trắc nghiệm' },
              { value: 'fill-in-blank', icon: '✏️', label: 'Điền từ' },
            ].map(({ value, icon, label }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  mode === value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-sm font-medium">{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Hướng kiểm tra */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Hướng kiểm tra</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'normal', label: 'Nhật → Việt', sub: 'Xem chữ Nhật, đoán nghĩa' },
              { value: 'reverse', label: 'Việt → Nhật', sub: 'Xem nghĩa, đoán chữ Nhật' },
            ].map(({ value, label, sub }) => (
              <button
                key={value}
                onClick={() => setDirection(value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  direction === value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-semibold">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Số câu hỏi */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Số câu hỏi</label>
          <div className="flex gap-2">
            {['10', '20', 'all'].map((c) => {
              const label = c === 'all' ? `Tất cả (${cardCount})` : c;
              const disabled = c !== 'all' && parseInt(c, 10) > cardCount;
              return (
                <button
                  key={c}
                  onClick={() => !disabled && setCount(c)}
                  disabled={disabled}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    count === c
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : disabled
                      ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nút bắt đầu */}
        <button
          onClick={() => onStart({ mode, direction, count })}
          disabled={cardCount < 2}
          className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Bắt đầu Quiz →
        </button>
        {cardCount < 2 && (
          <p className="text-center text-red-500 text-sm mt-3">
            Cần ít nhất 2 thẻ để làm quiz
          </p>
        )}

        <Link
          to={`/deck/${deck.id}`}
          className="block text-center text-gray-400 text-sm mt-4 hover:text-gray-600"
        >
          ← Quay lại bộ thẻ
        </Link>
      </div>
    </div>
  );
}

// ===== Quiz Screen =====

function QuizScreen({ questions, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  const current = questions[currentIndex];
  const progressPct = (currentIndex / questions.length) * 100;
  const correctSoFar = results.filter((r) => r.isCorrect).length;

  // Focus input khi sang câu mới (fill-in-blank)
  useEffect(() => {
    if (current?.mode === 'fill-in-blank' && !isAnswered) {
      inputRef.current?.focus();
    }
  }, [currentIndex, isAnswered, current?.mode]);

  const recordResult = useCallback(
    (userAnswer, correct) => {
      setIsCorrect(correct);
      setIsAnswered(true);
      setResults((prev) => [
        ...prev,
        {
          question: current.question,
          answer: current.answer,
          userAnswer,
          isCorrect: correct,
          hint: current.hint,
        },
      ]);
    },
    [current],
  );

  const handleMultipleChoiceSelect = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
    recordResult(option, option === current.answer);
  };

  const handleFillInBlankSubmit = () => {
    if (isAnswered || !inputValue.trim()) return;
    const trimmed = inputValue.trim().toLowerCase();
    const correct = trimmed === current.answer.trim().toLowerCase();
    recordResult(inputValue.trim(), correct);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      // Truyền kết quả đã cộng thêm câu cuối
      onFinish([
        ...results,
      ]);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setInputValue('');
      setIsAnswered(false);
      setIsCorrect(null);
    }
  };

  const getOptionStyle = (option) => {
    if (!isAnswered)
      return 'border-gray-200 bg-white text-gray-800 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer';
    if (option === current.answer)
      return 'border-green-500 bg-green-50 text-green-800';
    if (option === selectedOption)
      return 'border-red-400 bg-red-50 text-red-700';
    return 'border-gray-100 bg-gray-50 text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header: progress + điểm tạm */}
        <div className="flex items-center gap-4 pt-6 mb-6">
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-gray-600 whitespace-nowrap">
            <span className="text-green-600 font-bold">{correctSoFar} ✓</span>
            <span>{currentIndex + 1}/{questions.length}</span>
          </div>
        </div>

        {/* Thẻ câu hỏi */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4 font-medium">
            {current.mode === 'multiple-choice' ? 'Chọn đáp án đúng' : 'Điền câu trả lời'}
          </p>
          <p className="text-4xl font-bold text-gray-900 leading-tight break-all mb-3">
            {current.question}
          </p>
          {current.hint && (
            <p className="text-gray-400 text-base">{current.hint}</p>
          )}
        </div>

        {/* Vùng trả lời — Multiple Choice */}
        {current.mode === 'multiple-choice' && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {current.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleMultipleChoiceSelect(option)}
                className={`p-4 rounded-xl border-2 text-left font-medium transition-all ${getOptionStyle(option)}`}
              >
                <span className="inline-block w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold text-center leading-6 mb-2">
                  {String.fromCharCode(65 + i)}
                </span>
                <p className="text-sm leading-snug">{option}</p>
              </button>
            ))}
          </div>
        )}

        {/* Vùng trả lời — Fill in blank */}
        {current.mode === 'fill-in-blank' && (
          <div className="mb-6 space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isAnswered && handleFillInBlankSubmit()}
              disabled={isAnswered}
              placeholder="Nhập câu trả lời..."
              className={`w-full px-5 py-4 text-lg border-2 rounded-xl outline-none transition-all ${
                isAnswered
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-red-400 bg-red-50 text-red-800'
                  : 'border-gray-300 focus:border-indigo-500 bg-white'
              }`}
            />
            {isAnswered && !isCorrect && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <p className="text-sm text-green-700">
                  <span className="font-semibold">Đáp án đúng:</span> {current.answer}
                </p>
              </div>
            )}
            {!isAnswered && (
              <button
                onClick={handleFillInBlankSubmit}
                disabled={!inputValue.trim()}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Kiểm tra
              </button>
            )}
          </div>
        )}

        {/* Phản hồi + nút Tiếp theo */}
        {isAnswered && (
          <div className="space-y-3">
            <div
              className={`p-4 rounded-xl flex items-center gap-3 font-semibold ${
                isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
              }`}
            >
              <span className="text-2xl">{isCorrect ? '✅' : '❌'}</span>
              <span>{isCorrect ? 'Chính xác!' : 'Chưa đúng rồi!'}</span>
            </div>
            <button
              onClick={handleNext}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 active:scale-95 transition-all"
            >
              {currentIndex + 1 >= questions.length ? 'Xem kết quả 🏁' : 'Câu tiếp theo →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Results Screen =====

function ResultsScreen({ results, deckId, deckName, onRetry }) {
  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalCount = results.length;
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const wrongAnswers = results.filter((r) => !r.isCorrect);

  const grade = (() => {
    if (percentage >= 90) return { label: 'Xuất sắc!', emoji: '🏆', color: 'text-yellow-500' };
    if (percentage >= 75) return { label: 'Tốt lắm!', emoji: '⭐', color: 'text-green-600' };
    if (percentage >= 50) return { label: 'Khá tốt!', emoji: '📚', color: 'text-blue-600' };
    return { label: 'Cần ôn thêm!', emoji: '💪', color: 'text-orange-500' };
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 pb-12">
      <div className="max-w-2xl mx-auto pt-8 space-y-5">
        {/* Thẻ điểm */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-5xl mb-3">{grade.emoji}</div>
          <h2 className={`text-xl font-bold mb-1 ${grade.color}`}>{grade.label}</h2>
          <p className="text-sm text-gray-400 mb-4">{deckName}</p>

          <div className="text-7xl font-black text-gray-900 my-4">{percentage}%</div>

          <p className="text-gray-500 text-base">
            Đúng{' '}
            <span className="font-bold text-green-600">{correctCount}</span>
            {' '}/ {totalCount} câu
          </p>

          <div className="h-3 bg-gray-100 rounded-full mt-5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Breakdown mini */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-green-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-green-600">{correctCount}</div>
              <div className="text-xs text-green-500">Đúng</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-red-500">{totalCount - correctCount}</div>
              <div className="text-xs text-red-400">Sai</div>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onRetry}
            className="py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Làm lại
          </button>
          <Link
            to={`/deck/${deckId}`}
            className="py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Về bộ thẻ
          </Link>
        </div>

        {/* Danh sách câu sai */}
        {wrongAnswers.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>❌</span> Cần ôn lại ({wrongAnswers.length} câu)
            </h3>
            <div className="space-y-3">
              {wrongAnswers.map((r, i) => (
                <div key={i} className="p-4 bg-red-50 border border-red-100 rounded-xl">
                  <p className="font-semibold text-gray-900 text-base">{r.question}</p>
                  {r.hint && <p className="text-gray-400 text-xs mt-0.5">{r.hint}</p>}
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-red-600">
                      <span className="text-gray-500">Bạn trả lời: </span>
                      {r.userAnswer || '(bỏ trống)'}
                    </p>
                    <p className="text-green-600">
                      <span className="text-gray-500">Đáp án đúng: </span>
                      {r.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-green-50 rounded-2xl p-6 text-center border border-green-100">
            <p className="text-green-700 font-semibold text-lg">
              🎉 Hoàn hảo! Bạn trả lời đúng tất cả câu hỏi!
            </p>
          </div>
        )}
      </div>
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

  const { data: deck, isLoading, error } = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => flashcardApi.getDeck(deckId),
  });

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
      setPhase('quiz');
    },
    [deck],
  );

  const handleFinish = (results) => {
    setQuizResults(results);
    setPhase('results');
  };

  const handleRetry = () => {
    if (quizConfig) handleStart(quizConfig);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-400">Đang tải...</div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">Không tìm thấy bộ thẻ!</p>
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Quay lại Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {phase === 'setup' && <SetupScreen deck={deck} onStart={handleStart} />}
      {phase === 'quiz' && <QuizScreen questions={questions} onFinish={handleFinish} />}
      {phase === 'results' && (
        <ResultsScreen
          results={quizResults}
          deckId={deckId}
          deckName={deck.name}
          onRetry={handleRetry}
        />
      )}
    </>
  );
}
