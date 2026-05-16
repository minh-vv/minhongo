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
    <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Bắt đầu lộ trình học của bạn
          </h3>
          <p className="text-sm text-gray-600">
            Chọn một lộ trình theo cấp độ JLPT để biết hôm nay học gì, học bao
            nhiêu — và theo dõi tiến độ đến mục tiêu của bạn.
          </p>
        </div>
        <Link
          to="/roadmap"
          className="flex-shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm"
        >
          Xem lộ trình →
        </Link>
      </div>
    </div>
  );
}

function FinishedCard({ courseTitle, courseSlug }) {
  return (
    <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
      <h3 className="text-lg font-bold text-emerald-900 mb-1">
        Hoàn thành lộ trình!
      </h3>
      <p className="text-sm text-emerald-800/80 mb-3">
        Bạn đã pass toàn bộ bài của <strong>{courseTitle}</strong>.
      </p>
      <Link
        to={`/courses/${courseSlug}`}
        className="inline-block px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700"
      >
        Xem lại lộ trình
      </Link>
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
      <div className="bg-gray-50 rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
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

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">
          Bài học hôm nay
        </span>
        <Link
          to={`/courses/${courseSlug}`}
          className="text-xs underline opacity-80 hover:opacity-100"
        >
          {courseTitle}
        </Link>
      </div>

      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xl flex items-center justify-center flex-shrink-0">
            {lesson.order}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900 truncate">
                {lesson.title}
              </h3>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded flex-shrink-0">
                {STATUS_LABEL[lesson.status]}
              </span>
            </div>
            <p className="text-sm text-gray-500">~{lesson.estimatedMin} phút</p>
          </div>
        </div>

        {pace && (
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-gray-500">Còn lại</div>
              <div className="text-lg font-bold text-gray-900">
                {pace.remainingLessons} bài
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Còn</div>
              <div className="text-lg font-bold text-gray-900">
                {pace.daysLeft} ngày
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Cần học</div>
              <div
                className={`text-lg font-bold ${
                  pace.overdue ? 'text-rose-600' : 'text-gray-900'
                }`}
              >
                {pace.lessonsPerWeek}/tuần
              </div>
            </div>
          </div>
        )}

        {pace?.overdue && (
          <p className="mt-3 text-xs text-rose-600 text-center">
            Đã quá hạn mục tiêu. Hãy điều chỉnh deadline ở trang lộ trình.
          </p>
        )}

        <Link
          to={`/learn/${lesson.id}`}
          className="block mt-5 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-center"
        >
          Vào học bài này →
        </Link>
      </div>
    </div>
  );
}
