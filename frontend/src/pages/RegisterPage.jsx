import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { systemApi } from '../api/systemApi';
import { useAuth } from '../hooks/useAuth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const { data: publicCfg } = useQuery({
    queryKey: ['publicSystemConfig'],
    queryFn: systemApi.getPublicConfig,
    staleTime: 60_000,
    retry: 1,
  });
  const registrationClosed = publicCfg && publicCfg.allowRegistration === false;

  const registerMutation = useMutation({
    mutationFn: ({ email, password, name }) => authApi.register(email, password, name),
    onSuccess: async () => {
      const loginData = await authApi.login(formData.email, formData.password);
      login(loginData.access_token, loginData.user);
      navigate('/dashboard');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    registerMutation.mutate({ email: formData.email, password: formData.password, name: formData.name || undefined });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-indigo-600 to-violet-700 flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo_main.png" alt="Logo" className="h-10 w-auto object-contain" />
          <span className="text-indigo-300 text-base">学日本語</span>
        </Link>

        <div>
          <div
            className="text-[120px] leading-none font-black text-white/10 mb-6 select-none"
            style={{ fontFamily: 'serif' }}
          >
            学習
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Bắt đầu học tiếng Nhật hôm nay
          </h2>
          <p className="text-indigo-200 mb-8 leading-relaxed">
            Tham gia cùng hàng nghìn người Việt đang chinh phục tiếng Nhật với Minhongo.
            Miễn phí, không giới hạn.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '漢', label: 'Hán tự N5~N1' },
              { icon: '≡', label: 'Từ vựng chủ đề' },
              { icon: '📖', label: 'Ngữ pháp rõ ràng' },
              { icon: '🤖', label: 'Lộ trình AI' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5">
                <span className="text-lg">{f.icon}</span>
                <span className="text-indigo-100 text-xs font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-indigo-400 text-xs">© 2026 Minhongo</p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm mx-auto">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-xl font-bold text-indigo-600">Minhongo</span>
            <span className="text-gray-400 text-sm">学日本語</span>
          </Link>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Tạo tài khoản</h1>
          <p className="text-gray-500 text-sm mb-8">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
              Đăng nhập
            </Link>
          </p>

          {registrationClosed && (
            <div className="mb-5 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Đăng ký tạm thời đã đóng. Vui lòng quay lại sau hoặc liên hệ quản trị viên.</span>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Họ tên <span className="text-gray-400 font-normal">(tùy chọn)</span>
              </label>
              <input name="name" type="text" value={formData.name} onChange={handleChange} disabled={registrationClosed}
                placeholder="Nguyễn Văn A" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input name="email" type="email" required value={formData.email} onChange={handleChange} disabled={registrationClosed}
                placeholder="you@example.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
              <input name="password" type="password" required minLength={6} value={formData.password}
                onChange={handleChange} disabled={registrationClosed} placeholder="Ít nhất 6 ký tự" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
              <input name="confirmPassword" type="password" required minLength={6}
                value={formData.confirmPassword} onChange={handleChange} disabled={registrationClosed} placeholder="••••••••" className={inputClass} />
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending || registrationClosed}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm shadow-indigo-200 text-sm mt-2"
            >
              {registerMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang tạo tài khoản...
                </span>
              ) : (
                'Tạo tài khoản miễn phí'
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              Bằng cách đăng ký, bạn đồng ý với điều khoản sử dụng của Minhongo.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
