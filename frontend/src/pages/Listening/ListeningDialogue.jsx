import { useState, useEffect, useRef, useCallback } from 'react';
import { DIALOGUES } from './ListeningData';
import {
  Volume2, Play, Pause, RotateCw, BookOpen, CheckCircle2,
  XCircle, ChevronRight, HelpCircle, ArrowRight, Info, Award
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';

export default function ListeningDialogue() {
  const [activeDiag, setActiveDiag] = useState(DIALOGUES[0]);
  const [showDiagJa, setShowDiagJa] = useState(true);
  const [showDiagRomaji, setShowDiagRomaji] = useState(true);
  const [showDiagVi, setShowDiagVi] = useState(true);
  const [levelFilter, setLevelFilter] = useState('ALL');

  const [speechRate, setSpeechRate] = useState(1.0); // 0.5, 0.8, 1.0
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('isSidebarCollapsed') === 'true');

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newVal = !prev;
      localStorage.setItem('isSidebarCollapsed', String(newVal));
      return newVal;
    });
  };
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

  // Clear auto play when changing active dialogue
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

  // Trắc nghiệm hiểu hội thoại
  const [diagAnswers, setDiagAnswers] = useState({}); // { questionIdx: optionIdx }
  const [diagSubmitted, setDiagSubmitted] = useState(false);
  const [diagScore, setDiagScore] = useState(0);

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
  };

  const resetDiagQuiz = () => {
    setDiagAnswers({});
    setDiagSubmitted(false);
    setDiagScore(0);
  };

  const isSelectedCorrect = (qIdx, q) => {
    return diagAnswers[qIdx] === q.answerIndex;
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8 animate-fade-up">
      {/* ── HERO BANNER (Navy & Vermilion Accent) ── */}
      <PageHeader
        tag="Luyện kỹ năng thực hành nghe nói"
        title="Nghe hội thoại"
        subtitle="Luyện phản xạ nghe hiểu qua các đoạn hội thoại thực tế."
        ghostChar="聴"
        rightContent={
          <div className="flex gap-4 items-center bg-white/5 border border-white/10 px-5 py-3 text-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Tốc độ đọc TTS:</span>
            <div className="flex gap-1.5">
              {[0.5, 0.8, 1.0].map(rate => (
                <button
                  key={rate}
                  onClick={() => setSpeechRate(rate)}
                  className={`px-2 py-1 text-xs font-bold transition-all ${
                    speechRate === rate ? 'bg-amber-400 text-amber-950 font-black' : 'hover:bg-white/10 text-white'
                  }`}
                  style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* ── MAIN CONTENT ACCORDING TO TABS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar list dialogues */}
        <div className={`lg:col-span-4 space-y-4 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> Danh sách hội thoại
            </h2>
          </div>
          {/* Level filter tabs */}
          <div className="flex flex-wrap gap-1 bg-surface-container p-1 border border-outline-variant/40">
            {['ALL', 'N5', 'N4', 'N2'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-3 py-1.5 text-xs font-bold transition-all ${
                  levelFilter === lvl
                    ? 'bg-secondary text-white'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {lvl === 'ALL' ? 'Tất cả' : lvl}
              </button>
            ))}
          </div>
          <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1 no-scrollbar">
            {DIALOGUES.filter(d => levelFilter === 'ALL' || d.level === levelFilter).map(diag => (
              <button
                key={diag.id}
                onClick={() => setActiveDiag(diag)}
                className={`w-full p-4 border text-left cursor-pointer transition-all ${
                  activeDiag.id === diag.id
                    ? 'bg-surface border-secondary sharp-shadow'
                    : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 text-[9px] font-bold ${
                    diag.level === 'N5' ? 'bg-blue-100 text-blue-800' :
                    diag.level === 'N4' ? 'bg-orange-100 text-orange-800' :
                    diag.level === 'N2' ? 'bg-red-100 text-red-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {diag.level}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-medium">
                    {diag.lines.length} câu thoại
                  </span>
                </div>
                <h3 className="font-headline font-bold text-on-surface text-sm line-clamp-2">
                  {diag.title}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1 line-clamp-2">
                  {diag.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation detail screen */}
        <div className={`${isSidebarCollapsed ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
          <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 sharp-shadow relative">
            
            {/* Dialogue Actions Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-outline-variant/20 mb-4">
              <div>
                <h2 className="font-headline text-lg font-black text-on-surface flex items-center gap-2">
                  {activeDiag.title}
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">Nhấp vào từng câu thoại hoặc bóng chat để nghe phát âm</p>
              </div>
              
              {/* Controls */}
              <div className="flex gap-2">
                <button
                  onClick={toggleSidebar}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant/40 text-xs font-bold uppercase tracking-wider transition-colors"
                  title={isSidebarCollapsed ? "Hiển thị mục lục" : "Ẩn mục lục"}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {isSidebarCollapsed ? 'Mở rộng' : 'Thu gọn'}
                </button>
                <button
                  onClick={startAutoPlay}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors border ${
                    isPlayingAll
                      ? 'bg-secondary text-white border-secondary'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border-outline-variant/40'
                  }`}
                >
                  {isPlayingAll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlayingAll ? 'Tạm dừng' : 'Chạy liên tục'}
                </button>
                <button
                  onClick={stopAutoPlay}
                  className="p-2 border border-outline-variant/40 hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors"
                  title="Phát lại từ đầu"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Premium segmented control for Visibility toggles */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs font-bold text-on-surface-variant mb-6 pb-4 border-b border-outline-variant/20">
              <span className="text-[10px] uppercase tracking-wider my-auto">Hiển thị:</span>
              <div className="flex flex-wrap gap-1 bg-surface-container p-1 border border-outline-variant/40">
                <button
                  onClick={() => setShowDiagJa(prev => !prev)}
                  className={`px-3 py-1.5 font-bold transition-all text-xs ${
                    showDiagJa
                      ? 'bg-surface-container-lowest text-secondary shadow-sm'
                      : 'text-on-surface-variant/70 hover:text-on-surface'
                  }`}
                >
                  Tiếng Nhật
                </button>
                <button
                  onClick={() => setShowDiagRomaji(prev => !prev)}
                  className={`px-3 py-1.5 font-bold transition-all text-xs ${
                    showDiagRomaji
                      ? 'bg-surface-container-lowest text-secondary shadow-sm'
                      : 'text-on-surface-variant/70 hover:text-on-surface'
                  }`}
                >
                  Romaji
                </button>
                <button
                  onClick={() => setShowDiagVi(prev => !prev)}
                  className={`px-3 py-1.5 font-bold transition-all text-xs ${
                    showDiagVi
                      ? 'bg-surface-container-lowest text-secondary shadow-sm'
                      : 'text-on-surface-variant/70 hover:text-on-surface'
                  }`}
                >
                  Bản dịch
                </button>
              </div>
            </div>

            {/* Context info for N2 exercises */}
            {activeDiag.context && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-xs rounded">
                <span className="font-bold text-amber-800">Ngữ cảnh: </span>
                <span className="text-amber-900 font-jp">{activeDiag.context}</span>
                {activeDiag.contextVi && (
                  <span className="text-amber-700 ml-1">({activeDiag.contextVi})</span>
                )}
              </div>
            )}

            {/* Audio player for N2 exercises */}
            {activeDiag.audioSrc && (
              <div className="mb-4 p-3 bg-surface-container border border-outline-variant/30 flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-secondary flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Audio gốc JLPT N2</p>
                  <audio controls preload="none" className="w-full h-8" style={{height: 32}}>
                    <source src={activeDiag.audioSrc} type="audio/mpeg" />
                  </audio>
                </div>
              </div>
            )}

            {/* Chat layout dialogue */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 no-scrollbar mb-8">
              {activeDiag.lines.map((line, idx) => {
                const isSpeakerA = line.speaker === 'A';
                const isActive = currentLineIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`flex gap-3 items-start ${
                      isSpeakerA ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {/* Speaker A left volume icon */}
                    {isSpeakerA && (
                      <button
                        onClick={() => playLine(idx)}
                        className={`p-2 rounded-full border transition-all flex-shrink-0 ${
                          isActive
                            ? 'bg-secondary text-white border-secondary'
                            : 'bg-surface hover:bg-surface-container text-on-surface-variant border-outline-variant/30'
                        }`}
                        aria-label={`Nghe câu ${idx + 1}`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Speech Bubble */}
                    <button
                      onClick={() => playLine(idx)}
                      className={`max-w-[80%] p-4 border text-left transition-all block ${
                        isActive
                          ? 'border-secondary sharp-shadow bg-surface'
                          : isSpeakerA
                          ? 'bg-surface-container border-outline-variant/20 hover:border-outline-variant/40'
                          : 'bg-surface-container-low border-outline-variant/10 hover:border-outline-variant/30'
                      }`}
                    >
                      <div className="flex justify-between items-center gap-4 mb-1.5">
                        <span className="text-[10px] font-black tracking-wider uppercase text-on-surface-variant opacity-80">
                          {line.name}
                        </span>
                        <span className="text-[9px] text-on-surface-variant/40 font-mono">
                          {line.speaker === 'A' ? 'Speaker A' : 'Speaker B'}
                        </span>
                      </div>

                      {showDiagJa && (
                        <p className="font-jp text-base font-bold text-on-surface leading-normal tracking-wide">
                          {line.text}
                        </p>
                      )}
                      
                      {showDiagRomaji && line.romaji && (
                        <p className="text-xs text-on-surface-variant font-medium tracking-wide mt-1.5 italic">
                          {line.romaji}
                        </p>
                      )}

                      {showDiagVi && (
                        <p className="text-xs text-on-surface/85 leading-relaxed mt-2 pt-2 border-t border-outline-variant/10">
                          {line.translation}
                        </p>
                      )}
                    </button>

                    {/* Speaker B right volume icon */}
                    {!isSpeakerA && (
                      <button
                        onClick={() => playLine(idx)}
                        className={`p-2 rounded-full border transition-all flex-shrink-0 ${
                          isActive
                            ? 'bg-secondary text-white border-secondary'
                            : 'bg-surface hover:bg-surface-container text-on-surface-variant border-outline-variant/30'
                        }`}
                        aria-label={`Nghe câu ${idx + 1}`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Comprehension Quiz section */}
            <div className="border-t border-outline-variant/30 pt-6 mt-6">
              <h3 className="font-headline font-bold text-on-surface text-base mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Bài kiểm tra nghe hiểu (Comprehension Check)
              </h3>
              
              <div className="space-y-6">
                {activeDiag.questions.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-2.5">
                    <p className="text-sm font-semibold text-on-surface flex items-start gap-2">
                      <span className="w-5 h-5 bg-surface-container text-on-surface-variant flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {qIdx + 1}
                      </span>
                      {q.question}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = diagAnswers[qIdx] === optIdx;
                        const isCorrect = optIdx === q.answerIndex;
                        let btnStyle = 'bg-surface border-outline-variant/30 hover:border-outline-variant';
                        
                        if (diagSubmitted) {
                          if (isCorrect) {
                            btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold';
                          } else if (isSelected) {
                            btnStyle = 'bg-rose-50 border-rose-400 text-rose-800';
                          } else {
                            btnStyle = 'bg-surface border-outline-variant/20 opacity-60';
                          }
                        } else if (isSelected) {
                          btnStyle = 'border-secondary bg-surface-container-lowest font-bold text-secondary';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleDiagSelect(qIdx, optIdx)}
                            disabled={diagSubmitted}
                            className={`p-3 text-left text-xs transition-all border ${btnStyle}`}
                            style={{ boxShadow: isSelected && !diagSubmitted ? '2px 2px 0 0 var(--secondary)' : 'none' }}
                          >
                            <span className="mr-2 font-mono text-[10px] text-on-surface-variant">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {diagSubmitted && (
                      <div className="pl-7 animate-fade-up">
                        <div className="text-xs text-on-surface-variant bg-surface p-3 mt-1 border-l-2 border-secondary flex items-start gap-2">
                          <Info className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-secondary">Giải thích: </span>
                            {q.explanation}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submission and Scoring */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-4 border-t border-outline-variant/10">
                {!diagSubmitted ? (
                  <button
                    onClick={submitDiagQuiz}
                    disabled={Object.keys(diagAnswers).length < activeDiag.questions.length}
                    className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-on-secondary bg-secondary hover:bg-secondary-dim disabled:opacity-40 transition-colors shadow-sm ml-auto"
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
                    </div>
                    <button
                      onClick={resetDiagQuiz}
                      className="px-5 py-2.5 border border-outline-variant/40 hover:bg-surface-container-low text-xs font-bold uppercase tracking-wider transition-colors ml-auto"
                    >
                      Làm lại bài
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
