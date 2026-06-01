import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, Fragment } from 'react';
import { aiApi } from '../api/aiApi';
import {
  ArrowLeft, Sparkles, Play, CheckCircle2, Clock,
  BookOpen, Trophy, X, Trash2, RotateCcw, Flag,
  ChevronRight, Lock,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const COLS = 3;

const SKILL_META = {
  VOCABULARY: { label: '語', bg: 'bg-blue-100 text-blue-700', name: 'Từ vựng' },
  KANJI:      { label: '漢', bg: 'bg-rose-100 text-rose-700', name: 'Hán tự' },
  GRAMMAR:    { label: '文', bg: 'bg-violet-100 text-violet-700', name: 'Ngữ pháp' },
  READING:    { label: '読', bg: 'bg-teal-100 text-teal-700', name: 'Đọc hiểu' },
  LISTENING:  { label: '聴', bg: 'bg-amber-100 text-amber-700', name: 'Nghe hiểu' },
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

  return (
    <div className="flex flex-col items-center flex-shrink-0" style={{ width: 64 }}>
      <button
        onClick={() => onSelect(item)}
        title={item.customTitle}
        className={[
          'relative w-14 h-14 rounded-full border-[3px] flex items-center justify-center',
          'font-black text-sm transition-all duration-200 select-none outline-none',
          isSelected
            ? 'ring-4 ring-offset-2 ring-indigo-300 scale-110 z-10'
            : 'hover:scale-110 active:scale-95',
          done
            ? 'bg-emerald-400 border-emerald-500 text-white shadow-lg shadow-emerald-200'
            : isNext
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-200'
              : hasLesson
                ? 'bg-white border-indigo-300 text-indigo-600 shadow-md shadow-indigo-100'
                : 'bg-white border-slate-200 text-slate-400 shadow-sm',
        ].join(' ')}
      >
        {done
          ? <CheckCircle2 className="w-6 h-6" />
          : isNext
            ? <span className="text-base">{dayNum}</span>
            : <span className="text-sm">{dayNum}</span>
        }

        {/* Pulse ring for next lesson */}
        {isNext && !done && (
          <span className="absolute inset-0 rounded-full border-[3px] border-indigo-400 animate-ping opacity-40 pointer-events-none" />
        )}
      </button>

      {/* Day label below node */}
      <span
        className={[
          'mt-1.5 text-[9px] font-semibold text-center leading-tight',
          'max-w-[64px] line-clamp-2',
          done ? 'text-emerald-500' : isNext ? 'text-indigo-600' : 'text-slate-400',
        ].join(' ')}
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
        className={[
          'w-full border-t-2',
          done ? 'border-emerald-300' : 'border-dashed border-indigo-200',
        ].join(' ')}
      />
    </div>
  );
}

// ─── Turn connector between rows ──────────────────────────────────────────────
function TurnConn({ isLTR }) {
  // After LTR row: curve down on the RIGHT edge
  // After RTL row: curve down on the LEFT edge
  const borderSide = isLTR
    ? { borderRight: '2px dashed #c7d2fe', borderBottomRightRadius: 20, right: 4 }
    : { borderLeft: '2px dashed #c7d2fe', borderBottomLeftRadius: 20, left: 4 };

  return (
    <div className="relative" style={{ height: 32 }}>
      <div
        className="absolute"
        style={{
          ...borderSide,
          borderBottom: '2px dashed #c7d2fe',
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
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-200 to-indigo-200" />
      <div
        className={[
          'flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm whitespace-nowrap',
          allDone
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-white border-indigo-100 text-indigo-700 shadow-indigo-50',
        ].join(' ')}
      >
        {allDone ? <Trophy className="w-3.5 h-3.5" /> : <Flag className="w-3.5 h-3.5" />}
        {phase.title}
        <span
          className={[
            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
            allDone ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-400',
          ].join(' ')}
        >
          {pct}%
        </span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-indigo-200 to-indigo-200" />
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
                  // displayItems is reversed for RTL, so we need the original index
                  const origIdx = isLTR
                    ? rowIdx * COLS + colIdx
                    : rowIdx * COLS + (rowItems.length - 1 - colIdx);
                  const dayNum = dayOffset + origIdx + 1;
                  // Connector done state: the connector between two nodes is "done" if both nodes are done
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
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              {/* Day / Phase context */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  Ngày {dayNum}
                </span>
                <span className="text-xs text-slate-400">{phaseTitle}</span>
              </div>

              {/* Title */}
              <h2 className="text-lg font-extrabold text-slate-800 leading-snug">
                {node.customTitle?.replace(/^Ngày\s*\d+\s*[:\-–]\s*/i, '') || node.customTitle}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lesson info card (if linked) */}
          {hasLesson && (
            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl p-4 mb-4 border border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">
                  N{lesson.course?.jlptLevel}
                </span>
                <span className="text-xs text-slate-500 font-medium">{lesson.course?.title}</span>
                {lesson.estimatedMin && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {lesson.estimatedMin} phút
                  </span>
                )}
              </div>

              <p className="font-bold text-slate-800 mb-2">{lesson.title}</p>

              {lesson.summary && (
                <p className="text-sm text-slate-500 leading-relaxed mb-3">{lesson.summary}</p>
              )}

              {/* Skill badges */}
              {lesson.skills && lesson.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {lesson.skills.map((skill) => {
                    const meta = SKILL_META[skill] || { label: skill, bg: 'bg-slate-100 text-slate-600' };
                    return (
                      <span
                        key={skill}
                        className={`px-2.5 py-0.5 text-xs font-bold rounded-lg ${meta.bg}`}
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
              <p className="text-sm text-slate-600 leading-relaxed">{node.customDesc}</p>
            </div>
          )}

          {/* Completion status */}
          {node.isCompleted && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-700">Đã hoàn thành</span>
              {node.completedAt && (
                <span className="ml-auto text-xs text-emerald-400">
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
                className={[
                  'flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-all',
                  node.isCompleted
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200',
                ].join(' ')}
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
              className={[
                'flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-sm transition-all border-2',
                node.isCompleted
                  ? 'border-rose-200 text-rose-500 hover:bg-rose-50'
                  : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50',
                'disabled:opacity-50',
              ].join(' ')}
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-slate-500 font-medium">Đang tải lộ trình...</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CustomRoadmapPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedPhaseTitle, setSelectedPhaseTitle] = useState('');
  const [selectedDayNum, setSelectedDayNum] = useState(1);
  const [showDelete, setShowDelete] = useState(false);

  const { data: roadmap, isLoading } = useQuery({
    queryKey: ['custom-roadmap', id],
    queryFn: () => aiApi.getRoadmapById(id),
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

  if (isLoading) return <LoadingRoad />;
  if (!roadmap) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-bold text-slate-700 mb-2">Không tìm thấy lộ trình</p>
        <Link to="/roadmap" className="text-indigo-600 hover:underline font-medium">← Quay lại</Link>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/20 to-white">
      <div className="max-w-sm mx-auto px-4 pb-16 pt-4">

        {/* Back */}
        <Link
          to="/roadmap"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 mb-5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </Link>

        {/* ── Hero header ──────────────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 rounded-3xl p-6 text-white mb-8 overflow-hidden shadow-xl shadow-indigo-200">
          {/* Background dots */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
          {/* Ghost kanji */}
          <div className="absolute -right-6 -bottom-8 text-white/5 font-bold leading-none select-none pointer-events-none" style={{ fontSize: 140 }}>道</div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Lộ trình AI cá nhân</span>
            </div>
            <h1 className="text-xl font-extrabold leading-snug mb-1">{roadmap.title}</h1>
            <p className="text-indigo-200 text-sm leading-relaxed mb-4 line-clamp-2">{roadmap.description}</p>

            <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5 text-xs font-semibold mb-5">
              🎯 {roadmap.goal}
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-indigo-200">{completedItems}/{totalItems} ngày hoàn thành</span>
                <span className="font-black text-xl leading-none">{overallPct}%</span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <p className="text-indigo-300 text-[11px] mt-1.5">
                {roadmap.phases.length} tuần · {linkedCount}/{totalItems} bài liên kết thực tế
              </p>
            </div>
          </div>
        </div>

        {/* ── Road ─────────────────────────────────────────────────────────── */}
        <div>
          {/* START marker */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-indigo-200" />
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-indigo-100 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-[11px] font-bold text-indigo-600">BẮT ĐẦU</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-indigo-200" />
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
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-200" />
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-200 shadow-sm">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-bold text-amber-600">ĐÍCH ĐẾN</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-200" />
          </div>
        </div>

        {/* ── Legend ───────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-8 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Chú thích</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { dot: 'bg-emerald-400 border-emerald-500', label: 'Đã hoàn thành' },
              { dot: 'bg-indigo-600 border-indigo-500', label: 'Bài học tiếp theo', pulse: true },
              { dot: 'bg-white border-indigo-300', label: 'Có bài học liên kết' },
              { dot: 'bg-white border-slate-200', label: 'Chưa có bài liên kết' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`relative w-5 h-5 rounded-full border-2 flex-shrink-0 ${item.dot}`}>
                  {item.pulse && (
                    <span className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-40" />
                  )}
                </div>
                <span className="text-xs text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Delete ───────────────────────────────────────────────────────── */}
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-rose-500 transition-colors font-medium w-full justify-center py-2"
          >
            <Trash2 className="w-4 h-4" /> Xóa lộ trình này
          </button>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-sm text-rose-700 font-semibold text-center">
              Xóa lộ trình? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 text-sm font-bold bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-60"
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
