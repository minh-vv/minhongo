import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { coursesApi } from '../api/coursesApi';
import { aiApi } from '../api/aiApi';
import { useAuth } from '../hooks/useAuth';
import LoginPrompt from '../components/LoginPrompt';
import PageHeader from '../components/PageHeader';
import {
  Sparkles, X, Loader2, ChevronRight, ChevronLeft,
  Plus, Trash2, Trophy, BookOpen, Target, Clock, Brain,
  CheckCircle2, Download, ArrowRight, List, Headphones, Eye, FileText
} from 'lucide-react';

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

// ─── 4 Skill blocks ───────────────────────────────────────────────────────────
const SKILLS = [
  {
    id: 'vocabulary',
    label: 'Từ vựng',
    jp: '語彙',
    desc: 'Từ vựng theo chủ đề JLPT, kèm phiên âm và ví dụ câu thực tế.',
    path: '/vocabulary',
    accent: 'var(--primary)',
    accentEnd: 'var(--primary-container)',
    ghost: '語',
    icon: <List className="w-6 h-6 text-indigo-600" />,
  },
  {
    id: 'grammar',
    label: 'Ngữ pháp',
    jp: '文法',
    desc: 'Giải thích cấu trúc bằng tiếng Việt, kèm công thức và ví dụ thực tế.',
    path: '/grammar',
    accent: '#006064',
    accentEnd: '#00838f',
    ghost: '文',
    icon: <FileText className="w-6 h-6 text-teal-600" />,
  },
  {
    id: 'reading',
    label: 'Đọc hiểu',
    jp: '読解',
    desc: 'Luyện đọc văn bản theo trình độ JLPT với chú thích từ vựng và ngữ pháp.',
    path: '/self-study',
    accent: '#1565c0',
    accentEnd: '#1976d2',
    ghost: '読',
    icon: <Eye className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'listening',
    label: 'Luyện nghe',
    jp: '聴解',
    desc: 'Chép chính tả (dictation) và shadowing với TTS chuẩn tiếng Nhật.',
    path: '/listening',
    accent: 'var(--secondary)',
    accentEnd: 'var(--secondary-container)',
    ghost: '聴',
    icon: <Headphones className="w-6 h-6 text-rose-600" />,
  },
];

// ─── Level option cards ───────────────────────────────────────────────────────
const LEVEL_OPTIONS = [
  { value: 'Chưa biết gì', label: 'Mới bắt đầu', sub: 'Chưa biết Hiragana', emoji: '🌱' },
  { value: 'Mới thuộc bảng chữ cái', label: 'Sơ cấp', sub: 'Đã biết Hiragana/Katakana', emoji: '🌿' },
  { value: 'Đang học N5', label: 'N5 đang học', sub: 'Đang ôn luyện N5', emoji: '📗' },
  { value: 'Có bằng N5, đang học N4', label: 'N4 đang học', sub: 'Đã pass N5', emoji: '📘' },
  { value: 'Từ vựng tốt, ngữ pháp kém', label: 'Từ vựng tốt', sub: 'Cần cải thiện ngữ pháp', emoji: '🧩' },
  { value: 'N3 trở lên', label: 'N3+', sub: 'Trình độ trung cấp', emoji: '🏆' },
];

const JLPT_TARGETS = [
  { value: 5, label: 'N5', desc: 'Sơ cấp cơ bản' },
  { value: 4, label: 'N4', desc: 'Sơ cấp nâng cao' },
  { value: 3, label: 'N3', desc: 'Trung cấp' },
  { value: 2, label: 'N2', desc: 'Thượng trung cấp' },
  { value: 1, label: 'N1', desc: 'Cao cấp chuyên sâu' },
];

const SKILL_PRIORITIES = [
  { id: 'VOCABULARY', label: 'Từ vựng', jp: '語彙', emoji: '📙' },
  { id: 'GRAMMAR', label: 'Ngữ pháp', jp: '文法', emoji: '✍️' },
  { id: 'KANJI', label: 'Hán tự', jp: '漢字', emoji: '💮' },
  { id: 'LISTENING', label: 'Nghe hiểu', jp: '聴解', emoji: '🎧' },
  { id: 'READING', label: 'Đọc hiểu', jp: '読解', emoji: '📖' },
];

// ─── Section header component (design-system aligned) ─────────────────────────
function SectionHeader({ title, accent = 'var(--secondary)' }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1.5 h-6 flex-shrink-0" style={{ background: accent }} />
      <h2 className="text-lg font-headline font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      <div className="flex-1 h-px ml-1" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)' }} />
    </div>
  );
}

// ─── Step dot ────────────────────────────────────────────────────────────────
function StepDot({ step, current, label }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex flex-col items-center gap-1.5 relative z-10">
      <div className={`w-9 h-9 flex items-center justify-center text-xs font-bold rounded-full border-2 transition-all duration-300 ${
        done
          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
          : active
            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
            : 'bg-white border-slate-200 text-slate-400'
      }`}>
        {done ? <CheckCircle2 className="w-5 h-5 text-white" /> : step}
      </div>
      <span className={`text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 ${
        active ? 'text-indigo-600' : done ? 'text-emerald-500' : 'text-slate-400'
      }`}>
        {label}
      </span>
    </div>
  );
}

// ─── Course card (design system aligned) ────────────────────────────────────
function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group block bg-surface-container-lowest border border-outline-variant/40 hover:border-primary/40 transition-all overflow-hidden sharp-shadow-sm hover:sharp-shadow"
    >
      <div className="h-1" style={{ background: 'var(--primary)', opacity: course.isDefault ? 1 : 0.3 }} />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/8 text-primary border border-primary/20">
            JLPT N{course.jlptLevel}
          </span>
          {course.isDefault && (
            <span className="px-2 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-800 text-[10px] font-bold uppercase tracking-wider">Đề xuất</span>
          )}
          {course.enrolled && (
            <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-700 text-[10px] font-bold uppercase tracking-wider">Đã đăng ký</span>
          )}
        </div>
        <h3 className="text-base font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">{course.title}</h3>
        {course.description && (
          <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">{course.description}</p>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-on-surface-variant">
          <span>{course._count?.lessons ?? 0} bài học</span>
          {course.targetDate && <span>Mục tiêu: {formatDate(course.targetDate)}</span>}
        </div>
      </div>
    </Link>
  );
}

function MyCourseRow({ enroll }) {
  const percent = enroll.totalLessons > 0
    ? Math.round((enroll.passedLessons / enroll.totalLessons) * 100) : 0;
  return (
    <Link
      to={`/courses/${enroll.slug}`}
      className="block bg-surface-container-lowest border border-outline-variant/40 hover:border-primary/40 transition-all sharp-shadow-sm hover:sharp-shadow p-5"
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 bg-primary/5 flex-shrink-0">
            N{enroll.jlptLevel}
          </span>
          <h3 className="text-base font-bold text-on-surface truncate">{enroll.title}</h3>
        </div>
        <span className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--primary)' }}>
          {enroll.passedLessons}/{enroll.totalLessons}
        </span>
      </div>
      <div className="h-1.5 bg-surface-container overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="h-full transition-all" style={{ width: `${percent}%`, background: 'var(--secondary)' }} />
      </div>
      {(enroll.goal || enroll.targetDate) && (
        <div className="mt-2 text-xs text-on-surface-variant flex gap-3">
          {enroll.goal && <span>Mục tiêu: {enroll.goal}</span>}
          {enroll.targetDate && <span>Hạn: {formatDate(enroll.targetDate)}</span>}
        </div>
      )}
    </Link>
  );
}

function AiModal({ onClose, onSuccess, userProgress }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    goal: '',
    targetMonths: 3,
    minutesPerDay: 30,
    currentLevel: 'Chưa biết gì',
    targetJlpt: null,      // explicit JLPT target 1–5
    prioritySkills: [],    // array of skill IDs
    achievements: '',
    testResults: [],
  });
  const [newTest, setNewTest] = useState({ lessonTitle: '', score: '' });
  const [loadingStage, setLoadingStage] = useState(0);
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: aiApi.generateRoadmap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roadmaps'] });
      onSuccess();
    },
    onError: (err) => {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra khi tạo lộ trình');
    },
  });

  useEffect(() => {
    if (!generateMutation.isPending) {
      setLoadingStage(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStage((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, [generateMutation.isPending]);

  const loadingMessages = [
    "Kết nối với Sensei AI...",
    "Phân tích mục tiêu và trình độ học tập...",
    "Tối ưu các bài học theo kỹ năng ưu tiên...",
    "Thiết lập chu kỳ ôn tập từ vựng & ngữ pháp...",
  ];
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

  const autoFillFromSystem = () => {
    if (!userProgress || userProgress.length === 0) return;
    const lines = userProgress
      .filter((p) => p.passedLessons > 0)
      .map((p) => `✅ ${p.title} (N${p.jlptLevel}): ${p.passedLessons}/${p.totalLessons} bài hoàn thành${p.goal ? ` — Mục tiêu: ${p.goal}` : ''}`);
    if (lines.length === 0) return;
    setFormData((f) => ({
      ...f,
      achievements: (f.achievements ? f.achievements + '\n' : '') + lines.join('\n'),
    }));
  };

  const handleGenerate = () => {
    generateMutation.mutate({ ...formData, testResults: formData.testResults });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-white w-full sm:max-w-xl flex flex-col max-h-[90vh] overflow-hidden rounded-2xl border border-slate-100 shadow-2xl transition-all duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex-shrink-0 flex justify-between items-center">
          <div>
            <h2 id="modal-title" className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
              Tạo lộ trình AI cá nhân
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Sensei AI thiết kế lộ trình tối ưu cho riêng bạn</p>
          </div>
          <button
            onClick={onClose}
            disabled={generateMutation.isPending}
            aria-label="Đóng bảng tạo lộ trình"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicators */}
        {!generateMutation.isPending && (
          <div className="flex items-center justify-center gap-8 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
            <StepDot step={1} current={step} label="Cơ bản" />
            <div className={`w-14 h-[2px] rounded-full transition-colors duration-300 ${step > 1 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            <StepDot step={2} current={step} label="Thành tích" />
            <div className={`w-14 h-[2px] rounded-full transition-colors duration-300 ${step > 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            <StepDot step={3} current={step} label="Xác nhận" />
          </div>
        )}

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-white">
          {generateMutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <div className="text-center space-y-2 max-w-xs">
                <h3 className="font-bold text-base text-slate-800">
                  Sensei AI đang thiết kế lộ trình...
                </h3>
                <p className="text-sm font-semibold text-indigo-600 animate-pulse">
                  {loadingMessages[loadingStage]}
                </p>
                <p className="text-[10px] text-slate-400 mt-2">
                  Quá trình phân tích bài học, kỹ năng và tối ưu thời gian có thể mất khoảng 15-30 giây.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-indigo-600" /> Mục tiêu của bạn
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Làm lập trình viên tại Tokyo, Đạt N4 tháng 12..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm shadow-sm transition-all outline-none"
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-400 mt-1 pl-1">Nhập mục tiêu cụ thể giúp AI định hướng nội dung bài học tốt hơn.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-indigo-600" /> Thời gian học
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100">
                          {formData.targetMonths} tháng
                        </span>
                      </div>
                      <input
                        type="range" min="1" max="24" step="1"
                        className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: 'var(--primary)' }}
                        value={formData.targetMonths}
                        onChange={(e) => setFormData({ ...formData, targetMonths: parseInt(e.target.value) })}
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                        <span>1 tháng</span>
                        <span>12 tháng</span>
                        <span>24 tháng</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-indigo-600" /> Phút mỗi ngày
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100">
                          {formData.minutesPerDay} phút
                        </span>
                      </div>
                      <input
                        type="range" min="10" max="180" step="10"
                        className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: 'var(--primary)' }}
                        value={formData.minutesPerDay}
                        onChange={(e) => setFormData({ ...formData, minutesPerDay: parseInt(e.target.value) })}
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                        <span>10m</span>
                        <span>90m</span>
                        <span>180m</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-indigo-600" /> Trình độ hiện tại
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {LEVEL_OPTIONS.map((opt) => {
                        const isActive = formData.currentLevel === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, currentLevel: opt.value })}
                            className={`flex items-center gap-3 p-3 border rounded-xl text-left transition-all duration-300 ${
                              isActive
                                ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/10 shadow-[0_4px_12px_rgba(79,70,229,0.05)]'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-700'
                            }`}
                          >
                            <span className="text-xl p-1 bg-slate-100 border border-slate-200/50 rounded-lg shadow-sm">{opt.emoji}</span>
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate ${isActive ? 'text-indigo-600' : 'text-slate-800'}`}>
                                {opt.label}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">{opt.sub}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      Mục tiêu JLPT <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {JLPT_TARGETS.map((t) => {
                        const isActive = formData.targetJlpt === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, targetJlpt: t.value })}
                            className={`flex-1 min-w-[70px] flex flex-col items-center py-2.5 px-2 border rounded-xl transition-all duration-300 ${
                              isActive
                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-700'
                            }`}
                          >
                            <span className={`text-xs font-black ${isActive ? 'text-white' : 'text-slate-800'}`}>
                              {t.label}
                            </span>
                            <span className={`text-[9px] mt-0.5 text-center leading-none ${isActive ? 'text-indigo-50' : 'text-slate-400'}`}>
                              {t.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {!formData.targetJlpt && (
                      <p className="text-[10px] text-rose-500 mt-1.5 pl-1 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Vui lòng chọn mục tiêu JLPT để tiếp tục
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Kỹ năng muốn tập trung <span className="text-[10px] font-normal normal-case text-slate-400">(tùy chọn)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SKILL_PRIORITIES.map((skill) => {
                        const isSelected = formData.prioritySkills.includes(skill.id);
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => {
                              const newSkills = isSelected
                                ? formData.prioritySkills.filter((s) => s !== skill.id)
                                : [...formData.prioritySkills, skill.id];
                              setFormData({ ...formData, prioritySkills: newSkills });
                            }}
                            className={`flex items-center gap-1.5 px-4 py-2 border rounded-full text-[11px] font-extrabold transition-all duration-300 ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-600'
                            }`}
                          >
                            <span>{skill.emoji}</span>
                            <span className="font-jp-sans">{skill.label}</span>
                            <span className={`text-[9px] opacity-70 ${isSelected ? 'text-indigo-50' : 'text-slate-400'}`}>({skill.jp})</span>
                          </button>
                        );
                      })}
                    </div>
                    {formData.prioritySkills.length === 0 && (
                      <p className="text-[10px] text-slate-400 mt-1 pl-1">Không chọn = AI phân bổ cân bằng tất cả kỹ năng.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-500" /> Thành tích học tập
                      </label>
                      {userProgress && userProgress.length > 0 && (
                        <button
                          type="button"
                          onClick={autoFillFromSystem}
                          className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 border border-indigo-200 text-indigo-600 bg-indigo-50/40 hover:bg-indigo-600 hover:text-white rounded-full transition-all duration-300"
                        >
                          <Download className="w-3.5 h-3.5" /> Điền từ hệ thống
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={4}
                      placeholder={`VD:\n- Đã tự học bảng chữ cái Hiragana & Katakana\n- Đã học xong giáo trình Minna no Nihongo sơ cấp 1`}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all outline-none text-sm resize-none"
                      value={formData.achievements}
                      onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Kết quả bài kiểm tra gần đây
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Tên bài kiểm tra / Bài học..."
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all outline-none text-sm"
                        value={newTest.lessonTitle}
                        onChange={(e) => setNewTest({ ...newTest, lessonTitle: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addTestResult()}
                      />
                      <input
                        type="number" placeholder="Điểm %" min="0" max="100"
                        className="w-24 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all outline-none text-sm"
                        value={newTest.score}
                        onChange={(e) => setNewTest({ ...newTest, score: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addTestResult()}
                      />
                      <button
                        type="button"
                        onClick={addTestResult}
                        aria-label="Thêm kết quả bài kiểm tra"
                        className="w-10 h-10 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-600/10 active:scale-95"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {formData.testResults.length > 0 ? (
                      <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                        {formData.testResults.map((t, idx) => {
                          let scoreBadge = 'bg-rose-50 text-rose-700 border border-rose-100';
                          if (t.score >= 75) {
                            scoreBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                          } else if (t.score >= 50) {
                            scoreBadge = 'bg-amber-50 text-amber-700 border border-amber-100';
                          }
                          return (
                            <div key={idx} className="flex items-center gap-3 border border-slate-100 rounded-xl px-4 py-2.5 bg-slate-50/50">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBadge}`}>
                                {t.score}%
                              </span>
                              <span className="flex-1 text-sm font-semibold text-slate-700 truncate">{t.lessonTitle}</span>
                              <button
                                type="button"
                                onClick={() => removeTestResult(idx)}
                                aria-label="Xóa kết quả này"
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full p-1.5 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-slate-50/50 border-2 border-dashed border-slate-200/60 rounded-xl px-4">
                        <p className="text-xs text-slate-400 leading-relaxed">Chưa có kết quả nào. Nhập và thêm để AI cá nhân hóa chính xác hơn.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="border border-indigo-100 bg-indigo-50/20 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-indigo-100/50">
                      <Sparkles className="w-4 h-4 text-indigo-600" /> Vé thông hành học tập AI
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Target className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Mục tiêu học tập</p>
                          <p className="text-sm font-semibold text-slate-700 leading-relaxed mt-0.5">{formData.goal || '(chưa nhập)'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {formData.targetJlpt && (
                          <div className="flex items-start gap-3">
                            <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">JLPT Mục tiêu</p>
                              <p className="text-sm font-bold text-slate-700 mt-0.5">JLPT N{formData.targetJlpt}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lịch trình học</p>
                            <p className="text-sm font-bold text-slate-700 mt-0.5">
                              {formData.targetMonths} tháng · {formData.minutesPerDay}m/ngày
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <Brain className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trình độ hiện tại</p>
                            <p className="text-sm font-bold text-slate-700 mt-0.5">{formData.currentLevel}</p>
                          </div>
                        </div>

                        {formData.prioritySkills.length > 0 && (
                          <div className="flex items-start gap-3">
                            <BookOpen className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kỹ năng ưu tiên</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {formData.prioritySkills.map(sid => {
                                  const s = SKILL_PRIORITIES.find(x => x.id === sid);
                                  return s ? (
                                    <span key={sid} className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1">
                                      {s.emoji} {s.label}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!generateMutation.isPending && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex-shrink-0 flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-all text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !formData.goal.trim()) { alert('Vui lòng nhập mục tiêu của bạn'); return; }
                  if (step === 1 && !formData.targetJlpt) { alert('Vui lòng chọn trình độ JLPT mục tiêu'); return; }
                  setStep(step + 1);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-white font-bold text-sm bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/10"
              >
                Tiếp theo <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold bg-gradient-to-r from-secondary to-secondary-dim shadow-md shadow-secondary/15 transition-all hover:shadow-lg active:scale-[0.98] text-sm"
              >
                <Sparkles className="w-4 h-4 animate-pulse" /> Tạo lộ trình
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RoadmapPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
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
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-12 relative">

      {/* ── HERO ────────────────────────────────────────────── */}
      <PageHeader
        tag="Cá nhân hóa · AI-powered"
        title="Lộ trình học"
        subtitle="Theo dõi lộ trình học tập được cá nhân hóa bằng AI."
        ghostChar="道"
        rightContent={
          <button
            onClick={() => { setAiSuccess(false); setShowAiModal(true); }}
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-all flex-shrink-0"
            style={{ background: 'var(--secondary)' }}
          >
            <Sparkles className="w-5 h-5" />
            Tạo lộ trình với AI
          </button>
        }
      />

      {/* Success toast */}
      {aiSuccess && (
        <div className="flex items-center gap-3 p-4 border"
          style={{ background: 'rgba(0,100,60,0.06)', borderColor: 'rgba(0,100,60,0.2)' }}>
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="font-semibold text-sm text-on-surface">Tạo lộ trình AI thành công! Xem bên dưới.</p>
          <button onClick={() => setAiSuccess(false)} className="ml-auto text-on-surface-variant hover:text-on-surface">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── 4 KỸ NĂNG ────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Luyện theo kỹ năng" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SKILLS.map((skill) => (
            <button
              key={skill.id}
              onClick={() => navigate(skill.path)}
              className="group relative flex flex-col p-6 bg-surface-container-lowest overflow-hidden transition-all hover:sharp-shadow active:scale-[0.98] text-left w-full"
              style={{ border: '1px solid rgba(0,0,0,0.07)' }}
            >
              {/* Top accent bar on hover */}
              <div className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(to right, ${skill.accent}, ${skill.accentEnd})` }} />

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="p-3 w-fit text-white flex-shrink-0 transition-transform group-hover:scale-110 group-hover:-rotate-3"
                  style={{ background: skill.accent }}>
                  {skill.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="font-headline font-bold text-on-surface text-lg">{skill.label}</h3>
                    <span className="font-jp text-sm text-on-surface-variant">{skill.jp}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{skill.desc}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: skill.accent }}>
                Học ngay
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Ghost character */}
              <div className="absolute -right-3 -bottom-3 font-jp font-bold leading-none select-none pointer-events-none opacity-[0.04] group-hover:opacity-[0.07] transition-opacity text-on-surface"
                style={{ fontSize: 80 }}>{skill.ghost}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── ĐANG HỌC ──────────────────────────────────────────── */}
      {myCourses && myCourses.length > 0 && (
        <section>
          <SectionHeader title="Đang học" />
          <div className="grid md:grid-cols-2 gap-3">
            {myCourses.map((c) => <MyCourseRow key={c.courseId} enroll={c} />)}
          </div>
        </section>
      )}

      {/* ── AI ROADMAPS ──────────────────────────────────────── */}
      {customRoadmaps && customRoadmaps.length > 0 && (
        <section>
          <SectionHeader title="Lộ trình AI cá nhân" accent="var(--secondary)" />
          <div className="grid md:grid-cols-2 gap-4">
            {customRoadmaps.map((r) => {
              const totalItems = r.phases?.reduce((acc, p) => acc + (p.items?.length ?? 0), 0) ?? 0;
              const completedItems = r.phases?.reduce(
                (acc, p) => acc + (p.items?.filter((i) => i.isCompleted).length ?? 0), 0,
              ) ?? 0;
              const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

              return (
                <Link
                  key={r.id}
                  to={`/custom-roadmap/${r.id}`}
                  className="block bg-surface-container-lowest border border-outline-variant/40 hover:border-secondary/40 transition-all sharp-shadow-sm hover:sharp-shadow p-5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base font-bold text-on-surface leading-tight">{r.title}</h3>
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white flex-shrink-0 ml-2"
                      style={{ background: 'var(--secondary)' }}>
                      {r.phases?.length || 0} tuần
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-3 line-clamp-2">{r.description}</p>

                  {totalItems > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[11px] text-on-surface-variant mb-1">
                        <span>{completedItems}/{totalItems} bài hoàn thành</span>
                        <span className="font-bold">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-container overflow-hidden">
                        <div className="h-full transition-all" style={{ width: `${pct}%`, background: 'var(--secondary)' }} />
                      </div>
                    </div>
                  )}

                  <div className="text-xs font-medium text-on-surface-variant inline-flex px-2.5 py-1 border border-outline-variant/30">
                    🎯 {r.goal}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── TẤT CẢ LỘ TRÌNH ─────────────────────────────────── */}
      <section>
        <SectionHeader title="Tất cả lộ trình" accent="var(--primary)" />
        {loadingCourses ? (
          <div className="flex items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-on-surface-variant text-sm">Đang tải lộ trình...</span>
          </div>
        ) : !courses || courses.length === 0 ? (
          <div className="p-8 text-center bg-surface-container-lowest border border-outline-variant/30">
            <p className="text-on-surface-variant text-sm">Chưa có lộ trình nào.</p>
          </div>
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
          onSuccess={() => { setShowAiModal(false); setAiSuccess(true); }}
          userProgress={myCourses}
        />
      )}
    </div>
  );
}
