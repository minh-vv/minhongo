import { Link, useLocation } from 'react-router-dom';

export default function LoginPrompt({ title, description, ghostChar = '錠' }) {
  const location = useLocation();
  const returnTo = encodeURIComponent(location.pathname);

  return (
    <div className="max-w-2xl mx-auto w-full p-6 md:p-8">
      <section className="relative overflow-hidden animate-fade-up bg-surface-container-lowest"
        style={{ border: '1px solid rgba(0,0,0,0.07)', minHeight: 320 }}>
        {/* Top vermilion accent bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: 'var(--secondary)' }} />

        {/* Asanoha overlay */}
        <div className="absolute inset-0 asanoha-bg opacity-[0.4] pointer-events-none" />

        <div className="relative z-10 px-8 md:px-12 py-14 md:py-16 flex flex-col items-center text-center">
          {/* Square icon */}
          <div className="w-14 h-14 flex items-center justify-center mb-6 sharp-shadow-sm flex-shrink-0"
            style={{ background: 'var(--primary)' }}>
            <svg className="w-7 h-7 text-on-primary" fill="none" stroke="currentColor"
              strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-5"
            style={{ background: 'rgba(198,40,40,0.08)' }}>
            <span className="w-1.5 h-1.5 rotate-45" style={{ background: 'var(--secondary)' }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: 'var(--secondary)' }}>
              Dành cho thành viên
            </span>
          </div>

          <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-surface mb-3"
            style={{ letterSpacing: '-0.02em' }}>
            {title || 'Đăng nhập để tiếp tục'}
          </h2>
          <p className="text-on-surface-variant text-sm max-w-md mb-8 leading-relaxed">
            {description || 'Tính năng này dành cho thành viên. Đăng nhập hoặc tạo tài khoản miễn phí để sử dụng.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/login?return=${returnTo}`}
              className="px-7 py-2.5 text-sm font-bold uppercase tracking-wider text-on-secondary hover:bg-secondary-dim transition-colors inline-flex items-center justify-center gap-2"
              style={{ background: 'var(--secondary)' }}
            >
              Đăng nhập
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/register"
              className="px-7 py-2.5 text-sm font-bold uppercase tracking-wider text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors"
            >
              Tạo tài khoản miễn phí
            </Link>
          </div>
        </div>

        {/* Ghost kanji */}
        <div className="absolute -right-4 -bottom-6 font-jp font-bold text-on-surface/[0.04] leading-none select-none pointer-events-none"
          style={{ fontSize: 160 }}>
          {ghostChar}
        </div>
      </section>
    </div>
  );
}
