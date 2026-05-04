import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English',    flag: '🇬🇧' },
];

/* ── icons (24 × 24 Lucide-style) ────────────────────────── */
const IconHome    = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
const IconKanji   = () => <span className="text-[20px] font-black leading-none" style={{ fontFamily: 'serif', display:'block', width:24, textAlign:'center' }}>漢</span>;
const IconList    = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M4 6h16M4 10h16M4 14h10M4 18h7"/></svg>;
const IconBook    = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>;
const IconMap     = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>;
const IconLayers  = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg>;
const IconPeople  = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
const IconStar    = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>;
const IconLogOut  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>;
const IconUser    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
const IconChevron = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>;
const IconSettings = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconShield   = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconGlobe    = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IconChart    = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>;

const navItems = [
  { path: '/dashboard',  label: 'Trang chủ',    end: true, icon: <IconHome /> },
  { path: '/browse',     label: 'Khóa học',                icon: <IconGlobe />,  badge: 'Mới' },
  { path: '/kanji',      label: 'Hán tự',                  icon: <IconKanji /> },
  { path: '/vocabulary', label: 'Từ vựng',                 icon: <IconList /> },
  { path: '/grammar',    label: 'Ngữ pháp',                icon: <IconBook /> },
  { path: '/roadmap',    label: 'Lộ trình',                icon: <IconMap />,    badge: 'AI' },
  { path: '/self-study', label: 'Học Flashcard',           icon: <IconLayers /> },
  { path: '/progress',   label: 'Tiến độ học',             icon: <IconChart /> },
  { path: '/community',  label: 'Cộng đồng',               icon: <IconPeople /> },
];

export default function AppLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [settingsOpen, setSettingsOpen]   = useState(false);
  const [language, setLanguage]           = useState('vi');
  const dropdownRef = useRef(null);
  const settingsRef = useRef(null);

  const handleLogout = () => { setDropdownOpen(false); logout(); navigate('/'); };

  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const initials    = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
  const displayName = user?.name || user?.email?.split('@')[0] || 'Bạn';

  return (
    <div className="min-h-screen bg-surface text-on-surface w-full relative">

      {/* ── FIXED HEADER ──────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-40 glass-panel flex justify-between items-center px-5 py-2.5">
        <Link to="/" className="text-base font-black text-on-surface tracking-tight font-headline flex items-center gap-2">
          <img src="/logo_main.png" alt="Minhongo" className="w-6 h-6 object-contain" />
          Minhongo
        </Link>

        {isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-surface-container transition-colors"
            >
              <div className="w-7 h-7 overflow-hidden" style={{ border: '1.5px solid rgba(198,40,40,0.3)' }}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-red-100 flex items-center justify-center">
                    <span className="text-[11px] font-bold" style={{ color: 'var(--secondary)' }}>{initials}</span>
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-on-surface-variant hidden sm:block">{displayName}</span>
              <IconChevron />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-surface-container-lowest border border-outline-variant/40 py-1 z-50 sharp-shadow">
                <div className="px-4 py-2.5 border-b border-outline-variant/20">
                  <p className="text-sm font-semibold text-on-surface truncate">{displayName}</p>
                  <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
                </div>
                <Link to="/profile" onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors">
                  <IconUser /> Hồ sơ cá nhân
                </Link>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-surface-container transition-colors"
                  style={{ color: 'var(--secondary)' }}>
                  <IconLogOut /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">Đăng nhập</Link>
            <Link to="/register"
              className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-on-secondary hover:bg-secondary-dim transition-colors"
              style={{ background: 'var(--secondary)' }}>
              Đăng ký
            </Link>
          </div>
        )}
      </header>

      {/* ── BODY (below header) ────────────────────────────────── */}
      <div className="flex pt-[50px] min-w-0 w-full relative">

        {/* ── FIXED SIDEBAR ──────────────────────────────────── */}
        <aside className="fixed left-0 top-0 hidden md:flex flex-col h-screen w-64 bg-surface-container-lowest z-30 border-r asanoha-bg"
          style={{ borderColor: 'rgba(0,0,0,0.07)' }}>

          <div className="pt-[50px] flex-1 overflow-y-auto no-scrollbar">
            <nav className="flex-1 space-y-0.5 px-3 py-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    isActive
                      ? 'flex items-center gap-4 px-4 py-3.5 text-base transition-all duration-150 vermilion-active font-bold'
                      : 'flex items-center gap-4 px-4 py-3.5 text-base transition-all duration-150 text-on-surface-variant border-l-[3px] border-transparent hover:border-outline-variant/30 hover:bg-surface-container hover:text-on-surface font-medium'
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span style={{ color: isActive ? 'var(--secondary)' : 'var(--on-surface-variant)' }}>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-px bg-amber-400 text-amber-900 text-[9px] font-black leading-none">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* ── ADMIN SECTION (chỉ hiện với admin) ──────────────── */}
          {user?.isAdmin && (
            <div className="px-3 pb-1 border-t" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
                Quản trị
              </p>
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  isActive
                    ? 'flex items-center gap-4 px-4 py-3.5 text-base transition-all duration-150 vermilion-active font-bold'
                    : 'flex items-center gap-4 px-4 py-3.5 text-base transition-all duration-150 text-on-surface-variant border-l-[3px] border-transparent hover:border-outline-variant/30 hover:bg-surface-container hover:text-on-surface font-medium'
                }
              >
                {({ isActive }) => (
                  <>
                    <span style={{ color: isActive ? 'var(--secondary)' : 'var(--on-surface-variant)' }}>
                      <IconShield />
                    </span>
                    <span className="flex-1">Quản lý Users</span>
                  </>
                )}
              </NavLink>
            </div>
          )}

          {/* ── BOTTOM ACTIONS ──────────────────────────────────── */}
          <div className="border-t" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>

            {/* Upgrade button */}
            <div className="px-3 pt-3 pb-1">
              <NavLink
                to="/upgrade"
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3.5 text-base font-bold w-full transition-all duration-150 border-l-[3px] ${
                    isActive ? 'border-amber-400' : 'border-transparent hover:bg-surface-container'
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? 'rgba(245,158,11,0.08)' : undefined,
                  color: '#b45309',
                })}
              >
                <span style={{ color: '#b45309' }}><IconStar /></span>
                <span className="flex-1">Nâng cấp</span>
              </NavLink>
            </div>

            {/* Settings button + panel */}
            <div className="px-3 pb-3 relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen((o) => !o)}
                className={`flex items-center gap-4 px-4 py-3.5 text-base font-medium w-full transition-all duration-150 border-l-[3px] ${
                  settingsOpen
                    ? 'border-outline-variant/40 bg-surface-container text-on-surface'
                    : 'border-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span style={{ color: settingsOpen ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>
                  <IconSettings />
                </span>
                <span className="flex-1 text-left">Cài đặt</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              {/* Settings panel (opens upward) */}
              {settingsOpen && (
                <div className="absolute bottom-full left-3 right-3 mb-1 bg-surface-container-lowest border py-3 sharp-shadow z-50"
                  style={{ borderColor: 'rgba(0,0,0,0.09)' }}>
                  <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Ngôn ngữ hiển thị
                  </p>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors hover:bg-surface-container"
                    >
                      <span className="text-base leading-none">{lang.flag}</span>
                      <span className={`flex-1 text-left ${language === lang.code ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>
                        {lang.label}
                      </span>
                      {language === lang.code && (
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                          style={{ color: 'var(--secondary)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── MAIN ──────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 w-full md:ml-64 pb-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
