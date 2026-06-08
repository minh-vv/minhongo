import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, Fragment } from 'react';
import { aiApi } from '../api/aiApi';
import { useAuth } from '../hooks/useAuth';
import LoginPrompt from '../components/LoginPrompt';
import {
  ArrowLeft, Sparkles, Play, CheckCircle2, Clock,
  BookOpen, Trophy, X, Trash2, RotateCcw, Flag,
  ChevronRight, Lock,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const COLS = 7;

const SKILL_META = {
  VOCABULARY: { label: '語', name: 'Từ vựng' },
  KANJI:      { label: '漢', name: 'Hán tự' },
  GRAMMAR:    { label: '文', name: 'Ngữ pháp' },
  READING:    { label: '読', name: 'Đọc hiểu' },
  LISTENING:  { label: '聴', name: 'Nghe hiểu' },
};

// Extract short label from "Ngày X: ..." titles
function shortLabel(title, dayNum) {
  if (!title) return `${dayNum}`;
  const cleaned = title.replace(/^Ngày\s*\d+\s*[:\-–]\s*/i, '').trim();
  if (cleaned.length <= 10) return cleaned;
  return cleaned.slice(0, 9) + '…';
}

// ─── Individual day node ──────────────────────────────────────────────────────
function DayNode({ item, dayNum, isSelected, isNext, onSelect }) {
  const done = item.isCompleted;
  const hasLesson = !!item.lessonId;
  const label = shortLabel(item.customTitle, dayNum);

  const nodeStyle = done
    ? { background: 'var(--tertiary)', borderColor: 'var(--tertiary)', color: '#fff' }
    : isNext
      ? { background: 'var(--primary)', borderColor: 'var(--primary)', color: '#fff' }
      : hasLesson
        ? { background: 'var(--surface-container-lowest)', borderColor: 'var(--primary)', color: 'var(--primary)' }
        : { background: 'var(--surface-container-lowest)', borderColor: 'var(--outline-variant)', color: 'var(--on-surface-variant)' };

  return (
    <div className="flex flex-col items-center flex-shrink-0" style={{ width: 64 }}>
      <button
        onClick={() => onSelect(item)}
        title={item.customTitle}
        className="relative w-14 h-14 border-[3px] flex items-center justify-center font-black text-sm transition-all duration-200 select-none outline-none"
        style={{
          ...nodeStyle,
          transform: isSelected ? 'scale(1.1)' : undefined,
          zIndex: isSelected ? 10 : undefined,
          boxShadow: isSelected
            ? '0 0 0 4px rgba(26,35,126,0.2)'
            : done
              ? '2px 2px 0 0 rgba(74,103,65,0.15)'
              : isNext
                ? '3px 3px 0 0 rgba(26,35,126,0.15)'
                : '2px 2px 0 0 rgba(0,0,0,0.06)',
        }}
      >
        {done
          ? <CheckCircle2 className="w-6 h-6" />
          : isNext
            ? <span className="text-base">{dayNum}</span>
            : <span className="text-sm">{dayNum}</span>
        }

        {/* Pulse ring for next lesson */}
        {isNext && !done && (
          <span
            className="absolute inset-0 border-[3px] animate-ping opacity-40 pointer-events-none"
            style={{ borderColor: 'var(--primary)' }}
          />
        )}
      </button>

      {/* Day label below node */}
      <span
        className="mt-1.5 text-[9px] font-semibold text-center leading-tight max-w-[64px] line-clamp-2"
        style={{
          color: done ? 'var(--tertiary)' : isNext ? 'var(--primary)' : 'var(--on-surface-variant)',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Horizontal connector between nodes in a row ──────────────────────────────
function HConn({ done }) {
  return (
    <div className="flex-1 flex items-center" style={{ marginTop: 28 }}>
      <div
        className="w-full border-t-2"
        style={{
          borderColor: done ? 'var(--tertiary)' : 'var(--outline-variant)',
          borderStyle: done ? 'solid' : 'dashed',
        }}
      />
    </div>
  );
}

// ─── Turn connector between rows ──────────────────────────────────────────────
function TurnConn({ isLTR }) {
  const borderSide = isLTR
    ? { borderRight: '2px dashed var(--outline-variant)', right: 4 }
    : { borderLeft: '2px dashed var(--outline-variant)', left: 4 };

  return (
    <div className="relative" style={{ height: 32 }}>
      <div
        className="absolute"
        style={{
          ...borderSide,
          borderBottom: '2px dashed var(--outline-variant)',
          width: '28%',
          top: 0,
          bottom: 0,
        }}
      />
    </div>
  );
}

// ─── Phase milestone banner ───────────────────────────────────────────────────
function PhaseBanner({ phase, doneCount }) {
  const total = phase.items.length;
  const allDone = doneCount === total && total > 0;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="relative flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--outline-variant))' }} />
      <div
        className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold border whitespace-nowrap"
        style={{
          background: allDone ? 'rgba(74,103,65,0.08)' : 'var(--surface-container-lowest)',
          borderColor: allDone ? 'var(--tertiary)' : 'var(--outline-variant)',
          color: allDone ? 'var(--tertiary)' : 'var(--primary)',
        }}
      >
        {allDone ? <Trophy className="w-3.5 h-3.5" /> : <Flag className="w-3.5 h-3.5" />}
        {phase.title}
        <span
          className="text-[10px] font-bold px-1.5 py-0.5"
          style={{
            background: allDone ? 'rgba(74,103,65,0.12)' : 'rgba(26,35,126,0.06)',
            color: allDone ? 'var(--tertiary)' : 'var(--primary)',
          }}
        >
          {pct}%
        </span>
      </div>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, var(--outline-variant))' }} />
    </div>
  );
}

// ─── Phase snake section ──────────────────────────────────────────────────────
function PhaseSection({ phase, dayOffset, selectedId, nextItemId, onSelect }) {
  const items = phase.items;
  const doneCount = items.filter((i) => i.isCompleted).length;

  // Split into rows of COLS
  const rows = [];
  for (let i = 0; i < items.length; i += COLS) {
    rows.push(items.slice(i, i + COLS));
  }

  return (
    <div>
      <PhaseBanner phase={phase} doneCount={doneCount} />

      <div className="space-y-0">
        {rows.map((rowItems, rowIdx) => {
          const isLTR = rowIdx % 2 === 0;
          // For RTL rows, reverse the display order so the path continues correctly
          const displayItems = isLTR ? rowItems : [...rowItems].reverse();

          return (
            <div key={rowIdx}>
              {/* Node row */}
              <div
                className={[
                  'flex items-start',
                  isLTR ? '' : 'flex-row-reverse',
                ].join(' ')}
              >
                {displayItems.map((item, colIdx) => {
                  // Calculate actual day number
                  const origIdx = isLTR
                    ? rowIdx * COLS + colIdx
                    : rowIdx * COLS + (rowItems.length - 1 - colIdx);
                  const dayNum = dayOffset + origIdx + 1;
                  const nextItem = displayItems[colIdx + 1];
                  const connDone = item.isCompleted && nextItem?.isCompleted;

                  return (
                    <Fragment key={item.id}>
                      <DayNode
                        item={item}
                        dayNum={dayNum}
                        isSelected={selectedId === item.id}
                        isNext={nextItemId === item.id}
                        onSelect={onSelect}
                      />
                      {colIdx < displayItems.length - 1 && <HConn done={connDone} />}
                    </Fragment>
                  );
                })}

                {/* Empty placeholder nodes to fill incomplete last row */}
                {rowItems.length < COLS && (
                  <>
                    {Array.from({ length: COLS - rowItems.length }).map((_, i) => (
                      <Fragment key={`empty-${i}`}>
                        <HConn done={false} />
                        <div className="flex-shrink-0" style={{ width: 64 }} />
                      </Fragment>
                    ))}
                  </>
                )}
              </div>

              {/* Turn connector between rows */}
              {rowIdx < rows.length - 1 && <TurnConn isLTR={isLTR} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Node detail bottom sheet ─────────────────────────────────────────────────
function NodeDetailPanel({ node, dayNum, phaseTitle, onClose, onToggle, isToggling }) {
  const lesson = node?.lesson;
  const hasLesson = !!node?.lessonId && !!lesson;

  if (!node) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t-2"
        style={{ maxHeight: '80vh', overflowY: 'auto', borderColor: 'var(--primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1" style={{ background: 'var(--outline-variant)' }} />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              {/* Day / Phase context */}
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="text-xs font-bold px-2.5 py-0.5"
                  style={{ background: 'rgba(26,35,126,0.08)', color: 'var(--primary)' }}
                >
                  Ngày {dayNum}
                </span>
                <span className="text-xs text-on-surface-variant">{phaseTitle}</span>
              </div>

              {/* Title */}
              <h2 className="text-lg font-headline font-extrabold text-on-surface leading-snug">
                {node.customTitle?.replace(/^Ngày\s*\d+\s*[:\-–]\s*/i, '') || node.customTitle}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0"
              style={{ background: 'var(--surface-container)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lesson info card (if linked) */}
          {hasLesson && (
            <div
              className="p-4 mb-4 border"
              style={{ background: 'rgba(26,35,126,0.04)', borderColor: 'rgba(26,35,126,0.15)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-xs font-bold px-2 py-0.5"
                  style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
                >
                  N{lesson.course?.jlptLevel}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">{lesson.course?.title}</span>
                {lesson.estimatedMin && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-on-surface-variant">
                    <Clock className="w-3 h-3" />
                    {lesson.estimatedMin} phút
                  </span>
                )}
              </div>

              <p className="font-bold text-on-surface mb-2">{lesson.title}</p>

              {lesson.summary && (
                <p className="text-sm text-on-surface-variant leading-relaxed mb-3">{lesson.summary}</p>
              )}

              {/* Skill badges */}
              {lesson.skills && lesson.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {lesson.skills.map((skill) => {
                    const meta = SKILL_META[skill] || { label: skill, name: skill };
                    return (
                      <span
                        key={skill}
                        className="px-2.5 py-0.5 text-xs font-bold font-jp-sans"
                        style={{
                          background: 'rgba(26,35,126,0.08)',
                          color: 'var(--primary)',
                          border: '1px solid rgba(26,35,126,0.15)',
                        }}
                        title={meta.name}
                      >
                        {meta.label} {meta.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Description (when no lesson or extra notes) */}
          {node.customDesc && (
            <div className="mb-4">
              <p className="text-sm text-on-surface-variant leading-relaxed">{node.customDesc}</p>
            </div>
          )}

          {/* Completion status */}
          {node.isCompleted && (
            <div
              className="flex items-center gap-2 px-4 py-2.5 mb-4 border"
              style={{ background: 'rgba(74,103,65,0.06)', borderColor: 'rgba(74,103,65,0.2)' }}
            >
              <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--tertiary)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--tertiary)' }}>Đã hoàn thành</span>
              {node.completedAt && (
                <span className="ml-auto text-xs text-on-surface-variant">
                  {new Date(node.completedAt).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            {/* Primary: Go to lesson */}
            {hasLesson && (
              <Link
                to={`/learn/${node.lessonId}`}
                className="flex items-center justify-center gap-2 w-full py-3.5 font-bold text-sm transition-all"
                style={{
                  background: node.isCompleted ? 'var(--surface-container)' : 'var(--primary)',
                  color: node.isCompleted ? 'var(--on-surface)' : 'var(--on-primary)',
                }}
              >
                {node.isCompleted ? (
                  <><RotateCcw className="w-4 h-4" /> Ôn lại bài học</>
                ) : (
                  <><Play className="w-4 h-4 fill-current" /> Vào học ngay</>
                )}
              </Link>
            )}

            {/* Secondary: Toggle completion */}
            <button
              onClick={() => onToggle(node.id)}
              disabled={isToggling}
              className="flex items-center justify-center gap-2 w-full py-3 font-semibold text-sm transition-all border-2 disabled:opacity-50"
              style={{
                borderColor: node.isCompleted ? 'var(--secondary)' : 'var(--tertiary)',
                color: node.isCompleted ? 'var(--secondary)' : 'var(--tertiary)',
                background: 'transparent',
              }}
            >
              {isToggling ? (
                <span className="animate-pulse">Đang cập nhật...</span>
              ) : node.isCompleted ? (
                <><X className="w-4 h-4" /> Bỏ đánh dấu hoàn thành</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Đánh dấu đã hoàn thành</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingRoad() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div
          className="w-16 h-16 flex items-center justify-center"
          style={{ background: 'rgba(26,35,126,0.08)' }}
        >
          <Sparkles className="w-8 h-8 animate-pulse" style={{ color: 'var(--primary)' }} />
        </div>
        <div
          className="absolute inset-0 border-4 animate-spin"
          style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
        />
      </div>
      <p className="text-on-surface-variant font-medium">Đang tải lộ trình...</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CustomRoadmapPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedPhaseTitle, setSelectedPhaseTitle] = useState('');
  const [selectedDayNum, setSelectedDayNum] = useState(1);
  const [showDelete, setShowDelete] = useState(false);

  const { data: roadmap, isLoading } = useQuery({
    queryKey: ['custom-roadmap', id],
    queryFn: () => aiApi.getRoadmapById(id),
    enabled: isAuthenticated,
  });

  const toggleMutation = useMutation({
    mutationFn: (itemId) => aiApi.completeItem(itemId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries(['custom-roadmap', id]);
      // Update selectedNode locally for immediate UI feedback
      setSelectedNode((prev) => prev ? { ...prev, isCompleted: updated.isCompleted, completedAt: updated.completedAt } : prev);
    },
    onError: () => alert('Không thể cập nhật. Vui lòng thử lại.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => aiApi.deleteRoadmap(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['custom-roadmaps']);
      navigate('/roadmap');
    },
    onError: () => alert('Không thể xóa lộ trình.'),
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

  if (isLoading) return <LoadingRoad />;
  if (!roadmap) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-bold text-on-surface mb-2">Không tìm thấy lộ trình</p>
        <Link to="/roadmap" className="font-medium hover:underline" style={{ color: 'var(--primary)' }}>← Quay lại</Link>
      </div>
    );
  }

  // ─── Derived stats ────────────────────────────────────────────────────────
  const allItems = roadmap.phases.flatMap((p) => p.items);
  const totalItems = allItems.length;
  const completedItems = allItems.filter((i) => i.isCompleted).length;
  const overallPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const linkedCount = allItems.filter((i) => i.lessonId).length;

  // First non-completed item = "next" node (highlighted)
  const nextItem = allItems.find((i) => !i.isCompleted);

  // Pre-compute cumulative day offsets per phase
  const phaseOffsets = roadmap.phases.reduce((acc, phase, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + roadmap.phases[i - 1].items.length);
    return acc;
  }, []);

  const handleNodeSelect = (item, phaseTitle, dayNum) => {
    setSelectedNode(item);
    setSelectedPhaseTitle(phaseTitle);
    setSelectedDayNum(dayNum);
  };

  return (
    <div className="bg-surface min-h-screen">
      <div className="max-w-5xl mx-auto p-6 md:p-8">

        {/* Back */}
        <Link
          to="/roadmap"
          className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary mb-5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </Link>

        {/* ── Hero header ──────────────────────────────────────────────────── */}
        <div
          className="relative p-6 text-white mb-8 overflow-hidden animate-fade-up"
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 60%, #0d1b5e 100%)',
          }}
        >
          {/* Asanoha pattern */}
          <div className="absolute inset-0 asanoha-bg opacity-20" />
          {/* Right accent bar */}
          <div className="absolute right-0 top-0 bottom-0 w-1" style={{ background: 'var(--secondary)' }} />

          {/* Ghost kanji */}
          <div
            className="absolute -right-6 -bottom-8 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none"
            style={{ fontSize: 140 }}
          >道</div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-white/60" />
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Lộ trình AI cá nhân</span>
            </div>
            <h1 className="font-headline text-xl font-extrabold leading-snug mb-1">{roadmap.title}</h1>
            <p className="text-white/60 text-sm leading-relaxed mb-4 line-clamp-2">{roadmap.description}</p>

            <div
              className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 text-xs font-semibold mb-5"
              style={{ backdropFilter: 'blur(4px)' }}
            >
              🎯 {roadmap.goal}
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-white/60">{completedItems}/{totalItems} ngày hoàn thành</span>
                <span className="font-black text-xl leading-none">{overallPct}%</span>
              </div>
              <div className="h-2.5 bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-700"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <p className="text-white/40 text-[11px] mt-1.5">
                {roadmap.phases.length} tuần · {linkedCount}/{totalItems} bài liên kết thực tế
              </p>
            </div>
          </div>
        </div>

        {/* ── Road ─────────────────────────────────────────────────────────── */}
        <div>
          {/* START marker */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--outline-variant))' }} />
            <div
              className="flex items-center gap-1.5 px-3 py-1 border"
              style={{ background: 'var(--surface-container-lowest)', borderColor: 'var(--outline-variant)' }}
            >
              <span className="w-2 h-2 rotate-45" style={{ background: 'var(--primary)' }} />
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>BẮT ĐẦU</span>
            </div>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, var(--outline-variant))' }} />
          </div>

          {roadmap.phases.map((phase, phaseIdx) => (
            <PhaseSection
              key={phase.id}
              phase={phase}
              dayOffset={phaseOffsets[phaseIdx]}
              selectedId={selectedNode?.id}
              nextItemId={nextItem?.id}
              onSelect={(item) => {
                // Calculate day number for this item
                const itemIdx = phase.items.findIndex((i) => i.id === item.id);
                const dayNum = phaseOffsets[phaseIdx] + itemIdx + 1;
                handleNodeSelect(item, phase.title, dayNum);
              }}
            />
          ))}

          {/* END marker */}
          <div className="flex items-center gap-3 mt-4 mb-8">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--secondary))' }} />
            <div
              className="flex items-center gap-1.5 px-3 py-1 border"
              style={{ background: 'rgba(198,40,40,0.06)', borderColor: 'var(--secondary)' }}
            >
              <Trophy className="w-3.5 h-3.5" style={{ color: 'var(--secondary)' }} />
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--secondary)' }}>ĐÍCH ĐẾN</span>
            </div>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, var(--secondary))' }} />
          </div>
        </div>

        {/* ── Legend ───────────────────────────────────────────────────────── */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-4 mb-8 sharp-shadow-sm">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Chú thích</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { style: { background: 'var(--tertiary)', borderColor: 'var(--tertiary)' }, label: 'Đã hoàn thành' },
              { style: { background: 'var(--primary)', borderColor: 'var(--primary)' }, label: 'Bài học tiếp theo', pulse: true },
              { style: { background: 'var(--surface-container-lowest)', borderColor: 'var(--primary)' }, label: 'Có bài học liên kết' },
              { style: { background: 'var(--surface-container-lowest)', borderColor: 'var(--outline-variant)' }, label: 'Chưa có bài liên kết' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className="relative w-5 h-5 border-2 flex-shrink-0"
                  style={item.style}
                >
                  {item.pulse && (
                    <span
                      className="absolute inset-0 border-2 animate-ping opacity-40"
                      style={{ borderColor: 'var(--primary)' }}
                    />
                  )}
                </div>
                <span className="text-xs text-on-surface-variant">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Delete ───────────────────────────────────────────────────────── */}
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-secondary transition-colors font-medium w-full justify-center py-2"
          >
            <Trash2 className="w-4 h-4" /> Xóa lộ trình này
          </button>
        ) : (
          <div
            className="border p-4 flex flex-col gap-3"
            style={{ background: 'rgba(198,40,40,0.04)', borderColor: 'var(--secondary)' }}
          >
            <p className="text-sm font-semibold text-center" style={{ color: 'var(--secondary)' }}>
              Xóa lộ trình? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2 text-sm font-semibold border text-on-surface-variant hover:bg-surface-container transition-colors"
                style={{ background: 'var(--surface-container-lowest)', borderColor: 'var(--outline-variant)' }}
              >
                Hủy
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 text-sm font-bold text-white transition-colors disabled:opacity-60"
                style={{ background: 'var(--secondary)' }}
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Node detail panel ─────────────────────────────────────────────── */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          dayNum={selectedDayNum}
          phaseTitle={selectedPhaseTitle}
          onClose={() => setSelectedNode(null)}
          onToggle={(itemId) => toggleMutation.mutate(itemId)}
          isToggling={toggleMutation.isPending}
        />
      )}
    </div>
  );
}
