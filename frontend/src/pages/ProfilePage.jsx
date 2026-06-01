import { useState, useRef, useEffect, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { userApi } from '../api/userApi';
import {
  IconTarget, IconTrophy, IconPlane, IconBriefcase, IconTv,
  IconHeart, IconCamera, IconKey, IconChevronDown, IconCheck,
  IconCheckCircle, IconXCircle, IconAlertCircle, IconMail,
} from '../components/Icons';

// ===== Predefined learning goals =====
const LEARNING_GOALS = [
  { value: 'jlpt_n5', label: 'Thi JLPT N5', icon: <IconTarget className="w-4 h-4" /> },
  { value: 'jlpt_n4', label: 'Thi JLPT N4', icon: <IconTarget className="w-4 h-4" /> },
  { value: 'jlpt_n3', label: 'Thi JLPT N3', icon: <IconTarget className="w-4 h-4" /> },
  { value: 'jlpt_n2', label: 'Thi JLPT N2', icon: <IconTarget className="w-4 h-4" /> },
  { value: 'jlpt_n1', label: 'Thi JLPT N1', icon: <IconTrophy className="w-4 h-4" /> },
  { value: 'travel', label: 'Du lịch Nhật Bản', icon: <IconPlane className="w-4 h-4" /> },
  { value: 'work', label: 'Làm việc tại Nhật', icon: <IconBriefcase className="w-4 h-4" /> },
  { value: 'anime', label: 'Xem anime / manga', icon: <IconTv className="w-4 h-4" /> },
  { value: 'interest', label: 'Yêu thích ngôn ngữ', icon: <IconHeart className="w-4 h-4" /> },
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

  const [prevAvatarUrl, setPrevAvatarUrl] = useState(profile?.avatarUrl);
  if (profile?.avatarUrl !== prevAvatarUrl) {
    setPrevAvatarUrl(profile?.avatarUrl);
    setPreview(null);
  }

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
            <IconCamera className="w-7 h-7 text-white" />
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
        <span className="text-lg">{type === 'success' ? <IconCheckCircle className="w-5 h-5" /> : <IconXCircle className="w-5 h-5" />}</span>
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

  // ── Fetch profile ──
  const { data: profile, isLoading } = useQuery({
    queryKey: ['myProfile'],
    queryFn: userApi.getProfile,
    enabled: isAuthenticated,
    onSuccess: (data) => {
      setFormData({ name: data.name || '', learningGoal: data.learningGoal || '' });
    },
  });

  // Sync form khi profile load xong
  const [prevProfile, setPrevProfile] = useState(null);
  if (profile !== prevProfile) {
    setPrevProfile(profile);
    if (profile) {
      setFormData({ name: profile.name || '', learningGoal: profile.learningGoal || '' });
    }
  }

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

  if (!isAuthenticated) return <Navigate to="/login" replace />;

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
                  <IconMail className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
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
                        <IconCheck className="w-3.5 h-3.5 ml-auto flex-shrink-0" />
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

          {/* ── Save button ── */}
          <div className="flex items-center gap-4 pb-2">
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
        </form>
      )}

      {/* ── Đổi mật khẩu ── */}
      {!isLoading && <ChangePasswordSection onToast={setToast} />}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

// ===== Change Password Section (tách riêng để có state độc lập) =====
function ChangePasswordSection({ onToast }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [validationError, setValidationError] = useState('');

  const mutation = useMutation({
    mutationFn: userApi.changePassword,
    onSuccess: () => {
      onToast({ message: 'Đổi mật khẩu thành công!', type: 'success' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setOpen(false);
    },
    onError: (err) => {
      onToast({
        message: err?.response?.data?.message || 'Mật khẩu hiện tại không đúng',
        type: 'error',
      });
    },
  });

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setValidationError('');

    if (form.newPassword.length < 6) {
      setValidationError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setValidationError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (form.currentPassword === form.newPassword) {
      setValidationError('Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    mutation.mutate({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
  }, [form, mutation]);

  return (
    <section className="pb-8">
      <SectionHeader title="Bảo mật" />
      <div className="bg-surface-container-lowest" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>

        {/* Toggle row */}
        <button
          type="button"
          onClick={() => { setOpen((o) => !o); setValidationError(''); mutation.reset(); }}
          className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-surface-container-low"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}>
              <IconKey className="w-4 h-4 text-on-surface-variant" />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Đổi mật khẩu</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Thay đổi mật khẩu đăng nhập hiện tại</p>
            </div>
          </div>
          <IconChevronDown
            className={`w-4 h-4 text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Form (collapsible) */}
        {open && (
          <div className="border-t px-5 pb-5 pt-4 space-y-4"
            style={{ borderColor: 'rgba(0,0,0,0.06)' }}>

            {/* Validation / server error */}
            {(validationError || mutation.isError) && (
              <div className="flex items-start gap-2 p-3 text-sm"
                style={{ background: 'rgba(198,40,40,0.07)', border: '1px solid rgba(198,40,40,0.2)', color: 'var(--secondary)' }}>
                <IconAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {validationError || mutation.error?.response?.data?.message || 'Có lỗi xảy ra'}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mật khẩu hiện tại */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  required
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  placeholder="Nhập mật khẩu đang dùng"
                  className="w-full px-4 py-2.5 bg-surface text-on-surface text-sm outline-none transition-all"
                  style={{ border: '1px solid rgba(0,0,0,0.15)' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--secondary)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.15)'}
                />
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="Ít nhất 6 ký tự"
                  className="w-full px-4 py-2.5 bg-surface text-on-surface text-sm outline-none transition-all"
                  style={{ border: '1px solid rgba(0,0,0,0.15)' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--secondary)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.15)'}
                />
              </div>

              {/* Xác nhận mật khẩu */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full px-4 py-2.5 bg-surface text-on-surface text-sm outline-none transition-all"
                  style={{
                    border: `1px solid ${
                      form.confirmPassword && form.confirmPassword !== form.newPassword
                        ? 'var(--secondary)'
                        : 'rgba(0,0,0,0.15)'
                    }`,
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--secondary)'}
                  onBlur={(e) => {
                    e.target.style.borderColor =
                      form.confirmPassword && form.confirmPassword !== form.newPassword
                        ? 'var(--secondary)'
                        : 'rgba(0,0,0,0.15)';
                  }}
                />
                {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                  <p className="text-xs mt-1" style={{ color: 'var(--secondary)' }}>
                    Mật khẩu không khớp
                  </p>
                )}
              </div>

              {/* Strength hint */}
              {form.newPassword.length > 0 && (
                <div className="flex items-center gap-2">
                  {['Yếu', 'Trung bình', 'Mạnh'].map((label, i) => {
                    const strength =
                      form.newPassword.length < 6 ? 0
                      : form.newPassword.length < 10 ? 1
                      : /[A-Z]/.test(form.newPassword) && /[0-9]/.test(form.newPassword) ? 3
                      : 2;
                    return (
                      <div key={label} className="flex items-center gap-1">
                        <div className="h-1.5 w-10 transition-all"
                          style={{ background: i < strength ? ['#ef5350', '#ffa726', '#66bb6a'][i] : 'rgba(0,0,0,0.1)' }} />
                        {i === strength - 1 && (
                          <span className="text-[10px] font-semibold" style={{ color: ['#ef5350', '#ffa726', '#66bb6a'][i] }}>
                            {label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="px-6 py-2.5 text-sm font-bold text-on-secondary uppercase tracking-wider transition-all disabled:opacity-40 hover:bg-secondary-dim"
                  style={{ background: 'var(--secondary)' }}
                >
                  {mutation.isPending ? 'Đang đổi...' : 'Xác nhận đổi mật khẩu'}
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); setForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setValidationError(''); }}
                  className="px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
                  style={{ border: '1px solid rgba(0,0,0,0.1)' }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
