import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DIALOGUES } from './ListeningData';
import {
  Volume2, Play, Pause, RotateCw, BookOpen, CheckCircle2,
  XCircle, ChevronRight, ChevronLeft, HelpCircle, Info, Award
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { annotateSentence } from '../../utils/furiganaHelper';

const sortedDialogues = [...DIALOGUES].sort((a, b) => {
  const levelOrder = { 'N5': 1, 'N4': 2, 'N3': 3, 'N2': 4, 'N1': 5 };
  const orderA = levelOrder[a.level] || 99;
  const orderB = levelOrder[b.level] || 99;
  if (orderA !== orderB) return orderA - orderB;
  return a.id.localeCompare(b.id, undefined, { numeric: true });
});

export default function ListeningDialogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentDiagId = searchParams.get('id');
  const currentLevel = searchParams.get('level');

  const activeDiag = useMemo(() => {
    if (!currentDiagId) return null;
    return sortedDialogues.find(d => d.id === currentDiagId) || null;
  }, [currentDiagId]);

  const [completedDiags, setCompletedDiags] = useState(() => {
    try {
      const stored = localStorage.getItem('minhongo_completed_dialogues');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const markDiagAsCompleted = useCallback((id) => {
    setCompletedDiags((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem('minhongo_completed_dialogues', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, []);

  const [showDiagJa, setShowDiagJa] = useState(true);
  const [showDiagRomaji, setShowDiagRomaji] = useState(true);
  const [showDiagVi, setShowDiagVi] = useState(true);

  const [speechRate, setSpeechRate] = useState(1.0); // 0.5, 0.8, 1.0
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  
  const playAllTimeout = useRef(null);
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const stopAutoPlay = useCallback(() => {
    setIsPlayingAll(false);
    setCurrentLineIndex(-1);
    if (playAllTimeout.current) {
      clearTimeout(playAllTimeout.current);
      playAllTimeout.current = null;
    }
    if (synth) synth.cancel();
  }, [synth]);

  // Script Dictation Mode states
  const [isDictationMode, setIsDictationMode] = useState(false);
  const [lineInputs, setLineInputs] = useState({});
  const [lineChecked, setLineChecked] = useState({});
  const [lineResults, setLineResults] = useState({});

  // Trắc nghiệm hiểu hội thoại
  const [diagAnswers, setDiagAnswers] = useState({}); // { questionIdx: optionIdx }
  const [diagSubmitted, setDiagSubmitted] = useState(false);
  const [diagScore, setDiagScore] = useState(0);

  // Clear auto play and inputs when changing active dialogue
  useEffect(() => {
    stopAutoPlay();
    resetDiagQuiz();
  }, [activeDiag, stopAutoPlay]);

  useEffect(() => {
    return () => {
      stopAutoPlay();
    };
  }, [stopAutoPlay]);

  const startAutoPlay = () => {
    if (isPlayingAll) {
      stopAutoPlay();
      return;
    }
    setIsPlayingAll(true);
    playLine(0);
  };

  const playLine = (index) => {
    if (index >= activeDiag.lines.length) {
      setIsPlayingAll(false);
      setCurrentLineIndex(-1);
      return;
    }
    setCurrentLineIndex(index);
    const line = activeDiag.lines[index];
    
    if (synth) {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(line.text);
      utterance.lang = 'ja-JP';
      utterance.rate = speechRate;
      
      utterance.onend = () => {
        if (isPlayingAll) {
          playAllTimeout.current = setTimeout(() => {
            playLine(index + 1);
          }, 1200); // 1.2s delay between lines
        }
      };
      
      synth.speak(utterance);
    }
  };

  const handleDiagSelect = (qIdx, optIdx) => {
    if (diagSubmitted) return;
    setDiagAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const submitDiagQuiz = () => {
    let score = 0;
    activeDiag.questions.forEach((q, idx) => {
      if (diagAnswers[idx] === q.answerIndex) score++;
    });
    setDiagScore(score);
    setDiagSubmitted(true);
    if (score === activeDiag.questions.length) {
      markDiagAsCompleted(activeDiag.id);
    }
  };

  const resetDiagQuiz = () => {
    setDiagAnswers({});
    setDiagSubmitted(false);
    setDiagScore(0);
    setLineInputs({});
    setLineChecked({});
    setLineResults({});
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
    const line = activeDiag.lines[idx];
    const userInput = lineInputs[idx] || '';
    const isMatched = cleanString(userInput) === cleanString(line.text);
    
    setLineChecked(prev => ({ ...prev, [idx]: true }));
    setLineResults(prev => ({ ...prev, [idx]: isMatched }));
  };

  const handleRevealLine = (idx) => {
    setLineResults(prev => ({ ...prev, [idx]: true }));
    setLineChecked(prev => ({ ...prev, [idx]: true }));
  };

  // N2 numbering utilities
  const parseNum = (str) => {
    if (!str) return '';
    return str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 65248));
  };

  const getLessonNumber = (title) => {
    const norm = parseNum(title);
    const match = norm.match(/Bài\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 999;
  };

  const getSubLessonNumber = (title) => {
    const norm = parseNum(title);
    const match = norm.match(/(\d+)\s*番/i);
    return match ? parseInt(match[1], 10) : 999;
  };

  const levelDialogues = useMemo(() => {
    if (!currentLevel) return [];
    return sortedDialogues.filter(d => d.level === currentLevel);
  }, [currentLevel]);

  // Group N2 dialogues by Chapter and sort
  const groupedN2Chapters = useMemo(() => {
    if (currentLevel !== 'N2') return null;
    const chapters = {};
    levelDialogues.forEach((diag) => {
      const match = diag.title.match(/(Bài\s*\d+)/i);
      const chapterName = match ? match[1] : 'Khác';
      if (!chapters[chapterName]) {
        chapters[chapterName] = [];
      }
      chapters[chapterName].push(diag);
    });

    const sortedChapters = {};
    const sortedKeys = Object.keys(chapters).sort((a, b) => {
      const numA = getLessonNumber(a);
      const numB = getLessonNumber(b);
      return numA - numB;
    });

    sortedKeys.forEach(key => {
      sortedChapters[key] = chapters[key].sort((a, b) => {
        const subA = getSubLessonNumber(a.title);
        const subB = getSubLessonNumber(b.title);
        return subA - subB;
      });
    });

    return sortedChapters;
  }, [currentLevel, levelDialogues]);

  // Total statistics for landing page
  const totalN5 = sortedDialogues.filter(d => d.level === 'N5').length;
  const totalN4 = sortedDialogues.filter(d => d.level === 'N4').length;
  const totalN2 = sortedDialogues.filter(d => d.level === 'N2').length;
  
  const completedN5 = sortedDialogues.filter(d => d.level === 'N5' && completedDiags.includes(d.id)).length;
  const completedN4 = sortedDialogues.filter(d => d.level === 'N4' && completedDiags.includes(d.id)).length;
  const completedN2 = sortedDialogues.filter(d => d.level === 'N2' && completedDiags.includes(d.id)).length;

  // Render selection views or study workspace
  if (!activeDiag) {
    if (!currentLevel) {
      // Landing page
      return (
        <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8 min-h-screen">
          <PageHeader
            tag="JLPT N5 → N2"
            title="Luyện nghe hội thoại"
            subtitle="Luyện phản xạ nghe hiểu tiếng Nhật qua các đoạn hội thoại thực tế phân theo cấp độ."
            ghostChar="聴"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 animate-fade-up">
            {/* Card N5 */}
            <button
              onClick={() => setSearchParams({ level: 'N5' })}
              className="group relative flex flex-col justify-between bg-surface-container-lowest p-6 transition-all sharp-shadow hover:sharp-shadow-sm hover:-translate-y-0.5 text-left w-full border border-outline-variant/50 overflow-hidden min-h-[220px] rounded-lg"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />
              <div className="flex items-start justify-between w-full mb-4">
                <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-500/10 border border-blue-500/20">
                  JLPT N5
                </span>
                <span className="text-xs text-on-surface-variant font-bold font-sans">
                  {completedN5}/{totalN5} đã học
                </span>
              </div>
              <div className="flex-1 mb-4">
                <h3 className="font-headline font-bold text-on-surface text-lg mb-2 group-hover:text-blue-600 transition-colors">
                  Sơ cấp N5
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                  Luyện nghe các đoạn hội thoại giao tiếp cơ bản hằng ngày, mua sắm, chào hỏi và giới thiệu bản thân cơ bản.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 transition-all mt-auto group-hover:gap-2">
                Bắt đầu học
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Card N4 */}
            <button
              onClick={() => setSearchParams({ level: 'N4' })}
              className="group relative flex flex-col justify-between bg-surface-container-lowest p-6 transition-all sharp-shadow hover:sharp-shadow-sm hover:-translate-y-0.5 text-left w-full border border-outline-variant/50 overflow-hidden min-h-[220px] rounded-lg"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-orange-600" />
              <div className="flex items-start justify-between w-full mb-4">
                <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider text-orange-700 bg-orange-500/10 border border-orange-500/20">
                  JLPT N4
                </span>
                <span className="text-xs text-on-surface-variant font-bold font-sans">
                  {completedN4}/{totalN4} đã học
                </span>
              </div>
              <div className="flex-1 mb-4">
                <h3 className="font-headline font-bold text-on-surface text-lg mb-2 group-hover:text-orange-600 transition-colors">
                  Sơ cấp N4
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                  Nâng cao khả năng nghe hiểu với chỉ đường, giao tiếp đời sống thực tế, trao đổi thông tin đơn giản.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-600 transition-all mt-auto group-hover:gap-2">
                Bắt đầu học
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Card N2 */}
            <button
              onClick={() => setSearchParams({ level: 'N2' })}
              className="group relative flex flex-col justify-between bg-surface-container-lowest p-6 transition-all sharp-shadow hover:sharp-shadow-sm hover:-translate-y-0.5 text-left w-full border border-outline-variant/50 overflow-hidden min-h-[220px] rounded-lg"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: '#c62828' }} />
              <div className="flex items-start justify-between w-full mb-4">
                <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider text-red-700 bg-red-500/10 border border-red-500/20" style={{ color: '#c62828' }}>
                  JLPT N2
                </span>
                <span className="text-xs text-on-surface-variant font-bold font-sans">
                  {completedN2}/{totalN2} đã học
                </span>
              </div>
              <div className="flex-1 mb-4">
                <h3 className="font-headline font-bold text-on-surface text-lg mb-2 group-hover:text-red-600 transition-colors" style={{ '--tw-text-opacity': '1', '--tw-group-hover-text-color': '#c62828' }}>
                  Thượng cấp N2
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                  Tài liệu nghe hiểu phong phú bám sát đề thi JLPT N2, giọng đọc tự nhiên của người bản xứ và từ vựng chuyên sâu.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all mt-auto group-hover:gap-2" style={{ color: '#c62828' }}>
                Bắt đầu học
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      );
    } else {
      // Level list page
      const totalCount = levelDialogues.length;
      const passedCount = levelDialogues.filter(d => completedDiags.includes(d.id)).length;
      const percent = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

      const levelTitle = currentLevel === 'N2' ? 'Thượng cấp N2' : currentLevel === 'N4' ? 'Sơ cấp N4' : 'Sơ cấp N5';
      const levelDesc = currentLevel === 'N2' 
        ? 'Luyện nghe hiểu chuẩn đề thi N2 bản xứ với các chủ đề cuộc sống và công việc phức tạp.' 
        : 'Luyện nghe cấu trúc hội thoại giao tiếp cơ bản hằng ngày.';

      return (
        <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8 min-h-screen">
          <PageHeader
            tag={`JLPT ${currentLevel}`}
            title={`Nghe hội thoại ${levelTitle}`}
            subtitle={levelDesc}
            ghostChar="聴"
            backLink="/listening/dialogue"
            backText="Quay lại tất cả cấp độ"
            rightContent={
              <div className="flex gap-2 text-white text-xs font-bold bg-white/10 px-3 py-1.5 border border-white/10 backdrop-blur-sm shrink-0">
                <span>{totalCount} bài học</span>
                <span className="text-white/30">|</span>
                <span>{passedCount} đã học</span>
              </div>
            }
          />

          {/* Progress bar */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 sharp-shadow-sm p-6 rounded-lg animate-fade-up">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-on-surface font-headline">Tiến độ học tập</span>
              <span className="text-sm font-bold text-on-surface-variant font-sans">
                {passedCount}/{totalCount} bài
              </span>
            </div>
            <div className="h-2.5 bg-surface-container overflow-hidden border border-outline-variant/20 rounded-full">
              <div
                className="h-full transition-all duration-500 rounded-full bg-secondary"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-end mt-1.5">
              <span className="text-xs font-bold text-on-surface-variant font-sans">{percent}% hoàn thành</span>
            </div>
          </div>

          {/* Lessons listing */}
          <div className="animate-fade-up">
            {currentLevel !== 'N2' ? (
              // N5 / N4 simple grid list
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {levelDialogues.map((diag, index) => {
                  const isCompleted = completedDiags.includes(diag.id);
                  return (
                    <button
                      key={diag.id}
                      onClick={() => setSearchParams({ level: currentLevel, id: diag.id })}
                      className="group bg-surface-container-lowest border border-outline-variant/50 p-5 flex items-center justify-between gap-4 transition-all sharp-shadow hover:sharp-shadow-sm hover:-translate-y-0.5 w-full text-left rounded-lg"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 font-black text-sm border border-secondary text-secondary bg-secondary/5 rounded-md">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-jp font-bold text-on-surface text-sm md:text-base group-hover:text-secondary transition-colors truncate">
                            {diag.title.replace(/^(?:N5|N4)\s*[-——–—]?\s*/i, '').trim()}
                          </h3>
                          <p className="text-xs text-on-surface-variant font-medium mt-1.5 truncate max-w-[250px] md:max-w-md">
                            {diag.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-xs font-bold px-2.5 py-1 bg-surface-container text-on-surface border border-outline-variant/40 rounded font-sans">
                          {diag.lines.length} câu
                        </span>
                        {isCompleted && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 rounded font-sans">
                            Đã học
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              // N2 Grouped by chapters
              <div className="space-y-8">
                {Object.entries(groupedN2Chapters).map(([chapter, items]) => {
                  const chapterCompleted = items.filter(d => completedDiags.includes(d.id)).length;
                  return (
                    <div key={chapter} className="space-y-4">
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-on-surface-variant/80 border-b border-outline-variant/30 pb-2 mt-4 flex justify-between items-center font-headline">
                        <span>{chapter}</span>
                        <span className="text-xs font-normal normal-case text-on-surface-variant/60 font-sans">
                          Đã học {chapterCompleted}/{items.length} bài
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map((diag) => {
                          const isCompleted = completedDiags.includes(diag.id);
                          const subLessonNum = getSubLessonNumber(diag.title);
                          const cleanTitle = diag.title.replace(/^(?:N2\s+Bài\s+\d+|N2)\s*[-——–—]?\s*(?:\d+番:)?\s*/i, '').trim();

                          return (
                            <button
                              key={diag.id}
                              onClick={() => setSearchParams({ level: currentLevel, id: diag.id })}
                              className="group bg-surface-container-lowest border border-outline-variant/50 p-4 flex items-center justify-between gap-4 transition-all sharp-shadow hover:sharp-shadow-sm hover:-translate-y-0.5 w-full text-left rounded-lg"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 font-black text-sm border border-secondary text-secondary bg-secondary/5 rounded-md">
                                  {subLessonNum !== 999 ? subLessonNum : '?'}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-jp font-bold text-on-surface text-sm group-hover:text-secondary transition-colors truncate">
                                    {cleanTitle}
                                  </h3>
                                  <p className="text-xs text-on-surface-variant font-medium mt-1 truncate max-w-[200px] md:max-w-xs">
                                    {diag.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0">
                                <span className="text-xs font-bold px-2 py-1 bg-surface-container text-on-surface border border-outline-variant/40 rounded font-sans">
                                  {diag.lines.length} câu
                                </span>
                                {isCompleted && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 rounded font-sans">
                                    Đã học
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  // Study workspace
  const cleanDiagTitle = activeDiag.title.replace(/^(?:N5|N4|N2)\s*[-——–—]?\s*/i, '').trim();

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8 min-h-screen">
      <PageHeader
        tag={`Bài luyện nghe ${activeDiag.level}`}
        title={cleanDiagTitle}
        subtitle={activeDiag.description}
        ghostChar="聴"
        backLink={`/listening/dialogue?level=${activeDiag.level}`}
        backText="Quay lại danh sách bài học"
        rightContent={
          <div className="flex gap-3.5 items-center bg-white/5 border border-white/10 px-4 py-2 rounded text-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Tốc độ đọc TTS:</span>
            <div className="flex gap-1.5">
              {[0.5, 0.8, 1.0].map(rate => (
                <button
                  key={rate}
                  onClick={() => setSpeechRate(rate)}
                  className={`px-2.5 py-1 text-xs font-bold transition-all border border-white/10 rounded hover:bg-white/10 cursor-pointer ${
                    speechRate === rate ? 'bg-amber-400 text-amber-950 border-amber-400 font-black' : 'text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
        {/* 1. THANH NGHE (AUDIO DECK AT THE TOP) */}
        <div className="p-5 md:p-6 bg-surface-container-lowest border border-outline-variant/30 sharp-shadow rounded-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 dark:bg-secondary/20 text-secondary flex items-center justify-center rounded-full flex-shrink-0" style={{ animation: isPlayingAll ? 'pulse 1.5s infinite' : 'none' }}>
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface font-headline">Thanh phát nhạc & đọc thoại</h3>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Phát liên tiếp các câu thoại tự động hoặc tùy chỉnh tốc độ đọc.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={startAutoPlay}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors border rounded-md cursor-pointer ${
                  isPlayingAll
                    ? 'bg-secondary text-white border-secondary sharp-shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border-outline-variant/40'
                }`}
              >
                {isPlayingAll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlayingAll ? 'Tạm dừng' : 'Chạy liên tục'}
              </button>
              <button
                onClick={stopAutoPlay}
                className="p-2 border border-outline-variant/40 hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer rounded-md"
                title="Phát lại từ đầu"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context box */}
          {activeDiag.context && (
            <div className="p-4 bg-amber-500/5 dark:bg-amber-950/15 border border-amber-500/20 dark:border-amber-900/40 text-xs rounded-md leading-relaxed">
              <span className="font-extrabold text-amber-800 dark:text-amber-400">Ngữ cảnh: </span>
              <span className="text-on-surface font-jp font-semibold ml-1">{activeDiag.context}</span>
              {activeDiag.contextVi && (
                <p className="text-on-surface-variant/80 mt-1 italic">({activeDiag.contextVi})</p>
              )}
            </div>
          )}

          {/* Native audio player (JLPT N2) */}
          {activeDiag.audioSrc && (
            <div className="pt-4 border-t border-outline-variant/20">
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-2 font-headline">Audio gốc người bản xứ</p>
              <audio controls preload="none" className="w-full h-9 block outline-none">
                <source src={activeDiag.audioSrc} type="audio/mpeg" />
              </audio>
            </div>
          )}
        </div>

        {/* 2. SCRIPT NGHE (DIALOGUE BUBBLES MIDDLE SECTION) */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 md:p-6 rounded-lg sharp-shadow space-y-6">
          {/* Script Control Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-outline-variant/20">
            <h3 className="font-headline font-bold text-on-surface text-sm uppercase tracking-wider flex items-center gap-1.5">
              Script Nghe Hội Thoại
            </h3>

            <div className="flex flex-wrap items-center gap-4">
              {/* Dictation switcher */}
              <label className="flex items-center gap-2 text-xs font-bold text-secondary cursor-pointer select-none font-headline uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={isDictationMode}
                  onChange={(e) => setIsDictationMode(e.target.checked)}
                  className="w-4 h-4 accent-secondary cursor-pointer"
                />
                <span>Chép chính tả</span>
              </label>

              {/* Toggles */}
              <div className="flex gap-0.5 bg-surface-container p-0.5 border border-outline-variant/40 rounded text-[10px]">
                <button
                  onClick={() => setShowDiagJa(p => !p)}
                  className={`px-2.5 py-1 font-bold rounded-sm transition-all cursor-pointer ${
                    showDiagJa ? 'bg-surface-container-lowest text-secondary font-black shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  Tiếng Nhật
                </button>
                <button
                  onClick={() => setShowDiagRomaji(p => !p)}
                  className={`px-2.5 py-1 font-bold rounded-sm transition-all cursor-pointer ${
                    showDiagRomaji ? 'bg-surface-container-lowest text-secondary font-black shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  Romaji
                </button>
                <button
                  onClick={() => setShowDiagVi(p => !p)}
                  className={`px-2.5 py-1 font-bold rounded-sm transition-all cursor-pointer ${
                    showDiagVi ? 'bg-surface-container-lowest text-secondary font-black shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  Bản dịch
                </button>
              </div>
            </div>
          </div>

          {/* Dialogue list thread */}
          <div className="space-y-6">
            {activeDiag.lines.map((line, idx) => {
              const isSpeakerA = line.speaker === 'A';
              const isActive = currentLineIndex === idx;
              const isRevealed = !isDictationMode || lineResults[idx] || false;

              return (
                <div
                  key={idx}
                  className={`flex gap-4 items-start w-full ${
                    isSpeakerA ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {/* Speaker A left avatar & volume */}
                  {isSpeakerA && (
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm tracking-wider transition-all border ${
                        isActive
                          ? 'bg-secondary text-white border-secondary sharp-shadow-sm scale-105'
                          : 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-container dark:border-primary-container/30'
                      }`}>
                        {line.name ? line.name[0].toUpperCase() : 'A'}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); playLine(idx); }}
                        className={`p-2 rounded-full border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-secondary text-white border-secondary'
                            : 'bg-surface hover:bg-surface-container text-on-surface-variant border-outline-variant/30 hover:border-outline-variant'
                        }`}
                        aria-label={`Nghe câu ${idx + 1}`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Speech Bubble */}
                  <div
                    className={`flex-1 max-w-[78%] p-4 border text-left transition-all relative rounded-lg ${
                      isActive
                        ? 'border-secondary bg-surface-container-lowest sharp-shadow ring-1 ring-secondary/15'
                        : isSpeakerA
                        ? 'bg-surface-container border-outline-variant/20 hover:border-outline-variant/40'
                        : 'bg-surface-container-low border-outline-variant/10 hover:border-outline-variant/30'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-4 mb-2">
                      <span className="text-[10px] font-black tracking-wider uppercase text-on-surface-variant opacity-90">
                        {line.name}
                      </span>
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <div className="flex items-end gap-0.5 h-3 pb-0.5" aria-hidden="true">
                            <span className="w-0.5 h-2 bg-secondary animate-pulse" />
                            <span className="w-0.5 h-3 bg-secondary animate-pulse" style={{ animationDelay: '0.15s' }} />
                            <span className="w-0.5 h-1.5 bg-secondary animate-pulse" style={{ animationDelay: '0.3s' }} />
                          </div>
                        )}
                        <span className="text-[9px] text-on-surface-variant/40 font-mono">
                          {line.speaker === 'A' ? 'Speaker A' : 'Speaker B'}
                        </span>
                      </div>
                    </div>

                    {!isRevealed ? (
                      <div className="space-y-3 py-1.5 animate-fade-up">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-ping" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-90">
                            Chế độ Chép chính tả
                          </span>
                        </div>
                        
                        <div className="relative flex items-center bg-surface border border-outline-variant/60 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/15 transition-all duration-200 rounded-lg overflow-hidden group shadow-sm">
                          {/* Keyboard/Pen icon on the left */}
                          <div className="absolute left-3 text-on-surface-variant/40 group-focus-within:text-secondary transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                          
                          <input
                            type="text"
                            placeholder="Gõ lại câu thoại tiếng Nhật nghe được..."
                            value={lineInputs[idx] || ''}
                            onChange={(e) => setLineInputs(prev => ({ ...prev, [idx]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCheckLine(idx); }}
                            className="w-full pl-9 pr-24 py-2.5 bg-transparent text-sm focus:outline-none font-jp font-bold text-on-surface"
                          />
                          
                          {/* Actions grouped on the right inside input bar */}
                          <div className="absolute right-1.5 flex gap-1">
                            <button
                              onClick={() => handleRevealLine(idx)}
                              className="px-2.5 py-1.5 text-[10px] font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded cursor-pointer uppercase tracking-wider font-headline"
                              title="Hiển thị câu thoại"
                            >
                              Hiện
                            </button>
                            <button
                              onClick={() => handleCheckLine(idx)}
                              className="px-3 py-1.5 bg-secondary text-white text-[10px] font-black hover:bg-secondary-dim transition-colors rounded cursor-pointer uppercase tracking-widest shadow-sm font-headline"
                            >
                              Check
                            </button>
                          </div>
                        </div>

                        {lineChecked[idx] && !lineResults[idx] && (
                          <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-450 rounded-md text-xs">
                            <XCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                            <span className="font-semibold text-rose-700 dark:text-rose-400">Chưa chính xác, hãy nghe lại câu thoại và thử lại nhé!</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {isDictationMode && lineChecked[idx] && lineResults[idx] && (
                          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-450 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/15 mb-2 w-max">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Chép chính tả chính xác
                          </div>
                        )}

                        {showDiagJa && (
                          <p 
                            className="font-jp text-base font-bold text-on-surface leading-normal tracking-wide"
                            dangerouslySetInnerHTML={{ __html: annotateSentence(line.text) }}
                          />
                        )}
                        
                        {showDiagRomaji && line.romaji && (
                          <p className="text-xs text-on-surface-variant font-medium tracking-wide mt-1.5 italic font-jp">
                            {line.romaji}
                          </p>
                        )}

                        {showDiagVi && (
                          <p className="text-xs text-on-surface/85 leading-relaxed mt-2 pt-2 border-t border-outline-variant/15">
                            {line.translation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Speaker B right avatar & volume */}
                  {!isSpeakerA && (
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm tracking-wider transition-all border ${
                        isActive
                          ? 'bg-secondary text-white border-secondary sharp-shadow-sm scale-105'
                          : 'bg-tertiary/10 text-tertiary border-tertiary/20 dark:bg-tertiary/20 dark:text-tertiary dark:border-tertiary/30'
                      }`}>
                        {line.name ? line.name[0].toUpperCase() : 'B'}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); playLine(idx); }}
                        className={`p-2 rounded-full border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-secondary text-white border-secondary'
                            : 'bg-surface hover:bg-surface-container text-on-surface-variant border-outline-variant/30 hover:border-outline-variant'
                        }`}
                        aria-label={`Nghe câu ${idx + 1}`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. CÂU HỎI TRẢ LỜI (MCQ COMPREHENSION QUIZ AT THE BOTTOM) */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 md:p-6 rounded-lg sharp-shadow space-y-6">
          <h3 className="font-headline font-bold text-on-surface text-base flex items-center gap-2 border-b border-outline-variant/20 pb-4">
            <Award className="w-5 h-5 text-amber-500" />
            Bài kiểm tra nghe hiểu (Comprehension Check)
          </h3>
          
          <div className="space-y-6">
            {activeDiag.questions.map((q, qIdx) => (
              <div key={qIdx} className="space-y-3">
                <p className="text-sm font-bold text-on-surface flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-surface-container text-on-surface-variant flex items-center justify-center font-bold text-xs flex-shrink-0 rounded-sm">
                    {qIdx + 1}
                  </span>
                  {q.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7.5">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = diagAnswers[qIdx] === optIdx;
                    const isCorrect = optIdx === q.answerIndex;
                    let btnStyle = 'bg-surface border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low dark:hover:bg-surface-container/40';
                    
                    if (diagSubmitted) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold';
                      } else if (isSelected) {
                        btnStyle = 'bg-rose-50 dark:bg-rose-950/20 border-rose-400 dark:border-rose-800 text-rose-800 dark:text-rose-300';
                      } else {
                        btnStyle = 'bg-surface border-outline-variant/10 opacity-40';
                      }
                    } else if (isSelected) {
                      btnStyle = 'border-secondary bg-surface-container-lowest font-bold text-secondary';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleDiagSelect(qIdx, optIdx)}
                        disabled={diagSubmitted}
                        className={`p-3 text-left text-xs transition-all border cursor-pointer rounded-md ${btnStyle}`}
                        style={{ boxShadow: isSelected && !diagSubmitted ? '2px 2px 0 0 var(--secondary)' : 'none' }}
                      >
                        <span className="mr-2 font-mono text-[10px] text-on-surface-variant font-bold">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {diagSubmitted && (
                  <div className="pl-7.5 animate-fade-up">
                    <div className="text-xs text-on-surface-variant bg-surface-container-low p-3.5 border-l-2 border-secondary flex items-start gap-2.5 rounded-r">
                      <Info className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold text-secondary">Giải thích: </span>
                        {q.explanation}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Submission and Scoring */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-4 border-t border-outline-variant/20">
            {!diagSubmitted ? (
              <button
                onClick={submitDiagQuiz}
                disabled={Object.keys(diagAnswers).length < activeDiag.questions.length}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-on-secondary bg-secondary hover:bg-secondary-dim disabled:opacity-40 transition-colors shadow-sm ml-auto cursor-pointer rounded-md font-headline"
              >
                Nộp bài trắc nghiệm
              </button>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-on-surface">Kết quả:</span>
                  <span className="text-2xl font-black text-secondary">
                    {diagScore} / {activeDiag.questions.length}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">câu đúng</span>
                  {diagScore === activeDiag.questions.length && (
                    <span className="px-2 py-0.5 text-[9px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 uppercase tracking-widest rounded dark:bg-emerald-950/20 dark:text-emerald-300 font-sans">
                      Hoàn thành xuất sắc!
                    </span>
                  )}
                </div>
                <button
                  onClick={resetDiagQuiz}
                  className="px-5 py-2.5 border border-outline-variant/45 hover:bg-surface-container-low text-xs font-bold uppercase tracking-wider transition-colors ml-auto cursor-pointer rounded-md font-headline"
                >
                  Làm lại bài
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
