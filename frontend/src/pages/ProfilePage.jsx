import { useState, useRef, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { userApi } from '../api/userApi';

// ===== Predefined learning goals =====
const LEARNING_GOALS = [
  { value: 'jlpt_n5', label: 'Thi JLPT N5', icon: '🎯' },
  { value: 'jlpt_n4', label: 'Thi JLPT N4', icon: '🎯' },
  { value: 'jlpt_n3', label: 'Thi JLPT N3', icon: '🎯' },
  { value: 'jlpt_n2', label: 'Thi JLPT N2', icon: '🎯' },
  { value: 'jlpt_n1', label: 'Thi JLPT N1', icon: '🏆' },
  { value: 'travel', label: 'Du lịch Nhật Bản', icon: '✈️' },
  { value: 'work', label: 'Làm việc tại Nhật', icon: '💼' },
  { value: 'anime', label: 'Xem anime / manga', icon: '🎌' },
  { value: 'interest', label: 'Yêu thích ngôn ngữ', icon: '❤️' },
];

// ===== Section Header — app design system =====
function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1.5 h-6 flex-shrink-0" style={{ background: 'var(--secondary)' }} />
      <h2 className="text-lg font-headline font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      <div className="flex-1 h-px ml-1" style={{ background: 'linear-gradient(to right,rgba(0,0,0,0.08),transparent)' }} />
    </div>
  );
}

// ===== Avatar Upload Component =====
function AvatarSection({ profile, onAvatarChange, isUploading }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const initials = (profile?.name?.[0] || profile?.email?.[0] || 'U').toUpperCase();
  const avatarSrc = preview || profile?.avatarUrl;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Local preview ngay lập tức
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result);
    reader.readAsDataURL(file);
    // Gọi upload callback
    onAvatarChange(file);
  };

  // Sync preview khi avatarUrl thay đổi từ server
  useEffect(() => {
    if (profile?.avatarUrl) setPreview(null);
  }, [profile?.avatarUrl]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar circle */}
      <div className="relative group">
        <div className="w-28 h-28 overflow-hidden"
          style={{ border: '3px solid rgba(0,0,0,0.08)' }}>
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-black"
              style={{ background: 'rgba(26,35,126,0.08)', color: 'var(--primary)' }}>
              {initials}
            </div>
          )}
        </div>

        {/* Hover overlay */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0" />
            </svg>
          )}
        </button>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <div className="text-center">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="text-xs font-semibold transition-colors disabled:opacity-40"
          style={{ color: 'var(--secondary)' }}
        >
          {isUploading ? 'Đang tải lên...' : 'Đổi ảnh đại diện'}
        </button>
        <p className="text-[10px] text-on-surface-variant mt-0.5">JPG, PNG, WebP · Tối đa 5MB</p>
      </div>
    </div>
  );
}

// ===== Toast Notification =====
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-up">
      <div className="flex items-center gap-3 px-5 py-3 sharp-shadow"
        style={{
          background: type === 'success' ? 'var(--primary)' : 'var(--secondary)',
          color: '#fff',
        }}>
        <span className="text-lg">{type === 'success' ? '✅' : '❌'}</span>
        <span className="text-sm font-semibold">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    </div>
  );
}

// ===== Main ProfilePage =====
export default function ProfilePage() {
  const { user: authUser, isAuthenticated, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({ name: '', learningGoal: '' });
  const [toast, setToast] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // ── Fetch profile ──
  const { data: profile, isLoading } = useQuery({
    queryKey: ['myProfile'],
    queryFn: userApi.getProfile,
    onSuccess: (data) => {
      setFormData({ name: data.name || '', learningGoal: data.learningGoal || '' });
    },
  });

  // Sync form khi profile load xong
  useEffect(() => {
    if (profile) {
      setFormData({ name: profile.name || '', learningGoal: profile.learningGoal || '' });
    }
  }, [profile]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // ── Update profile mutation ──
  const updateMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      updateUser(data.user); // Sync AuthContext + localStorage
      setToast({ message: 'Hồ sơ đã được cập nhật!', type: 'success' });
      setHasChanges(false);
    },
    onError: (err) => {
      setToast({ message: err?.response?.data?.message || 'Có lỗi xảy ra', type: 'error' });
    },
  });

  // ── Upload avatar mutation ──
  const avatarMutation = useMutation({
    mutationFn: userApi.uploadAvatar,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      updateUser(data.user);
      setToast({ message: 'Ảnh đại diện đã được cập nhật!', type: 'success' });
    },
    onError: () => {
      setToast({ message: 'Upload ảnh thất bại. Kiểm tra định dạng và kích thước.', type: 'error' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '—';

  return (
    <div className="max-w-3xl mx-auto w-full p-6 md:p-8 space-y-10">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden animate-fade-up" style={{ minHeight: 120 }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 60%, #0d1b5e 100%)'
        }} />
        <div className="absolute inset-0 asanoha-bg opacity-20" />
        <div className="absolute right-0 top-0 bottom-0 w-1" style={{ background: 'var(--secondary)' }} />

        <div className="relative z-10 p-8 md:p-10 flex items-center gap-6">
          {/* Avatar mini */}
          <div className="w-16 h-16 flex-shrink-0 overflow-hidden"
            style={{ border: '3px solid rgba(255,255,255,0.25)' }}>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/80"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                {(profile?.name?.[0] || authUser?.email?.[0] || 'U').toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 mb-2"
              style={{ backdropFilter: 'blur(4px)' }}>
              <span className="w-1.5 h-1.5 rotate-45" style={{ background: 'var(--secondary)' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                Hồ sơ cá nhân
              </span>
            </div>
            <h1 className="font-headline text-2xl md:text-3xl font-bold text-white leading-tight"
              style={{ letterSpacing: '-0.02em' }}>
              {profile?.name || authUser?.email?.split('@')[0] || 'Người dùng'}
            </h1>
            <p className="text-white/50 text-sm mt-1">Thành viên từ {joinDate}</p>
          </div>
        </div>

        <div className="absolute -right-4 -bottom-4 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none"
          style={{ fontSize: 140 }}>私</div>
      </section>

      {/* ── FORM ──────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-outline-variant border-t-secondary animate-spin rounded-full" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-10">

          {/* ── Avatar ── */}
          <section>
            <SectionHeader title="Ảnh đại diện" />
            <div className="bg-surface-container-lowest p-6 flex flex-col sm:flex-row items-center gap-8"
              style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
              <AvatarSection
                profile={profile}
                onAvatarChange={(file) => avatarMutation.mutate(file)}
                isUploading={avatarMutation.isPending}
              />

              <div className="text-sm text-on-surface-variant space-y-2 text-center sm:text-left">
                <p className="font-semibold text-on-surface">Tải lên ảnh đại diện</p>
                <p>Di chuột lên ảnh và nhấn vào biểu tượng máy ảnh để thay đổi.</p>
                <p className="text-xs">Hỗ trợ: JPG, PNG, WebP, GIF · Tối đa 5MB</p>
                {profile?.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => avatarMutation.mutate(null)}
                    className="text-xs font-semibold transition-colors"
                    style={{ color: 'var(--secondary)' }}
                  >
                    Xóa ảnh đại diện
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ── Thông tin cơ bản ── */}
          <section>
            <SectionHeader title="Thông tin cơ bản" />
            <div className="bg-surface-container-lowest p-6 space-y-5"
              style={{ border: '1px solid rgba(0,0,0,0.07)' }}>

              {/* Tên hiển thị */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Nhập tên của bạn..."
                  className="w-full px-4 py-2.5 bg-surface text-on-surface text-sm outline-none transition-all"
                  style={{ border: '1px solid rgba(0,0,0,0.15)' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--secondary)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.15)'}
                />
              </div>

              {/* Email — readonly */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  Email
                </label>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-container text-sm"
                  style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
                  <svg className="w-4 h-4 text-on-surface-variant flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-on-surface flex-1">{profile?.email}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"
                    style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--on-surface-variant)' }}>
                    Không thể thay đổi
                  </span>
                </div>
              </div>

              {/* Ngày tham gia */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  Ngày tham gia
                </label>
                <div className="px-4 py-2.5 bg-surface-container text-sm text-on-surface-variant"
                  style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
                  {joinDate}
                </div>
              </div>
            </div>
          </section>

          {/* ── Mục tiêu học tập ── */}
          <section>
            <SectionHeader title="Mục tiêu học tập" />
            <div className="bg-surface-container-lowest p-6"
              style={{ border: '1px solid rgba(0,0,0,0.07)' }}>

              <p className="text-xs text-on-surface-variant mb-4">
                Chọn mục tiêu giúp AI cá nhân hóa lộ trình học cho bạn.
              </p>

              {/* Grid mục tiêu */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {LEARNING_GOALS.map((goal) => {
                  const isSelected = formData.learningGoal === goal.value;
                  return (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => handleFormChange('learningGoal', isSelected ? '' : goal.value)}
                      className="flex items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition-all"
                      style={{
                        border: `2px solid ${isSelected ? 'var(--secondary)' : 'rgba(0,0,0,0.1)'}`,
                        background: isSelected ? 'rgba(198,40,40,0.06)' : 'var(--surface)',
                        color: isSelected ? 'var(--secondary)' : 'var(--on-surface)',
                      }}
                    >
                      <span className="text-base flex-shrink-0">{goal.icon}</span>
                      <span className="text-xs font-semibold leading-tight">{goal.label}</span>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Hoặc nhập tự do */}
              {!LEARNING_GOALS.some((g) => g.value === formData.learningGoal) && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    Hoặc nhập mục tiêu của bạn
                  </label>
                  <input
                    type="text"
                    value={formData.learningGoal}
                    onChange={(e) => handleFormChange('learningGoal', e.target.value)}
                    placeholder="Ví dụ: Học để hiểu văn hoá Nhật Bản..."
                    maxLength={100}
                    className="w-full px-4 py-2.5 bg-surface text-on-surface text-sm outline-none transition-all"
                    style={{ border: '1px solid rgba(0,0,0,0.15)' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--secondary)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.15)'}
                  />
                </div>
              )}
            </div>
          </section>

          {/* ── Save button + links ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={updateMutation.isPending || !hasChanges}
                className="px-8 py-2.5 text-sm font-bold text-on-secondary uppercase tracking-wider transition-all disabled:opacity-40 hover:bg-secondary-dim"
                style={{ background: 'var(--secondary)' }}
              >
                {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              {hasChanges && (
                <span className="text-xs text-on-surface-variant">Có thay đổi chưa lưu</span>
              )}
            </div>

            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Đổi mật khẩu
            </Link>
          </div>
        </form>
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
