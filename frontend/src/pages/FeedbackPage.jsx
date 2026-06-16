import { useState, useRef, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feedbackApi } from '../api/feedbackApi';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import { IconX, IconCheck, IconUpload, IconAlertCircle } from '../components/Icons';
import LoginPrompt from '../components/LoginPrompt';

/* ── Feedback type config ───────────────────────────────────── */
const FEEDBACK_TYPES = [
  { value: 'BUG',     label: 'Báo lỗi',      emoji: '🐛', color: '#dc2626' },
  { value: 'FEATURE', label: 'Đề xuất',       emoji: '💡', color: '#d97706' },
  { value: 'CONTENT', label: 'Nội dung',      emoji: '📚', color: '#2563eb' },
  { value: 'UI_UX',   label: 'Giao diện',     emoji: '🎨', color: '#7c3aed' },
  { value: 'OTHER',   label: 'Khác',          emoji: '💬', color: '#6b7280' },
];

const STATUS_CONFIG = {
  PENDING:   { label: 'Chờ xử lý',   bg: 'rgba(245,158,11,0.12)', color: '#b45309' },
  REVIEWED:  { label: 'Đã xem',      bg: 'rgba(37,99,235,0.10)',  color: '#2563eb' },
  RESOLVED:  { label: 'Đã giải quyết', bg: 'rgba(22,163,74,0.10)', color: '#16a34a' },
  DISMISSED: { label: 'Bỏ qua',      bg: 'rgba(107,114,128,0.10)', color: '#6b7280' },
};

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1.5 h-6 flex-shrink-0" style={{ background: 'var(--secondary)' }} />
      <h2 className="text-lg font-headline font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      <div className="flex-1 h-px ml-1"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)' }} />
    </div>
  );
}

/* ── Image preview card ─────────────────────────────────────── */
function ImagePreview({ file, onRemove }) {
  const url = URL.createObjectURL(file);
  return (
    <div className="relative group w-20 h-20 overflow-hidden bg-surface-container flex-shrink-0"
      style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
      <img src={url} alt="Preview" className="w-full h-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Xóa ảnh"
      >
        <IconX className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ── Status badge ───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

/* ── Feedback Detail Modal ───────────────────────────────────── */
function FeedbackDetailModal({ feedback, onClose, onAddComment, isSubmittingComment }) {
  const [commentText, setCommentText] = useState('');
  const typeInfo = FEEDBACK_TYPES.find((t) => t.value === feedback.type) || FEEDBACK_TYPES[4];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(feedback.id, commentText.trim(), () => {
      setCommentText('');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal Content */}
      <div
        className="relative bg-surface-container-lowest w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-up"
        style={{ border: '1px solid rgba(0,0,0,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: `${typeInfo.color}12`, color: typeInfo.color }}
            >
              {typeInfo.emoji} {typeInfo.label}
            </span>
            <StatusBadge status={feedback.status} />
            <span className="text-xs text-on-surface-variant font-mono">
              {new Date(feedback.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-surface-container transition-colors" aria-label="Đóng">
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Main feedback message */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Nội dung phản hồi</p>
            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap bg-surface-container p-4"
              style={{ border: '1px solid rgba(0,0,0,0.04)' }}>
              {feedback.message}
            </p>
          </div>

          {/* Main feedback images */}
          {feedback.imageUrls?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Ảnh đính kèm</p>
              <div className="flex gap-2 flex-wrap">
                {feedback.imageUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="w-20 h-20 overflow-hidden block hover:opacity-80 transition-opacity"
                    style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                    <img src={url} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Discussion comments thread */}
          <div className="pt-4 border-t animate-fade-up" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-4">
              Thảo luận / Trao đổi
            </h3>

            {feedback.comments?.length > 0 ? (
              <div className="space-y-4 flex flex-col">
                {feedback.comments.map((comment) => {
                  const isAdmin = comment.user?.isAdmin;
                  return (
                    <div
                      key={comment.id}
                      className={`flex flex-col p-3 space-y-1 w-full max-w-[85%] ${
                        isAdmin ? 'mr-auto bg-surface-container-high' : 'ml-auto bg-primary/5'
                      }`}
                      style={{
                        border: '1px solid rgba(0,0,0,0.04)',
                        alignSelf: isAdmin ? 'flex-start' : 'flex-end',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-on-surface">
                          {isAdmin ? '🛡️ Ban quản trị Minhongo' : comment.user?.name || 'Bạn'}
                        </span>
                        {isAdmin && (
                          <span className="text-[9px] px-1.5 py-0.2 font-bold uppercase text-secondary bg-secondary/10">
                            Admin
                          </span>
                        )}
                        <span className="text-[9px] text-on-surface-variant font-mono ml-auto">
                          {new Date(comment.createdAt).toLocaleDateString('vi-VN', {
                            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                        {comment.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic text-center py-4">
                Chưa có trao đổi nào.
              </p>
            )}
          </div>
        </div>

        {/* Footer input form */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Nhập nội dung trả lời..."
              className="flex-1 px-3 py-2 text-sm bg-surface-container text-on-surface focus:outline-none placeholder:text-on-surface-variant/50"
              style={{ border: '1px solid rgba(0,0,0,0.08)' }}
              disabled={isSubmittingComment}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmittingComment}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-secondary transition-colors disabled:opacity-40"
              style={{ background: 'var(--secondary)' }}
            >
              {isSubmittingComment ? 'Đang gửi...' : 'Gửi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────── */
export default function FeedbackPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // Form state
  const [selectedType, setSelectedType] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // My feedbacks
  const { data: myFeedbacks, isLoading: loadingMine } = useQuery({
    queryKey: ['myFeedbacks'],
    queryFn: () => feedbackApi.getMine({ page: 1, limit: 50 }),
    enabled: isAuthenticated,
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: (formData) => feedbackApi.submit(formData),
    onSuccess: () => {
      setSelectedType('');
      setMessage('');
      setFiles([]);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
      queryClient.invalidateQueries({ queryKey: ['myFeedbacks'] });
    },
  });

  // Selected feedback for detail modal
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Find updated feedback from query data
  const activeFeedback = myFeedbacks?.items?.find((fb) => fb.id === selectedFeedback?.id) || selectedFeedback;

  // Comment reply mutation
  const commentMutation = useMutation({
    mutationFn: ({ id, message }) => feedbackApi.addComment(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFeedbacks'] });
    },
  });

  const handleFileAdd = useCallback((e) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles].slice(0, 3));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleRemoveFile = useCallback((idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedType || message.trim().length < 10) return;

    const formData = new FormData();
    formData.append('type', selectedType);
    formData.append('message', message.trim());
    files.forEach((f) => formData.append('images', f));
    submitMutation.mutate(formData);
  };

  const canSubmit = selectedType && message.trim().length >= 10 && !submitMutation.isPending;

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto w-full p-6 md:p-8">
        <PageHeader
          tag="Phản hồi"
          title="Gửi phản hồi"
          subtitle="Giúp Minhongo ngày càng tốt hơn bằng ý kiến của bạn."
          ghostChar="声"
        />
        <div className="mt-8">
          <LoginPrompt message="Đăng nhập để gửi phản hồi cho chúng tôi" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full p-6 md:p-8 space-y-10">

      {/* ── HERO ────────────────────────────────────────────── */}
      <PageHeader
        tag="Phản hồi"
        title="Gửi phản hồi"
        subtitle="Giúp Minhongo ngày càng tốt hơn bằng ý kiến của bạn."
        ghostChar="声"
      />

      {/* ── SUCCESS TOAST ───────────────────────────────────── */}
      {submitSuccess && (
        <div
          className="flex items-center gap-3 px-5 py-3 animate-fade-up"
          style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}
        >
          <IconCheck className="w-5 h-5 flex-shrink-0" style={{ color: '#16a34a' }} />
          <p className="text-sm font-medium" style={{ color: '#16a34a' }}>
            Cảm ơn bạn! Phản hồi đã được gửi thành công.
          </p>
        </div>
      )}

      {/* ── FORM ────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Viết phản hồi" />

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Type selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
              Loại phản hồi
            </label>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_TYPES.map((t) => {
                const active = selectedType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setSelectedType(t.value)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-150"
                    style={{
                      background: active ? `${t.color}12` : 'var(--surface-container-lowest)',
                      border: active ? `2px solid ${t.color}` : '1px solid rgba(0,0,0,0.08)',
                      color: active ? t.color : 'var(--on-surface-variant)',
                    }}
                  >
                    <span className="text-base">{t.emoji}</span>
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message textarea */}
          <div>
            <label htmlFor="feedback-message" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
              Nội dung phản hồi
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mô tả chi tiết phản hồi của bạn... (tối thiểu 10 ký tự)"
              rows={5}
              className="w-full px-4 py-3 text-sm bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 resize-y focus:outline-none transition-colors"
              style={{
                border: '1px solid rgba(0,0,0,0.08)',
                minHeight: 120,
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--secondary)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.08)'; }}
            />
            <p className="text-xs text-on-surface-variant mt-1.5">
              {message.length}/10 ký tự tối thiểu
              {message.length >= 10 && (
                <IconCheck className="inline w-3.5 h-3.5 ml-1" style={{ color: '#16a34a' }} />
              )}
            </p>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
              Đính kèm ảnh <span className="font-normal normal-case">(tối đa 3 ảnh, 5MB mỗi ảnh)</span>
            </label>

            <div className="flex items-start gap-3 flex-wrap">
              {files.map((f, i) => (
                <ImagePreview key={i} file={f} onRemove={() => handleRemoveFile(i)} />
              ))}

              {files.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                  style={{ border: '2px dashed rgba(0,0,0,0.12)' }}
                >
                  <IconUpload className="w-5 h-5" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Thêm ảnh</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileAdd}
                className="hidden"
              />
            </div>
          </div>

          {/* Error message */}
          {submitMutation.isError && (
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}
            >
              <IconAlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#dc2626' }} />
              <p className="text-sm" style={{ color: '#dc2626' }}>
                {submitMutation.error?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.'}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-8 py-3 text-xs font-bold uppercase tracking-wider text-on-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--secondary)' }}
            onMouseEnter={(e) => {
              if (canSubmit) e.currentTarget.style.background = 'var(--secondary-dim)';
            }}
            onMouseLeave={(e) => {
              if (canSubmit) e.currentTarget.style.background = 'var(--secondary)';
            }}
          >
            {submitMutation.isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
          </button>
        </form>
      </section>

      {/* ── MY FEEDBACKS ────────────────────────────────────── */}
      <section>
        <SectionHeader title="Phản hồi của bạn" />

        {loadingMine ? (
          <div className="space-y-3" aria-busy="true" aria-label="Đang tải">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-surface-container animate-pulse" />
            ))}
          </div>
        ) : myFeedbacks?.items?.length > 0 ? (
          <div className="space-y-3">
            {myFeedbacks.items.map((fb) => {
              const typeInfo = FEEDBACK_TYPES.find((t) => t.value === fb.type) || FEEDBACK_TYPES[4];
              return (
                <div
                  key={fb.id}
                  className="bg-surface-container-lowest p-4 md:p-5 flex flex-col sm:flex-row sm:items-start gap-3 cursor-pointer hover:bg-surface-container/30 transition-colors"
                  style={{ border: '1px solid rgba(0,0,0,0.06)' }}
                  onClick={() => setSelectedFeedback(fb)}
                  title="Click để xem chi tiết và trao đổi"
                >
                  {/* Type + Status */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: `${typeInfo.color}12`, color: typeInfo.color }}
                    >
                      <span>{typeInfo.emoji}</span>
                      {typeInfo.label}
                    </span>
                    <StatusBadge status={fb.status} />
                  </div>

                  {/* Message */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface leading-relaxed line-clamp-2">
                      {fb.message}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-1.5 font-mono">
                      {new Date(fb.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Image thumbnails */}
                  {fb.imageUrls?.length > 0 && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      {fb.imageUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                          className="w-10 h-10 overflow-hidden block"
                          style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                          <img src={url} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-on-surface-variant">Bạn chưa gửi phản hồi nào.</p>
          </div>
        )}
      </section>

      {/* Ghost character bottom */}
      <div className="text-center pb-4">
        <p className="text-xs text-on-surface-variant font-mono tracking-widest uppercase">
          Mọi ý kiến đều được trân trọng 🙏
        </p>
      </div>

      {/* ── DETAIL MODAL ────────────────────────────────────── */}
      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={activeFeedback}
          onClose={() => setSelectedFeedback(null)}
          onAddComment={(id, msg, onSuccess) => {
            commentMutation.mutate({ id, message: msg }, { onSuccess });
          }}
          isSubmittingComment={commentMutation.isPending}
        />
      )}
    </div>
  );
}
