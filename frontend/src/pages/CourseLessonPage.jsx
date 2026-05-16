import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { coursesApi } from '../api/coursesApi';
import { flashcardApi } from '../api/flashcardApi';

const PHASE = {
  THEORY: 'theory',
  REVIEW: 'review',
  TEST: 'test',
  RESULT: 'result',
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

  if (!card) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-gray-600">Bài này chưa có từ vựng để ôn.</p>
        <button
          onClick={onContinue}
          className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg"
        >
          Sang phần kiểm tra →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8">
      <div className="mb-4 text-center text-sm text-gray-500">
        Từ {idx + 1} / {cards.length}
      </div>
      <div className="h-1 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-indigo-500 transition-all"
          style={{ width: `${((idx + 1) / cards.length) * 100}%` }}
        />
      </div>

      <div
        onClick={() => setFlipped(!flipped)}
        className="cursor-pointer bg-white rounded-2xl shadow-md p-8 md:p-12 mb-4 min-h-[260px] flex flex-col items-center justify-center text-center select-none hover:shadow-lg transition-shadow"
      >
        {!flipped ? (
          <>
            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              {card.front}
            </div>
            {card.romaji && (
              <div className="text-base text-gray-500 italic">{card.romaji}</div>
            )}
            <div className="mt-6 text-xs text-gray-400">Bấm để xem nghĩa</div>
          </>
        ) : (
          <>
            <div className="text-2xl md:text-3xl font-semibold text-indigo-700 mb-3">
              {card.back}
            </div>
            {card.example && (
              <div className="text-sm text-gray-600 mt-3 italic">
                {card.example}
              </div>
            )}
            <div className="mt-6 text-xs text-gray-400">Bấm để lật lại</div>
          </>
        )}
      </div>

      <div className="flex justify-between gap-3">
        <button
          onClick={() => {
            if (idx > 0) {
              setIdx(idx - 1);
              setFlipped(false);
            }
          }}
          disabled={idx === 0}
          className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Trước
        </button>
        <button
          onClick={next}
          className="flex-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
        >
          {isLast ? 'Làm bài kiểm tra →' : 'Tiếp theo →'}
        </button>
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
