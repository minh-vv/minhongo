import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  IconBook,
  IconList,
  IconGlobe,
  IconLayers,
  IconArrowRight,
  IconSparkles,
  IconStar,
  IconCheckCircle,
  IconHeadphones,
} from '../components/Icons';

export default function HomePage() {
  const { isAuthenticated, openLogin, openRegister } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to /dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const guestFeatures = [
    {
      path: '/kanji',
      label: 'Hán tự (Kanji)',
      desc: 'Học kanji từ N5 đến N1 có câu ví dụ, âm Hán Việt và bài tập kiểm tra.',
      accent: 'var(--primary)',
      ghostChar: '漢',
      icon: <IconBook className="w-5 h-5" />,
    },
    {
      path: '/vocabulary',
      label: 'Từ vựng chủ đề',
      desc: 'Kho từ vựng khổng lồ chia theo các chủ đề hữu ích và cấp độ JLPT.',
      accent: '#1565c0',
      ghostChar: '語',
      icon: <IconList className="w-5 h-5" />,
    },
    {
      path: '/grammar',
      label: 'Ngữ pháp chi tiết',
      desc: 'Giải thích ngữ pháp rõ ràng bằng tiếng Việt, đi kèm các câu ví dụ cụ thể.',
      accent: '#006064',
      ghostChar: '文',
      icon: <IconBook className="w-5 h-5" />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto w-full p-6 md:p-8 space-y-10 md:space-y-12">
      {/* ── HERO BANNER ── */}
      <section className="relative overflow-hidden animate-fade-up border border-outline-variant/30 sharp-shadow rounded-2xl bg-surface-container-lowest">
        {/* Decorative elements */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 60%, #0c144e 100%)',
          }}
        />
        <div className="absolute inset-0 asanoha-bg opacity-[0.15] pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-1.5" style={{ background: 'var(--secondary)' }} />

        {/* Hero Content */}
        <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center min-h-[260px] md:min-h-[300px] text-white">
          <div
            className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 w-fit mb-5"
            style={{ backdropFilter: 'blur(4px)' }}
          >
            <span className="w-1.5 h-1.5 rotate-45 flex-shrink-0" style={{ background: 'var(--secondary)' }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
              Cổng học tập Minhongo
            </span>
          </div>

          <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            Học tiếng Nhật đúng hướng,<br />
            ghi nhớ hiệu quả mỗi ngày
          </h1>

          <p className="text-white/70 text-sm max-w-xl leading-relaxed mb-8">
            Hệ thống ôn luyện Hán tự, từ vựng và ngữ pháp tiếng Nhật một cách khoa học.
            Hoàn toàn miễn phí cho các bài học cơ bản, không yêu cầu đăng ký ban đầu.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={openRegister}
              className="px-6 py-2.5 bg-secondary hover:bg-secondary-dim text-white text-xs font-bold uppercase tracking-wider rounded transition cursor-pointer flex items-center gap-1.5"
            >
              Bắt đầu miễn phí
              <IconArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={openLogin}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded border border-white/20 transition cursor-pointer"
            >
              Đã có tài khoản
            </button>
          </div>
        </div>

        {/* Large decorative Kanji watermark */}
        <div
          className="absolute -right-6 -bottom-8 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none"
          style={{ fontSize: '220px' }}
        >
          日
        </div>
      </section>

      {/* ── QUICK START (PUBLIC FEATURES) ── */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 flex-shrink-0" style={{ background: 'var(--secondary)' }} />
          <h2 className="text-lg font-headline font-bold text-on-surface">
            Bắt đầu học miễn phí
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-outline-variant/30 to-transparent ml-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guestFeatures.map((feat, i) => (
            <div
              key={feat.path}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <button
                onClick={() => navigate(feat.path)}
                className="group relative flex flex-col p-5 md:p-6 bg-surface-container-lowest overflow-hidden transition-all hover:sharp-shadow active:scale-[0.98] h-full w-full text-left border border-outline-variant/30 rounded-xl"
              >
                {/* Accent top line on hover */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: feat.accent }}
                />

                {/* Feature Icon */}
                <div
                  className="p-3 w-fit mb-5 text-white transition-transform group-hover:scale-110 group-hover:rotate-[-3deg] rounded-lg"
                  style={{ background: feat.accent }}
                >
                  {feat.icon}
                </div>

                {/* Text Content */}
                <h3 className="font-headline font-bold text-on-surface mb-2 text-sm md:text-base flex items-center justify-between w-full">
                  {feat.label}
                  <IconArrowRight className="w-3.5 h-3.5 text-on-surface-variant opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </h3>
                
                <p className="text-xs text-on-surface-variant leading-relaxed flex-1">
                  {feat.desc}
                </p>

                {/* Decorative Kanji watermark */}
                <div
                  className="absolute -right-3 -bottom-3 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none font-jp font-bold leading-none text-on-surface select-none"
                  style={{ fontSize: '80px' }}
                >
                  {feat.ghostChar}
                </div>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── BENEFITS OF SIGNING UP ── */}
      <section className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left Column: Benefits list */}
        <div className="md:col-span-3 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 md:p-8 flex flex-col justify-between animate-fade-up">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <IconSparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <h3 className="text-base font-bold uppercase tracking-wider text-on-surface">
                Tính năng thành viên vượt trội
              </h3>
            </div>
            
            <p className="text-xs text-on-surface-variant mb-6">
              Đăng ký tài khoản miễn phí trong 30 giây để kích hoạt các công cụ học tập thông minh nhất:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'Lộ trình cá nhân hóa AI',
                  desc: 'Hệ thống tự động phân tích điểm mạnh/yếu để định hướng bài học mỗi ngày.',
                },
                {
                  title: 'Kho cá nhân (Flashcard SRS)',
                  desc: 'Thuật toán lặp lại ngắt quãng tối ưu thời gian ôn tập, giúp nhớ từ vựng vĩnh viễn.',
                },
                {
                  title: 'Báo cáo & thống kê',
                  desc: 'Theo dõi tiến trình học chi tiết, duy trì chuỗi streak học tập hàng ngày.',
                },
                {
                  title: 'Luyện nghe & Luyện nói',
                  desc: 'Trải nghiệm các nội dung nghe nâng cao và chat AI sửa lỗi câu.',
                },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-2.5">
                  <IconCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">{item.title}</h4>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-outline-variant/30 pt-5 flex items-center justify-between flex-wrap gap-4">
            <span className="text-[10px] text-on-surface-variant font-medium">
              🎁 Hoàn toàn miễn phí · Không cần thẻ tín dụng
            </span>
            <button
              onClick={openRegister}
              className="px-5 py-2 bg-secondary hover:bg-secondary-dim text-white text-xs font-bold uppercase tracking-wider rounded transition cursor-pointer"
            >
              Đăng ký ngay
            </button>
          </div>
        </div>

        {/* Right Column: Premium callout banner */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#1a237e] to-[#0c144e] text-white border border-[#1a237e]/30 rounded-2xl p-6 md:p-8 flex flex-col justify-between relative overflow-hidden animate-fade-up delay-100">
          <div className="absolute inset-0 asanoha-bg opacity-10 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="p-2.5 bg-white/10 w-fit mb-5 rounded-lg" style={{ backdropFilter: 'blur(4px)' }}>
              <IconStar className="w-5 h-5 text-amber-300" />
            </div>
            <h3 className="text-xl font-headline font-bold text-white mb-2">
              Chinh phục Tiếng Nhật
            </h3>
            <p className="text-indigo-200 text-xs leading-relaxed">
              Minhongo đồng hành cùng bạn trên con đường từ con số 0 đến làm chủ các chứng chỉ JLPT N5, N4, N3, N2, N1.
            </p>
          </div>

          <button
            onClick={openLogin}
            className="relative z-10 mt-8 w-full py-2.5 bg-white hover:bg-indigo-50 text-indigo-900 font-bold text-xs uppercase tracking-wider rounded transition cursor-pointer text-center"
          >
            Đăng nhập tài khoản
          </button>

          <div
            className="absolute -right-4 -bottom-6 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none"
            style={{ fontSize: '130px' }}
          >
            学
          </div>
        </div>
      </section>
    </div>
  );
}
