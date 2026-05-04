import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { adminApi } from '../api/adminApi';

// ===== Section Header — matches DashboardPage =====
function SectionHeader({ title, accent = 'var(--secondary)', action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-6 flex-shrink-0" style={{ background: accent }} />
        <h2 className="text-lg font-headline font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
          {title}
        </h2>
        <div className="flex-1 h-px ml-1" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)' }} />
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  );
}

// ===== Stat Card — flat Japanese style =====
function StatCard({ label, value, icon, accentColor = 'var(--secondary)' }) {
  return (
    <div className="bg-surface-container-lowest p-5 relative overflow-hidden animate-fade-up"
      style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: accentColor }} />
      <div className="pl-3">
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">{label}</p>
        <p className="text-3xl font-black text-on-surface leading-none mb-0.5">{value ?? '—'}</p>
      </div>
      {/* Ghost icon */}
      <div className="absolute -right-1 -bottom-2 text-5xl opacity-[0.04] pointer-events-none select-none">
        {icon}
      </div>
    </div>
  );
}

// ===== Delete Confirm Modal =====
function DeleteConfirmModal({ user, onConfirm, onCancel, isPending }) {
  if (!user) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-lowest w-full max-w-sm p-6 sharp-shadow"
        style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
        {/* Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(198,40,40,0.1)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ color: 'var(--secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-headline font-bold text-on-surface">Xác nhận xóa tài khoản</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Hành động này không thể hoàn tác</p>
          </div>
        </div>

        <p className="text-sm text-on-surface-variant mb-5 pl-1">
          Bạn sắp xóa vĩnh viễn tài khoản{' '}
          <span className="font-semibold text-on-surface">{user.email}</span>{' '}
          cùng tất cả dữ liệu liên quan.
        </p>

        <div className="flex gap-3">
          <button onClick={onCancel} disabled={isPending}
            className="flex-1 px-4 py-2 text-sm font-medium text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors disabled:opacity-50">
            Hủy
          </button>
          <button onClick={onConfirm} disabled={isPending}
            className="flex-1 px-4 py-2 text-sm font-bold text-on-secondary hover:bg-secondary-dim transition-colors disabled:opacity-50"
            style={{ background: 'var(--secondary)' }}>
            {isPending ? 'Đang xóa...' : 'Xóa tài khoản'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Status Badge =====
function StatusBadge({ isBlocked }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{
        background: isBlocked ? 'rgba(198,40,40,0.1)' : 'rgba(26,35,126,0.08)',
        color: isBlocked ? 'var(--secondary)' : 'var(--primary)',
      }}>
      <span className="w-1.5 h-1.5"
        style={{ background: isBlocked ? 'var(--secondary)' : 'var(--primary)' }} />
      {isBlocked ? 'Đã khóa' : 'Hoạt động'}
    </span>
  );
}

// ===== Main AdminUsersPage =====
export default function AdminUsersPage() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deletingUser, setDeletingUser] = useState(null);

  // Debounce search 400ms
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleStatusChange = useCallback((s) => { setStatusFilter(s); setPage(1); }, []);

  // Guard
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentUser && !currentUser.isAdmin) return <Navigate to="/dashboard" replace />;

  // ── Stats ──
  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getStats,
    staleTime: 30_000,
  });

  // ── Users ──
  const { data: usersData, isLoading, isFetching } = useQuery({
    queryKey: ['adminUsers', debouncedSearch, statusFilter, page],
    queryFn: () => adminApi.getUsers({ search: debouncedSearch, status: statusFilter, page }),
    keepPreviousData: true,
  });

  // ── Mutations ──
  const toggleBlockMutation = useMutation({
    mutationFn: (userId) => adminApi.toggleBlockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setDeletingUser(null);
    },
  });

  const users = usersData?.users || [];
  const totalPages = usersData?.totalPages || 1;
  const total = usersData?.total || 0;

  const STAT_CARDS = [
    { label: 'Tổng người dùng', value: stats?.totalUsers,  icon: '👥', accentColor: 'var(--primary)' },
    { label: 'Đang hoạt động',  value: stats?.activeUsers,  icon: '✅', accentColor: '#2e7d32' },
    { label: 'Đã bị khóa',      value: stats?.blockedUsers, icon: '🔒', accentColor: 'var(--secondary)' },
    { label: 'Mới hôm nay',     value: stats?.newToday,     icon: '🆕', accentColor: '#6a1b9a' },
  ];

  const STATUS_TABS = [
    { value: 'all',     label: 'Tất cả',         count: stats?.totalUsers },
    { value: 'active',  label: 'Hoạt động',       count: stats?.activeUsers },
    { value: 'blocked', label: 'Đã khóa',         count: stats?.blockedUsers },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-10">

      {/* ── HERO BANNER ─────────────────────────────────────── */}
      <section className="relative overflow-hidden animate-fade-up"
        style={{ minHeight: 140 }}>
        {/* Gradient background */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 60%, #0d1b5e 100%)'
        }} />
        {/* Asanoha overlay */}
        <div className="absolute inset-0 asanoha-bg opacity-20" />
        {/* Vermilion right bar */}
        <div className="absolute right-0 top-0 bottom-0 w-1" style={{ background: 'var(--secondary)' }} />

        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {/* Breadcrumb */}
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 mb-4"
              style={{ backdropFilter: 'blur(4px)' }}>
              <span className="w-1.5 h-1.5 rotate-45 flex-shrink-0" style={{ background: 'var(--secondary)' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                Admin · Quản trị hệ thống
              </span>
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-white leading-tight"
              style={{ letterSpacing: '-0.02em' }}>
              Quản lý người dùng
            </h1>
            <p className="text-white/50 text-sm mt-2">
              Xem, tìm kiếm, khóa/mở tài khoản người dùng trong hệ thống
            </p>
          </div>

          {/* Total count badge */}
          <div className="flex-shrink-0 text-center bg-white/10 px-8 py-4"
            style={{ backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-4xl font-black text-white leading-none">{stats?.totalUsers ?? '—'}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Người dùng</p>
          </div>
        </div>

        {/* Ghost kanji */}
        <div className="absolute -right-4 -bottom-4 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none"
          style={{ fontSize: 160 }}>人</div>
      </section>

      {/* ── STATS ROW ───────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {STAT_CARDS.map((s, i) => (
            <div key={s.label} style={{ animationDelay: `${i * 60}ms` }}>
              <StatCard {...s} />
            </div>
          ))}
        </div>
      </section>

      {/* ── USER TABLE ──────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Danh sách người dùng"
          action={
            isFetching && !isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <div className="w-3 h-3 border border-outline-variant border-t-secondary animate-spin rounded-full" />
                Đang cập nhật...
              </div>
            )
          }
        />

        <div className="bg-surface-container-lowest" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>

          {/* Search + Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 border-b"
            style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'var(--surface-container-low)' }}>
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest text-on-surface text-sm outline-none"
                style={{ border: '1px solid rgba(0,0,0,0.12)' }}
              />
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-0.5 bg-surface-container p-0.5"
              style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleStatusChange(tab.value)}
                  className="px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5"
                  style={{
                    background: statusFilter === tab.value ? 'var(--surface-container-lowest)' : 'transparent',
                    color: statusFilter === tab.value ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                    boxShadow: statusFilter === tab.value ? '1px 1px 0 0 rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="px-1.5 py-px text-[9px] font-bold"
                      style={{
                        background: statusFilter === tab.value ? 'rgba(198,40,40,0.1)' : 'rgba(0,0,0,0.06)',
                        color: statusFilter === tab.value ? 'var(--secondary)' : 'var(--on-surface-variant)',
                      }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Result count */}
          <div className="px-6 py-2.5 border-b text-xs text-on-surface-variant"
            style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
            {isLoading ? 'Đang tải...' : `Tìm thấy ${total} người dùng`}
            {debouncedSearch && ` · Tìm kiếm: "${debouncedSearch}"`}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-on-surface-variant">
              <div className="w-5 h-5 border-2 border-outline-variant border-t-secondary animate-spin rounded-full" />
              <span className="text-sm">Đang tải dữ liệu...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🔍</p>
              <p className="font-semibold text-on-surface text-sm mb-1">Không tìm thấy người dùng nào</p>
              <p className="text-xs text-on-surface-variant">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'var(--surface-container-low)' }}>
                    {['Người dùng', 'Email', 'Ngày đăng ký', 'Số deck', 'Trạng thái', 'Hành động'].map((h, i) => (
                      <th key={h} className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ${i === 3 ? 'text-center' : i === 4 ? 'text-center' : i === 5 ? 'text-right' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, rowIdx) => {
                    const isSelf = user.id === currentUser?.id;
                    const initials = (user.name?.[0] || user.email?.[0] || 'U').toUpperCase();
                    const isEven = rowIdx % 2 === 0;

                    return (
                      <tr key={user.id}
                        className="border-b transition-colors"
                        style={{
                          borderColor: 'rgba(0,0,0,0.04)',
                          background: isEven ? 'var(--surface-container-lowest)' : 'var(--surface)',
                          opacity: user.isBlocked ? 0.65 : 1,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
                        onMouseLeave={e => e.currentTarget.style.background = isEven ? 'var(--surface-container-lowest)' : 'var(--surface)'}
                      >
                        {/* Avatar + name */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center text-xs font-black flex-shrink-0"
                              style={{
                                background: user.isAdmin ? 'rgba(198,40,40,0.12)' : 'rgba(26,35,126,0.1)',
                                color: user.isAdmin ? 'var(--secondary)' : 'var(--primary)',
                                border: `1px solid ${user.isAdmin ? 'rgba(198,40,40,0.2)' : 'rgba(26,35,126,0.15)'}`,
                              }}>
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-on-surface">
                                  {user.name || '—'}
                                </span>
                                {isSelf && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5"
                                    style={{ background: 'rgba(26,35,126,0.08)', color: 'var(--primary)' }}>
                                    Bạn
                                  </span>
                                )}
                              </div>
                              {user.isAdmin && (
                                <span className="text-[9px] font-bold uppercase tracking-wider"
                                  style={{ color: 'var(--secondary)' }}>
                                  ◆ Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-3.5 text-sm text-on-surface-variant">{user.email}</td>

                        {/* Join date */}
                        <td className="px-6 py-3.5 text-xs text-on-surface-variant tabular-nums">
                          {new Date(user.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                          })}
                        </td>

                        {/* Deck count */}
                        <td className="px-6 py-3.5 text-center">
                          <span className="text-sm font-bold text-on-surface">{user._count?.decks ?? 0}</span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-3.5 text-center">
                          <StatusBadge isBlocked={user.isBlocked} />
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            {!user.isAdmin && !isSelf ? (
                              <>
                                {/* Toggle block */}
                                <button
                                  onClick={() => toggleBlockMutation.mutate(user.id)}
                                  disabled={toggleBlockMutation.isPending}
                                  className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40"
                                  style={user.isBlocked ? {
                                    background: 'rgba(26,35,126,0.1)',
                                    color: 'var(--primary)',
                                    border: '1px solid rgba(26,35,126,0.2)',
                                  } : {
                                    background: 'rgba(198,40,40,0.08)',
                                    color: 'var(--secondary)',
                                    border: '1px solid rgba(198,40,40,0.2)',
                                  }}
                                >
                                  {user.isBlocked ? '🔓 Mở khóa' : '🔒 Khóa'}
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => setDeletingUser(user)}
                                  className="p-1.5 transition-colors text-on-surface-variant hover:text-secondary"
                                  title="Xóa tài khoản"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-on-surface-variant italic opacity-50">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t"
              style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'var(--surface-container-low)' }}>
              <p className="text-xs text-on-surface-variant tabular-nums">
                Trang <span className="font-bold text-on-surface">{page}</span> / {totalPages}
                {' '}· Tổng <span className="font-bold text-on-surface">{total}</span> người dùng
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors disabled:opacity-30 hover:bg-surface-container"
                  style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
                  ← Trước
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-8 h-8 text-xs font-bold transition-colors"
                      style={{
                        background: p === page ? 'var(--secondary)' : 'transparent',
                        color: p === page ? 'var(--on-secondary)' : 'var(--on-surface-variant)',
                        border: `1px solid ${p === page ? 'var(--secondary)' : 'rgba(0,0,0,0.1)'}`,
                      }}>
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors disabled:opacity-30 hover:bg-surface-container"
                  style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Delete confirm modal */}
      <DeleteConfirmModal
        user={deletingUser}
        onConfirm={() => deleteMutation.mutate(deletingUser?.id)}
        onCancel={() => setDeletingUser(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
