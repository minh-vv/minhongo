function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1.5 h-6 flex-shrink-0" style={{ background: 'var(--secondary)' }} />
      <h2 className="text-lg font-headline font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      <div className="flex-1 h-px ml-1"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)' }} />
    </div>
  );
}

const PLANS = [
  {
    name: 'Miễn phí',
    price: '0đ',
    period: 'mãi mãi',
    features: ['Hán tự N5–N4', 'Từ vựng cơ bản', 'Ngữ pháp N5–N4', 'Không cần đăng ký'],
    cta: 'Đang sử dụng',
    current: true,
  },
  {
    name: 'Pro',
    price: '99.000đ',
    period: 'tháng',
    badge: 'Phổ biến nhất',
    features: [
      'Toàn bộ Hán tự N5–N1',
      'Từ vựng đầy đủ tất cả cấp',
      'Ngữ pháp toàn diện',
      'Lộ trình AI cá nhân hóa',
      'Flashcard không giới hạn',
      'Ôn tập SRS nâng cao',
    ],
    cta: 'Nâng cấp ngay',
    current: false,
  },
];

function CheckIcon({ active }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor"
      strokeWidth={2.5} viewBox="0 0 24 24"
      style={{ color: active ? 'var(--secondary)' : 'var(--on-surface-variant)' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function UpgradePage() {
  return (
    <div className="max-w-5xl mx-auto w-full p-6 md:p-8 space-y-10">

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden animate-fade-up" style={{ minHeight: 130 }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 60%, #0d1b5e 100%)'
        }} />
        <div className="absolute inset-0 asanoha-bg opacity-20" />
        <div className="absolute right-0 top-0 bottom-0 w-1" style={{ background: 'var(--secondary)' }} />

        <div className="relative z-10 p-8 md:p-10">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 mb-4"
            style={{ backdropFilter: 'blur(4px)' }}>
            <span className="w-1.5 h-1.5 rotate-45" style={{ background: 'var(--secondary)' }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
              Nâng cấp tài khoản
            </span>
          </div>
          <h1 className="font-headline text-3xl font-bold text-white"
            style={{ letterSpacing: '-0.02em' }}>
            Mở khóa toàn bộ nội dung
          </h1>
          <p className="text-white/50 text-sm mt-2 max-w-md">
            Học tiếng Nhật toàn diện từ N5 đến N1 với lộ trình AI cá nhân hóa và thuật toán SRS.
          </p>
        </div>

        <div className="absolute -right-4 -bottom-4 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none"
          style={{ fontSize: 160 }}>
          昇
        </div>
      </section>

      {/* ── PLANS ───────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Chọn gói phù hợp" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLANS.map((plan) => {
            const isPro = !plan.current;
            return (
              <div key={plan.name}
                className="relative bg-surface-container-lowest p-6 md:p-7 flex flex-col overflow-hidden"
                style={{
                  border: isPro
                    ? '2px solid var(--secondary)'
                    : '1px solid rgba(0,0,0,0.07)',
                }}>
                {/* Top accent bar for Pro */}
                {isPro && (
                  <div className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: 'var(--secondary)' }} />
                )}

                {plan.badge && (
                  <span className="absolute top-0 right-6 -translate-y-1/2 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-on-secondary"
                    style={{ background: 'var(--secondary)' }}>
                    {plan.badge}
                  </span>
                )}

                <div className="mb-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    Gói
                  </p>
                  <h2 className="font-headline text-xl font-bold text-on-surface mb-3">
                    {plan.name}
                  </h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black leading-none"
                      style={{ color: isPro ? 'var(--secondary)' : 'var(--on-surface)' }}>
                      {plan.price}
                    </span>
                    <span className="text-on-surface-variant text-xs">/ {plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6 pt-5"
                  style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-on-surface">
                      <span className="mt-0.5"><CheckIcon active={isPro} /></span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={plan.current}
                  className="w-full py-2.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:cursor-default"
                  style={
                    plan.current
                      ? { background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }
                      : { background: 'var(--secondary)', color: 'var(--on-secondary)' }
                  }
                  onMouseEnter={(e) => {
                    if (!plan.current) e.currentTarget.style.background = 'var(--secondary-dim)';
                  }}
                  onMouseLeave={(e) => {
                    if (!plan.current) e.currentTarget.style.background = 'var(--secondary)';
                  }}
                >
                  {plan.cta}
                </button>

                {/* Ghost kanji bottom-right */}
                <div className="absolute -right-3 -bottom-4 font-jp font-bold leading-none select-none pointer-events-none"
                  style={{
                    fontSize: 100,
                    color: isPro ? 'rgba(198,40,40,0.04)' : 'rgba(0,0,0,0.03)',
                  }}>
                  {plan.current ? '初' : '極'}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6 font-mono tracking-widest uppercase">
          * Tính năng thanh toán đang được phát triển. Liên hệ để biết thêm.
        </p>
      </section>
    </div>
  );
}
