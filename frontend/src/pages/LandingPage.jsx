import { Link } from 'react-router-dom';

/* ─── Data ────────────────────────────────────────────────── */

const stats = [
  { value: '5 cấp độ', label: 'JLPT N5 → N1' },
  { value: '10,000+', label: 'Từ vựng & Hán tự' },
  { value: 'SRS', label: 'Ôn tập thông minh' },
  { value: 'AI', label: 'Lộ trình cá nhân hóa' },
];

const features = [
  {
    group: 'Nội dung do giáo viên biên soạn',
    groupColor: 'text-indigo-600',
    groupBg: 'bg-indigo-50',
    items: [
      {
        icon: (
          <span className="text-3xl font-black" style={{ fontFamily: 'serif' }}>漢</span>
        ),
        title: 'Hán tự theo JLPT',
        desc: 'Học kanji từ N5 đến N1, có hình minh họa, ví dụ câu và bài tập kiểm tra.',
        color: 'border-indigo-100 hover:border-indigo-300',
        iconBg: 'bg-indigo-50',
      },
      {
        icon: (
          <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h10M4 18h7" />
          </svg>
        ),
        title: 'Từ vựng có chủ đề',
        desc: 'Từ vựng được nhóm theo chủ đề và cấp độ, kèm phiên âm romaji và audio.',
        color: 'border-blue-100 hover:border-blue-300',
        iconBg: 'bg-blue-50',
      },
      {
        icon: (
          <svg className="w-7 h-7 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
        title: 'Ngữ pháp dễ hiểu',
        desc: 'Giải thích ngữ pháp bằng tiếng Việt, kèm công thức và ví dụ thực tế.',
        color: 'border-sky-100 hover:border-sky-300',
        iconBg: 'bg-sky-50',
      },
    ],
  },
  {
    group: 'Tính năng cá nhân hóa',
    groupColor: 'text-violet-600',
    groupBg: 'bg-violet-50',
    items: [
      {
        icon: (
          <svg className="w-7 h-7 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        ),
        title: 'Lộ trình AI',
        desc: 'AI phân tích điểm yếu và tạo lộ trình học tối ưu, tự điều chỉnh theo tiến trình của bạn.',
        color: 'border-violet-100 hover:border-violet-300',
        iconBg: 'bg-violet-50',
        badge: 'AI',
      },
      {
        icon: (
          <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        ),
        title: 'Tự học & Flashcard',
        desc: 'Tạo bộ thẻ riêng, import từ Anki, ôn tập với thuật toán SRS ghi nhớ lâu dài.',
        color: 'border-purple-100 hover:border-purple-300',
        iconBg: 'bg-purple-50',
      },
    ],
  },
];

const steps = [
  {
    num: '01',
    title: 'Đăng ký & kiểm tra trình độ',
    desc: 'Tạo tài khoản miễn phí. Làm bài kiểm tra ngắn để AI xác định điểm xuất phát phù hợp.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Học theo lộ trình được tạo sẵn',
    desc: 'Mỗi ngày nhận danh sách bài học từ hệ thống — Hán tự, từ vựng, ngữ pháp được sắp xếp hợp lý.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Ôn tập thông minh mỗi ngày',
    desc: 'SRS tự động nhắc ôn đúng lúc bạn sắp quên. Chỉ 15 phút/ngày là đủ để ghi nhớ bền vững.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
];

const testimonials = [
  {
    avatar: 'T',
    name: 'Minh Tuấn',
    role: 'Đã đạt JLPT N3 sau 8 tháng',
    content:
      'Trước đây mình học lan man, không có hướng. Từ khi dùng Minhongo, lộ trình AI giúp mình biết mỗi ngày cần học gì. Kanji không còn là nỗi ám ảnh nữa!',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    avatar: 'L',
    name: 'Phương Linh',
    role: 'Sinh viên ngành Nhật Bản học',
    content:
      'Tính năng tự tạo flashcard và import từ Anki rất tiện. Giao diện sạch, dễ dùng. Mình dùng SRS để ôn từ vựng chuyên ngành mà không bị quên nữa.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    avatar: 'N',
    name: 'Hoàng Nam',
    role: 'Đang ôn thi JLPT N1',
    content:
      'Phần ngữ pháp giải thích bằng tiếng Việt rất rõ, ví dụ câu thực tế. Mình đặc biệt thích phần so sánh các mẫu ngữ pháp dễ nhầm lẫn.',
    color: 'from-blue-500 to-sky-500',
  },
];

/* ─── Sub-components ──────────────────────────────────────── */

function KanjiCard({ char, reading, meaning, level }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center min-w-[100px]">
      <div className="text-4xl font-black text-gray-800 mb-1" style={{ fontFamily: 'serif' }}>
        {char}
      </div>
      <div className="text-xs text-gray-500">{reading}</div>
      <div className="text-xs font-medium text-gray-700 mt-0.5">{meaning}</div>
      <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-semibold rounded-full">
        N{level}
      </span>
    </div>
  );
}

function VocabRow({ jp, reading, vn }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-base font-bold text-gray-800 min-w-[64px]">{jp}</span>
      <span className="text-xs text-gray-400 min-w-[64px]">{reading}</span>
      <span className="text-sm text-gray-600">{vn}</span>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ═══ NAV ══════════════════════════════════════════════ */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo_main.png" alt="Logo" className="h-8 w-auto object-contain" />
            <span className="text-gray-400 text-sm">学日本語</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Tính năng</a>
            <a href="#how" className="hover:text-gray-900 transition-colors">Cách học</a>
            <a href="#review" className="hover:text-gray-900 transition-colors">Đánh giá</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Bắt đầu miễn phí
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═════════════════════════════════════════════ */}
      <section className="pt-28 pb-16 px-6 bg-gradient-to-b from-indigo-50/60 to-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: copy */}
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full mb-5">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                Nền tảng học tiếng Nhật cho người Việt
              </span>

              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
                Học tiếng Nhật{' '}
                <span className="text-indigo-600">đúng hướng</span>,<br />
                nhớ lâu hơn mỗi ngày
              </h1>

              <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-md">
                Hán tự, từ vựng và ngữ pháp được hệ thống hóa. Lộ trình AI cá nhân hóa.
                Thuật toán SRS giúp bạn không bao giờ quên những gì đã học.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  to="/register"
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 text-sm"
                >
                  Học miễn phí ngay
                </Link>
                <a
                  href="#how"
                  className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 border border-gray-200 transition-all text-sm"
                >
                  Xem cách hoạt động
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {['Miễn phí hoàn toàn', 'Không cần cài đặt', 'Tiếng Việt 100%'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: UI preview mockup */}
            <div className="relative">
              {/* Decorative blobs */}
              <div className="absolute -top-8 -right-8 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-60" />
              <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-violet-100 rounded-full blur-3xl opacity-60" />

              {/* App card preview */}
              <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 max-w-sm mx-auto">
                {/* Mini header */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <div className="text-sm font-bold text-indigo-600">Minhongo</div>
                  <div className="flex gap-1 ml-auto">
                    <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] rounded-md font-medium">Học bài</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-md">Trang chủ</span>
                  </div>
                </div>

                {/* Flashcard */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 mb-4 text-white text-center">
                  <div className="text-5xl font-black mb-2" style={{ fontFamily: 'serif' }}>学</div>
                  <div className="text-indigo-200 text-xs mb-1">まな・ぶ / まなぶ</div>
                  <div className="font-semibold">học, học hỏi</div>
                  <div className="mt-3 text-xs text-indigo-200">日本語を学ぶ — Học tiếng Nhật</div>
                </div>

                {/* SRS buttons */}
                <div className="flex gap-2 mb-4">
                  {[
                    { label: 'Quên mất', color: 'bg-red-50 text-red-600 border-red-200' },
                    { label: 'Khó', color: 'bg-amber-50 text-amber-600 border-amber-200' },
                    { label: 'Nhớ', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
                  ].map((b) => (
                    <button key={b.label} className={`flex-1 py-2 text-[11px] font-semibold rounded-lg border ${b.color}`}>
                      {b.label}
                    </button>
                  ))}
                </div>

                {/* Kanji row */}
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Hán tự hôm nay
                  </div>
                  <div className="flex gap-2 overflow-hidden">
                    {[
                      { char: '日', r: 'にち', m: 'ngày, mặt trời', lv: 5 },
                      { char: '本', r: 'ほん', m: 'gốc, sách', lv: 5 },
                      { char: '語', r: 'ご', m: 'ngôn ngữ', lv: 4 },
                    ].map((k) => (
                      <KanjiCard key={k.char} {...k} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-3 -left-3 bg-white rounded-2xl shadow-lg border border-gray-100 px-3 py-2 flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <div>
                  <div className="text-xs font-bold text-gray-800">Streak 14 ngày</div>
                  <div className="text-[10px] text-gray-400">Tiếp tục chuỗi!</div>
                </div>
              </div>

              <div className="absolute -bottom-3 -right-3 bg-white rounded-2xl shadow-lg border border-gray-100 px-3 py-2 flex items-center gap-2">
                <span className="text-xl">✅</span>
                <div>
                  <div className="text-xs font-bold text-gray-800">42 thẻ hôm nay</div>
                  <div className="text-[10px] text-gray-400">Hoàn thành mục tiêu</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ════════════════════════════════════════ */}
      <section className="border-y border-gray-100 bg-gray-50/60 py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-extrabold text-indigo-600 mb-1">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═════════════════════════════════════════ */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Mọi thứ bạn cần để học tiếng Nhật
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Từ nội dung được biên soạn bởi giáo viên đến công nghệ AI cá nhân hóa — tất cả trong một nơi.
            </p>
          </div>

          {features.map((group) => (
            <div key={group.group} className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${group.groupBg} ${group.groupColor}`}>
                  {group.group}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="grid md:grid-cols-3 gap-5">
                {group.items.map((item) => (
                  <div
                    key={item.title}
                    className={`bg-white rounded-2xl border-2 p-6 transition-all duration-200 ${item.color}`}
                  >
                    <div className={`w-12 h-12 ${item.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      {item.title}
                      {item.badge && (
                        <span className="px-1.5 py-0.5 bg-amber-400 text-amber-900 text-[9px] font-black rounded-full">
                          AI
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CONTENT PREVIEW ══════════════════════════════════ */}
      <section className="py-16 px-6 bg-gray-50/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
              Nội dung phong phú, được cấu trúc rõ ràng
            </h2>
            <p className="text-gray-500 text-sm">Xem trước giao diện học thực tế</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Kanji preview */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-black text-indigo-700" style={{ fontFamily: 'serif' }}>漢</span>
                <span className="font-semibold text-gray-800 text-sm">Hán tự JLPT N5</span>
                <span className="ml-auto px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-full">
                  80 Kanji
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { char: '山', r: 'さん', m: 'núi' },
                  { char: '川', r: 'かわ', m: 'sông' },
                  { char: '田', r: 'た', m: 'ruộng' },
                  { char: '火', r: 'か', m: 'lửa' },
                  { char: '水', r: 'すい', m: 'nước' },
                  { char: '木', r: 'もく', m: 'cây' },
                ].map((k) => (
                  <div key={k.char} className="flex flex-col items-center bg-indigo-50 rounded-xl px-3 py-2">
                    <span className="text-2xl font-bold text-indigo-800" style={{ fontFamily: 'serif' }}>
                      {k.char}
                    </span>
                    <span className="text-[10px] text-gray-500">{k.r}</span>
                    <span className="text-[10px] text-gray-600 font-medium">{k.m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vocab preview */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h7" />
                </svg>
                <span className="font-semibold text-gray-800 text-sm">Từ vựng — Trường học</span>
                <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full">
                  N5
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                <VocabRow jp="学校" reading="がっこう" vn="trường học" />
                <VocabRow jp="先生" reading="せんせい" vn="giáo viên" />
                <VocabRow jp="学生" reading="がくせい" vn="học sinh, sinh viên" />
                <VocabRow jp="教室" reading="きょうしつ" vn="phòng học" />
                <VocabRow jp="勉強" reading="べんきょう" vn="việc học, học tập" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ══════════════════════════════════════ */}
      <section id="how" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Bắt đầu học trong 3 bước
            </h2>
            <p className="text-gray-500">Không cần kinh nghiệm. Không cần sách giáo khoa. Chỉ cần 15 phút mỗi ngày.</p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-0.5 bg-indigo-100" />

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((s, i) => (
                <div key={i} className="text-center relative">
                  <div className="w-14 h-14 mx-auto mb-5 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 relative z-10">
                    {s.icon}
                  </div>
                  <div className="text-xs font-black text-indigo-300 mb-1 tracking-widest">
                    BƯỚC {s.num}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-base">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ══════════════════════════════════════ */}
      <section id="review" className="py-20 px-6 bg-gray-50/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Người học nói gì?
            </h2>
            <p className="text-gray-500">Hàng nghìn người Việt đang học tiếng Nhật hiệu quả cùng Minhongo</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">"{t.content}"</p>

                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ══════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-10 text-white text-center shadow-2xl shadow-indigo-200">
            <div className="text-5xl mb-4" style={{ fontFamily: 'serif' }}>日本語</div>
            <h2 className="text-3xl font-extrabold mb-3">Sẵn sàng bắt đầu chưa?</h2>
            <p className="text-indigo-200 mb-8 max-w-md mx-auto">
              Đăng ký miễn phí hôm nay và bắt đầu hành trình chinh phục tiếng Nhật của bạn.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="px-7 py-3.5 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-md text-sm"
              >
                Tạo tài khoản miễn phí
              </Link>
              <Link
                to="/login"
                className="px-7 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 border border-white/20 transition-all text-sm"
              >
                Đã có tài khoản
              </Link>
            </div>
            <p className="mt-5 text-indigo-300 text-xs">
              Không cần thẻ tín dụng · Không cài đặt · Bắt đầu trong 30 giây
            </p>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ════════════════════════════════════════════ */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-600">Minhongo</span>
            <span className="text-gray-400 text-sm">学日本語</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-gray-700 transition-colors">Tính năng</a>
            <a href="#how" className="hover:text-gray-700 transition-colors">Cách học</a>
            <Link to="/login" className="hover:text-gray-700 transition-colors">Đăng nhập</Link>
            <Link to="/register" className="hover:text-gray-700 transition-colors">Đăng ký</Link>
          </div>
          <div className="text-xs text-gray-400">© 2026 Minhongo</div>
        </div>
      </footer>

    </div>
  );
}
