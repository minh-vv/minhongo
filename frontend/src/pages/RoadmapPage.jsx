import { useState } from 'react';
import axios from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import LoginPrompt from '../components/LoginPrompt';

const levels = [
  { value: 'newbie', label: 'Mới bắt đầu', desc: '0 kinh nghiệm' },
  { value: 'n5', label: 'JLPT N5', desc: 'Cơ bản' },
  { value: 'n4', label: 'JLPT N4', desc: 'Sơ cấp' },
  { value: 'n3', label: 'JLPT N3', desc: 'Trung cấp' },
  { value: 'n2', label: 'JLPT N2', desc: 'Cao cấp' },
];

const studyTimes = [
  { value: '15', label: '15 phút', desc: 'Phù hợp bận' },
  { value: '30', label: '30 phút', desc: 'Cân bằng' },
  { value: '60', label: '1 giờ', desc: 'Hiệu quả' },
  { value: '90', label: '1.5 giờ', desc: 'Chuyên sâu' },
  { value: '120', label: '2 giờ', desc: 'Tối đa' },
];

const roadmapFeatures = [
  { icon: '📅', text: 'Lịch học tập theo từng tuần' },
  { icon: '🎯', text: 'Mốc thời gian đạt mục tiêu' },
  { icon: '📚', text: 'Deck & tài liệu được đề xuất' },
  { icon: '💡', text: 'Tips và phương pháp học hiệu quả' },
];

function RoadmapResult({ roadmap, onReset }) {
  const lines = roadmap.split('\n').filter((l) => l.trim());

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Lộ trình của bạn</h2>
            <p className="text-xs text-gray-500">Được tạo bởi AI · Cá nhân hóa theo trình độ</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Tạo lại
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4">
          <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">Lộ trình học tiếng Nhật cá nhân hóa</p>
        </div>
        <div className="p-6 space-y-2">
          {lines.map((line, i) => {
            const isHeading = line.startsWith('#') || line.startsWith('**') || /^\d+\./.test(line);
            const cleanLine = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');

            if (isHeading && line.startsWith('#')) {
              return (
                <h3 key={i} className="font-bold text-gray-900 text-base mt-4 first:mt-0">
                  {cleanLine}
                </h3>
              );
            }
            if (/^\d+\./.test(line)) {
              return (
                <div key={i} className="flex gap-3 py-1">
                  <span className="flex-shrink-0 w-5 h-5 bg-violet-100 text-violet-700 rounded-full text-xs font-bold flex items-center justify-center mt-0.5">
                    {line.match(/^(\d+)/)?.[1]}
                  </span>
                  <p className="text-gray-700 text-sm leading-relaxed">{line.replace(/^\d+\.\s*/, '')}</p>
                </div>
              );
            }
            if (line.startsWith('-') || line.startsWith('•')) {
              return (
                <div key={i} className="flex gap-2 py-0.5">
                  <span className="text-violet-400 mt-1">·</span>
                  <p className="text-gray-600 text-sm leading-relaxed">{line.replace(/^[-•]\s*/, '')}</p>
                </div>
              );
            }
            return (
              <p key={i} className="text-gray-700 text-sm leading-relaxed">
                {cleanLine}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const { isAuthenticated } = useAuth();
  const [goal, setGoal] = useState('');
  const [currentLevel, setCurrentLevel] = useState('newbie');
  const [studyTime, setStudyTime] = useState('30');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRoadmap(null);
    try {
      const res = await axios.post('/ai/generate-roadmap', {
        goal,
        currentLevel,
        studyTimePerDay: parseInt(studyTime),
      });
      setRoadmap(res.data.roadmap);
    } catch {
      setError('Không thể tạo lộ trình. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginPrompt
        title="Đăng nhập để dùng Lộ trình AI"
        description="Tính năng AI cá nhân hóa lộ trình học chỉ dành cho thành viên. Đăng ký miễn phí để bắt đầu."
      />
    );
  }

  if (roadmap) {
    return (
      <div className="p-8">
        <RoadmapResult roadmap={roadmap} onReset={() => setRoadmap(null)} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-gray-900">Lộ trình học</h1>
            <span className="px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-black rounded-full">AI</span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">AI tạo lộ trình cá nhân hóa dựa trên mục tiêu và trình độ của bạn</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-semibold text-gray-800 text-sm">Cho AI biết về bạn</h2>
          </div>
          <form onSubmit={handleGenerate} className="p-6 space-y-6">
            {/* Goal */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mục tiêu của bạn là gì? <span className="text-red-400">*</span>
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                required
                rows={4}
                placeholder="VD: Đạt JLPT N4 trong 6 tháng để đi làm tại Nhật. Hiện tại mình biết hiragana và katakana nhưng chưa học kanji..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-none"
              />
              <p className="mt-1.5 text-xs text-gray-400">
                Càng chi tiết, lộ trình càng phù hợp với bạn.
              </p>
            </div>

            {/* Current level */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Trình độ hiện tại
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {levels.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setCurrentLevel(l.value)}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                      currentLevel === l.value
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className={`text-sm font-semibold ${currentLevel === l.value ? 'text-violet-700' : 'text-gray-800'}`}>
                      {l.label}
                    </span>
                    <span className="text-xs text-gray-400">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Study time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Thời gian học mỗi ngày
              </label>
              <div className="flex gap-2 flex-wrap">
                {studyTimes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setStudyTime(t.value)}
                    className={`flex flex-col items-center px-4 py-2 rounded-xl border-2 transition-all ${
                      studyTime === t.value
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className={`text-sm font-bold ${studyTime === t.value ? 'text-violet-700' : 'text-gray-800'}`}>
                      {t.label}
                    </span>
                    <span className="text-[10px] text-gray-400">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !goal.trim()}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  AI đang phân tích và tạo lộ trình...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Tạo lộ trình với AI
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info panel */}
        <div className="space-y-4">
          <div className="bg-violet-50 rounded-2xl border border-violet-100 p-5">
            <h3 className="font-semibold text-violet-900 text-sm mb-3">Lộ trình sẽ bao gồm</h3>
            <ul className="space-y-2.5">
              {roadmapFeatures.map((f) => (
                <li key={f.text} className="flex items-start gap-2.5 text-sm text-violet-700">
                  <span className="flex-shrink-0 text-base leading-none mt-0.5">{f.icon}</span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💡</span>
              <span className="font-semibold text-amber-900 text-sm">Mẹo nhỏ</span>
            </div>
            <p className="text-amber-800 text-xs leading-relaxed">
              Mô tả càng cụ thể (nghề nghiệp, lý do học, kỳ thi cần đạt...) thì AI sẽ tạo lộ trình phù hợp hơn.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 text-center">
            <div
              className="text-4xl font-black text-gray-200 mb-1 select-none"
              style={{ fontFamily: 'serif' }}
            >
              頑張れ
            </div>
            <p className="text-xs text-gray-400">Ganbatte! Cố lên!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
