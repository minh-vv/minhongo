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

const PLANNED_FEATURES = [
  {
    icon: '💬',
    title: 'Diễn đàn thảo luận',
    desc: 'Đặt câu hỏi về ngữ pháp, từ vựng và nhận giải đáp từ cộng đồng.',
  },
  {
    icon: '🤝',
    title: 'Kết bạn học chung',
    desc: 'Tìm bạn cùng trình độ, học cặp và động viên nhau giữ streak.',
  },
  {
    icon: '🏆',
    title: 'Sự kiện & Thử thách',
    desc: 'Tham gia challenge JLPT, đua streak hàng tuần để nhận huy hiệu.',
  },
  {
    icon: '📝',
    title: 'Chia sẻ bộ thẻ',
    desc: 'Tải lên bộ flashcard tự tạo, đánh giá và remix bộ thẻ của người khác.',
  },
];

export default function CommunityPage() {
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
              Sắp ra mắt
            </span>
          </div>
          <h1 className="font-headline text-3xl font-bold text-white"
            style={{ letterSpacing: '-0.02em' }}>
            Cộng đồng Minhongo
          </h1>
          <p className="text-white/50 text-sm mt-2 max-w-lg">
            Nơi kết nối những người cùng học tiếng Nhật — thảo luận, chia sẻ tài liệu và giữ động lực mỗi ngày.
          </p>
        </div>

        <div className="absolute -right-4 -bottom-4 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none"
          style={{ fontSize: 160 }}>
          仲
        </div>
      </section>

      {/* ── COMING SOON CARD ────────────────────────────────── */}
      <section>
        <div className="relative bg-surface-container-lowest p-8 md:p-10 text-center overflow-hidden"
          style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'var(--secondary)' }} />

          <div className="w-14 h-14 flex items-center justify-center mb-5 sharp-shadow-sm mx-auto"
            style={{ background: 'var(--primary)' }}>
            <svg className="w-7 h-7 text-on-primary" fill="none" stroke="currentColor"
              strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          <h2 className="font-headline text-2xl font-bold text-on-surface mb-2"
            style={{ letterSpacing: '-0.02em' }}>
            Tính năng đang được phát triển
          </h2>
          <p className="text-on-surface-variant text-sm max-w-md mx-auto leading-relaxed mb-6">
            Trong thời gian chờ, hãy tham gia Discord để gặp gỡ những người học khác và đề xuất tính năng bạn muốn.
          </p>

          <a href="https://discord.gg/minhongo" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-on-secondary hover:bg-secondary-dim transition-colors"
            style={{ background: 'var(--secondary)' }}>
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            Tham gia Discord
          </a>
        </div>
      </section>

      {/* ── PLANNED FEATURES ────────────────────────────────── */}
      <section>
        <SectionHeader title="Tính năng sắp ra mắt" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLANNED_FEATURES.map((f) => (
            <div key={f.title}
              className="relative bg-surface-container-lowest p-5 overflow-hidden"
              style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="absolute left-0 top-0 bottom-0 w-1"
                style={{ background: 'rgba(0,0,0,0.08)' }} />
              <div className="pl-3">
                <p className="text-2xl mb-2">{f.icon}</p>
                <h3 className="font-headline font-bold text-on-surface text-base mb-1.5">
                  {f.title}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
