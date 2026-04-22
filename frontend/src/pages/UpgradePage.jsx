import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Miễn phí',
    price: '0đ',
    period: 'mãi mãi',
    color: 'gray',
    features: ['Hán tự N5–N4', 'Từ vựng cơ bản', 'Ngữ pháp N5–N4', 'Không cần đăng ký'],
    cta: 'Đang sử dụng',
    current: true,
  },
  {
    name: 'Pro',
    price: '99.000đ',
    period: 'tháng',
    color: 'indigo',
    badge: 'Phổ biến nhất',
    features: ['Toàn bộ Hán tự N5–N1', 'Từ vựng đầy đủ tất cả cấp', 'Ngữ pháp toàn diện', 'Lộ trình AI cá nhân hóa', 'Flashcard không giới hạn', 'Ôn tập SRS nâng cao'],
    cta: 'Nâng cấp ngay',
  },
];

export default function UpgradePage() {
  return (
    <div className="flex-1 py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full mb-4">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Nâng cấp tài khoản
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Mở khóa toàn bộ nội dung</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Học tiếng Nhật toàn diện từ N5 đến N1 với lộ trình AI cá nhân hóa và thuật toán SRS.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 p-6 flex flex-col ${
                plan.current
                  ? 'border-gray-200 bg-white'
                  : 'border-indigo-500 bg-gradient-to-b from-indigo-50/50 to-white shadow-lg shadow-indigo-100'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow">
                  {plan.badge}
                </span>
              )}
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-3xl font-extrabold ${plan.current ? 'text-gray-700' : 'text-indigo-600'}`}>
                    {plan.price}
                  </span>
                  <span className="text-gray-400 text-sm">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className={`w-4 h-4 flex-shrink-0 ${plan.current ? 'text-gray-400' : 'text-indigo-500'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.current}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                  plan.current
                    ? 'bg-gray-100 text-gray-400 cursor-default'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          * Tính năng thanh toán đang được phát triển. Liên hệ chúng tôi để biết thêm.
        </p>
      </div>
    </div>
  );
}
