import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { flashcardApi } from '../api/flashcardApi';

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
    { value: '5', label: '5 từ', sub: 'Nhanh ~5 phút' },
    { value: '10', label: '10 từ', sub: 'Chuẩn ~10 phút' },
    { value: 'all', label: `Tất cả (${cardCount})`, sub: 'Toàn bộ bộ thẻ' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📖</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Học bài tương tác</h1>
          <p className="text-gray-500 mt-1 font-medium">{deck.name}</p>
          <p className="text-sm text-gray-400 mt-0.5">{cardCount} thẻ trong bộ</p>
        </div>

        {/* Giới thiệu flow */}
        <div className="bg-emerald-50 rounded-xl p-4 mb-6 space-y-2">
          <p className="text-sm font-semibold text-emerald-700 mb-2">Bài học bao gồm:</p>
          {[
            { icon: '📚', text: 'Học từng từ với phát âm và ví dụ câu' },
            { icon: '🧠', text: 'Quiz nhỏ xen kẽ để kiểm tra ghi nhớ' },
            { icon: '🏆', text: 'Kết quả chi tiết sau mỗi buổi học' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-emerald-600">
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Số từ mỗi buổi */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Số từ mỗi buổi học
          </label>
          <div className="space-y-2">
            {options.map(({ value, label, sub }) => {
              const disabled = value !== 'all' && parseInt(value, 10) > cardCount;
              return (
                <button
                  key={value}
                  onClick={() => !disabled && setCount(value)}
                  disabled={disabled}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${
                    count === value
                      ? 'border-emerald-500 bg-emerald-50'
                      : disabled
                      ? 'border-gray-100 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={`font-semibold text-sm ${count === value ? 'text-emerald-700' : disabled ? 'text-gray-300' : 'text-gray-700'}`}>
                    {label}
                  </span>
                  <span className={`text-xs ${count === value ? 'text-emerald-500' : 'text-gray-400'}`}>
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
          className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-semibold text-lg hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Bắt đầu học →
        </button>

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

// ===== Overview Slide =====

function OverviewSlide({ words, onNext }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="text-4xl mb-4">🎯</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bài học hôm nay</h2>
        <p className="text-gray-500 mb-6">Bạn sẽ học {words.length} từ mới</p>

        {/* Preview các từ sẽ học */}
        <div className="grid grid-cols-2 gap-2 mb-8 max-h-48 overflow-y-auto">
          {words.map((card, i) => (
            <div key={card.id} className="bg-emerald-50 rounded-lg px-3 py-2 text-left">
              <span className="text-xs text-gray-400 mr-1">{i + 1}.</span>
              <span className="font-semibold text-gray-900 text-sm">{card.front}</span>
              {card.romaji && (
                <p className="text-xs text-gray-400 mt-0.5">{card.romaji}</p>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onNext}
          className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 active:scale-95 transition-all"
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

  const handleSpeak = useCallback(() => {
    speakJapanese(card.front);
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 2000);
  }, [card.front]);

  // Tự động phát âm khi slide hiện ra
  useEffect(() => {
    setRevealed(false);
    setIsSpeaking(false);
    const t = setTimeout(() => {
      handleSpeak();
    }, 400);
    return () => {
      clearTimeout(t);
      window.speechSynthesis?.cancel();
    };
  }, [card.id, handleSpeak]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col p-4">
      {/* Progress header */}
      <div className="max-w-xl mx-auto w-full pt-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${((index) / total) * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
            📚 {index + 1} / {total}
          </span>
        </div>
      </div>

      {/* Nội dung từ */}
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-8">
          {/* Từ Nhật lớn */}
          <div className="text-center mb-6">
            <p className="text-6xl font-black text-gray-900 leading-tight mb-2"
              style={{ fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif' }}>
              {card.front}
            </p>
            {card.romaji && (
              <p className="text-xl text-gray-400 font-medium">{card.romaji}</p>
            )}
            {card.jlptLevel && (
              <span className="inline-block mt-2 px-2.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                JLPT N{card.jlptLevel}
              </span>
            )}
          </div>

          {/* Nút phát âm */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleSpeak}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-medium text-sm transition-all ${
                isSpeaking
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-600 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              <svg className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              {isSpeaking ? 'Đang phát...' : 'Nghe phát âm'}
            </button>
          </div>

          <hr className="border-gray-100 mb-5" />

          {/* Nút xem nghĩa hoặc nội dung đã reveal */}
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="w-full py-3 border-2 border-dashed border-emerald-300 text-emerald-600 rounded-xl font-medium hover:bg-emerald-50 transition-colors"
            >
              👁 Xem nghĩa & ví dụ
            </button>
          ) : (
            <div className="space-y-4">
              {/* Nghĩa */}
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">
                  Nghĩa tiếng Việt
                </p>
                <p className="text-2xl font-bold text-gray-900">{card.back}</p>
              </div>

              {/* Ví dụ câu */}
              {card.example && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">
                    Ví dụ câu
                  </p>
                  <p className="text-gray-800 text-sm leading-relaxed">{card.example}</p>
                  <button
                    onClick={() => speakJapanese(card.example)}
                    className="mt-2 text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                  >
                    🔊 Nghe ví dụ
                  </button>
                </div>
              )}

              <button
                onClick={onNext}
                className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 active:scale-95 transition-all"
              >
                {index + 1 >= total ? 'Hoàn thành giai đoạn học →' : 'Từ tiếp theo →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Checkpoint Slide =====

function CheckpointSlide({ wordCount, onNext }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="text-5xl mb-4">🧠</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Tốt lắm!</h2>
        <p className="text-gray-500 mb-2">
          Bạn vừa học xong <span className="font-bold text-emerald-600">{wordCount} từ mới</span>
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Bây giờ hãy kiểm tra xem bạn nhớ được bao nhiêu nhé!
        </p>

        <div className="bg-amber-50 rounded-xl p-4 mb-8 text-left space-y-2">
          <p className="text-sm text-amber-700 font-semibold">Sắp bắt đầu:</p>
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <span>❓</span>
            <span>{wordCount} câu hỏi trắc nghiệm</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <span>⚡</span>
            <span>Chọn nghĩa đúng của mỗi từ</span>
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full py-3.5 bg-amber-500 text-white rounded-xl font-semibold text-lg hover:bg-amber-600 active:scale-95 transition-all"
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
    if (!answered) return 'border-gray-200 bg-white text-gray-800 hover:border-amber-400 hover:bg-amber-50 cursor-pointer';
    if (option === card.back) return 'border-green-500 bg-green-50 text-green-800';
    if (option === selected) return 'border-red-400 bg-red-50 text-red-700';
    return 'border-gray-100 bg-gray-50 text-gray-400';
  };

  const progressPct = (index / total) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col p-4">
      {/* Progress header */}
      <div className="max-w-xl mx-auto w-full pt-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
            ❓ {index + 1} / {total}
          </span>
        </div>
      </div>

      {/* Nội dung quiz */}
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-8">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4 font-medium text-center">
            Chọn nghĩa đúng
          </p>

          {/* Từ cần đoán */}
          <div className="text-center mb-6">
            <p className="text-5xl font-black text-gray-900 mb-2"
              style={{ fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif' }}>
              {card.front}
            </p>
            {card.romaji && (
              <p className="text-gray-400">{card.romaji}</p>
            )}
            <button
              onClick={() => speakJapanese(card.front)}
              className="mt-2 text-xs text-gray-400 hover:text-amber-600 transition-colors"
            >
              🔊 Nghe
            </button>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleSelect(option)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${getOptionStyle(option)}`}
              >
                <span className="inline-block w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold text-center leading-5 mb-1.5">
                  {String.fromCharCode(65 + i)}
                </span>
                <p className="text-sm font-medium leading-snug">{option}</p>
              </button>
            ))}
          </div>

          {/* Feedback sau khi trả lời */}
          {answered && (
            <div className={`flex items-center gap-2 p-3 rounded-xl font-medium text-sm ${
              selected === card.back
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              <span className="text-lg">{selected === card.back ? '✅' : '❌'}</span>
              <span>
                {selected === card.back
                  ? 'Chính xác!'
                  : `Đáp án đúng: ${card.back}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Results Screen =====

function ResultsScreen({ results, deckId, deckName, wordCount, onRetry }) {
  const correctCount = results.filter((r) => r).length;
  const percentage = wordCount > 0 ? Math.round((correctCount / wordCount) * 100) : 0;

  const grade = (() => {
    if (percentage >= 90) return { label: 'Xuất sắc!', emoji: '🏆', color: 'text-yellow-500', bg: 'from-yellow-50 to-amber-50' };
    if (percentage >= 75) return { label: 'Tốt lắm!', emoji: '⭐', color: 'text-emerald-600', bg: 'from-emerald-50 to-teal-50' };
    if (percentage >= 50) return { label: 'Khá tốt!', emoji: '📚', color: 'text-blue-600', bg: 'from-blue-50 to-indigo-50' };
    return { label: 'Cần ôn thêm!', emoji: '💪', color: 'text-orange-500', bg: 'from-orange-50 to-red-50' };
  })();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${grade.bg} p-4 pb-12`}>
      <div className="max-w-md mx-auto pt-8 space-y-5">
        {/* Score card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-5xl mb-3">{grade.emoji}</div>
          <h2 className={`text-2xl font-bold mb-1 ${grade.color}`}>{grade.label}</h2>
          <p className="text-sm text-gray-400 mb-4">{deckName}</p>

          <div className="text-6xl font-black text-gray-900 my-4">{percentage}%</div>

          <p className="text-gray-500">
            Đúng <span className="font-bold text-emerald-600">{correctCount}</span> / {wordCount} câu
          </p>

          <div className="h-3 bg-gray-100 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-emerald-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-emerald-600">{correctCount}</div>
              <div className="text-xs text-emerald-500">Đúng</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-red-500">{wordCount - correctCount}</div>
              <div className="text-xs text-red-400">Sai</div>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onRetry}
            className="py-3.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Học lại
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

        {/* Gợi ý luyện tập tiếp */}
        {percentage < 80 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className="text-gray-600 text-sm mb-3">
              Muốn củng cố những từ chưa nhớ?
            </p>
            <Link
              to={`/quiz/${deckId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Làm Quiz bổ sung
            </Link>
          </div>
        )}
      </div>
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

  if (slide.type === 'overview') {
    return <OverviewSlide words={lessonWords} onNext={handleSlideNext} />;
  }

  if (slide.type === 'learn') {
    return (
      <LearnSlide
        key={slide.card.id + '-learn-' + currentSlide}
        card={slide.card}
        index={slide.index}
        total={lessonWords.length}
        onNext={handleSlideNext}
      />
    );
  }

  if (slide.type === 'checkpoint') {
    return <CheckpointSlide wordCount={lessonWords.length} onNext={handleSlideNext} />;
  }

  if (slide.type === 'quiz') {
    return (
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

  return null;
}
