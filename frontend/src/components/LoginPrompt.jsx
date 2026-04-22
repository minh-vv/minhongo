import { Link, useLocation } from 'react-router-dom';

export default function LoginPrompt({ title, description }) {
  const location = useLocation();
  const returnTo = encodeURIComponent(location.pathname);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 text-center">
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">
        {title || 'Đăng nhập để tiếp tục'}
      </h2>
      <p className="text-gray-500 text-sm max-w-xs mb-8 leading-relaxed">
        {description || 'Tính năng này dành cho thành viên. Đăng nhập hoặc tạo tài khoản miễn phí để sử dụng.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to={`/login?return=${returnTo}`}
          className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Đăng nhập
        </Link>
        <Link
          to="/register"
          className="px-6 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Tạo tài khoản miễn phí
        </Link>
      </div>
    </div>
  );
}
