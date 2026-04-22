export default function CommunityPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24 px-6">
      <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Cộng đồng</h1>
      <p className="text-gray-500 text-sm text-center max-w-sm">
        Tính năng đang được phát triển. Sắp ra mắt — nơi kết nối, thảo luận và học cùng nhau!
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        Sắp ra mắt
      </span>
    </div>
  );
}
