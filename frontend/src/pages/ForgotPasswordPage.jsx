import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: (email) => authApi.forgotPassword(email),
    onSuccess: () => setSent(true),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(email);
  };

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL — khớp với LoginPage ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-indigo-600 to-violet-700 flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo_main.png" alt="Logo" className="h-10 w-auto object-contain" />
          <span className="text-indigo-300 text-base">学日本語</span>
        </Link>

        <div>
          <div className="text-[120px] leading-none font-black text-white/10 mb-6 select-none"
            style={{ fontFamily: 'serif' }}>
            忘れた
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Quên mật khẩu?
          </h2>
          <p className="text-indigo-200 mb-8 leading-relaxed">
            Đừng lo — chỉ cần nhập email đăng ký của bạn và chúng tôi sẽ gửi link đặt lại ngay.
          </p>
          <ul className="space-y-3">
            {[
              'Nhập email đã đăng ký tài khoản',
              'Kiểm tra hộp thư và nhấn vào link',
              'Đặt mật khẩu mới an toàn hơn',
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

          {!sent ? (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Quên mật khẩu</h1>
              <p className="text-gray-500 text-sm mb-8">
                Nhập email của bạn để nhận link đặt lại mật khẩu.
              </p>

              {mutation.isError && (
                <div className="mb-5 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {mutation.error?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.'}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email đăng ký
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
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
                      Đang gửi...
                    </span>
                  ) : (
                    'Gửi link đặt lại'
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Nhớ ra mật khẩu rồi?{' '}
                <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </>
          ) : (
            /* ── SUCCESS STATE ── */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Kiểm tra hộp thư!</h2>
              <p className="text-gray-500 text-sm mb-2">
                Nếu <span className="font-semibold text-gray-700">{email}</span> tồn tại trong hệ thống,
                chúng tôi đã gửi link đặt lại mật khẩu.
              </p>
              <p className="text-gray-400 text-xs mb-8">
                Link có hiệu lực trong <strong>1 giờ</strong>. Hãy kiểm tra cả mục Spam.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => { setSent(false); mutation.reset(); }}
                  className="w-full py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Gửi lại email khác
                </button>
                <Link
                  to="/login"
                  className="block w-full py-2.5 bg-indigo-600 text-white text-center rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
