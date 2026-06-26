import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { flashcardApi } from '../../api/flashcardApi';
import { useAuth } from '../../hooks/useAuth';
import { SYSTEM_SENTENCES } from './ListeningData';
import {
  Volume2, HelpCircle, CheckCircle2, XCircle, ArrowRight,
  Sparkles, Layers, RefreshCw, AlertCircle, AlertTriangle
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
// import ListeningNav from '../../components/ListeningNav';

export default function ListeningSentence() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [sentMode, setSentMode] = useState('cloze'); // 'cloze' | 'dictation'
  const [sentSource, setSentSource] = useState('system'); // 'system' | 'deck' | 'custom'
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [customSentence, setCustomSentence] = useState(null);
  
  const [speechRate, setSpeechRate] = useState(1.0); // 0.5, 0.8, 1.0
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('isSidebarCollapsed') === 'true');

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newVal = !prev;
      localStorage.setItem('isSidebarCollapsed', String(newVal));
      return newVal;
    });
  };
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const playTTS = useCallback((text, rateOverride) => {
    if (!synth) return;
    synth.cancel(); // Stop playing currently speaking text
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = rateOverride || speechRate;
    synth.speak(utterance);
  }, [synth, speechRate]);

  // ── THÔNG TIN DECK ──────────────────────────────────────────
  const { data: publicDecks = [] } = useQuery({
    queryKey: ['publicDecksForListening'],
    queryFn: flashcardApi.getPublicDecks,
    staleTime: 60_000,
  });

  const { data: userDecks = [] } = useQuery({
    queryKey: ['userDecksForListening'],
    queryFn: flashcardApi.getDecks,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const allDecks = useMemo(() => {
    return [...userDecks, ...publicDecks].filter(d => (d._count?.cards ?? 0) > 0);
  }, [userDecks, publicDecks]);

  // Handle URL query parameters for direct grammar redirects
  useEffect(() => {
    const mode = searchParams.get('mode');
    const deckId = searchParams.get('deckId');

    if (deckId) {
      setSentSource('deck');
      setSelectedDeckId(deckId);
      if (mode === 'dictation') {
        setSentMode('dictation');
      } else {
        setSentMode('cloze');
      }
    } else if (mode === 'cloze' || mode === 'dictation') {
      const japanese = searchParams.get('japanese');
      const keyword = searchParams.get('keyword');
      const romaji = searchParams.get('romaji');
      const translation = searchParams.get('translation');
      
      if (japanese) {
        const custom = {
          id: 'custom-sent-gram',
          level: 'Ngữ pháp',
          japanese,
          romaji: romaji || '',
          translation: translation || '',
          keyword: keyword || '',
        };
        setCustomSentence(custom);
        setSentSource('custom');
        setSentMode(mode);
      }
    }
  }, [searchParams]);

  // Fetch selected deck cards
  const { data: currentDeckData, isLoading: isLoadingDeck } = useQuery({
    queryKey: ['listeningDeckCards', selectedDeckId],
    queryFn: () => flashcardApi.getPublicDeck(selectedDeckId).catch(() => flashcardApi.getDeck(selectedDeckId)),
    enabled: !!selectedDeckId && sentSource === 'deck',
  });

  const sentences = useMemo(() => {
    if (sentSource === 'custom' && customSentence) return [customSentence];
    if (sentSource === 'system') return SYSTEM_SENTENCES;
    if (sentSource === 'deck' && currentDeckData?.cards) {
      // Convert cards having 'example' into sentence objects
      const cardsWithExamples = currentDeckData.cards.filter(c => !!c.example);
      if (cardsWithExamples.length > 0) {
        return cardsWithExamples.map((c) => ({
          id: `deck-sent-${c.id}`,
          level: c.jlptLevel ? `N${c.jlptLevel}` : 'Tự học',
          japanese: c.example,
          romaji: c.romaji || '',
          translation: c.back,
          keyword: c.front,
        }));
      }
    }
    return [];
  }, [sentSource, currentDeckData, customSentence]);

  const [currentSentIdx, setCurrentSentIdx] = useState(0);
  const activeSent = sentences[currentSentIdx] || null;

  const [userInput, setUserInput] = useState('');
  const [sentChecked, setSentChecked] = useState(false);
  const [sentIsCorrect, setSentIsCorrect] = useState(false);
  const [hintCount, setHintCount] = useState(0);

  // Play audio automatically on sentence load
  useEffect(() => {
    if (activeSent) {
      const t = setTimeout(() => {
        playTTS(activeSent.japanese);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [activeSent, playTTS]);

  // Reset states when changing source, deck or sentence
  const resetSentenceState = () => {
    setUserInput('');
    setSentChecked(false);
    setSentIsCorrect(false);
    setHintCount(0);
  };

  useEffect(() => {
    setCurrentSentIdx(0);
    resetSentenceState();
  }, [sentSource, selectedDeckId, sentMode]);

  const handleNextSentence = () => {
    if (sentences.length === 0) return;
    setCurrentSentIdx((currentSentIdx + 1) % sentences.length);
    resetSentenceState();
  };

  const getMaskedSentence = (fullText, maskText) => {
    if (!fullText || !maskText) return '...';
    return fullText.replace(maskText, ' [ ______ ] ');
  };

  const cleanString = (str) => {
    return str
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()。、？?！!]/g, '')
      .replace(/\s+/g, '')
      .trim();
  };

  const checkSentenceAnswer = () => {
    if (!activeSent) return;
    const target = sentMode === 'cloze' ? activeSent.keyword : activeSent.japanese;
    const isMatched = cleanString(userInput) === cleanString(target);
    
    setSentIsCorrect(isMatched);
    setSentChecked(true);
  };

  const handleHint = () => {
    if (!activeSent) return;
    const target = sentMode === 'cloze' ? activeSent.keyword : activeSent.japanese;
    if (hintCount < target.length) {
      setUserInput(target.slice(0, hintCount + 1));
      setHintCount(prev => prev + 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-6 animate-fade-up">
      {/* ── HERO BANNER ── */}
      <PageHeader
        tag="Luyện kỹ năng thực hành nghe nói"
        title="Chép chính tả"
        subtitle="Luyện nghe chi tiết qua bài tập điền từ và ghi chép."
        ghostChar="聴"
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

      {/* ── MAIN CONTENT AREA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column Config controls */}
        <div className={`lg:col-span-4 space-y-6 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
          
          {/* Mode Selection */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 sharp-shadow space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-secondary" /> Chế độ luyện tập
            </h3>
            
            <div className="space-y-2">
              {[
                { id: 'cloze', label: 'Điền từ vào ô trống', desc: 'Nghe câu và gõ lại từ khóa bị ẩn đi' },
                { id: 'dictation', label: 'Chép chính tả cả câu', desc: 'Nghe và gõ lại đầy đủ cả câu Nhật ngữ' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setSentMode(m.id)}
                  className={`w-full p-4 border text-left transition-all flex flex-col ${
                    sentMode === m.id
                      ? 'border-secondary bg-surface sharp-shadow'
                      : 'border-outline-variant/20 hover:border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className={`text-xs font-bold ${sentMode === m.id ? 'text-secondary' : 'text-on-surface'}`}>
                    {m.label}
                  </span>
                  <span className="text-[10px] text-on-surface-variant mt-1 leading-normal">
                    {m.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Data Source Selection */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 sharp-shadow space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-primary" /> Nguồn câu học tập
            </h3>
            
            {sentSource === 'custom' ? (
              <div className="space-y-2 animate-fade-up">
                <span className="px-2.5 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                  Cấu trúc từ bài học
                </span>
                <p className="text-xs text-on-surface-variant font-medium">Bạn đang luyện câu ví dụ ngữ pháp vừa học.</p>
                <button
                  onClick={() => {
                    setSentSource('system');
                    navigate(location.pathname, { replace: true });
                  }}
                  className="w-full text-center py-2 text-xs font-bold uppercase border border-outline-variant/40 hover:bg-surface-container transition-colors"
                >
                  Quay lại câu hệ thống
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-1 bg-surface-container p-0.5" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                  <button
                    onClick={() => setSentSource('system')}
                    className="flex-1 py-1.5 text-center text-xs font-bold transition-all uppercase tracking-wide"
                    style={{
                      background: sentSource === 'system' ? 'var(--surface-container-lowest)' : 'transparent',
                      color: sentSource === 'system' ? 'var(--secondary)' : 'var(--on-surface-variant)',
                    }}
                  >
                    Câu hệ thống
                  </button>
                  <button
                    onClick={() => {
                      setSentSource('deck');
                      if (allDecks.length > 0 && !selectedDeckId) {
                        setSelectedDeckId(allDecks[0].id);
                      }
                    }}
                    className="flex-1 py-1.5 text-center text-xs font-bold transition-all uppercase tracking-wide"
                    style={{
                      background: sentSource === 'deck' ? 'var(--surface-container-lowest)' : 'transparent',
                      color: sentSource === 'deck' ? 'var(--secondary)' : 'var(--on-surface-variant)',
                    }}
                  >
                    Từ thẻ học
                  </button>
                </div>

                {sentSource === 'deck' && (
                  <div className="space-y-2 pt-2 animate-fade-up">
                    <label htmlFor="deck-selector" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Chọn bộ thẻ có chứa câu ví dụ:
                    </label>
                    {allDecks.length === 0 ? (
                      <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 border border-amber-200 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>Chưa tìm thấy bộ thẻ nào có chứa câu. Vui lòng tạo thẻ trước.</span>
                      </div>
                    ) : (
                      <select
                        id="deck-selector"
                        value={selectedDeckId}
                        onChange={(e) => setSelectedDeckId(e.target.value)}
                        className="w-full p-2 border border-outline-variant bg-surface text-xs focus:border-secondary outline-none"
                      >
                        {allDecks.map(deck => (
                          <option key={deck.id} value={deck.id}>
                            {deck.name} ({deck._count?.cards ?? 0} thẻ)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </>
            )}

          </div>
        </div>

        {/* Right Column sentence work area */}
        <div className={`${isSidebarCollapsed ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
          {isLoadingDeck && sentSource === 'deck' ? (
            <div className="bg-surface-container-lowest border border-outline-variant/30 p-12 text-center sharp-shadow">
              <div className="w-8 h-8 border-2 border-outline-variant border-t-secondary animate-spin rounded-full mx-auto mb-4" />
              <span className="text-sm text-on-surface-variant font-medium">Đang nạp câu ví dụ từ bộ thẻ...</span>
            </div>
          ) : sentences.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant/30 p-12 text-center sharp-shadow space-y-3">
              <AlertCircle className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
              <h3 className="font-headline font-bold text-on-surface text-base">Bộ thẻ không có câu ví dụ</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                Hiện bộ thẻ được chọn chưa có ví dụ tương ứng. Bạn hãy chuyển sang "Câu hệ thống" hoặc bổ sung ví dụ cho thẻ học của bạn.
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 md:p-8 sharp-shadow relative">
              
              {/* Progress Header */}
              <div className="flex justify-between items-center pb-4 border-b border-outline-variant/20 mb-6">
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                    {activeSent?.level || 'Mẫu'}
                  </span>
                  <h3 className="font-headline text-base font-bold text-on-surface inline-block ml-3">
                    Luyện chép chính tả
                  </h3>
                  <button
                    onClick={toggleSidebar}
                    className="hidden lg:inline-flex items-center gap-1.5 ml-4 px-2.5 py-1 bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant/40 text-[10px] font-bold uppercase tracking-wider transition-colors"
                    title={isSidebarCollapsed ? "Hiển thị mục lục" : "Ẩn mục lục"}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {isSidebarCollapsed ? "Mở rộng mục lục" : "Thu gọn mục lục"}
                  </button>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-secondary">{currentSentIdx + 1}</span>
                  <span className="text-xs text-on-surface-variant"> / {sentences.length}</span>
                </div>
              </div>

              {/* Main Listening Exercise Board */}
              <div className="flex flex-col items-center justify-center py-10 bg-surface border border-outline-variant/20 mb-8 rounded relative overflow-hidden">
                <div className="absolute top-3 left-4 text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                  Bảng nghe phát âm
                </div>

                <div className="relative flex items-center justify-center w-24 h-24">
                  {/* Subtle pulsing background wave */}
                  <span className="absolute inset-0 bg-secondary/5 rounded-full animate-ping opacity-60" style={{ animationDuration: '3s' }} />
                  <span className="absolute inset-2 bg-secondary/10 rounded-full animate-ping opacity-40" style={{ animationDuration: '2s' }} />
                  
                  <button
                    onClick={() => playTTS(activeSent?.japanese)}
                    className="w-16 h-16 bg-secondary hover:bg-secondary-dim text-white flex items-center justify-center rounded-full transition-all duration-150 transform hover:scale-105 active:scale-95 sharp-shadow cursor-pointer z-10"
                    aria-label="Phát âm thanh câu tiếng Nhật"
                  >
                    <Volume2 className="w-7 h-7" />
                  </button>
                </div>
                
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-5">
                  Nhấp vào để nghe phát âm mẫu
                </span>
              </div>

              {/* Masked display when Cloze Mode */}
              {sentMode === 'cloze' && (
                <div className="mb-6 text-center animate-fade-up">
                  <p className="font-jp text-xl md:text-2xl font-bold text-on-surface leading-normal tracking-wide">
                    {getMaskedSentence(activeSent?.japanese, activeSent?.keyword)}
                  </p>
                  {activeSent?.romaji && (
                    <p className="text-xs text-on-surface-variant font-mono mt-1.5 italic">
                      {getMaskedSentence(activeSent?.romaji, activeSent?.keyword)}
                    </p>
                  )}
                </div>
              )}

              {/* Input form */}
              <div className="space-y-5">
                <div>
                  <label htmlFor="user-listening-input" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
                    {sentMode === 'cloze'
                      ? `Nhập từ còn thiếu: (Từ gồm ${activeSent?.keyword?.length} ký tự)`
                      : 'Nhập lại toàn bộ câu tiếng Nhật nghe được:'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="user-listening-input"
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      disabled={sentChecked && sentIsCorrect}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') checkSentenceAnswer();
                      }}
                      placeholder={sentMode === 'cloze' ? 'Ví dụ: 友達' : 'Ví dụ: 私はベトナム人です。'}
                      className="flex-1 p-3 border border-outline-variant bg-surface text-sm focus:border-secondary outline-none font-jp rounded-sm"
                    />
                    <button
                      onClick={handleHint}
                      disabled={sentChecked && sentIsCorrect}
                      className="px-4 py-2 border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer rounded-sm"
                      title="Gợi ý ký tự đầu"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs font-bold uppercase tracking-wide">Gợi ý</span>
                    </button>
                  </div>
                </div>

                {/* Feedback section */}
                {sentChecked && (
                  <div className={`p-4 border flex items-start gap-3 animate-fade-up rounded-sm ${
                    sentIsCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/20 border-rose-400 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}>
                    {sentIsCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1 w-full">
                          <p className="text-xs font-bold uppercase tracking-wider">Chính xác!</p>
                          <p className="font-jp text-base font-bold text-on-surface mt-1">{activeSent?.japanese}</p>
                          {activeSent?.romaji && (
                            <p className="text-xs text-on-surface-variant italic font-medium">{activeSent?.romaji}</p>
                          )}
                          <p className="text-xs text-on-surface/90 mt-1.5 pt-1.5 border-t border-outline-variant/10">{activeSent?.translation}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">Chưa chính xác</p>
                          <p className="text-xs mt-0.5">Hãy nghe kỹ lại và kiểm tra lỗi chính tả nhé!</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center gap-4 pt-4 border-t border-outline-variant/10">
                  {sentChecked && !sentIsCorrect && (
                    <button
                      onClick={() => {
                        setUserInput(sentMode === 'cloze' ? activeSent.keyword : activeSent.japanese);
                      }}
                      className="text-xs font-bold text-secondary hover:underline cursor-pointer"
                    >
                      Xem đáp án
                    </button>
                  )}
                  
                  <div className="ml-auto flex gap-2">
                    {!sentIsCorrect || !sentChecked ? (
                      <button
                        onClick={checkSentenceAnswer}
                        className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-on-secondary bg-secondary hover:bg-secondary-dim transition-colors cursor-pointer rounded-sm"
                      >
                        Kiểm tra kết quả
                      </button>
                    ) : (
                      <button
                        onClick={handleNextSentence}
                        className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer rounded-sm"
                      >
                        Câu tiếp theo
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
