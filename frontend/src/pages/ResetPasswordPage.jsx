import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [validationError, setValidationError] = useState('');
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ token, newPassword }) => authApi.resetPassword(token, newPassword),
    onSuccess: () => {
      setDone(true);
      // Tự động chuyển về login sau 3 giây
      setTimeout(() => navigate('/login'), 3000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (formData.newPassword.length < 6) {
      setValidationError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setValidationError('Mật khẩu xác nhận không khớp.');
      return;
    }

    mutation.mutate({ token, newPassword: formData.newPassword });
  };

  // Token không có trong URL
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link không hợp lệ</h2>
          <p className="text-gray-500 text-sm mb-6">
            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
          </p>
          <Link to="/forgot-password"
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
            Yêu cầu link mới
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-indigo-600 to-violet-700 flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo_main.png" alt="Logo" className="h-10 w-auto object-contain" />
          <span className="text-indigo-300 text-base">学日本語</span>
        </Link>

        <div>
          <div className="text-[120px] leading-none font-black text-white/10 mb-6 select-none"
            style={{ fontFamily: 'serif' }}>
            新
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">Đặt mật khẩu mới</h2>
          <p className="text-indigo-200 mb-8 leading-relaxed">
            Tạo mật khẩu mạnh để bảo vệ tài khoản học tập của bạn.
          </p>
          <ul className="space-y-3">
            {[
              'Ít nhất 6 ký tự',
              'Nên kết hợp chữ, số và ký tự đặc biệt',
              'Không dùng thông tin cá nhân dễ đoán',
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

          {!done ? (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Đặt mật khẩu mới</h1>
              <p className="text-gray-500 text-sm mb-8">
                Nhập mật khẩu mới cho tài khoản của bạn.
              </p>

              {/* Lỗi validation phía client */}
              {validationError && (
                <div className="mb-5 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationError}
                </div>
              )}

              {/* Lỗi từ server (token hết hạn, không hợp lệ...) */}
              {mutation.isError && (
                <div className="mb-5 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    {mutation.error?.response?.data?.message || 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'}
                    {' '}<Link to="/forgot-password" className="underline font-medium">Yêu cầu link mới</Link>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Mật khẩu mới */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                {/* Xác nhận mật khẩu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Nhập lại mật khẩu"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                      formData.confirmPassword && formData.confirmPassword !== formData.newPassword
                        ? 'border-red-300 focus:ring-red-400'
                        : 'border-gray-200 focus:ring-indigo-500'
                    }`}
                  />
                  {formData.confirmPassword && formData.confirmPassword !== formData.newPassword && (
                    <p className="text-xs text-red-500 mt-1">Mật khẩu không khớp</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm shadow-indigo-200 text-sm mt-2"
                >
                  {mutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang cập nhật...
                    </span>
                  ) : (
                    'Đặt mật khẩu mới'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* ── SUCCESS STATE ── */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Thành công!</h2>
              <p className="text-gray-500 text-sm mb-2">
                Mật khẩu đã được đặt lại. Bạn có thể đăng nhập bằng mật khẩu mới.
              </p>
              <p className="text-gray-400 text-xs mb-8">
                Tự động chuyển hướng về trang đăng nhập sau 3 giây...
              </p>
              <Link
                to="/login"
                className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
