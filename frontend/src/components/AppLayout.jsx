import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/* ── icons (24 × 24 Lucide-style) ────────────────────────── */
const IconHome    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
const IconKanji   = () => <span className="text-[17px] font-black leading-none" style={{ fontFamily: 'serif', display:'block', width:20, textAlign:'center' }}>漢</span>;
const IconList    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M4 6h16M4 10h16M4 14h10M4 18h7"/></svg>;
const IconBook    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>;
const IconMap     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>;
const IconLayers  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg>;
const IconPeople  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
const IconStar    = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>;
const IconLogOut  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>;
const IconUser    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
const IconChevron = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>;

const navItems = [
  { path: '/dashboard', label: 'Trang chủ',    end: true, icon: <IconHome /> },
  { path: '/hantu',     label: 'Hán tự',        icon: <IconKanji /> },
  { path: '/tuvung',    label: 'Từ vựng',       icon: <IconList /> },
  { path: '/nguphap',   label: 'Ngữ pháp',      icon: <IconBook /> },
  { path: '/lotrinh',   label: 'Lộ trình',      icon: <IconMap />,    badge: 'AI' },
  { path: '/tuhoc',     label: 'Học Flashcard', icon: <IconLayers /> },
  { path: '/cong-dong', label: 'Cộng đồng',     icon: <IconPeople /> },
  { path: '/nang-cap',  label: 'Nâng cấp',      icon: <IconStar />,   special: 'upgrade' },
];

export default function AppLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => { setDropdownOpen(false); logout(); navigate('/'); };

  useEffect(() => {
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
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
              <div className="w-7 h-7 rounded-full bg-red-100 border border-red-200 flex items-center justify-center">
                <span className="text-[11px] font-bold" style={{ color: 'var(--secondary)' }}>{initials}</span>
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
            <nav className="flex-1 space-y-0.5 px-3 py-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) => {
                    const base = 'flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150';
                    if (item.special === 'upgrade') {
                      return `${base} ${isActive
                        ? 'font-bold border-l-[3px]'
                        : 'text-on-surface-variant border-l-[3px] border-transparent hover:bg-surface-container hover:text-on-surface'
                      }`;
                    }
                    return isActive
                      ? `${base} vermilion-active`
                      : `${base} text-on-surface-variant border-l-[3px] border-transparent hover:border-outline-variant/30 hover:bg-surface-container hover:text-on-surface font-medium`;
                  }}
                  style={({ isActive }) =>
                    item.special === 'upgrade' && isActive
                      ? { borderLeftColor: '#f59e0b', background: 'rgba(245,158,11,0.08)', color: '#b45309', fontWeight: 700 }
                      : item.special === 'upgrade'
                      ? { color: '#b45309' }
                      : {}
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span style={
                        item.special === 'upgrade' ? { color: '#b45309' }
                        : isActive ? { color: 'var(--secondary)' }
                        : { color: 'var(--on-surface-variant)' }
                      }>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="px-1 py-px bg-amber-400 text-amber-900 text-[8px] font-black leading-none">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Discord block */}
          <div className="p-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
            <a href="https://discord.gg/minhongo" target="_blank" rel="noopener noreferrer"
              className="group relative block w-full bg-surface-container-lowest border border-outline-variant/20 p-4 transition-all hover:sharp-shadow-sm active:translate-y-px overflow-hidden"
              style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2" style={{ borderColor: 'rgba(88,101,242,0.2)' }} />
              <div className="relative z-10 flex items-center gap-3">
                <div className="p-2 text-white flex-shrink-0" style={{ background: '#5865F2' }}>
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] leading-none mb-1" style={{ color: '#5865F2' }}>Cộng đồng</span>
                  <span className="text-sm font-bold text-on-surface leading-none truncate">Discord ✿</span>
                </div>
              </div>
            </a>
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
