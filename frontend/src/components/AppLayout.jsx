import { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { systemApi } from '../api/systemApi';
import AuthModal from './AuthModal';
import {
  IconHome, IconGlobe, IconList, IconBook, IconMap, IconLayers,
  IconChart, IconTrophy, IconPeople, IconStar, IconShield,
  IconFolder, IconSettings, IconUser, IconLogOut, IconChevronDown,
  IconCheck, IconKanji, IconBot, IconHeadphones,
} from './Icons';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English',    flag: '🇬🇧' },
];

const navItems = [
  { path: '/dashboard',  label: 'Trang chủ',    end: true, icon: <IconHome /> },
  { path: '/kanji',      label: 'Hán tự',                  icon: <IconKanji /> },
  { path: '/vocabulary', label: 'Từ vựng',                 icon: <IconList /> },
  { path: '/grammar',    label: 'Ngữ pháp',                icon: <IconBook /> },
  {
    path: '/listening',
    label: 'Luyện nghe',
    icon: <IconHeadphones />,
    children: [
      { path: '/listening/dialogue', label: 'Nghe hội thoại' },
      { path: '/listening/sentence', label: 'Điền từ & chép câu' },
      { path: '/listening/shadowing', label: 'Nói đuổi Shadowing' },
    ]
  },
  { path: '/roadmap',    label: 'Lộ trình',                icon: <IconMap /> },
  { path: '/self-study', label: 'Kho cá nhân',           icon: <IconLayers /> },
  { path: '/community',  label: 'Cộng đồng',               icon: <IconPeople /> },
];

export default function AppLayout() {
  const { isAuthenticated, user, logout, openLogin, openRegister } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [settingsOpen, setSettingsOpen]   = useState(false);
  const [language, setLanguage]           = useState('vi');
  const [listeningOpen, setListeningOpen] = useState(() => location.pathname.startsWith('/listening'));
  const prevPathnameRef = useRef(location.pathname);

  useEffect(() => {
    const wasListening = prevPathnameRef.current.startsWith('/listening');
    const isListening = location.pathname.startsWith('/listening');
    
    if (!wasListening && isListening) {
      setListeningOpen(true);
    } else if (!isListening) {
      setListeningOpen(false);
    }
    
    prevPathnameRef.current = location.pathname;
  }, [location.pathname]);
  const dropdownRef = useRef(null);
  const settingsRef = useRef(null);

  const { data: publicConfig } = useQuery({
    queryKey: ['publicSystemConfig'],
    queryFn: systemApi.getPublicConfig,
    staleTime: 60_000,
    retry: 1,
  });

  const showSystemBanner = useMemo(() => {
    const msg = publicConfig?.announcementMessage?.trim();
    return !!(publicConfig?.maintenanceMode || msg);
  }, [publicConfig]);

  const bodyPadTop = showSystemBanner ? 92 : 50;

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
        <Link to="/" className="flex items-center">
          <img src="/logo_main.png" alt="Minhongo" className="h-9 w-auto object-contain" />
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            {/* Progress Link next to avatar */}
            <Link
              to="/progress"
              className="p-1.5 hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface flex items-center justify-center"
              title="Tiến độ học"
            >
              <IconChart className="w-5 h-5" />
            </Link>

            {/* Leaderboard Link next to avatar */}
            <Link
              to="/leaderboard"
              className="p-1.5 hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface flex items-center justify-center"
              title="Bảng xếp hạng"
            >
              <IconTrophy className="w-5 h-5" />
            </Link>

            {/* Dropdown Profile */}
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
                <IconChevronDown className="w-3 h-3" />
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
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={openLogin}
              className="text-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              Đăng nhập
            </button>
            <button
              onClick={openRegister}
              className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-on-secondary hover:bg-secondary-dim transition-colors cursor-pointer"
              style={{ background: 'var(--secondary)' }}
            >
              Đăng ký
            </button>
          </div>
        )}
      </header>

      {/* Thông báo / bảo trì từ cấu hình hệ thống */}
      {showSystemBanner && (
        <div
          className="fixed left-0 right-0 z-[38] px-4 py-2 text-center text-xs font-semibold leading-snug"
          style={{
            top: 50,
            background: publicConfig?.maintenanceMode ? 'rgba(180, 83, 9, 0.95)' : 'rgba(26, 35, 126, 0.92)',
            color: '#fff',
          }}
        >
          {publicConfig?.maintenanceMode && (
            <span className="font-black uppercase tracking-wider mr-2">Bảo trì</span>
          )}
          {publicConfig?.announcementMessage?.trim() || (publicConfig?.maintenanceMode ? 'Hệ thống có thể chậm hoặc thay đổi trong thời gian này.' : '')}
        </div>
      )}

      {/* ── BODY (below header) ────────────────────────────────── */}
      <div className="flex min-w-0 w-full relative" style={{ paddingTop: bodyPadTop }}>

        {/* ── FIXED SIDEBAR ──────────────────────────────────── */}
        <aside className="fixed left-0 top-0 hidden md:flex flex-col h-screen w-64 bg-surface-container-lowest z-30 border-r asanoha-bg"
          style={{ borderColor: 'rgba(0,0,0,0.07)' }}>

          <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingTop: bodyPadTop }}>
            <nav className="flex-1 space-y-0.5 px-3 py-3">
              {navItems.map((item) => {
                if (item.children) {
                  const isListeningActive = location.pathname.startsWith('/listening');
                  return (
                    <div key={item.path} className="flex flex-col">
                      <NavLink
                        to={item.path}
                        onClick={(e) => {
                          if (isListeningActive) {
                            e.preventDefault();
                          }
                          setListeningOpen(!listeningOpen);
                        }}
                        className={
                          isListeningActive
                            ? 'flex items-center gap-4 px-4 py-3.5 text-base transition-all duration-150 vermilion-active font-bold'
                            : 'flex items-center gap-4 px-4 py-3.5 text-base transition-all duration-150 text-on-surface-variant border-l-[3px] border-transparent hover:border-outline-variant/30 hover:bg-surface-container hover:text-on-surface font-medium'
                        }
                      >
                        <span style={{ color: isListeningActive ? 'var(--secondary)' : 'var(--on-surface-variant)' }}>
                          {item.icon}
                        </span>
                        <span className="flex-1">{item.label}</span>
                        <IconChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${listeningOpen ? 'rotate-180' : ''}`} />
                      </NavLink>
                      
                      {listeningOpen && (
                        <div className="flex flex-col mt-0.5 space-y-0.5 animate-fade-up">
                          {item.children.map((child) => (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              className={({ isActive }) =>
                                isActive
                                  ? 'flex items-center gap-3 pl-12 pr-4 py-2 text-sm transition-all duration-150 text-secondary font-bold border-l-[3px] border-secondary bg-secondary/5'
                                  : 'flex items-center gap-3 pl-12 pr-4 py-2 text-sm transition-all duration-150 text-on-surface-variant border-l-[3px] border-transparent hover:border-outline-variant/30 hover:bg-surface-container hover:text-on-surface font-medium'
                              }
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 animate-fade-up" />
                              <span className="flex-1">{child.label}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
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
                );
              })}
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
              <NavLink
                to="/admin/content"
                className={({ isActive }) =>
                  isActive
                    ? 'flex items-center gap-4 px-4 py-3.5 text-base transition-all duration-150 vermilion-active font-bold'
                    : 'flex items-center gap-4 px-4 py-3.5 text-base transition-all duration-150 text-on-surface-variant border-l-[3px] border-transparent hover:border-outline-variant/30 hover:bg-surface-container hover:text-on-surface font-medium'
                }
              >
                {({ isActive }) => (
                  <>
                    <span style={{ color: isActive ? 'var(--secondary)' : 'var(--on-surface-variant)' }}>
                      <IconFolder />
                    </span>
                    <span className="flex-1">Nội dung</span>
                  </>
                )}
              </NavLink>
              <NavLink
                to="/admin/settings"
                className={({ isActive }) =>
                  isActive
                    ? 'flex items-center gap-4 px-4 py-3.5 text-base transition-all duration-150 vermilion-active font-bold'
                    : 'flex items-center gap-4 px-4 py-3.5 text-base transition-all duration-150 text-on-surface-variant border-l-[3px] border-transparent hover:border-outline-variant/30 hover:bg-surface-container hover:text-on-surface font-medium'
                }
              >
                {({ isActive }) => (
                  <>
                    <span style={{ color: isActive ? 'var(--secondary)' : 'var(--on-surface-variant)' }}>
                      <IconSettings />
                    </span>
                    <span className="flex-1">Cấu hình</span>
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
                <IconChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
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
                        <IconCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--secondary)' }} />
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
      <AuthModal />
    </div>
  );
}
