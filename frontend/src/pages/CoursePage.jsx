import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../api/coursesApi';

const STATUS_LABEL = {
  NOT_STARTED: { label: 'Chưa học', color: 'bg-surface-container border border-outline-variant/30 text-on-surface-variant' },
  IN_PROGRESS: { label: 'Đang học', color: 'bg-amber-500/10 border border-amber-500/30 text-amber-800' },
  PASSED: { label: 'Đã pass', color: 'bg-green-500/10 border border-green-500/30 text-green-700' },
};

const SKILL_LABELS = {
  VOCABULARY: { label: 'Từ vựng', color: 'bg-primary/8 text-primary border border-primary/20' },
  KANJI: { label: 'Hán tự', color: 'bg-secondary/8 text-secondary border border-secondary/20' },
  GRAMMAR: { label: 'Ngữ pháp', color: 'bg-tertiary/8 text-tertiary border border-tertiary/20' },
  READING: { label: 'Đọc hiểu', color: 'bg-blue-500/10 border border-blue-500/30 text-blue-700' },
  LISTENING: { label: 'Nghe hiểu', color: 'bg-teal-500/10 border border-teal-500/30 text-teal-700' },
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
      className={`flex items-center gap-4 p-4 border transition-all ${
        locked
          ? 'bg-surface-container-low border-outline-variant/30 opacity-60'
          : 'bg-surface-container-lowest border-outline-variant/40 hover:border-primary/40 sharp-shadow-sm hover:sharp-shadow'
      }`}
    >
      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-primary/8 text-primary font-black border border-primary/20">
        {lesson.order}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-headline font-bold text-on-surface truncate">
          {lesson.title}
        </div>
        {lesson.skills && lesson.skills.length > 0 && (
          <div className="flex gap-1.5 mt-1">
            {lesson.skills.map((skill) => {
              const s = SKILL_LABELS[skill];
              if (!s) return null;
              return (
                <span key={skill} className={`px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.color}`}>
                  {s.label}
                </span>
              );
            })}
          </div>
        )}
        {lesson.summary && (
          <div className="text-sm text-on-surface-variant truncate mt-1">{lesson.summary}</div>
        )}
        <div className="flex gap-2 mt-1 text-xs text-on-surface-variant">
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
        <span className={`px-2 py-0.5 text-xs font-bold ${status.color}`}>
          {status.label}
        </span>
        {lesson.score != null && (
          <span className="text-xs text-on-surface-variant">{lesson.score}%</span>
        )}
      </div>
      {locked ? (
        <div className="px-4 py-2 bg-surface-container text-on-surface-variant text-sm font-bold border border-outline-variant/30 flex-shrink-0">
          🔒 Khoá
        </div>
      ) : (
        <Link
          to={`/learn/${lesson.id}`}
          className="px-4 py-2 bg-primary text-on-primary hover:opacity-90 text-sm font-bold uppercase tracking-wider transition-all flex-shrink-0"
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
      className="bg-primary/5 border border-primary/20 p-6 mb-6 text-left"
    >
      <h2 className="font-headline font-bold text-primary mb-1">Đăng ký lộ trình này</h2>
      <p className="text-sm text-on-surface-variant mb-4">
        Đặt mục tiêu để hệ thống nhắc bạn học đúng tốc độ.
      </p>
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Mục tiêu (tuỳ chọn)
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="VD: Thi N5 cuối năm"
            className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/60 text-on-surface focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Ngày dự kiến hoàn thành (tuỳ chọn)
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/60 text-on-surface focus:outline-none text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="px-5 py-2.5 bg-primary text-on-primary font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-60 transition-all text-xs cursor-pointer"
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
    return <div className="p-12 text-center text-on-surface-variant">Đang tải lộ trình...</div>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-8 text-center text-secondary font-bold">
        Không tải được lộ trình.
        <Link to="/roadmap" className="block mt-3 text-primary hover:underline">
          ← Về danh sách lộ trình
        </Link>
      </div>
    );
  }

  const passed = course.lessons.filter((l) => l.status === 'PASSED').length;
  const total = course.lessons.length;
  const percent = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 text-left">
      <Link
        to="/roadmap"
        className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary mb-5 font-medium transition-colors"
      >
        ← Lộ trình
      </Link>

      <div className="mt-3 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-primary/8 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
            JLPT N{course.jlptLevel}
          </span>
          {course.textbookRef && (
            <span className="text-xs text-on-surface-variant">{course.textbookRef}</span>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface leading-tight">
          {course.title}
        </h1>
        {course.description && (
          <p className="text-on-surface-variant mt-1.5 max-w-2xl text-sm leading-relaxed">{course.description}</p>
        )}
        {course.enrolled && (course.goal || course.targetDate) && (
          <div className="mt-3 text-xs text-on-surface-variant space-y-1">
            {course.goal && <div>Mục tiêu: <strong>{course.goal}</strong></div>}
            {course.targetDate && (
              <div>Ngày hoàn thành dự kiến: <strong>{formatDate(course.targetDate)}</strong></div>
            )}
          </div>
        )}
      </div>

      {/* Lesson Progress Bar Container */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 sharp-shadow-sm p-5 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-on-surface font-headline">Tiến độ học</span>
          <span className="text-sm font-bold text-on-surface-variant">{passed}/{total} bài</span>
        </div>
        <div className="h-3 bg-surface-container overflow-hidden border border-outline-variant/20 rounded-full">
          <div
            className="h-full bg-secondary transition-all duration-500 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-end mt-1.5">
          <span className="text-xs font-bold text-on-surface-variant">{percent}% hoàn thành</span>
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
