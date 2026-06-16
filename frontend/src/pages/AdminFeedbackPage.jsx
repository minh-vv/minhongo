import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackApi } from '../api/feedbackApi';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import { IconX, IconCheck, IconAlertCircle, IconChevronLeft, IconChevronRight } from '../components/Icons';

/* ── Config ─────────────────────────────────────────────────── */
const FEEDBACK_TYPES = [
  { value: 'BUG',     label: 'Báo lỗi',  emoji: '🐛', color: '#dc2626' },
  { value: 'FEATURE', label: 'Đề xuất',   emoji: '💡', color: '#d97706' },
  { value: 'CONTENT', label: 'Nội dung',  emoji: '📚', color: '#2563eb' },
  { value: 'UI_UX',   label: 'Giao diện', emoji: '🎨', color: '#7c3aed' },
  { value: 'OTHER',   label: 'Khác',      emoji: '💬', color: '#6b7280' },
];

const STATUS_OPTIONS = [
  { value: 'PENDING',   label: 'Chờ xử lý',     bg: 'rgba(245,158,11,0.12)', color: '#b45309' },
  { value: 'REVIEWED',  label: 'Đã xem',        bg: 'rgba(37,99,235,0.10)',  color: '#2563eb' },
  { value: 'RESOLVED',  label: 'Đã giải quyết', bg: 'rgba(22,163,74,0.10)',  color: '#16a34a' },
  { value: 'DISMISSED', label: 'Bỏ qua',        bg: 'rgba(107,114,128,0.10)', color: '#6b7280' },
];

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

/* ── Stat Card ──────────────────────────────────────────────── */
function StatCard({ label, value, color }) {
  return (
    <div className="bg-surface-container-lowest p-4 flex flex-col"
      style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
        {label}
      </span>
      <span className="text-2xl font-black font-headline" style={{ color: color || 'var(--on-surface)' }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

/* ── Detail Modal ───────────────────────────────────────────── */
function DetailModal({ feedback, onClose, onUpdate, onDelete, onAddComment, isSubmittingComment }) {
  const [status, setStatus] = useState(feedback.status);
  const [adminNote, setAdminNote] = useState(feedback.adminNote || '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentText, setCommentText] = useState('');
  const typeInfo = FEEDBACK_TYPES.find((t) => t.value === feedback.type) || FEEDBACK_TYPES[4];

  const handleSave = () => {
    onUpdate(feedback.id, { status, adminNote: adminNote.trim() || null });
  };

  const handleCommentSubmit = (e) => {
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

      {/* Modal */}
      <div
        className="relative bg-surface-container-lowest w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-fade-up"
        style={{ border: '1px solid rgba(0,0,0,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: `${typeInfo.color}12`, color: typeInfo.color }}
            >
              {typeInfo.emoji} {typeInfo.label}
            </span>
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

        {/* User info */}
        <div className="px-5 pt-4 flex items-center gap-3">
          <div className="w-8 h-8 overflow-hidden flex-shrink-0" style={{ border: '1.5px solid rgba(198,40,40,0.3)' }}>
            {feedback.user?.avatarUrl ? (
              <img src={feedback.user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-red-100 flex items-center justify-center">
                <span className="text-[10px] font-bold" style={{ color: 'var(--secondary)' }}>
                  {(feedback.user?.name || feedback.user?.email)?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">{feedback.user?.name || 'Ẩn danh'}</p>
            <p className="text-xs text-on-surface-variant">{feedback.user?.email}</p>
          </div>
        </div>

        {/* Message */}
        <div className="px-5 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Nội dung</p>
          <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap bg-surface-container p-4"
            style={{ border: '1px solid rgba(0,0,0,0.04)' }}>
            {feedback.message}
          </p>
        </div>

        {/* Images */}
        {feedback.imageUrls?.length > 0 && (
          <div className="px-5 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Ảnh đính kèm</p>
            <div className="flex gap-2 flex-wrap">
              {feedback.imageUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="w-24 h-24 overflow-hidden block hover:opacity-80 transition-opacity"
                  style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                  <img src={url} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Discussion comments thread */}
        <div className="px-5 pt-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
            Thảo luận với User
          </p>

          {feedback.comments?.length > 0 ? (
            <div className="space-y-3 max-h-[220px] overflow-y-auto mb-4 p-2 bg-surface-container/30 flex flex-col"
              style={{ border: '1px solid rgba(0,0,0,0.04)' }}>
              {feedback.comments.map((comment) => {
                const isAdmin = comment.user?.isAdmin;
                return (
                  <div
                    key={comment.id}
                    className={`flex flex-col p-2.5 space-y-1 w-full max-w-[85%] ${
                      isAdmin ? 'ml-auto bg-primary/5' : 'mr-auto bg-surface-container-high'
                    }`}
                    style={{
                      border: '1px solid rgba(0,0,0,0.04)',
                      alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-on-surface">
                        {isAdmin ? '🛡️ Bạn (Admin)' : comment.user?.name || 'User'}
                      </span>
                      {!isAdmin && (
                        <span className="text-[9px] text-on-surface-variant italic">
                          ({comment.user?.email})
                        </span>
                      )}
                      <span className="text-[9px] text-on-surface-variant font-mono ml-auto">
                        {new Date(comment.createdAt).toLocaleDateString('vi-VN', {
                          hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                      {comment.message}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant italic mb-4">
              Chưa có trao đổi nào với người dùng.
            </p>
          )}

          {/* Quick reply form */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Nhập nội dung phản hồi gửi đến user..."
              className="flex-1 px-3 py-1.5 text-xs bg-surface-container text-on-surface focus:outline-none placeholder:text-on-surface-variant/50"
              style={{ border: '1px solid rgba(0,0,0,0.08)' }}
              disabled={isSubmittingComment}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmittingComment}
              className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-on-secondary transition-colors disabled:opacity-40"
              style={{ background: 'var(--secondary)' }}
            >
              {isSubmittingComment ? 'Đang gửi...' : 'Gửi'}
            </button>
          </form>
        </div>

        {/* Admin controls */}
        <div className="px-5 pt-5 pb-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">Quản trị</p>

          {/* Status selector */}
          <div className="mb-4">
            <label className="text-xs text-on-surface-variant mb-1.5 block">Trạng thái</label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className="px-3 py-1.5 text-xs font-bold transition-all"
                  style={{
                    background: status === s.value ? s.bg : 'var(--surface-container)',
                    color: status === s.value ? s.color : 'var(--on-surface-variant)',
                    border: status === s.value ? `1.5px solid ${s.color}40` : '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Admin note */}
          <div className="mb-4">
            <label htmlFor="admin-note" className="text-xs text-on-surface-variant mb-1.5 block">Ghi chú nội bộ</label>
            <textarea
              id="admin-note"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Ghi chú cho admin..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-surface-container-lowest text-on-surface resize-y focus:outline-none"
              style={{ border: '1px solid rgba(0,0,0,0.08)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--secondary)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.08)'; }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-5 border-t gap-3" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-red-50"
              style={{ color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)' }}
            >
              Xóa
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: '#dc2626' }}>Xác nhận xóa?</span>
              <button
                onClick={() => { onDelete(feedback.id); onClose(); }}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
                style={{ background: '#dc2626' }}
              >
                Xóa
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container"
              >
                Hủy
              </button>
            </div>
          )}

          <button
            onClick={handleSave}
            className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-on-secondary transition-colors"
            style={{ background: 'var(--secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--secondary-dim)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--secondary)'; }}
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function AdminFeedbackPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['adminFeedbackStats'],
    queryFn: feedbackApi.getStats,
    enabled: !!user?.isAdmin,
  });

  // Feedbacks list
  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ['adminFeedbacks', page, filterType, filterStatus],
    queryFn: () => feedbackApi.getAll({ page, limit: 15, type: filterType, status: filterStatus }),
    enabled: !!user?.isAdmin,
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => feedbackApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFeedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['adminFeedbackStats'] });
      setSelectedFeedback(null);
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id) => feedbackApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFeedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['adminFeedbackStats'] });
    },
  });

  // Selected feedback updated with live data from cache
  const activeFeedback = feedbackData?.items?.find((fb) => fb.id === selectedFeedback?.id) || selectedFeedback;

  // Comment reply mutation for Admin
  const commentMutation = useMutation({
    mutationFn: ({ id, message }) => feedbackApi.addComment(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFeedbacks'] });
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="max-w-5xl mx-auto w-full p-6 md:p-8">
        <div className="text-center py-20">
          <IconAlertCircle className="w-10 h-10 mx-auto mb-3 text-on-surface-variant" />
          <p className="text-on-surface-variant">Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full p-6 md:p-8 space-y-8">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <PageHeader
        tag="Quản trị"
        title="Quản lý phản hồi"
        subtitle="Xem và xử lý phản hồi từ người dùng."
        ghostChar="管"
      />

      {/* ── STATS ───────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Tổng quan" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Tổng cộng" value={stats?.total ?? 0} color="var(--on-surface)" />
          <StatCard label="Chờ xử lý" value={stats?.byStatus?.PENDING ?? 0} color="#b45309" />
          <StatCard label="Đã xem" value={stats?.byStatus?.REVIEWED ?? 0} color="#2563eb" />
          <StatCard label="Đã giải quyết" value={stats?.byStatus?.RESOLVED ?? 0} color="#16a34a" />
          <StatCard label="Báo lỗi" value={stats?.byType?.BUG ?? 0} color="#dc2626" />
          <StatCard label="Đề xuất" value={stats?.byType?.FEATURE ?? 0} color="#d97706" />
        </div>
      </section>

      {/* ── FILTERS ─────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Danh sách phản hồi" />

        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Type filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mr-1">Loại:</span>
            <button
              onClick={() => { setFilterType('all'); setPage(1); }}
              className="px-2.5 py-1 text-xs font-medium transition-colors"
              style={{
                background: filterType === 'all' ? 'var(--surface-container-high)' : 'transparent',
                color: filterType === 'all' ? 'var(--on-surface)' : 'var(--on-surface-variant)',
              }}
            >
              Tất cả
            </button>
            {FEEDBACK_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => { setFilterType(t.value); setPage(1); }}
                className="px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  background: filterType === t.value ? `${t.color}12` : 'transparent',
                  color: filterType === t.value ? t.color : 'var(--on-surface-variant)',
                }}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mr-1">Trạng thái:</span>
            <button
              onClick={() => { setFilterStatus('all'); setPage(1); }}
              className="px-2.5 py-1 text-xs font-medium transition-colors"
              style={{
                background: filterStatus === 'all' ? 'var(--surface-container-high)' : 'transparent',
                color: filterStatus === 'all' ? 'var(--on-surface)' : 'var(--on-surface-variant)',
              }}
            >
              Tất cả
            </button>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => { setFilterStatus(s.value); setPage(1); }}
                className="px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  background: filterStatus === s.value ? s.bg : 'transparent',
                  color: filterStatus === s.value ? s.color : 'var(--on-surface-variant)',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-surface-container animate-pulse" />
            ))}
          </div>
        ) : feedbackData?.items?.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Người gửi</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Loại</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Nội dung</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Trạng thái</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Ngày</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Ảnh</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackData.items.map((fb) => {
                    const typeInfo = FEEDBACK_TYPES.find((t) => t.value === fb.type) || FEEDBACK_TYPES[4];
                    const statusInfo = STATUS_OPTIONS.find((s) => s.value === fb.status) || STATUS_OPTIONS[0];
                    return (
                      <tr
                        key={fb.id}
                        className="border-b hover:bg-surface-container/50 transition-colors cursor-pointer"
                        style={{ borderColor: 'rgba(0,0,0,0.04)' }}
                        onClick={() => setSelectedFeedback(fb)}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 overflow-hidden flex-shrink-0" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                              {fb.user?.avatarUrl ? (
                                <img src={fb.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-red-50 flex items-center justify-center">
                                  <span className="text-[8px] font-bold" style={{ color: 'var(--secondary)' }}>
                                    {(fb.user?.name || fb.user?.email)?.[0]?.toUpperCase() || 'U'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-medium text-on-surface truncate max-w-[100px]">
                              {fb.user?.name || fb.user?.email?.split('@')[0] || 'Ẩn danh'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                            style={{ background: `${typeInfo.color}12`, color: typeInfo.color }}
                          >
                            {typeInfo.emoji} {typeInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-xs text-on-surface line-clamp-1 max-w-[250px]">{fb.message}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                            style={{ background: statusInfo.bg, color: statusInfo.color }}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs text-on-surface-variant font-mono whitespace-nowrap">
                          {new Date(fb.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-3">
                          {fb.imageUrls?.length > 0 && (
                            <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-1.5 py-0.5">
                              {fb.imageUrls.length} ảnh
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {feedbackData.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-30"
                >
                  <IconChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-on-surface-variant px-3">
                  {page} / {feedbackData.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(feedbackData.totalPages, p + 1))}
                  disabled={page >= feedbackData.totalPages}
                  className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-30"
                >
                  <IconChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-sm text-on-surface-variant">Chưa có phản hồi nào.</p>
          </div>
        )}
      </section>

      {/* ── DETAIL MODAL ────────────────────────────────────── */}
      {selectedFeedback && (
        <DetailModal
          feedback={activeFeedback}
          onClose={() => setSelectedFeedback(null)}
          onUpdate={(id, payload) => updateMutation.mutate({ id, payload })}
          onDelete={(id) => deleteMutation.mutate(id)}
          onAddComment={(id, message, onSuccess) => commentMutation.mutate({ id, message }, { onSuccess })}
          isSubmittingComment={commentMutation.isPending}
        />
      )}
    </div>
  );
}
