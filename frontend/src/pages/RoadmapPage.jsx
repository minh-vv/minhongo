import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { coursesApi } from '../api/coursesApi';
import { aiApi } from '../api/aiApi';
import { useAuth } from '../hooks/useAuth';
import LoginPrompt from '../components/LoginPrompt';
import {
  Sparkles, X, Loader2, ChevronRight, ChevronLeft,
  Plus, Trash2, Trophy, BookOpen, Target, Clock, Brain,
  CheckCircle2, Download, ArrowRight,
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
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
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
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
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
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
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
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 14M17.07 6.93a9 9 0 010 10.14M9 9l-2 2H4v2h3l2 2V9z" />
      </svg>
    ),
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
    <div className="flex flex-col items-center gap-1">
      <div className="w-8 h-8 flex items-center justify-center text-sm font-bold transition-all"
        style={{
          background: done ? '#22c55e' : active ? 'var(--primary)' : 'rgba(0,0,0,0.07)',
          color: done || active ? '#fff' : 'var(--on-surface-variant)',
        }}
      >
        {done ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
      <span className="text-[10px] font-semibold whitespace-nowrap"
        style={{ color: active ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
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
      queryClient.invalidateQueries({ queryKey: ['custom-roadmaps'] });
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full sm:max-w-xl sharp-shadow overflow-hidden max-h-[95vh] flex flex-col"
        style={{ border: '2px solid var(--primary)' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-outline-variant/30 flex-shrink-0">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h2 className="text-lg font-headline font-extrabold text-on-surface flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                Tạo lộ trình AI cá nhân
              </h2>
              <p className="text-sm text-on-surface-variant mt-0.5">Sensei AI thiết kế riêng cho bạn</p>
            </div>
            <button onClick={onClose}
              className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-4">
            <StepDot step={1} current={step} label="Cơ bản" />
            <div className="flex-1 h-0.5" style={{ background: step > 1 ? 'var(--primary)' : 'rgba(0,0,0,0.1)' }} />
            <StepDot step={2} current={step} label="Thành tích" />
            <div className="flex-1 h-0.5" style={{ background: step > 2 ? 'var(--primary)' : 'rgba(0,0,0,0.1)' }} />
            <StepDot step={3} current={step} label="Xác nhận" />
          </div>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 flex items-center gap-1.5">
                  <Target className="w-4 h-4" style={{ color: 'var(--primary)' }} /> Mục tiêu của bạn
                </label>
                <input
                  type="text"
                  placeholder="VD: Làm kỹ sư IT ở Tokyo, Pass N4 tháng 12..."
                  className="w-full px-4 py-3 bg-surface border border-outline-variant/60 text-on-surface focus:outline-none text-sm"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" style={{ color: 'var(--primary)' }} /> Thời gian (tháng)
                  </label>
                  <input
                    type="range" min="1" max="24" step="1"
                    className="w-full"
                    style={{ accentColor: 'var(--primary)' }}
                    value={formData.targetMonths}
                    onChange={(e) => setFormData({ ...formData, targetMonths: parseInt(e.target.value) })}
                  />
                  <div className="text-center text-lg font-black" style={{ color: 'var(--primary)' }}>
                    {formData.targetMonths} tháng
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" style={{ color: 'var(--primary)' }} /> Phút mỗi ngày
                  </label>
                  <input
                    type="range" min="10" max="180" step="10"
                    className="w-full"
                    style={{ accentColor: 'var(--primary)' }}
                    value={formData.minutesPerDay}
                    onChange={(e) => setFormData({ ...formData, minutesPerDay: parseInt(e.target.value) })}
                  />
                  <div className="text-center text-lg font-black" style={{ color: 'var(--primary)' }}>
                    {formData.minutesPerDay} phút
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                  <Brain className="w-4 h-4" style={{ color: 'var(--primary)' }} /> Trình độ hiện tại
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LEVEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, currentLevel: opt.value })}
                      className="flex items-center gap-2.5 p-3 border-2 text-left transition-all"
                      style={{
                        borderColor: formData.currentLevel === opt.value ? 'var(--primary)' : 'rgba(0,0,0,0.1)',
                        background: formData.currentLevel === opt.value ? 'rgba(26,35,126,0.05)' : 'var(--surface-container-lowest)',
                      }}
                    >
                      <span className="text-xl">{opt.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: formData.currentLevel === opt.value ? 'var(--primary)' : 'var(--on-surface)' }}>
                          {opt.label}
                        </p>
                        <p className="text-[10px] text-on-surface-variant truncate">{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" /> Thành tích học tập
                  </label>
                  {userProgress && userProgress.length > 0 && (
                    <button type="button" onClick={autoFillFromSystem}
                      className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 border border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors">
                      <Download className="w-3 h-3" /> Lấy từ hệ thống
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  placeholder={`VD:\n- Đã học tiếng Nhật 3 tháng tự học\n- Biết Hiragana, Katakana thành thạo`}
                  className="w-full px-4 py-3 bg-surface border border-outline-variant/60 text-on-surface focus:outline-none text-sm resize-none"
                  value={formData.achievements}
                  onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" /> Kết quả bài kiểm tra
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Tên bài kiểm tra / JLPT..."
                    className="flex-1 px-3 py-2 bg-surface border border-outline-variant/60 text-on-surface focus:outline-none text-sm"
                    value={newTest.lessonTitle}
                    onChange={(e) => setNewTest({ ...newTest, lessonTitle: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addTestResult()}
                  />
                  <input
                    type="number" placeholder="Điểm %" min="0" max="100"
                    className="w-20 px-3 py-2 bg-surface border border-outline-variant/60 text-on-surface focus:outline-none text-sm"
                    value={newTest.score}
                    onChange={(e) => setNewTest({ ...newTest, score: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addTestResult()}
                  />
                  <button type="button" onClick={addTestResult}
                    className="px-3 py-2 text-white hover:opacity-90 transition-colors"
                    style={{ background: 'var(--primary)' }}>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.testResults.length > 0 ? (
                  <div className="space-y-2">
                    {formData.testResults.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-3 border px-3 py-2"
                        style={{ background: 'rgba(0,100,60,0.04)', borderColor: 'rgba(0,100,60,0.2)' }}>
                        <span className="text-xs font-black px-2 py-0.5 text-white"
                          style={{ background: t.score >= 70 ? '#22c55e' : 'var(--secondary)' }}>
                          {t.score}%
                        </span>
                        <span className="flex-1 text-sm text-on-surface truncate">{t.lessonTitle}</span>
                        <button type="button" onClick={() => removeTestResult(idx)}
                          className="text-on-surface-variant hover:text-secondary transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-surface-container border border-dashed border-outline-variant/40">
                    <p className="text-xs text-on-surface-variant">Chưa có kết quả nào. Thêm để AI cá nhân hóa chính xác hơn.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-5 border-2 border-primary/20" style={{ background: 'rgba(26,35,126,0.03)' }}>
                <h3 className="font-bold text-on-surface mb-3 text-sm uppercase tracking-wider">Tóm tắt lộ trình của bạn</h3>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Target className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                    <div>
                      <p className="text-[11px] font-bold uppercase" style={{ color: 'var(--primary)' }}>Mục tiêu</p>
                      <p className="text-sm font-semibold text-on-surface">{formData.goal || '(chưa nhập)'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                    <div>
                      <p className="text-[11px] font-bold uppercase" style={{ color: 'var(--primary)' }}>Lịch học</p>
                      <p className="text-sm font-semibold text-on-surface">
                        {formData.targetMonths} tháng · {formData.minutesPerDay} phút/ngày
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Brain className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                    <div>
                      <p className="text-[11px] font-bold uppercase" style={{ color: 'var(--primary)' }}>Trình độ</p>
                      <p className="text-sm font-semibold text-on-surface">{formData.currentLevel}</p>
                    </div>
                  </div>
                </div>
              </div>

              {generateMutation.isPending && (
                <div className="text-center py-6">
                  <div className="relative inline-flex">
                    <div className="w-16 h-16 flex items-center justify-center" style={{ background: 'rgba(26,35,126,0.08)' }}>
                      <Sparkles className="w-8 h-8 animate-pulse" style={{ color: 'var(--primary)' }} />
                    </div>
                    <div className="absolute inset-0 border-4 border-t-transparent animate-spin"
                      style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                  </div>
                  <p className="mt-4 font-bold text-on-surface">Sensei AI đang phân tích...</p>
                  <p className="text-sm text-on-surface-variant mt-1">Đang thiết kế lộ trình cá nhân cho bạn</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/30 flex-shrink-0 flex gap-3">
          {step > 1 && !generateMutation.isPending && (
            <button type="button" onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-outline-variant text-on-surface-variant font-semibold hover:bg-surface-container transition-colors text-sm">
              <ChevronLeft className="w-4 h-4" /> Quay lại
            </button>
          )}
          {step < 3 ? (
            <button type="button" onClick={() => {
              if (step === 1 && !formData.goal.trim()) { alert('Vui lòng nhập mục tiêu của bạn'); return; }
              setStep(step + 1);
            }}
              className="flex-1 flex items-center justify-center gap-1.5 px-6 py-2.5 text-white font-bold text-sm transition-colors hover:opacity-90"
              style={{ background: 'var(--primary)' }}>
              Tiếp theo <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={handleGenerate} disabled={generateMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm"
              style={{ background: 'var(--secondary)' }}>
              {generateMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</>
                : <><Sparkles className="w-4 h-4" /> Tạo lộ trình</>
              }
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
      <section className="relative overflow-hidden animate-fade-up" style={{ minHeight: 140 }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 60%, #0d1b5e 100%)'
        }} />
        <div className="absolute inset-0 asanoha-bg opacity-20" />
        <div className="absolute right-0 top-0 bottom-0 w-1" style={{ background: 'var(--secondary)' }} />

        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 mb-4"
              style={{ backdropFilter: 'blur(4px)' }}>
              <span className="w-1.5 h-1.5 rotate-45" style={{ background: 'var(--secondary)' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                Cá nhân hóa · AI-powered
              </span>
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-white tracking-tight">
              Lộ trình học của bạn
            </h1>
            <p className="text-white/60 text-sm mt-2 max-w-md">
              Chọn lộ trình theo cấp độ JLPT, hoặc để AI tạo lộ trình riêng dựa trên mục tiêu và trình độ của bạn.
            </p>
          </div>
          <button
            onClick={() => { setAiSuccess(false); setShowAiModal(true); }}
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-all flex-shrink-0"
            style={{ background: 'var(--secondary)' }}
          >
            <Sparkles className="w-5 h-5" />
            Tạo lộ trình với AI
          </button>
        </div>

        <div className="absolute -right-4 -bottom-4 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none"
          style={{ fontSize: 160 }}>道</div>
      </section>

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
