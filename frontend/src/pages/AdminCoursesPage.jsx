import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { adminApi } from '../api/adminApi';
import { flashcardApi } from '../api/flashcardApi';
import PageHeader from '../components/PageHeader';

const ROLE_OPTIONS = [
  { value: 'VOCAB', label: 'Từ vựng' },
  { value: 'KANJI', label: 'Hán tự' },
  { value: 'GRAMMAR', label: 'Ngữ pháp' },
];

/** Picker chọn 1 deck từ public + admin's decks */
function DeckPicker({ value, onChange }) {
  const { data: decks } = useQuery({
    queryKey: ['public-decks-for-admin'],
    queryFn: flashcardApi.getPublicDecks,
  });

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white w-full"
    >
      <option value="">— Chọn deck —</option>
      {(decks ?? []).map((d) => (
        <option key={d.id} value={d.id}>
          {d.name} ({d.category}, {d._count?.cards ?? 0} thẻ)
        </option>
      ))}
    </select>
  );
}

function LessonCard({ lesson, slug }) {
  const queryClient = useQueryClient();
  const [newDeckId, setNewDeckId] = useState('');
  const [newRole, setNewRole] = useState('VOCAB');

  const [testDeckId, setTestDeckId] = useState(lesson.test?.deckId || '');
  const [passScore, setPassScore] = useState(lesson.test?.passScore ?? 70);
  const [questionCount, setQuestionCount] = useState(
    lesson.test?.questionCount ?? 10,
  );

  const attachMutation = useMutation({
    mutationFn: (payload) => adminApi.attachDeckToLesson(lesson.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-course', slug] });
      setNewDeckId('');
    },
  });

  const detachMutation = useMutation({
    mutationFn: (deckId) => adminApi.detachDeckFromLesson(lesson.id, deckId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-course', slug] }),
  });

  const setTestMutation = useMutation({
    mutationFn: () =>
      adminApi.setLessonTest(lesson.id, {
        deckId: testDeckId,
        passScore: Number(passScore),
        questionCount: Number(questionCount),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-course', slug] }),
  });

  const removeTestMutation = useMutation({
    mutationFn: () => adminApi.removeLessonTest(lesson.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-course', slug] });
      setTestDeckId('');
    },
  });

  return (
    <div className="border border-gray-200 rounded-xl bg-white p-4 mb-3">
      <div className="font-semibold text-gray-900 mb-3">
        Bài {lesson.order} — {lesson.title}
      </div>

      {/* Linked decks */}
      <div className="mb-3">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Deck học gắn vào bài
        </div>
        {lesson.decks.length === 0 ? (
          <div className="text-xs text-gray-400 italic mb-2">
            Chưa gắn deck nào.
          </div>
        ) : (
          <ul className="space-y-1 mb-2">
            {lesson.decks.map((ld) => (
              <li
                key={ld.deckId}
                className="flex items-center justify-between gap-2 text-sm py-1 px-2 bg-gray-50 rounded"
              >
                <span className="truncate">
                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded mr-2">
                    {ld.role}
                  </span>
                  {ld.deck.name} · {ld.deck._count?.cards ?? 0} thẻ
                </span>
                <button
                  onClick={() => detachMutation.mutate(ld.deckId)}
                  className="text-xs text-rose-600 hover:underline flex-shrink-0"
                >
                  Gỡ
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <DeckPicker value={newDeckId} onChange={setNewDeckId} />
          </div>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded text-sm"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            disabled={!newDeckId || attachMutation.isPending}
            onClick={() =>
              attachMutation.mutate({ deckId: newDeckId, role: newRole })
            }
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded disabled:opacity-50"
          >
            Gắn
          </button>
        </div>
      </div>

      {/* Test */}
      <div className="pt-3 border-t border-gray-100">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Bài kiểm tra
        </div>
        {lesson.test ? (
          <div className="text-sm text-gray-700 mb-2">
            Hiện tại: <strong>{lesson.test.deck.name}</strong> · pass{' '}
            {lesson.test.passScore}% · {lesson.test.questionCount} câu
            <button
              onClick={() => removeTestMutation.mutate()}
              className="ml-3 text-xs text-rose-600 hover:underline"
            >
              Xóa
            </button>
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic mb-2">
            Chưa có bài kiểm tra.
          </div>
        )}

        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <DeckPicker value={testDeckId} onChange={setTestDeckId} />
          </div>
          <input
            type="number"
            min="0"
            max="100"
            value={passScore}
            onChange={(e) => setPassScore(e.target.value)}
            className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm"
            placeholder="Pass %"
            title="Điểm pass (%)"
          />
          <input
            type="number"
            min="1"
            value={questionCount}
            onChange={(e) => setQuestionCount(e.target.value)}
            className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm"
            placeholder="Số câu"
            title="Số câu hỏi"
          />
          <button
            disabled={!testDeckId || setTestMutation.isPending}
            onClick={() => setTestMutation.mutate()}
            className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-semibold rounded disabled:opacity-50"
          >
            {lesson.test ? 'Cập nhật' : 'Đặt'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CourseDetail({ slug }) {
  const { data: course, isLoading } = useQuery({
    queryKey: ['admin-course', slug],
    queryFn: () => adminApi.getCourse(slug),
  });

  if (isLoading) return <div className="text-gray-500">Đang tải...</div>;
  if (!course) return null;

  return (
    <div>
      <div className="mb-4 pb-3 border-b border-gray-200">
        <div className="text-xs text-gray-500">JLPT N{course.jlptLevel}</div>
        <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
        {course.description && (
          <p className="text-sm text-gray-600 mt-1">{course.description}</p>
        )}
      </div>

      {course.lessons.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} slug={slug} />
      ))}
    </div>
  );
}

export default function AdminCoursesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeSlug, setActiveSlug] = useState(null);

  const { data: courses } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: adminApi.listCourses,
    enabled: !!user?.isAdmin,
  });

  if (isLoading) return <div className="p-8 text-center">Đang tải...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />;

  const selectedSlug = activeSlug || courses?.[0]?.slug;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      <div className="mb-8">
        <PageHeader
          tag="Admin · Lộ trình"
          title="Quản lý lộ trình & bài học"
          subtitle="Gắn bộ thẻ bài học và cấu hình bài kiểm tra."
          ghostChar="路"
          backLink="/admin/content"
          backText="Quản lý nội dung"
        />
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar: course list */}
        <aside className="space-y-1">
          {(courses ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveSlug(c.slug)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                selectedSlug === c.slug
                  ? 'bg-indigo-100 text-indigo-900 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-xs font-bold rounded">
                  N{c.jlptLevel}
                </span>
                <span className="truncate">{c.title}</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {c._count?.lessons ?? 0} bài
              </div>
            </button>
          ))}
        </aside>

        {/* Main panel */}
        <main>
          {selectedSlug ? (
            <CourseDetail slug={selectedSlug} />
          ) : (
            <div className="text-center p-12 text-gray-500">
              Chọn một lộ trình ở thanh bên để chỉnh sửa.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
