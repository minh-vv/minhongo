import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const features = [
  {
    icon: <span className="text-2xl font-black text-indigo-700" style={{ fontFamily: 'serif' }}>漢</span>,
    bg: 'bg-indigo-50',
    title: 'Hán tự theo JLPT',
    desc: 'Học kanji từ N5 đến N1 với ví dụ câu và bài tập thực tế.',
    path: '/hantu',
    color: 'indigo',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h7" />
      </svg>
    ),
    bg: 'bg-blue-50',
    title: 'Từ vựng có chủ đề',
    desc: 'Từ vựng nhóm theo chủ đề, kèm phiên âm romaji và câu ví dụ.',
    path: '/tuvung',
    color: 'blue',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    bg: 'bg-sky-50',
    title: 'Ngữ pháp dễ hiểu',
    desc: 'Giải thích ngữ pháp bằng tiếng Việt, kèm công thức và ví dụ.',
    path: '/nguphap',
    color: 'sky',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    bg: 'bg-violet-50',
    title: 'Lộ trình AI',
    badge: 'AI',
    desc: 'AI phân tích trình độ và tạo lộ trình học tối ưu riêng cho bạn.',
    path: '/lotrinh',
    color: 'violet',
    requireAuth: true,
  },
  {
    icon: (
      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    bg: 'bg-purple-50',
    title: 'Tự học & Flashcard',
    desc: 'Tạo bộ thẻ riêng, import Anki, ôn tập bằng thuật toán SRS.',
    path: '/tuhoc',
    color: 'purple',
    requireAuth: true,
  },
];

const steps = [
  { num: '01', title: 'Chọn cấp độ', desc: 'Từ N5 cho người mới bắt đầu đến N1 cho trình độ cao.' },
  { num: '02', title: 'Học mỗi ngày', desc: 'Kanji, từ vựng, ngữ pháp — hệ thống và có định hướng.' },
  { num: '03', title: 'Ôn tập SRS', desc: 'Thuật toán nhắc ôn đúng lúc, giúp nhớ bền vững lâu dài.' },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="bg-white">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gradient-to-b from-indigo-50/70 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            Nền tảng học tiếng Nhật cho người Việt
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
            Học tiếng Nhật{' '}
            <span className="text-indigo-600">đúng hướng</span>,<br />
            nhớ lâu hơn mỗi ngày
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
            Hán tự, từ vựng và ngữ pháp có hệ thống. Lộ trình AI cá nhân hóa.
            Thuật toán SRS giúp bạn không bao giờ quên những gì đã học.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <Link
              to="/register"
              className="px-7 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 text-sm"
            >
              Học miễn phí ngay
            </Link>
            <Link
              to="/hantu"
              className="px-7 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-sm"
            >
              Xem nội dung học thử
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-5 text-sm text-gray-500">
            {['Miễn phí hoàn toàn', 'Không cần cài đặt', 'Tiếng Việt 100%'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
              5 tính năng trong một nền tảng
            </h2>
            <p className="text-gray-500 text-sm">
              Chọn một tab bất kỳ ở trên để bắt đầu — 3 tab đầu hoàn toàn miễn phí, không cần đăng nhập.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <Link
                key={f.path}
                to={f.path}
                className="group relative bg-white rounded-2xl border-2 border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all p-5"
              >
                {f.requireAuth && (
                  <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Cần đăng nhập
                  </span>
                )}
                <div className={`w-11 h-11 ${f.bg} rounded-xl flex items-center justify-center mb-3`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5 text-sm">
                  {f.title}
                  {f.badge && (
                    <span className="px-1.5 py-0.5 bg-amber-400 text-amber-900 text-[9px] font-black rounded-full">AI</span>
                  )}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-16 px-6 bg-gray-50/60">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-10">Bắt đầu trong 3 bước đơn giản</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i}>
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-lg font-bold mx-auto mb-3 shadow-md shadow-indigo-200">
                  {s.num}
                </div>
                <h3 className="font-bold text-gray-900 mb-1 text-sm">{s.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-10 text-white text-center shadow-xl shadow-indigo-200">
            <div className="text-4xl font-black mb-3 select-none" style={{ fontFamily: 'serif' }}>
              日本語
            </div>
            <h2 className="text-2xl font-extrabold mb-2">Sẵn sàng bắt đầu chưa?</h2>
            <p className="text-indigo-200 text-sm mb-6">
              Tạo tài khoản miễn phí và bắt đầu ngay hôm nay.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="px-6 py-2.5 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm"
              >
                Đăng ký miễn phí
              </Link>
              <Link
                to="/hantu"
                className="px-6 py-2.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 border border-white/20 transition-all text-sm"
              >
                Xem nội dung thử
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
