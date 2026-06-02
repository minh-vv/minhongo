import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { systemApi } from '../api/systemApi';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';
import {
  IconMail,
  IconKey,
  IconUser,
  IconX,
  IconAlertCircle,
  IconCheckCircle,
  IconChevronLeft,
} from './Icons';

export default function AuthCard({ initialMode = 'login', onClose, isModal = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Mode can be 'login' | 'register' | 'forgot-password'
  const [mode, setMode] = useState(initialMode);
  
  // Input fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Errors & Alerts
  const [error, setError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Sync mode with initialMode prop when it changes
  useEffect(() => {
    setMode(initialMode);
    setError('');
    setForgotSent(false);
  }, [initialMode]);

  // Fetch system config (to check if registration is closed)
  const { data: publicCfg } = useQuery({
    queryKey: ['publicSystemConfig'],
    queryFn: systemApi.getPublicConfig,
    staleTime: 60_000,
    retry: 1,
  });
  const registrationClosed = publicCfg && publicCfg.allowRegistration === false;

  // Redirection URL logic (fallback to /dashboard)
  const getRedirectUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('return') || '/dashboard';
  };

  // Mutation: LOGIN
  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => authApi.login(email, password),
    onSuccess: (data) => {
      login(data.access_token, data.user);
      if (!isModal) {
        navigate(getRedirectUrl());
      } else if (onClose) {
        onClose();
      }
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không đúng');
    },
  });

  // Mutation: REGISTER
  const registerMutation = useMutation({
    mutationFn: ({ email, password, name }) => authApi.register(email, password, name),
    onSuccess: async () => {
      // Auto login after registration
      const loginData = await authApi.login(formData.email, formData.password);
      login(loginData.access_token, loginData.user);
      if (!isModal) {
        navigate(getRedirectUrl());
      } else if (onClose) {
        onClose();
      }
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    },
  });

  // Mutation: FORGOT PASSWORD
  const forgotMutation = useMutation({
    mutationFn: (email) => authApi.forgotPassword(email),
    onSuccess: () => {
      setForgotSent(true);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({ email: formData.email, password: formData.password });
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (registrationClosed) {
      setError('Đăng ký hiện tại đang đóng.');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự');
      return;
    }

    registerMutation.mutate({
      email: formData.email,
      password: formData.password,
      name: formData.name || undefined,
    });
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setError('');
    forgotMutation.mutate(formData.email);
  };

  const switchMode = (newMode) => {
    setError('');
    setForgotSent(false);
    setMode(newMode);
  };

  return (
    <div className="w-full max-w-4xl bg-surface-container-lowest overflow-hidden flex flex-col md:flex-row relative sharp-shadow border border-outline-variant/30 rounded-2xl animate-fade-up">
      {/* Close Button (for Modal Mode) */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Đóng"
        >
          <IconX className="w-5 h-5" />
        </button>
      )}

      {/* ── LEFT PANEL (DECORATIVE) ── */}
      <div className="md:w-[42%] bg-gradient-to-br from-[#1a237e] via-[#111754] to-[#070b30] flex flex-col justify-between p-8 text-white relative overflow-hidden min-h-[220px] md:min-h-[500px]">
        {/* Hemp Leaf Pattern Overlay */}
        <div className="absolute inset-0 asanoha-bg opacity-[0.06] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo_main.png" alt="Logo" className="h-9 w-auto object-contain bg-white/10 p-1 rounded" />
          <div>
            <h3 className="font-bold text-base leading-none">Minhongo</h3>
            <span className="text-indigo-300 text-[11px]">学日本語</span>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 my-auto py-6">
          {/* Kanji Background Watermark */}
          <div
            className="absolute -left-6 -bottom-10 text-[130px] font-black text-white/5 select-none pointer-events-none font-jp"
          >
            {mode === 'login' && '接続'}
            {mode === 'register' && '学習'}
            {mode === 'forgot-password' && '忘却'}
          </div>

          <h2 className="text-2xl font-extrabold text-white mb-2 leading-tight">
            {mode === 'login' && 'Chào mừng quay trở lại!'}
            {mode === 'register' && 'Khởi đầu hành trình mới'}
            {mode === 'forgot-password' && 'Đừng lo lắng!'}
          </h2>
          
          <p className="text-indigo-200 text-xs mb-6 leading-relaxed max-w-xs">
            {mode === 'login' && 'Tiếp tục rèn luyện tiếng Nhật mỗi ngày. Từng bước nhỏ tạo nên kết quả lớn.'}
            {mode === 'register' && 'Tham gia cùng cộng đồng tự học tiếng Nhật hiệu quả, cá nhân hóa với công nghệ AI.'}
            {mode === 'forgot-password' && 'Chúng tôi sẽ giúp bạn khôi phục lại mật khẩu tài khoản một cách nhanh chóng.'}
          </p>

          <ul className="space-y-2.5 text-xs text-indigo-100">
            <li className="flex items-center gap-2">
              <span className="text-indigo-400">✓</span>
              Học Hán tự N5~N1, từ vựng & ngữ pháp
            </li>
            <li className="flex items-center gap-2">
              <span className="text-indigo-400">✓</span>
              Lộ trình AI thông minh theo trình độ
            </li>
            <li className="flex items-center gap-2">
              <span className="text-indigo-400">✓</span>
              Thuật toán ôn tập SRS nhớ siêu lâu
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[10px] text-indigo-400">
          © 2026 Minhongo · Học tiếng Nhật thông minh
        </div>
      </div>

      {/* ── RIGHT PANEL (FORMS) ── */}
      <div className="flex-1 p-8 md:p-10 flex flex-col justify-center bg-surface-container-lowest">
        <div className="w-full max-w-sm mx-auto">
          {/* Form Header / Tabs */}
          {mode !== 'forgot-password' ? (
            <div className="flex border-b border-outline-variant/30 mb-8 relative">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative ${
                  mode === 'login' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Đăng nhập
                {mode === 'login' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary animate-fade-left" />
                )}
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative ${
                  mode === 'register' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Đăng ký
                {mode === 'register' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary animate-fade-left" />
                )}
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-secondary transition-colors font-medium mb-3"
              >
                <IconChevronLeft className="w-4 h-4" /> Quay lại đăng nhập
              </button>
              <h1 className="text-xl font-extrabold text-on-surface">Quên mật khẩu</h1>
              <p className="text-on-surface-variant text-xs mt-1">
                Nhập email của bạn để nhận link đặt lại mật khẩu.
              </p>
            </div>
          )}

          {/* Alert Error Box */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl animate-fade-up">
              <IconAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Form Content */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Email</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    <IconMail className="w-4 h-4" />
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@gmail.com"
                    className="w-full pl-10 pr-4 py-2 text-sm border border-outline-variant bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant">Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot-password')}
                    className="text-[11px] text-secondary hover:underline font-medium"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    <IconKey className="w-4 h-4" />
                  </span>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 text-sm border border-outline-variant bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full py-2.5 bg-secondary hover:bg-secondary-dim text-white text-sm font-bold uppercase tracking-wider rounded-xl transition duration-150 shadow-sm shadow-red-200 hover:shadow disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              >
                {loginMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {registrationClosed && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-955 rounded-xl text-xs flex gap-2">
                  <span>⚠️ Đăng ký tạm thời đã đóng. Vui lòng quay lại sau.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Họ tên <span className="text-on-surface-variant/60 font-normal">(tùy chọn)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    <IconUser className="w-4 h-4" />
                  </span>
                  <input
                    name="name"
                    type="text"
                    disabled={registrationClosed}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-10 pr-4 py-2 text-sm border border-outline-variant bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Email</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    <IconMail className="w-4 h-4" />
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    disabled={registrationClosed}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@gmail.com"
                    className="w-full pl-10 pr-4 py-2 text-sm border border-outline-variant bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    <IconKey className="w-4 h-4" />
                  </span>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    disabled={registrationClosed}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-10 pr-10 py-2 text-sm border border-outline-variant bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={registrationClosed}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Xác nhận mật khẩu</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    <IconKey className="w-4 h-4" />
                  </span>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    disabled={registrationClosed}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Xác nhận mật khẩu"
                    className="w-full pl-10 pr-10 py-2 text-sm border border-outline-variant bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={registrationClosed}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending || registrationClosed}
                className="w-full py-2.5 bg-secondary hover:bg-secondary-dim text-white text-sm font-bold uppercase tracking-wider rounded-xl transition duration-150 shadow-sm shadow-red-200 hover:shadow disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-5"
              >
                {registerMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang tạo tài khoản...
                  </>
                ) : (
                  'Tạo tài khoản miễn phí'
                )}
              </button>

              <p className="text-[10px] text-center text-on-surface-variant/60 mt-3 leading-snug">
                Bằng cách đăng ký, bạn đồng ý với Điều khoản sử dụng của Minhongo.
              </p>
            </form>
          )}

          {mode === 'forgot-password' && (
            <div>
              {!forgotSent ? (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Email đăng ký</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                        <IconMail className="w-4 h-4" />
                      </span>
                      <input
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@gmail.com"
                        className="w-full pl-10 pr-4 py-2 text-sm border border-outline-variant bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotMutation.isPending}
                    className="w-full py-2.5 bg-secondary hover:bg-secondary-dim text-white text-sm font-bold uppercase tracking-wider rounded-xl transition duration-150 shadow-sm shadow-red-200 hover:shadow disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                  >
                    {forgotMutation.isPending ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Đang gửi...
                      </>
                    ) : (
                      'Gửi link đặt lại mật khẩu'
                    )}
                  </button>
                </form>
              ) : (
                /* Success screen */
                <div className="text-center py-4 animate-fade-up">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                    <IconCheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-2">Kiểm tra hộp thư!</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                    Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu vào địa chỉ email{' '}
                    <strong className="text-on-surface">{formData.email}</strong> nếu tài khoản tồn tại trong hệ thống.
                  </p>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => setForgotSent(false)}
                      className="w-full py-2 border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface rounded-xl text-xs font-semibold transition"
                    >
                      Nhập lại email khác
                    </button>
                    <button
                      onClick={() => switchMode('login')}
                      className="w-full py-2 bg-secondary text-white hover:bg-secondary-dim rounded-xl text-xs font-bold transition uppercase tracking-wider"
                    >
                      Quay lại đăng nhập
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
