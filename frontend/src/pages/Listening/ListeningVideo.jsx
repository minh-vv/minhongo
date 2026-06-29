import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { VIDEOS } from './ListeningVideoData';
import {
  Volume2, Play, Pause, RotateCw, BookOpen, CheckCircle2,
  XCircle, ChevronRight, HelpCircle, Info, Award
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { annotateSentence } from '../../utils/furiganaHelper';

export default function ListeningVideo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentVideoId = searchParams.get('id');

  const activeVideo = useMemo(() => {
    if (!currentVideoId) return null;
    return VIDEOS.find(v => v.id === currentVideoId) || null;
  }, [currentVideoId]);

  const [completedVideos, setCompletedVideos] = useState(() => {
    try {
      const stored = localStorage.getItem('minhongo_completed_videos');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const markVideoAsCompleted = useCallback((id) => {
    setCompletedVideos((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem('minhongo_completed_videos', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, []);

  const [currentTime, setCurrentTime] = useState(0);
  const [isFillBlankMode, setIsFillBlankMode] = useState(false);
  const [lineInputs, setLineInputs] = useState({});
  const [lineChecked, setLineChecked] = useState({});
  const [lineResults, setLineResults] = useState({});

  const playerInstance = useRef(null);
  const pollInterval = useRef(null);
  const sidebarRef = useRef(null);
  const playerContainerRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollInterval.current = setInterval(() => {
      if (playerInstance.current && typeof playerInstance.current.getCurrentTime === 'function') {
        const time = playerInstance.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 250);
  }, [stopPolling]);

  const initPlayer = useCallback(() => {
    if (!window.YT || !window.YT.Player || !activeVideo || !playerContainerRef.current) return;

    if (playerInstance.current) {
      try {
        playerInstance.current.destroy();
      } catch (e) {
        console.error(e);
      }
      playerInstance.current = null;
    }

    // Recreate the target div inside the container to prevent DOM replacement issues
    playerContainerRef.current.innerHTML = '<div id="yt-player-frame" class="w-full h-full"></div>';

    playerInstance.current = new window.YT.Player('yt-player-frame', {
      videoId: activeVideo.youtubeId,
      playerVars: {
        playsinline: 1,
        rel: 0,
        modestbranding: 1
      },
      events: {
        onStateChange: (event) => {
          // 1 is playing, 0 is ended
          if (event.data === 1) {
            startPolling();
          } else {
            stopPolling();
            if (event.data === 0) {
              markVideoAsCompleted(activeVideo.id);
            }
          }
        }
      }
    });
  }, [activeVideo, markVideoAsCompleted, startPolling, stopPolling]);

  // Sync YouTube iframe library
  useEffect(() => {
    if (!activeVideo) return;

    let isMounted = true;
    let checkInterval = null;

    const loadYoutubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
        return;
      }

      // If script is not present, add it
      if (!document.getElementById('youtube-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }

      // Poll until window.YT and window.YT.Player are available
      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          if (isMounted) initPlayer();
        }
      }, 100);
    };

    loadYoutubeAPI();

    // Reset states
    setCurrentTime(0);
    setLineInputs({});
    setLineChecked({});
    setLineResults({});

    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
      stopPolling();
      if (playerInstance.current) {
        try {
          playerInstance.current.destroy();
        } catch (e) {
          console.error(e);
        }
        playerInstance.current = null;
      }
    };
  }, [activeVideo, initPlayer, stopPolling]);

  const activeLineIndex = useMemo(() => {
    if (!activeVideo) return -1;
    return activeVideo.subtitles.findIndex(
      (sub) => currentTime >= sub.start && currentTime <= sub.end
    );
  }, [activeVideo, currentTime]);

  // Sidebar auto scroll — keep active line at the TOP of the container
  useEffect(() => {
    if (activeLineIndex !== -1 && sidebarRef.current) {
      const activeEl = sidebarRef.current.querySelector(`[data-line-index="${activeLineIndex}"]`);
      if (activeEl) {
        const container = sidebarRef.current;
        container.scrollTo({ top: activeEl.offsetTop, behavior: 'smooth' });
      }
    }
  }, [activeLineIndex]);

  const handleSeek = (seconds) => {
    if (playerInstance.current && typeof playerInstance.current.seekTo === 'function') {
      playerInstance.current.seekTo(seconds, true);
      // Play if paused
      playerInstance.current.playVideo();
    }
  };

  const cleanString = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()。、？?！!「」]/g, '')
      .replace(/\s+/g, '')
      .trim();
  };

  const handleCheckLine = (idx) => {
    const line = activeVideo.subtitles[idx];
    const userInput = lineInputs[idx] || '';
    const isMatched = cleanString(userInput) === cleanString(line.blankWord);
    
    setLineChecked(prev => ({ ...prev, [idx]: true }));
    setLineResults(prev => ({ ...prev, [idx]: isMatched }));

    // If correct, resume video after short delay
    if (isMatched && playerInstance.current && typeof playerInstance.current.playVideo === 'function') {
      setTimeout(() => {
        playerInstance.current.playVideo();
      }, 1000);
    }
  };

  const handleRevealLine = (idx) => {
    setLineResults(prev => ({ ...prev, [idx]: true }));
    setLineChecked(prev => ({ ...prev, [idx]: true }));
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Renders the Japanese sentence — in fill-blank mode the blank word is shown as ＿＿
  // The actual input field is rendered separately below the text, not inline.
  const renderSentenceText = (line, idx) => {
    const text = line.text;
    const blank = line.blankWord;
    const isCorrect = lineResults[idx];

    if (!isFillBlankMode || !blank || !text.includes(blank)) {
      return (
        <p
          className="font-jp text-xl md:text-2xl font-semibold text-on-surface leading-relaxed"
          dangerouslySetInnerHTML={{ __html: annotateSentence(text) }}
        />
      );
    }

    // In fill-blank mode: replace blank word with dashes or show the revealed word
    const parts = text.split(blank);
    return (
      <p className="font-jp text-xl md:text-2xl font-semibold text-on-surface leading-relaxed">
        <span dangerouslySetInnerHTML={{ __html: annotateSentence(parts[0]) }} />
        {isCorrect ? (
          <span
            className="text-[var(--secondary)] border-b-2 border-[var(--secondary)]/60 px-1"
            dangerouslySetInnerHTML={{ __html: annotateSentence(blank) }}
          />
        ) : (
          <span className="inline-block min-w-[3rem] mx-1 border-b-2 border-dashed border-on-surface-variant/50 text-on-surface-variant text-base align-bottom">
            {'　'}
          </span>
        )}
        <span dangerouslySetInnerHTML={{ __html: annotateSentence(parts[1]) }} />
      </p>
    );
  };

  // Renders the fill-blank input row — shown below the sentence, only when needed
  const renderFillBlankInput = (line, idx) => {
    if (!isFillBlankMode || !line.blankWord || !line.text.includes(line.blankWord)) return null;
    const isCorrect = lineResults[idx];
    const isChecked = lineChecked[idx];

    if (isCorrect) {
      return (
        <div className="flex items-center gap-2 pt-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Đúng rồi!</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 pt-2">
        <input
          type="text"
          value={lineInputs[idx] || ''}
          placeholder="Nhập từ còn thiếu…"
          onChange={(e) => setLineInputs(prev => ({ ...prev, [idx]: e.target.value }))}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCheckLine(idx); }}
          autoFocus
          className={`flex-1 min-w-0 px-3 py-2 rounded-lg border text-sm font-jp bg-surface text-on-surface outline-none transition-colors ${
            isChecked && !isCorrect
              ? 'border-rose-400 dark:border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
              : 'border-outline-variant focus:border-[var(--secondary)]'
          }`}
        />
        {isChecked && !isCorrect && (
          <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
        )}
        <button
          onClick={() => handleCheckLine(idx)}
          className="px-3 py-2 bg-[var(--secondary)] hover:bg-[var(--secondary-dim)] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex-shrink-0"
        >
          Kiểm tra
        </button>
        <button
          onClick={() => handleRevealLine(idx)}
          className="px-3 py-2 border border-outline-variant text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-lg cursor-pointer transition-colors flex-shrink-0"
        >
          Hiện đáp án
        </button>
      </div>
    );
  };

  // Landing view
  if (!activeVideo) {
    const totalCount = VIDEOS.length;
    const passedCount = VIDEOS.filter(v => completedVideos.includes(v.id)).length;
    const percent = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

    return (
      <div className="min-h-screen bg-surface font-jp-sans text-on-surface">
        {/* ── Page header ──────────────────────────────────────────────── */}
        <PageHeader
          tag="Luyện nghe qua phim"
          title="Nghe qua hoạt hình"
          subtitle="Rèn luyện kỹ năng nghe hiểu tiếng Nhật thực tế thông qua các video phim hoạt hình, truyện cổ tích có phụ đề tương tác."
          ghostChar="画"
        />

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

          {/* ── Progress strip ───────────────────────────────────────────── */}
          <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant rounded-xl px-5 py-4 flex items-center gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-on-surface">Tiến độ học</span>
                <span className="text-sm font-bold text-on-surface-variant tabular-nums">
                  {passedCount} / {totalCount}
                </span>
              </div>
              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--secondary)] transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-xs text-on-surface-variant mt-1.5">
                {percent === 0
                  ? 'Chưa học bài nào — bắt đầu thôi!'
                  : percent === 100
                  ? '🎉 Đã hoàn thành tất cả bài học!'
                  : `Đã hoàn thành ${percent}% — cố lên nhé!`}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-3xl font-bold text-[var(--secondary)] tabular-nums leading-none">{percent}%</p>
              <p className="text-xs text-on-surface-variant mt-0.5">hoàn thành</p>
            </div>
          </div>

          {/* ── Video grid ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {VIDEOS.map((vid) => {
              const isCompleted = completedVideos.includes(vid.id);
              const thumbUrl = `https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg`;

              return (
                <button
                  key={vid.id}
                  onClick={() => setSearchParams({ id: vid.id })}
                  className="group flex flex-col bg-surface-container-lowest dark:bg-surface-container border border-outline-variant rounded-xl overflow-hidden hover:border-[var(--secondary)] hover:shadow-md transition-all duration-200 text-left w-full"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-surface-container-high flex-shrink-0">
                    <img
                      src={thumbUrl}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 text-[var(--secondary)] fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* JLPT badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-[var(--secondary)] text-white text-[11px] font-bold rounded-md shadow-sm">
                      {vid.level}
                    </div>

                    {/* Completed badge */}
                    {isCompleted && (
                      <div className="absolute top-2 right-2 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="flex flex-col flex-1 p-3 gap-2">
                    <h3 className="text-sm font-semibold text-on-surface leading-snug line-clamp-2 group-hover:text-[var(--secondary)] transition-colors">
                      {vid.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 flex-1">
                      {vid.description}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/60">
                      <span className="text-xs text-on-surface-variant">
                        {vid.subtitles.length} câu thoại
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[var(--secondary)] group-hover:gap-1.5 transition-all">
                        Học ngay
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Active workspace view
  const activeLine = activeLineIndex !== -1 ? activeVideo.subtitles[activeLineIndex] : null;

  return (
    <div className="min-h-screen bg-surface font-jp-sans text-on-surface flex flex-col">
      <div className="max-w-7xl w-full mx-auto px-4 md:px-6 py-4 flex flex-col gap-4 flex-1 min-h-0">

        {/* ── Compact header strip ─────────────────────────────────────── */}
        <PageHeader
          tag={`Luyện nghe qua phim • JLPT ${activeVideo.level}`}
          title={activeVideo.title}
          subtitle={activeVideo.description}
          ghostChar="画"
          backLink="/listening/video"
          backText="Quay lại danh sách phim"
          compact={true}
          rightContent={
            completedVideos.includes(activeVideo.id) ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã hoàn thành
              </span>
            ) : (
              <button
                onClick={() => markVideoAsCompleted(activeVideo.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--secondary-dim)] text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                Hoàn thành bài
              </button>
            )
          }
        />

        {/* ── Two-column workspace ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[calc(100vh-140px)] lg:min-h-0 overflow-y-auto lg:overflow-hidden">

          {/* ── LEFT: Player + Active subtitle ────────────────────────── */}
          <div className="lg:col-span-8 flex flex-col gap-4 lg:h-full lg:min-h-0 min-h-0">

            {/* Video Player */}
            <div
              ref={playerContainerRef}
              className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-md flex-shrink-0 border border-outline-variant"
            >
              <div id="yt-player-frame" className="w-full h-full" />
            </div>

            {/* Active Subtitle Panel */}
            <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">

              {/* Fill-blank mode toggle */}
              <div className="flex items-center justify-between gap-3 flex-shrink-0">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
                  Phụ đề đang phát
                </span>
                <button
                  onClick={() => setIsFillBlankMode(v => !v)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    isFillBlankMode
                      ? 'bg-[var(--secondary)] text-white border-[var(--secondary-dim)] shadow-sm'
                      : 'bg-surface-container text-on-surface-variant border-outline-variant hover:border-[var(--secondary)] hover:text-[var(--secondary)]'
                  }`}
                  aria-pressed={isFillBlankMode}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Luyện điền từ
                </button>
              </div>

              {/* Subtitle content */}
              <div className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl border border-outline-variant p-5 flex-shrink-0">
                {activeLine ? (
                  <div className="space-y-3">
                    {/* Japanese text — blank shown as underline gap in fill-blank mode */}
                    {renderSentenceText(activeLine, activeLineIndex)}

                    {/* Fill-blank input row — below the text, not inline */}
                    {renderFillBlankInput(activeLine, activeLineIndex)}

                    {/* Romaji — hidden while fill-blank not yet answered */}
                    {(!isFillBlankMode || lineResults[activeLineIndex]) && activeLine.romaji && (
                      <p className="text-sm text-[var(--tertiary)] dark:text-emerald-400 italic tracking-wide font-hand pt-1">
                        {activeLine.romaji}
                      </p>
                    )}

                    {/* Translation — hidden while fill-blank not yet answered */}
                    {(!isFillBlankMode || lineResults[activeLineIndex]) && (
                      <p className="text-sm text-on-surface-variant leading-relaxed pt-3 border-t border-outline-variant">
                        {activeLine.translation}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center gap-2 text-center">
                    <Volume2 className="w-8 h-8 text-on-surface-variant opacity-40" />
                    <p className="text-sm font-medium text-on-surface-variant">Không có thoại tại thời điểm này</p>
                    <p className="text-xs text-on-surface-variant opacity-70">
                      Phát video hoặc chọn dòng trong script bên phải để nhảy đến
                    </p>
                  </div>
                )}
              </div>

              {/* Current time hint */}
              <p className="text-xs text-on-surface-variant opacity-60 flex-shrink-0 pl-1">
                ⏱ {formatTime(currentTime)} — nhấn vào dòng thoại bên phải để tua đến vị trí đó
              </p>
            </div>
          </div>

          {/* ── RIGHT: Full script sidebar ─────────────────────────────── */}
          <div className="lg:col-span-4 flex flex-col rounded-xl border border-outline-variant overflow-hidden bg-surface-container-lowest dark:bg-surface-container-low shadow-sm lg:h-full min-h-[400px] lg:min-h-0">

            {/* Sidebar header */}
            <div className="flex items-center justify-between px-4 py-3 bg-surface-container dark:bg-surface-container border-b border-outline-variant flex-shrink-0">
              <span className="text-xs font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-on-surface-variant" />
                Script đầy đủ
              </span>
              <span className="text-xs font-semibold text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-full">
                {activeVideo.subtitles.length} câu
              </span>
            </div>

            {/* Script list */}
            <div
              ref={sidebarRef}
              className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-outline-variant/40 relative"
            >
              {activeVideo.subtitles.map((line, idx) => {
                const isActive = activeLineIndex === idx;
                const isChecked = lineChecked[idx];
                const isCorrect = lineResults[idx];

                return (
                  <button
                    key={idx}
                    data-line-index={idx}
                    onClick={() => handleSeek(line.start)}
                    className={`w-full px-4 py-3 text-left flex gap-3 items-start transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[var(--secondary)]/8 dark:bg-[var(--secondary)]/12 border-l-2 border-[var(--secondary)]'
                        : 'border-l-2 border-transparent hover:bg-surface-container dark:hover:bg-surface-container'
                    }`}
                  >
                    {/* Timestamp */}
                    <span className={`font-mono text-[11px] mt-0.5 flex-shrink-0 select-none tabular-nums ${
                      isActive ? 'text-[var(--secondary)] font-bold' : 'text-on-surface-variant opacity-70'
                    }`}>
                      {formatTime(line.start)}
                    </span>

                    <div className="min-w-0 flex-1 space-y-1">
                      <p className={`font-jp text-sm leading-snug ${
                        isActive ? 'text-on-surface font-bold' : 'text-on-surface font-normal'
                      }`}>
                        {line.text}
                      </p>
                      <p className="text-xs text-on-surface-variant leading-normal line-clamp-1 font-normal">
                        {line.translation}
                      </p>
                      {/* Fill-blank status badges */}
                      {isFillBlankMode && isCorrect && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Đúng
                        </span>
                      )}
                      {isFillBlankMode && isChecked && !isCorrect && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          <XCircle className="w-3 h-3" /> Sai
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
