import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { coursesApi } from '../api/coursesApi';
import { aiApi } from '../api/aiApi';
import { useAuth } from '../hooks/useAuth';
import LoginPrompt from '../components/LoginPrompt';
import {
  Sparkles, X, Loader2, ChevronRight, ChevronLeft,
  Plus, Trash2, Trophy, BookOpen, Target, Clock, Brain,
  CheckCircle2, Download,
} from 'lucide-react';

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

// ─── Level option cards ───────────────────────────────────────────────────────
const LEVEL_OPTIONS = [
  { value: 'Chưa biết gì', label: 'Mới bắt đầu', sub: 'Chưa biết Hiragana', emoji: '🌱' },
  { value: 'Mới thuộc bảng chữ cái', label: 'Sơ cấp', sub: 'Đã biết Hiragana/Katakana', emoji: '🌿' },
  { value: 'Đang học N5', label: 'N5 đang học', sub: 'Đang ôn luyện N5', emoji: '📗' },
  { value: 'Có bằng N5, đang học N4', label: 'N4 đang học', sub: 'Đã pass N5', emoji: '📘' },
  { value: 'Từ vựng tốt, ngữ pháp kém', label: 'Từ vựng tốt', sub: 'Cần cải thiện ngữ pháp', emoji: '🧩' },
  { value: 'N3 trở lên', label: 'N3+', sub: 'Trình độ trung cấp', emoji: '🏆' },
];

// ─── Step indicators ──────────────────────────────────────────────────────────
function StepDot({ step, current, label }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
        ${done ? 'bg-emerald-500 text-white' : active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
      <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}

// ─── CourseCard (unchanged) ───────────────────────────────────────────────────
function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="block bg-white rounded-2xl border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">
            JLPT N{course.jlptLevel}
          </span>
          {course.isDefault && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded">Đề xuất</span>
          )}
          {course.enrolled && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">Đã đăng ký</span>
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{course.title}</h3>
        {course.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>{course._count?.lessons ?? 0} bài học</span>
          {course.targetDate && <span>Mục tiêu: {formatDate(course.targetDate)}</span>}
        </div>
      </div>
    </Link>
  );
}

function MyCourseRow({ enroll }) {
  const percent =
    enroll.totalLessons > 0 ? Math.round((enroll.passedLessons / enroll.totalLessons) * 100) : 0;
  return (
    <Link
      to={`/courses/${enroll.slug}`}
      className="block bg-white rounded-2xl border border-gray-200 hover:border-indigo-400 hover:shadow-sm transition-all p-5"
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded flex-shrink-0">N{enroll.jlptLevel}</span>
          <h3 className="text-base font-bold text-gray-900 truncate">{enroll.title}</h3>
        </div>
        <span className="text-sm font-bold text-indigo-700 flex-shrink-0">
          {enroll.passedLessons}/{enroll.totalLessons}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 transition-all" style={{ width: `${percent}%` }} />
      </div>
      {(enroll.goal || enroll.targetDate) && (
        <div className="mt-2 text-xs text-gray-500 flex gap-3">
          {enroll.goal && <span>Mục tiêu: {enroll.goal}</span>}
          {enroll.targetDate && <span>Hạn: {formatDate(enroll.targetDate)}</span>}
        </div>
      )}
    </Link>
  );
}

// ─── AI Generate Modal ────────────────────────────────────────────────────────
function AiModal({ onClose, onSuccess, userProgress }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    goal: '',
    targetMonths: 3,
    minutesPerDay: 30,
    currentLevel: 'Chưa biết gì',
    achievements: '',
    testResults: [],
  });
  const [newTest, setNewTest] = useState({ lessonTitle: '', score: '' });

  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: aiApi.generateRoadmap,
    onSuccess: () => {
      queryClient.invalidateQueries(['custom-roadmaps']);
      onSuccess();
    },
    onError: (err) => {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra khi tạo lộ trình');
    },
  });

  const addTestResult = () => {
    if (!newTest.lessonTitle || !newTest.score) return;
    setFormData((f) => ({
      ...f,
      testResults: [...f.testResults, { lessonTitle: newTest.lessonTitle, score: parseInt(newTest.score) }],
    }));
    setNewTest({ lessonTitle: '', score: '' });
  };

  const removeTestResult = (idx) => {
    setFormData((f) => ({ ...f, testResults: f.testResults.filter((_, i) => i !== idx) }));
  };

  // Auto-fill từ tiến độ hệ thống
  const autoFillFromSystem = () => {
    if (!userProgress || userProgress.length === 0) return;
    const lines = userProgress
      .filter((p) => p.status === 'PASSED')
      .map((p) => `✅ Đã hoàn thành: ${p.lessonTitle || p.title}${p.score ? ` (Điểm: ${p.score}%)` : ''}`);
    setFormData((f) => ({
      ...f,
      achievements: (f.achievements ? f.achievements + '\n' : '') + lines.join('\n'),
    }));
  };

  const handleGenerate = () => {
    generateMutation.mutate({
      ...formData,
      testResults: formData.testResults,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full sm:max-w-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Tạo lộ trình AI cá nhân
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">Sensei AI thiết kế riêng cho bạn</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-4">
            <StepDot step={1} current={step} label="Cơ bản" />
            <div className={`flex-1 h-0.5 rounded-full transition-colors ${step > 1 ? 'bg-indigo-400' : 'bg-slate-200'}`} />
            <StepDot step={2} current={step} label="Thành tích" />
            <div className={`flex-1 h-0.5 rounded-full transition-colors ${step > 2 ? 'bg-indigo-400' : 'bg-slate-200'}`} />
            <StepDot step={3} current={step} label="Xác nhận" />
          </div>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Step 1: Thông tin cơ bản ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-500" /> Mục tiêu của bạn
                </label>
                <input
                  type="text"
                  placeholder="VD: Làm kỹ sư IT ở Tokyo, Pass N4 tháng 12..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-500" /> Thời gian (tháng)
                  </label>
                  <div className="space-y-1">
                    <input
                      type="range" min="1" max="24" step="1"
                      className="w-full accent-indigo-600"
                      value={formData.targetMonths}
                      onChange={(e) => setFormData({ ...formData, targetMonths: parseInt(e.target.value) })}
                    />
                    <div className="text-center text-lg font-black text-indigo-600">{formData.targetMonths} tháng</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-500" /> Phút mỗi ngày
                  </label>
                  <div className="space-y-1">
                    <input
                      type="range" min="10" max="180" step="10"
                      className="w-full accent-indigo-600"
                      value={formData.minutesPerDay}
                      onChange={(e) => setFormData({ ...formData, minutesPerDay: parseInt(e.target.value) })}
                    />
                    <div className="text-center text-lg font-black text-indigo-600">{formData.minutesPerDay} phút</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-indigo-500" /> Trình độ hiện tại
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LEVEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, currentLevel: opt.value })}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all
                        ${formData.currentLevel === opt.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 bg-white hover:border-indigo-200'}`}
                    >
                      <span className="text-xl">{opt.emoji}</span>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${formData.currentLevel === opt.value ? 'text-indigo-700' : 'text-slate-700'}`}>
                          {opt.label}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Thành tích & Kết quả kiểm tra ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" /> Thành tích học tập
                  </label>
                  {userProgress && userProgress.length > 0 && (
                    <button
                      type="button"
                      onClick={autoFillFromSystem}
                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Download className="w-3 h-3" /> Lấy từ hệ thống
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  placeholder={`VD:\n- Đã học tiếng Nhật 3 tháng tự học\n- Biết Hiragana, Katakana thành thạo\n- Đã xem anime không cần phụ đề N5`}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
                  value={formData.achievements}
                  onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                />
                <p className="text-[11px] text-slate-400 mt-1">Mô tả những gì bạn đã học, kể cả ngoài hệ thống này</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Kết quả bài kiểm tra
                </label>

                {/* Add test result */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Tên bài kiểm tra / JLPT..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                    value={newTest.lessonTitle}
                    onChange={(e) => setNewTest({ ...newTest, lessonTitle: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addTestResult()}
                  />
                  <input
                    type="number"
                    placeholder="Điểm %"
                    min="0" max="100"
                    className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                    value={newTest.score}
                    onChange={(e) => setNewTest({ ...newTest, score: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addTestResult()}
                  />
                  <button
                    type="button"
                    onClick={addTestResult}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Test results list */}
                {formData.testResults.length > 0 ? (
                  <div className="space-y-2">
                    {formData.testResults.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                        <span className={`text-xs font-black px-2 py-0.5 rounded ${t.score >= 70 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                          {t.score}%
                        </span>
                        <span className="flex-1 text-sm text-slate-700 truncate">{t.lessonTitle}</span>
                        <button type="button" onClick={() => removeTestResult(idx)} className="text-slate-400 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400">Chưa có kết quả nào. Thêm để AI cá nhân hóa chính xác hơn.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Xác nhận ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-5 border border-indigo-100">
                <h3 className="font-bold text-indigo-900 mb-3 text-sm uppercase tracking-wider">Tóm tắt lộ trình của bạn</h3>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Target className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-indigo-400 font-bold uppercase">Mục tiêu</p>
                      <p className="text-sm text-indigo-900 font-semibold">{formData.goal || '(chưa nhập)'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-indigo-400 font-bold uppercase">Lịch học</p>
                      <p className="text-sm text-indigo-900 font-semibold">{formData.targetMonths} tháng · {formData.minutesPerDay} phút/ngày</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Brain className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-indigo-400 font-bold uppercase">Trình độ</p>
                      <p className="text-sm text-indigo-900 font-semibold">{formData.currentLevel}</p>
                    </div>
                  </div>
                  {formData.achievements && (
                    <div className="flex items-start gap-2.5">
                      <Trophy className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-amber-500 font-bold uppercase">Thành tích</p>
                        <p className="text-sm text-slate-700 line-clamp-3 whitespace-pre-line">{formData.achievements}</p>
                      </div>
                    </div>
                  )}
                  {formData.testResults.length > 0 && (
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-emerald-600 font-bold uppercase">Kết quả kiểm tra</p>
                        <p className="text-sm text-slate-700">{formData.testResults.length} bài kiểm tra</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {generateMutation.isPending && (
                <div className="text-center py-6">
                  <div className="relative inline-flex">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                  </div>
                  <p className="mt-4 font-bold text-slate-700">Sensei AI đang phân tích...</p>
                  <p className="text-sm text-slate-400 mt-1">Đang thiết kế lộ trình cá nhân cho bạn</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 flex gap-3">
          {step > 1 && !generateMutation.isPending && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !formData.goal.trim()) {
                  alert('Vui lòng nhập mục tiêu của bạn');
                  return;
                }
                setStep(step + 1);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm shadow-lg shadow-indigo-200"
            >
              Tiếp theo <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm shadow-lg shadow-indigo-200"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Tạo lộ trình</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RoadmapPage() {
  const { isAuthenticated } = useAuth();
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);

  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.listCourses,
    enabled: isAuthenticated,
  });

  const { data: myCourses } = useQuery({
    queryKey: ['my-courses'],
    queryFn: coursesApi.myCourses,
    enabled: isAuthenticated,
  });

  const { data: customRoadmaps } = useQuery({
    queryKey: ['custom-roadmaps'],
    queryFn: aiApi.getMyRoadmaps,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <LoginPrompt
        title="Đăng nhập để xem lộ trình"
        description="Đăng ký miễn phí để theo dõi tiến độ học của bạn."
        ghostChar="道"
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-10 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Lộ trình học</h1>
          <p className="text-gray-600 mt-1">
            Chọn lộ trình theo cấp độ JLPT, hoặc tạo lộ trình cá nhân với AI.
          </p>
        </div>
        <button
          onClick={() => { setAiSuccess(false); setShowAiModal(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl shadow-[0_8px_16px_rgb(99,102,241,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all whitespace-nowrap"
        >
          <Sparkles className="w-5 h-5 text-indigo-100 fill-indigo-100" />
          Tạo lộ trình với AI
        </button>
      </div>

      {/* Success toast */}
      {aiSuccess && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="font-semibold text-sm">Tạo lộ trình AI thành công! Xem bên dưới.</p>
          <button onClick={() => setAiSuccess(false)} className="ml-auto text-emerald-400 hover:text-emerald-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* My Courses */}
      {myCourses && myCourses.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Đang học</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {myCourses.map((c) => <MyCourseRow key={c.courseId} enroll={c} />)}
          </div>
        </section>
      )}

      {/* Custom AI Roadmaps */}
      {customRoadmaps && customRoadmaps.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" /> Lộ trình AI cá nhân
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {customRoadmaps.map((r) => {
              const totalItems = r.phases?.reduce((acc, p) => acc + (p.items?.length ?? 0), 0) ?? 0;
              const completedItems = r.phases?.reduce(
                (acc, p) => acc + (p.items?.filter((i) => i.isCompleted).length ?? 0),
                0,
              ) ?? 0;
              const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

              return (
                <Link
                  key={r.id}
                  to={`/custom-roadmap/${r.id}`}
                  className="block bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 shadow-sm p-5 hover:shadow-md hover:border-indigo-300 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base font-bold text-indigo-900 leading-tight group-hover:text-indigo-700 transition-colors">
                      {r.title}
                    </h3>
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full whitespace-nowrap ml-2">
                      {r.phases?.length || 0} tuần
                    </span>
                  </div>
                  <p className="text-xs text-indigo-900/60 mb-3 line-clamp-2">{r.description}</p>

                  {/* Progress bar */}
                  {totalItems > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[11px] text-indigo-400 mb-1">
                        <span>{completedItems}/{totalItems} bài hoàn thành</span>
                        <span className="font-bold">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-xs font-medium text-indigo-500 bg-white inline-flex px-2.5 py-1 rounded-lg border border-indigo-50">
                    🎯 {r.goal}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* All Courses */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Tất cả lộ trình</h2>
        {loadingCourses ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : !courses || courses.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-2xl">Chưa có lộ trình nào.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {courses.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </section>

      {/* AI Modal */}
      {showAiModal && (
        <AiModal
          onClose={() => setShowAiModal(false)}
          onSuccess={() => {
            setShowAiModal(false);
            setAiSuccess(true);
          }}
          userProgress={myCourses}
        />
      )}
    </div>
  );
}
