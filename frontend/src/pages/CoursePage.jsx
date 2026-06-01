import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../api/coursesApi';

const STATUS_LABEL = {
  NOT_STARTED: { label: 'Chưa học', color: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS: { label: 'Đang học', color: 'bg-amber-100 text-amber-700' },
  PASSED: { label: 'Đã pass', color: 'bg-emerald-100 text-emerald-700' },
};

const SKILL_LABELS = {
  VOCABULARY: { label: 'Từ vựng', color: 'bg-blue-100 text-blue-700' },
  KANJI: { label: 'Hán tự', color: 'bg-red-100 text-red-700' },
  GRAMMAR: { label: 'Ngữ pháp', color: 'bg-purple-100 text-purple-700' },
  READING: { label: 'Đọc hiểu', color: 'bg-orange-100 text-orange-700' },
  LISTENING: { label: 'Nghe hiểu', color: 'bg-teal-100 text-teal-700' },
};

function formatDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return dt.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function LessonRow({ lesson }) {
  const status = STATUS_LABEL[lesson.status] ?? STATUS_LABEL.NOT_STARTED;
  const locked = lesson.locked;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
        locked
          ? 'bg-gray-50 border-gray-200 opacity-60'
          : 'bg-white border-gray-200 hover:border-indigo-400 hover:shadow-sm'
      }`}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-50 text-indigo-700 font-bold">
        {lesson.order}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 truncate">
          {lesson.title}
        </div>
        {lesson.skills && lesson.skills.length > 0 && (
          <div className="flex gap-1.5 mt-1">
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
        {lesson.summary && (
          <div className="text-sm text-gray-500 truncate mt-1">{lesson.summary}</div>
        )}
        <div className="flex gap-2 mt-1 text-xs text-gray-400">
          <span>~{lesson.estimatedMin} phút</span>
          <span>·</span>
          <span>{lesson.cardCount} thẻ</span>
          {lesson.hasTest && (
            <>
              <span>·</span>
              <span>Có bài kiểm tra</span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${status.color}`}>
          {status.label}
        </span>
        {lesson.score != null && (
          <span className="text-xs text-gray-500">{lesson.score}%</span>
        )}
      </div>
      {locked ? (
        <div className="px-4 py-2 bg-gray-200 text-gray-500 text-sm font-semibold rounded-lg flex-shrink-0">
          🔒 Khoá
        </div>
      ) : (
        <Link
          to={`/learn/${lesson.id}`}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg flex-shrink-0"
        >
          {lesson.status === 'PASSED' ? 'Ôn lại' : 'Vào học'}
        </Link>
      )}
    </div>
  );
}

function EnrollForm({ slug, onDone }) {
  const queryClient = useQueryClient();
  const [targetDate, setTargetDate] = useState('');
  const [goal, setGoal] = useState('');

  const mutation = useMutation({
    mutationFn: () => coursesApi.enroll(slug, { targetDate, goal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', slug] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      onDone?.();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 mb-6"
    >
      <h2 className="font-bold text-indigo-900 mb-1">Đăng ký lộ trình này</h2>
      <p className="text-sm text-indigo-700/80 mb-4">
        Đặt mục tiêu để hệ thống nhắc bạn học đúng tốc độ.
      </p>
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Mục tiêu (tuỳ chọn)
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="VD: Thi N5 cuối năm"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Ngày dự kiến hoàn thành (tuỳ chọn)
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg disabled:opacity-60"
      >
        {mutation.isPending ? 'Đang đăng ký...' : 'Đăng ký lộ trình'}
      </button>
    </form>
  );
}

export default function CoursePage() {
  const { slug } = useParams();

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => coursesApi.getCourse(slug),
  });

  if (isLoading) {
    return <div className="p-12 text-center text-gray-500">Đang tải lộ trình...</div>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-8 text-center text-rose-600">
        Không tải được lộ trình.
        <Link to="/roadmap" className="block mt-3 text-indigo-600 hover:underline">
          ← Về danh sách lộ trình
        </Link>
      </div>
    );
  }

  const passed = course.lessons.filter((l) => l.status === 'PASSED').length;
  const total = course.lessons.length;
  const percent = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <Link
        to="/roadmap"
        className="text-sm text-indigo-600 hover:underline"
      >
        ← Lộ trình
      </Link>

      <div className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">
              JLPT N{course.jlptLevel}
            </span>
            {course.textbookRef && (
              <span className="text-xs text-gray-500">{course.textbookRef}</span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-gray-600 mt-1 max-w-2xl">{course.description}</p>
          )}
          {course.enrolled && (course.goal || course.targetDate) && (
            <div className="mt-3 text-sm text-gray-600">
              {course.goal && <div>Mục tiêu: <strong>{course.goal}</strong></div>}
              {course.targetDate && (
                <div>Ngày hoàn thành dự kiến: <strong>{formatDate(course.targetDate)}</strong></div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 min-w-[180px]">
          <div className="text-xs text-gray-500 mb-1">Tiến độ</div>
          <div className="text-2xl font-bold text-indigo-700">
            {passed}/{total}
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-indigo-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {!course.enrolled && <EnrollForm slug={slug} />}

      <div className="space-y-3">
        {course.lessons.map((lesson) => (
          <LessonRow key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  );
}
