import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { coursesApi } from '../api/coursesApi';
import { flashcardApi } from '../api/flashcardApi';
import { ArrowLeft, ArrowRight, RotateCw, Check } from 'lucide-react';

const PHASE = {
  THEORY: 'theory',
  REVIEW: 'review',
  TEST: 'test',
  RESULT: 'result',
};

const SKILL_LABELS = {
  VOCABULARY: { label: 'Từ vựng', color: 'bg-blue-100 text-blue-700' },
  KANJI: { label: 'Hán tự', color: 'bg-red-100 text-red-700' },
  GRAMMAR: { label: 'Ngữ pháp', color: 'bg-purple-100 text-purple-700' },
  READING: { label: 'Đọc hiểu', color: 'bg-orange-100 text-orange-700' },
  LISTENING: { label: 'Nghe hiểu', color: 'bg-teal-100 text-teal-700' },
};

/** Fisher–Yates shuffle (immutable). */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sinh câu hỏi trắc nghiệm: hỏi nghĩa (front → back) với 3 distractor random.
 */
function buildQuestions(cards, count) {
  if (!cards || cards.length < 2) return [];
  const pool = shuffle(cards);
  const selected = pool.slice(0, Math.min(count, pool.length));

  return selected.map((card) => {
    const distractorPool = cards.filter((c) => c.id !== card.id);
    const distractors = shuffle(distractorPool)
      .slice(0, 3)
      .map((c) => c.back);
    while (distractors.length < 3) {
      distractors.push('—');
    }
    return {
      id: card.id,
      question: card.front,
      hint: card.romaji,
      answer: card.back,
      options: shuffle([card.back, ...distractors]),
    };
  });
}

// ============================================================
// THEORY PHASE
// ============================================================
function TheoryPhase({ lesson, onContinue }) {
  const grammarDeck = lesson.decks?.find((d) => d.role === 'GRAMMAR');

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8">
      <div className="mb-4">
        <Link
          to={`/courses/${lesson.course.slug}`}
          className="text-sm text-indigo-600 hover:underline"
        >
          ← {lesson.course.title}
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 md:p-10 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">
            Bài {lesson.order}
          </span>
          {lesson.skills && lesson.skills.length > 0 && (
            <div className="flex gap-1.5">
              {lesson.skills.map((skill) => {
                const s = SKILL_LABELS[skill];
                if (!s) return null;
                return (
                  <span key={skill} className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm uppercase tracking-wider ${s.color}`}>
                    {s.label}
                  </span>
                );
              })}
            </div>
          )}
          <span className="text-xs text-gray-500">
            ~{lesson.estimatedMin} phút
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          {lesson.title}
        </h1>

        <article className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded">
          <ReactMarkdown>{lesson.theoryMd}</ReactMarkdown>
        </article>
      </div>

      {grammarDeck && (
        <div className="bg-purple-55 border border-purple-200 rounded-2xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ backgroundColor: '#faf5ff' }}>
          <div>
            <h3 className="font-bold text-purple-900 text-base">Thẻ ghi nhớ Ngữ pháp</h3>
            <p className="text-sm text-purple-700 mt-1">
              Bài học này bao gồm bộ thẻ luyện tập {grammarDeck.cardCount} mẫu cấu trúc ngữ pháp (Nghe phát âm, chép chính tả, shadowing & AI đặt câu).
            </p>
          </div>
          <Link
            to={`/grammar/${grammarDeck.deckId}`}
            target="_blank"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-all shadow-sm shrink-0"
          >
            Luyện ngữ pháp
          </Link>
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-colors"
      >
        Tiếp theo: Học từ vựng →
      </button>
    </div>
  );
}

// ============================================================
// REVIEW PHASE — flashcard quick
// ============================================================
function ReviewPhase({ cards, onContinue }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[idx];
  const isLast = idx === cards.length - 1;

  const next = () => {
    if (isLast) {
      onContinue();
    } else {
      setIdx(idx + 1);
      setFlipped(false);
    }
  };

  const prev = () => {
    if (idx > 0) {
      setIdx(idx - 1);
      setFlipped(false);
    }
  };

  if (!card) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center flex flex-col items-center">
        <p className="text-xl text-slate-500 font-medium mb-6">Bài này chưa có từ vựng để ôn.</p>
        <button
          onClick={onContinue}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
        >
          Sang phần kiểm tra →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8">
      {/* Header & Progress */}
      <div className="mb-8">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Ôn tập từ vựng</h1>
            <p className="text-sm font-medium text-slate-400 mt-1">Ghi nhớ nhanh trước khi kiểm tra</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-indigo-600">{idx + 1}</span>
            <span className="text-slate-400 font-medium"> / {cards.length}</span>
          </div>
        </div>

        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((idx + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 3D Flashcard */}
      <div
        className="relative h-96 w-full cursor-pointer mb-8 group [perspective:1500px]"
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className="relative w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] [transform-style:preserve-3d]"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center p-8 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all [backface-visibility:hidden]"
          >
            <div className="absolute top-6 left-8 text-xs font-bold tracking-widest text-slate-400 uppercase">
              Mặt trước
            </div>
            
            <p className="text-6xl md:text-7xl font-extrabold text-slate-800 text-center mb-6 tracking-tight">
              {card.front}
            </p>
            {card.romaji && (
              <p className="text-xl md:text-2xl text-slate-400 font-medium tracking-wide">
                {card.romaji}
              </p>
            )}

            <div className="absolute bottom-8 flex items-center gap-2 text-sm font-semibold text-slate-300 group-hover:text-indigo-400 transition-colors">
              <RotateCw className="w-4 h-4" /> Nhấn để lật
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-[2rem] shadow-[0_8px_30px_rgb(79,70,229,0.3)] flex flex-col items-center justify-center p-8 text-white [backface-visibility:hidden]"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div className="absolute top-6 left-8 text-xs font-bold tracking-widest text-indigo-200 uppercase">
              Mặt sau
            </div>
            
            <p className="text-4xl md:text-5xl font-bold text-center mb-8 drop-shadow-sm">
              {card.back}
            </p>
            
            {card.example && (
              <div className="mt-2 p-5 bg-white/10 backdrop-blur-md rounded-2xl w-full max-w-sm border border-white/20 shadow-inner">
                <p className="text-xs text-indigo-200 uppercase font-bold mb-2 tracking-wider">Ví dụ</p>
                <p className="text-lg md:text-xl text-white font-medium leading-relaxed">
                  {card.example}
                </p>
              </div>
            )}

            <div className="absolute bottom-8 flex items-center gap-2 text-sm font-medium text-indigo-200 group-hover:text-white transition-colors">
              <RotateCw className="w-4 h-4" /> Nhấn để lật lại
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between gap-4 w-full">
        <button
          onClick={prev}
          disabled={idx === 0}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" /> <span className="hidden sm:inline">Trước</span>
        </button>

        {isLast ? (
          <button
            onClick={next}
            className="flex-[2] flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-[0_8px_20px_rgb(16,185,129,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Kiểm tra <Check className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={next}
            className="flex-[2] flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-[0_8px_20px_rgb(79,70,229,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Tiếp theo <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TEST PHASE — multiple choice quiz
// ============================================================
function TestPhase({ questions, passScore, onFinish }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const q = questions[idx];
  const isLast = idx === questions.length - 1;

  const submit = () => {
    if (selected == null) return;
    setAnswers({ ...answers, [q.id]: selected });
    setShowFeedback(true);
  };

  const next = () => {
    setShowFeedback(false);
    setSelected(null);
    if (isLast) {
      // Tính điểm
      const finalAnswers = { ...answers, [q.id]: selected };
      const correct = questions.filter(
        (qq) => finalAnswers[qq.id] === qq.answer,
      ).length;
      const score = Math.round((correct / questions.length) * 100);
      onFinish({ score, correct, total: questions.length });
    } else {
      setIdx(idx + 1);
    }
  };

  if (!q) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center text-gray-600">
        Không có câu hỏi để kiểm tra.
      </div>
    );
  }

  const isCorrect = selected === q.answer;

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8">
      <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
        <span>
          Câu {idx + 1} / {questions.length}
        </span>
        <span>Đạt {passScore}% để qua bài</span>
      </div>
      <div className="h-1 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all"
          style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 mb-4">
        <div className="text-xs text-gray-500 mb-2">Nghĩa của từ sau là?</div>
        <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
          {q.question}
        </div>
        {q.hint && (
          <div className="text-sm text-gray-500 italic">{q.hint}</div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {q.options.map((opt) => {
          const isThis = selected === opt;
          const isAnswer = opt === q.answer;
          let cls = 'bg-white border-gray-300 hover:bg-gray-50';
          if (showFeedback) {
            if (isAnswer) cls = 'bg-emerald-50 border-emerald-500';
            else if (isThis) cls = 'bg-rose-50 border-rose-500';
            else cls = 'bg-white border-gray-200 opacity-60';
          } else if (isThis) {
            cls = 'bg-indigo-50 border-indigo-500';
          }
          return (
            <button
              key={opt}
              disabled={showFeedback}
              onClick={() => setSelected(opt)}
              className={`w-full text-left px-4 py-3 border-2 rounded-xl font-medium text-gray-800 transition-colors ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {showFeedback ? (
        <button
          onClick={next}
          className={`w-full px-5 py-3 text-white font-semibold rounded-xl ${
            isCorrect
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-amber-600 hover:bg-amber-700'
          }`}
        >
          {isCorrect ? '✓ Đúng — ' : '✗ Sai — '}
          {isLast ? 'Xem kết quả' : 'Câu tiếp theo'}
        </button>
      ) : (
        <button
          onClick={submit}
          disabled={selected == null}
          className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Kiểm tra đáp án
        </button>
      )}
    </div>
  );
}

// ============================================================
// RESULT PHASE
// ============================================================
function ResultPhase({ result, lesson, onRetry }) {
  const navigate = useNavigate();
  const { passed, score, passScore, correct, total, nextLessonId } = result;

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8">
      <div
        className={`rounded-2xl shadow-md p-8 md:p-10 text-center text-white ${
          passed
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-700'
            : 'bg-gradient-to-br from-amber-500 to-rose-500'
        }`}
      >
        <div className="text-5xl mb-3">{passed ? '✓' : '↻'}</div>
        <h2 className="text-2xl font-bold mb-1">
          {passed ? 'Hoàn thành bài!' : 'Chưa đạt'}
        </h2>
        <p className="text-white/80 text-sm">
          {passed
            ? 'Bạn đã pass bài học này.'
            : `Cần ít nhất ${passScore}% để pass. Hãy ôn lại từ vựng và thử lại.`}
        </p>

        <div className="mt-6 inline-flex items-baseline gap-2">
          <span className="text-5xl md:text-6xl font-bold">{score}</span>
          <span className="text-xl font-semibold">%</span>
        </div>
        <p className="text-white/80 text-sm mt-1">
          {correct} / {total} câu đúng
        </p>
      </div>

      <div className="flex flex-col gap-2 mt-6">
        {passed && nextLessonId ? (
          <button
            onClick={() => navigate(`/learn/${nextLessonId}`)}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
          >
            Bài tiếp theo →
          </button>
        ) : passed ? (
          <Link
            to={`/courses/${lesson.course.slug}`}
            className="text-center px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
          >
            Quay lại lộ trình
          </Link>
        ) : (
          <button
            onClick={onRetry}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
          >
            Làm lại bài kiểm tra
          </button>
        )}
        <Link
          to={`/courses/${lesson.course.slug}`}
          className="text-center px-5 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
        >
          Về lộ trình
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function CourseLessonPage() {
  const { lessonId } = useParams();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState(PHASE.THEORY);
  const [result, setResult] = useState(null);

  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => coursesApi.getLesson(lessonId),
    retry: false,
  });

  // Deck dùng làm test pool — nếu có test, dùng deckId của test; nếu không, dùng vocab deck đầu tiên
  const studyDeckId = useMemo(() => {
    if (!lesson) return null;
    if (lesson.test?.deckId) return lesson.test.deckId;
    return lesson.decks[0]?.deckId ?? null;
  }, [lesson]);

  const { data: deckData } = useQuery({
    queryKey: ['deck', studyDeckId],
    queryFn: () => flashcardApi.getDeck(studyDeckId),
    enabled: !!studyDeckId,
  });

  const startMutation = useMutation({
    mutationFn: () => coursesApi.startLesson(lessonId),
  });

  const completeMutation = useMutation({
    mutationFn: (score) => coursesApi.completeLesson(lessonId, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['course'] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['current-lesson'] });
    },
  });

  // Khi user bấm "Tiếp theo: Học từ vựng" → mark started
  useEffect(() => {
    if (phase === PHASE.REVIEW && lesson?.progress?.status === 'NOT_STARTED') {
      startMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const questions = useMemo(() => {
    if (!deckData?.cards || !lesson?.test) return [];
    return buildQuestions(deckData.cards, lesson.test.questionCount);
  }, [deckData, lesson]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-gray-500">Đang tải bài học...</div>
    );
  }

  if (error) {
    const msg =
      error.response?.data?.message ||
      'Không tải được bài học. Bạn cần hoàn thành bài trước đó để mở khóa.';
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <div className="text-rose-600 font-semibold mb-2">⚠ {msg}</div>
        <Link
          to="/roadmap"
          className="inline-block mt-2 px-5 py-2 bg-indigo-600 text-white rounded-lg"
        >
          Về lộ trình
        </Link>
      </div>
    );
  }

  if (!lesson) return null;

  // PHASE: THEORY
  if (phase === PHASE.THEORY) {
    return (
      <TheoryPhase lesson={lesson} onContinue={() => setPhase(PHASE.REVIEW)} />
    );
  }

  // PHASE: REVIEW (vocab flashcard quick)
  if (phase === PHASE.REVIEW) {
    if (!deckData) {
      return (
        <div className="p-12 text-center text-gray-500">Đang tải từ vựng...</div>
      );
    }
    return (
      <ReviewPhase
        cards={deckData.cards || []}
        onContinue={() => setPhase(PHASE.TEST)}
      />
    );
  }

  // PHASE: TEST
  if (phase === PHASE.TEST) {
    if (!deckData) {
      return (
        <div className="p-12 text-center text-gray-500">Đang chuẩn bị bài kiểm tra...</div>
      );
    }
    if (questions.length === 0) {
      return (
        <div className="max-w-md mx-auto p-8 text-center text-gray-600">
          Bài này chưa có đủ thẻ để làm bài kiểm tra (cần ít nhất 2 thẻ).
          <Link
            to={`/courses/${lesson.course.slug}`}
            className="block mt-4 text-indigo-600 hover:underline"
          >
            Về lộ trình
          </Link>
        </div>
      );
    }
    return (
      <TestPhase
        questions={questions}
        passScore={lesson.test?.passScore ?? 70}
        onFinish={async ({ score, correct, total }) => {
          const apiResult = await completeMutation.mutateAsync(score);
          setResult({ ...apiResult, correct, total });
          setPhase(PHASE.RESULT);
        }}
      />
    );
  }

  // PHASE: RESULT
  return (
    <ResultPhase
      result={result}
      lesson={lesson}
      onRetry={() => {
        setResult(null);
        setPhase(PHASE.TEST);
      }}
    />
  );
}
