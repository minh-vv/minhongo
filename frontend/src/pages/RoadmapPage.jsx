import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../api/coursesApi';
import { useAuth } from '../hooks/useAuth';
import LoginPrompt from '../components/LoginPrompt';

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="block bg-white rounded-2xl border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">
            JLPT N{course.jlptLevel}
          </span>
          {course.isDefault && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded">
              Đề xuất
            </span>
          )}
          {course.enrolled && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">
              Đã đăng ký
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-1">{course.title}</h3>
        {course.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>{course._count?.lessons ?? 0} bài học</span>
          {course.targetDate && (
            <span>Mục tiêu: {formatDate(course.targetDate)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function MyCourseRow({ enroll }) {
  const percent =
    enroll.totalLessons > 0
      ? Math.round((enroll.passedLessons / enroll.totalLessons) * 100)
      : 0;

  return (
    <Link
      to={`/courses/${enroll.slug}`}
      className="block bg-white rounded-2xl border border-gray-200 hover:border-indigo-400 hover:shadow-sm transition-all p-5"
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded flex-shrink-0">
            N{enroll.jlptLevel}
          </span>
          <h3 className="text-base font-bold text-gray-900 truncate">
            {enroll.title}
          </h3>
        </div>
        <span className="text-sm font-bold text-indigo-700 flex-shrink-0">
          {enroll.passedLessons}/{enroll.totalLessons}
        </span>
      </div>

      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {(enroll.goal || enroll.targetDate) && (
        <div className="mt-2 text-xs text-gray-500 flex gap-3">
          {enroll.goal && <span>Mục tiêu: {enroll.goal}</span>}
          {enroll.targetDate && (
            <span>Hạn: {formatDate(enroll.targetDate)}</span>
          )}
        </div>
      )}
    </Link>
  );
}

export default function RoadmapPage() {
  const { isAuthenticated } = useAuth();

  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.listCourses,
    enabled: isAuthenticated,
  });

  const { data: myCourses, isLoading: loadingMine } = useQuery({
    queryKey: ['my-courses'],
    queryFn: coursesApi.myCourses,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <LoginPrompt
        title="Đăng nhập để xem lộ trình"
        description="Đăng ký miễn phí để theo dõi tiến độ học của bạn."
        ghostChar="道"
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Lộ trình học
        </h1>
        <p className="text-gray-600 mt-1">
          Chọn một lộ trình theo cấp độ JLPT để bắt đầu, hoặc tiếp tục lộ trình đang học.
        </p>
      </div>

      {/* Lộ trình của tôi */}
      {myCourses && myCourses.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Đang học
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {myCourses.map((c) => (
              <MyCourseRow key={c.courseId} enroll={c} />
            ))}
          </div>
        </section>
      )}

      {/* Tất cả lộ trình */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Tất cả lộ trình
        </h2>
        {loadingCourses ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : !courses || courses.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-2xl">
            Chưa có lộ trình nào.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </section>

      {(loadingMine || loadingCourses) && (
        <div className="text-center text-xs text-gray-400">Đang đồng bộ tiến độ...</div>
      )}
    </div>
  );
}
