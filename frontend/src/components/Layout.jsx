import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Paths that belong to the "Học bài" section
const STUDY_PATHS = ['/kanji', '/vocabulary', '/grammar', '/roadmap', '/self-study', '/deck', '/study'];

const studyAdminTabs = [
  {
    path: '/kanji',
    label: 'Hán tự',
    icon: (
      <span className="text-base font-bold leading-none" style={{ fontFamily: 'serif' }}>
        漢
      </span>
    ),
  },
  {
    path: '/vocabulary',
    label: 'Từ vựng',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h7" />
      </svg>
    ),
  },
  {
    path: '/grammar',
    label: 'Ngữ pháp',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
];

const studyPersonalTabs = [
  {
    path: '/roadmap',
    label: 'Lộ trình',
    badge: 'AI',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    path: '/self-study',
    label: 'Tự học',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

function SidebarStudy() {
  const tabBase =
    'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left';
  const active = 'bg-indigo-50 text-indigo-700 font-semibold';
  const inactive = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

  const personalActive = 'bg-violet-50 text-violet-700 font-semibold';
  const personalInactive = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

  return (
    <div className="flex flex-col gap-1 p-3">
      {/* Admin content */}
      <div className="mb-1">
        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Nội dung học
        </p>
        {studyAdminTabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) => `${tabBase} ${isActive ? active : inactive}`}
          >
            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-current">
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Separator */}
      <div className="my-1 border-t border-gray-100" />

      {/* Personal / AI */}
      <div>
        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Cá nhân hóa
        </p>
        {studyPersonalTabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `${tabBase} ${isActive ? personalActive : personalInactive}`
            }
          >
            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-current">
              {tab.icon}
            </span>
            <span className="flex-1">{tab.label}</span>
            {tab.badge && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-400 text-amber-900 rounded-full leading-none">
                {tab.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

function SidebarOverview() {
  const tabBase =
    'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left text-gray-600 hover:bg-gray-100 hover:text-gray-900';

  return (
    <div className="flex flex-col gap-1 p-3">
      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        Tổng quan
      </p>
      <button className={tabBase}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Thống kê
      </button>
      <button className={tabBase}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Lịch học
      </button>
      <button className={tabBase}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        Thành tựu
      </button>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isStudySection = STUDY_PATHS.some((p) => location.pathname.startsWith(p));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const headerTabBase =
    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150';
  const headerTabActive = 'bg-indigo-600 text-white shadow-sm';
  const headerTabInactive = 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ─── HEADER ──────────────────────────────────────────────── */}
      <header className="flex-shrink-0 h-14 bg-white border-b border-gray-200 shadow-sm z-40">
        <div className="h-full flex items-center px-4 gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-shrink-0 flex items-center gap-2 mr-4"
          >
            <img src="/logo_main.png" alt="Logo" className="h-8 w-auto object-contain" />
          </button>

          {/* Header tabs */}
          <nav className="flex items-center gap-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `${headerTabBase} ${isActive ? headerTabActive : headerTabInactive}`
              }
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Trang chủ
            </NavLink>

            {/* "Học bài" tab — active when on any study route */}
            <NavLink
              to="/kanji"
              className={() =>
                `${headerTabBase} ${isStudySection ? headerTabActive : headerTabInactive}`
              }
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Học bài
            </NavLink>

            {/* Placeholder tabs — greyed out for future */}
            <button
              className={`${headerTabBase} text-gray-400 cursor-not-allowed`}
              disabled
              title="Sắp ra mắt"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Tiến trình
              <span className="ml-1 text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-medium">
                soon
              </span>
            </button>
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User section */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-indigo-700">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                {user?.name || user?.email || 'User'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── BODY (sidebar + content) ────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="flex-shrink-0 w-52 bg-white border-r border-gray-200 overflow-y-auto">
          {isStudySection ? <SidebarStudy /> : <SidebarOverview />}
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
