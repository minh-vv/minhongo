import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { adminApi } from '../api/adminApi';

function SectionHeader({ title, accent = 'var(--secondary)' }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1.5 h-6 flex-shrink-0" style={{ background: accent }} />
      <h2 className="text-lg font-headline font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      <div className="flex-1 h-px ml-1" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)' }} />
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
      <div>
        <p className="text-sm font-semibold text-on-surface">{label}</p>
        <p className="text-xs text-on-surface-variant mt-1 max-w-xl">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="flex-shrink-0 w-12 h-7 rounded-full transition-colors relative disabled:opacity-40"
        style={{ background: checked ? 'var(--primary)' : 'rgba(0,0,0,0.15)' }}
      >
        <span
          className="absolute top-1 w-5 h-5 bg-white transition-all shadow"
          style={{ left: checked ? 'calc(100% - 1.4rem)' : '0.25rem' }}
        />
      </button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [allowRegistration, setAllowRegistration] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [guestDemoCards, setGuestDemoCards] = useState(5);
  const [savedFlash, setSavedFlash] = useState(false);

  const isAdminUser = !!(isAuthenticated && currentUser?.isAdmin);

  const { data: rawSettings, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: adminApi.getSettings,
    staleTime: 15_000,
    enabled: isAdminUser,
  });

  useEffect(() => {
    if (!rawSettings) return;
    setAllowRegistration(rawSettings.allow_registration !== 'false');
    setMaintenanceMode(rawSettings.maintenance_mode === 'true');
    setAnnouncementMessage(rawSettings.announcement_message || '');
    const n = parseInt(rawSettings.guest_demo_cards, 10);
    setGuestDemoCards(Number.isNaN(n) ? 5 : Math.min(50, Math.max(1, n)));
  }, [rawSettings]);

  const saveMutation = useMutation({
    mutationFn: () => adminApi.patchSettings({
      allowRegistration,
      maintenanceMode,
      announcementMessage,
      guestDemoCards,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      queryClient.invalidateQueries({ queryKey: ['publicSystemConfig'] });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    },
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentUser && !currentUser.isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="max-w-3xl mx-auto w-full p-6 md:p-8 space-y-10">

      <section className="relative overflow-hidden animate-fade-up" style={{ minHeight: 120 }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 50%, #311b92 100%)',
        }} />
        <div className="absolute inset-0 asanoha-bg opacity-15" />
        <div className="absolute right-0 top-0 bottom-0 w-1" style={{ background: 'var(--secondary)' }} />
        <div className="relative z-10 p-8 md:p-10">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 mb-4" style={{ backdropFilter: 'blur(4px)' }}>
            <span className="w-1.5 h-1.5 rotate-45 flex-shrink-0" style={{ background: 'var(--secondary)' }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Admin · Cấu hình</span>
          </div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-white leading-tight" style={{ letterSpacing: '-0.02em' }}>
            Cấu hình hệ thống
          </h1>
          <p className="text-white/55 text-sm mt-2">
            Điều khiển đăng ký, thông báo toàn cục và trải nghiệm khách
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 font-jp font-bold text-white/[0.05] leading-none select-none pointer-events-none" style={{ fontSize: 140 }}>設</div>
      </section>

      {isLoading ? (
        <div className="flex justify-center py-20 text-on-surface-variant text-sm gap-2">
          <div className="w-5 h-5 border-2 border-outline-variant border-t-secondary animate-spin rounded-full" />
          Đang tải cấu hình...
        </div>
      ) : (
        <section className="bg-surface-container-lowest sharp-shadow p-6 md:p-8" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          <SectionHeader title="Truy cập & vận hành" />

          <ToggleRow
            label="Cho phép đăng ký tài khoản mới"
            description="Khi tắt, API đăng ký trả lỗi và trang Đăng ký hiển thị thông báo khóa."
            checked={allowRegistration}
            onChange={setAllowRegistration}
            disabled={saveMutation.isPending}
          />
          <ToggleRow
            label="Chế độ bảo trì (banner)"
            description="Bật để hiển thị cảnh báo trên toàn app. API vẫn hoạt động — chỉ là thông báo cho người dùng."
            checked={maintenanceMode}
            onChange={setMaintenanceMode}
            disabled={saveMutation.isPending}
          />

          <div className="pt-6 pb-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Thông báo banner (tối đa 500 ký tự)</label>
            <textarea
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ví dụ: Hệ thống bảo trì từ 22:00–24:00..."
              className="mt-2 w-full px-3 py-2 text-sm bg-surface-container-lowest text-on-surface outline-none resize-none"
              style={{ border: '1px solid rgba(0,0,0,0.12)' }}
            />
            <p className="text-[10px] text-on-surface-variant mt-1 tabular-nums">{announcementMessage.length}/500</p>
          </div>

          <div className="pt-4 pb-6">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Số thẻ flashcard tối đa cho khách (thử nghiệm)</label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="number"
                min={1}
                max={50}
                value={guestDemoCards}
                onChange={(e) => setGuestDemoCards(Math.min(50, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                className="w-24 px-3 py-2 text-sm tabular-nums bg-surface-container-lowest outline-none"
                style={{ border: '1px solid rgba(0,0,0,0.12)' }}
              />
              <span className="text-xs text-on-surface-variant">Trang demo đọc giá trị này từ API công khai.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="px-6 py-2.5 text-sm font-bold text-on-secondary hover:bg-secondary-dim transition-colors disabled:opacity-50"
              style={{ background: 'var(--secondary)' }}
            >
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
            {savedFlash && (
              <span className="text-sm font-medium" style={{ color: '#2e7d32' }}>Đã lưu thành công.</span>
            )}
            {saveMutation.isError && (
              <span className="text-sm text-secondary">
                {saveMutation.error?.response?.data?.message || 'Lưu thất bại.'}
              </span>
            )}
          </div>
        </section>
      )}

      <p className="text-xs text-on-surface-variant px-1">
        Endpoint công khai: <code className="text-[11px] bg-surface-container px-1 py-0.5">GET /system/public-config</code>
        {' '}— dùng cho trang đăng ký, demo khách và banner.
      </p>
    </div>
  );
}
