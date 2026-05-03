import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => authApi.login(email, password),
    onSuccess: (data) => {
      login(data.access_token, data.user);
      navigate('/dashboard');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không đúng');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate(formData);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-indigo-600 to-violet-700 flex-col justify-between p-12">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo_main.png" alt="Logo" className="h-10 w-auto object-contain" />
          <span className="text-indigo-300 text-base">学日本語</span>
        </Link>

        {/* Center content */}
        <div>
          <div
            className="text-[120px] leading-none font-black text-white/10 mb-6 select-none"
            style={{ fontFamily: 'serif' }}
          >
            日本語
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Chào mừng quay trở lại!
          </h2>
          <p className="text-indigo-200 mb-8 leading-relaxed">
            Tiếp tục hành trình học tiếng Nhật của bạn. Mỗi ngày một ít, tiến bộ mỗi ngày.
          </p>
          <ul className="space-y-3">
            {[
              'Hán tự, từ vựng & ngữ pháp có hệ thống',
              'Lộ trình AI cá nhân hóa theo trình độ',
              'Ôn tập SRS — không bao giờ quên',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-indigo-100 text-sm">
                <svg className="w-5 h-5 text-indigo-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-indigo-400 text-xs">© 2026 Minhongo</p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile brand */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-xl font-bold text-indigo-600">Minhongo</span>
            <span className="text-gray-400 text-sm">学日本語</span>
          </Link>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Đăng nhập</h1>
          <p className="text-gray-500 text-sm mb-8">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
              Đăng ký miễn phí
            </Link>
          </p>

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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                <Link to="/forgot-password" className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm shadow-indigo-200 text-sm mt-2"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
