import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../api/coursesApi';

const STATUS_LABEL = {
  NOT_STARTED: 'Chưa học',
  IN_PROGRESS: 'Đang học',
  PASSED: 'Đã pass',
};

function NoEnrollCard() {
  return (
    <div
      className="bg-surface-container-lowest p-6 md:p-8 transition-all hover:sharp-shadow-sm text-left"
      style={{ border: '1px solid rgba(0,0,0,0.07)' }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-base font-headline font-bold text-on-surface mb-1.5">
            Bắt đầu lộ trình học của bạn
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Chọn một lộ trình theo cấp độ JLPT để biết hôm nay học gì, học bao
            nhiêu — và theo dõi tiến độ đến mục tiêu của bạn.
          </p>
        </div>
        <Link
          to="/roadmap"
          className="flex-shrink-0 px-5 py-2.5 text-on-secondary font-bold text-xs uppercase tracking-wider text-center transition-colors"
          style={{ background: 'var(--secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--secondary-dim)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--secondary)')}
        >
          Xem lộ trình →
        </Link>
      </div>
    </div>
  );
}

function FinishedCard({ courseTitle, courseSlug }) {
  return (
    <div
      className="bg-surface-container-lowest p-6 transition-all hover:sharp-shadow-sm text-left"
      style={{ border: '1px solid rgba(0,0,0,0.07)' }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-headline font-bold text-on-surface">
              Hoàn thành lộ trình!
            </h3>
            <span
              className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#047857' }}
            >
              Đã hoàn thành
            </span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Bạn đã pass toàn bộ bài của <strong className="text-on-surface">{courseTitle}</strong>.
          </p>
        </div>
        <Link
          to={`/courses/${courseSlug}`}
          className="flex-shrink-0 px-5 py-2.5 text-on-secondary font-bold text-xs uppercase tracking-wider text-center transition-colors"
          style={{ background: 'var(--secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--secondary-dim)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--secondary)')}
        >
          Xem lại lộ trình
        </Link>
      </div>
    </div>
  );
}

export default function TodaysLessonCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['current-lesson'],
    queryFn: coursesApi.getCurrentLesson,
  });

  if (isLoading) {
    return (
      <div
        className="bg-surface-container-lowest p-6 animate-pulse"
        style={{ border: '1px solid rgba(0,0,0,0.07)' }}
      >
        <div className="h-4 bg-surface-container-high w-1/3 mb-3" />
        <div className="h-8 bg-surface-container-low w-full mb-3" />
        <div className="h-10 bg-surface-container w-1/2" />
      </div>
    );
  }

  if (!data) {
    return <NoEnrollCard />;
  }

  if (data.finished) {
    return (
      <FinishedCard
        courseTitle={data.courseTitle}
        courseSlug={data.courseSlug}
      />
    );
  }

  const { lesson, courseTitle, courseSlug, pace } = data;

  const isReviewDay = !lesson.id;

  return (
    <div
      className="bg-surface-container-lowest transition-all hover:sharp-shadow"
      style={{ border: '1px solid rgba(0,0,0,0.07)' }}
    >
      {/* Header */}
      <div
        className="text-white px-6 py-3 flex items-center justify-between"
        style={{ background: 'var(--primary)' }}
      >
        <span className="text-xs font-bold uppercase tracking-wider text-on-primary">
          Bài học hôm nay
        </span>
        <Link
          to={lesson?.customRoadmapId ? `/custom-roadmap/${lesson.customRoadmapId}` : `/courses/${courseSlug}`}
          className="text-xs font-headline font-bold text-on-primary/80 hover:text-on-primary transition-colors underline"
        >
          {courseTitle}
        </Link>
      </div>

      {/* Body */}
      <div className="p-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 font-headline font-bold text-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(26, 35, 126, 0.08)', color: 'var(--primary)' }}
            >
              {lesson.order}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-base font-headline font-bold text-on-surface truncate leading-snug">
                  {lesson.title}
                </h3>
                <span
                  className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                  style={
                    lesson.status === 'NOT_STARTED'
                      ? { background: 'rgba(245, 158, 11, 0.08)', color: '#b45309' }
                      : lesson.status === 'IN_PROGRESS'
                      ? { background: 'rgba(59, 130, 246, 0.08)', color: '#1d4ed8' }
                      : { background: 'rgba(16, 185, 129, 0.08)', color: '#047857' }
                  }
                >
                  {STATUS_LABEL[lesson.status] || STATUS_LABEL.NOT_STARTED}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">~{lesson.estimatedMin} phút</p>
            </div>
          </div>

          <Link
            to={lesson?.id ? `/learn/${lesson.id}` : `/custom-roadmap/${lesson?.customRoadmapId}`}
            className="px-5 py-2.5 text-on-secondary font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--secondary-dim)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--secondary)')}
          >
            {isReviewDay ? "Xem chi tiết →" : "Học ngay →"}
          </Link>
        </div>

        {/* Pace details (if standard course) */}
        {pace && (
          <div className="mt-5 grid grid-cols-3 gap-3 pt-5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <div
              className="bg-surface-container-low p-3 text-center"
              style={{ border: '1px solid rgba(0,0,0,0.05)' }}
            >
              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Còn lại
              </div>
              <div className="text-base font-black text-on-surface leading-none">
                {pace.remainingLessons} bài
              </div>
            </div>
            <div
              className="bg-surface-container-low p-3 text-center"
              style={{ border: '1px solid rgba(0,0,0,0.05)' }}
            >
              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Còn
              </div>
              <div className="text-base font-black text-on-surface leading-none">
                {pace.daysLeft} ngày
              </div>
            </div>
            <div
              className="bg-surface-container-low p-3 text-center"
              style={{ border: '1px solid rgba(0,0,0,0.05)' }}
            >
              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Cần học
              </div>
              <div
                className={`text-base font-black leading-none ${
                  pace.overdue ? 'text-secondary' : 'text-on-surface'
                }`}
              >
                {pace.lessonsPerWeek}/tuần
              </div>
            </div>
          </div>
        )}

        {pace?.overdue && (
          <p className="mt-3 text-xs font-semibold text-secondary text-center">
            Đã quá hạn mục tiêu. Hãy điều chỉnh deadline ở trang lộ trình.
          </p>
        )}
      </div>
    </div>
  );
}
