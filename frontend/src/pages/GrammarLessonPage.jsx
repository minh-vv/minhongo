import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Volume2,
  BookOpen,
  FileText,
  Play,
  Sparkles,
  Loader2,
  ChevronRight,
  ChevronLeft,
  PenTool,
  Bookmark,
  Trash2,
  History,
} from 'lucide-react';
import { flashcardApi } from '../api/flashcardApi';
import aiTutorApi from '../api/aiTutorApi';

/** Parse ví dụ: "日本語（Vietnamese translation）" */
function parseExample(exampleText) {
  if (!exampleText) return { ja: '', vi: '' };
  
  // Try splitting by double newlines to get the first example block
  const blocks = exampleText.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  if (blocks.length > 0) {
    const firstBlock = blocks[0];
    const lines = firstBlock.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length >= 2) {
      return { ja: lines[0], vi: lines[1] };
    }
    const regex = /([^（(]+)[（(]([^）)]+)[）)]/;
    const match = firstBlock.match(regex);
    if (match) return { ja: match[1].trim(), vi: match[2].trim() };
    return { ja: firstBlock, vi: '' };
  }
  
  return { ja: exampleText, vi: '' };
}

/** Parse tất cả ví dụ thành mảng các đối tượng { ja, vi } */
function parseAllExamples(exampleText) {
  if (!exampleText) return [];
  
  const blocks = exampleText.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  return blocks.map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length >= 2) {
      return { ja: lines[0], vi: lines[1] };
    }
    const regex = /([^（(]+)[（(]([^）)]+)[）)]/;
    const match = block.match(regex);
    if (match) return { ja: match[1].trim(), vi: match[2].trim() };
    return { ja: block, vi: '' };
  });
}


function speakJapanese(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

const getBookInfo = (deck) => {
  if (!deck) return { id: 'other', title: 'Khác' };
  const nameLower = deck.name.toLowerCase();
  const descLower = (deck.description || '').toLowerCase();
  
  if (nameLower.includes('minna') || nameLower.includes('nihongo') || descLower.includes('minna')) {
    return { id: 'minna', title: 'Minna no Nihongo' };
  }
  if (nameLower.includes('kanzen') || nameLower.includes('shin kanzen') || nameLower.includes('shinkanzen') || descLower.includes('kanzen')) {
    return { id: 'kanzen', title: 'Shin Kanzen Master' };
  }
  if (nameLower.includes('soumatome') || nameLower.includes('somatome') || descLower.includes('soumatome')) {
    return { id: 'soumatome', title: 'Nihongo Soumatome' };
  }
  if (nameLower.includes('mimikara') || nameLower.includes('mimi kara') || descLower.includes('mimikara')) {
    return { id: 'mimikara', title: 'Mimikara Oboeru' };
  }
  if (nameLower.includes('try') || descLower.includes('try!')) {
    return { id: 'try', title: 'Try! Tăng cường ngữ pháp' };
  }
  if (nameLower.includes('genki') || descLower.includes('genki')) {
    return { id: 'genki', title: 'Genki' };
  }
  if (nameLower.includes('dekiru') || descLower.includes('dekiru')) {
    return { id: 'dekiru', title: 'Dekiru Nihongo' };
  }
  return { id: 'other', title: 'Tài liệu khác' };
};

const getLessonNumber = (name) => {
  const match = name.match(/Bài\s*(?:học\s*)?(\d+)/i);
  return match ? parseInt(match[1]) : 999;
};

const cleanNextDeckName = (name) => {
  if (!name) return '';
  return name
    .replace(/^[a-zA-Z0-9\s]+N\d\s*—\s*/gi, '') // Removes "Shinkanzen N2 — " or "Minna N5 — "
    .replace(/—\s*Ngữ pháp/gi, '') // Removes " — Ngữ pháp"
    .trim();
};

/** Single grammar point card */
function GrammarCard({ card, index, onStudy }) {
  const [expanded, setExpanded] = useState(false);
  const parsedExamples = parseAllExamples(card.example);

  // AI-driven Grammar practice states
  const [aiExamples, setAiExamples] = useState([]);
  const [generatingExample, setGeneratingExample] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [practiceText, setPracticeText] = useState('');
  const [checkingPractice, setCheckingPractice] = useState(false);
  const [practiceResult, setPracticeResult] = useState(null);

  // Saved examples & practice history states
  const [savedExamples, setSavedExamples] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchCardData = async () => {
      setLoadingSaved(true);
      setLoadingHistory(true);
      try {
        const [saved, history] = await Promise.all([
          aiTutorApi.getSavedExamples(card.id),
          aiTutorApi.getPracticeHistory(card.id),
        ]);
        if (active) {
          setSavedExamples(saved || []);
          setPracticeHistory(history || []);
        }
      } catch (err) {
        console.error('Lỗi khi tải lịch sử hoặc ví dụ đã lưu:', err);
      } finally {
        if (active) {
          setLoadingSaved(false);
          setLoadingHistory(false);
        }
      }
    };
    fetchCardData();
    return () => {
      active = false;
    };
  }, [card.id]);

  const handleGenerateExample = async () => {
    setGeneratingExample(true);
    try {
      const res = await aiTutorApi.grammarExample({
        grammarStructure: card.front,
        meaning: card.back,
      });
      if (res && res.japanese) {
        setAiExamples((prev) => [...prev, res]);
      }
    } catch (err) {
      console.error('Lỗi sinh ví dụ từ AI:', err);
      alert('Đã xảy ra lỗi khi tạo ví dụ mới từ AI. Vui lòng thử lại!');
    } finally {
      setGeneratingExample(false);
    }
  };

  const handleCheckPractice = async () => {
    if (!practiceText.trim()) return;
    setCheckingPractice(true);
    try {
      const result = await aiTutorApi.evaluate({
        userAnswer: practiceText,
        question: `Đặt câu tiếng Nhật dùng cấu trúc: ${card.front} (Nghĩa: ${card.back})`,
        expectedAnswer: card.front,
        cardId: card.id,
      });
      setPracticeResult(result);

      // Refresh practice history
      const history = await aiTutorApi.getPracticeHistory(card.id);
      setPracticeHistory(history || []);
    } catch (err) {
      console.error('Lỗi đánh giá đặt câu:', err);
      alert('Đã xảy ra lỗi khi kiểm tra câu với AI. Vui lòng thử lại!');
    } finally {
      setCheckingPractice(false);
    }
  };

  const handleResetPractice = () => {
    setPracticeText('');
    setPracticeResult(null);
  };

  const handleToggleSaveExample = async (ex) => {
    const savedItem = savedExamples.find((s) => s.japanese === ex.japanese);
    if (savedItem) {
      try {
        await aiTutorApi.deleteSavedExample(savedItem.id);
        setSavedExamples((prev) => prev.filter((item) => item.id !== savedItem.id));
      } catch (err) {
        console.error('Lỗi khi bỏ lưu ví dụ:', err);
        alert('Không thể bỏ lưu ví dụ.');
      }
    } else {
      try {
        const res = await aiTutorApi.saveExample({
          cardId: card.id,
          japanese: ex.japanese,
          romaji: ex.romaji || '',
          vietnamese: ex.vietnamese,
        });
        if (res) {
          setSavedExamples((prev) => [res, ...prev]);
        }
      } catch (err) {
        console.error('Lỗi khi lưu ví dụ:', err);
        alert('Không thể lưu ví dụ.');
      }
    }
  };

  const handleDeleteSavedExample = async (id) => {
    try {
      await aiTutorApi.deleteSavedExample(id);
      setSavedExamples((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Lỗi khi xóa ví dụ đã lưu:', err);
      alert('Không thể xóa ví dụ này.');
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/40 sharp-shadow-sm overflow-hidden flex flex-col justify-between">
      {/* Card header & content */}
      <div className="p-5 md:p-6 pb-4">
        {/* Index + Structure label */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span
              className="w-7 h-7 flex items-center justify-center text-xs font-black text-white flex-shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              {index + 1}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/5 px-2 py-0.5 border border-secondary/20">
              Cấu trúc
            </span>
          </div>
          {card.jlptLevel && (
            <span className="px-2.5 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-800 text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
              N{card.jlptLevel}
            </span>
          )}
        </div>

        {/* ── Formula box ── */}
        <div
          className="p-4 mb-4 relative"
          style={{ background: 'rgba(26,35,126,0.03)', border: '2px solid rgba(26,35,126,0.12)' }}
        >
          <div className="absolute right-3 top-2 text-[9px] font-bold text-primary/25 uppercase tracking-widest select-none">
            FORMULA
          </div>
          <h2 className="font-jp font-extrabold text-xl md:text-2xl text-primary leading-tight">
            {card.front}
          </h2>
        </div>

        {/* ── Meaning ── */}
        <div className="space-y-1 mb-4">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
            <BookOpen className="w-3 h-3" /> Ý nghĩa & Giải thích
          </span>
          <p className="font-medium text-on-surface text-sm leading-relaxed whitespace-pre-line">{card.back}</p>
          {card.romaji && (
            <p className="text-xs text-on-surface-variant font-mono">{card.romaji}</p>
          )}
        </div>

        {/* ── Example (collapsed/expanded) ── */}
        {card.example && (
          <div className="space-y-3">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              <Volume2 className="w-3 h-3" />
              Ví dụ câu
              <ChevronRight
                className="w-3 h-3 transition-transform"
                style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
              />
            </button>

            {expanded && (
              <div className="space-y-3">
                {parsedExamples.map((ex, exIndex) => (
                  <div
                    key={exIndex}
                    className="p-4 relative group"
                    style={{ background: 'rgba(0,100,70,0.03)', border: '1px solid rgba(0,100,70,0.15)' }}
                  >
                    {/* TTS button */}
                    <button
                      onClick={() => speakJapanese(ex.ja)}
                      className="absolute right-3 top-3 p-1.5 text-primary border border-primary/10 hover:bg-primary hover:text-white transition-all"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="pr-8 space-y-2">
                      <div>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 uppercase">
                          日本語
                        </span>
                        <p className="font-jp text-base font-bold text-on-surface mt-1 leading-loose">
                          {ex.ja}
                        </p>
                      </div>
                      {ex.vi && (
                        <div className="pt-2 border-t border-outline-variant/20">
                          <span className="text-[9px] font-bold text-on-surface-variant bg-surface px-1.5 py-0.5 border border-outline-variant/30 uppercase">
                            Tiếng Việt
                          </span>
                          <p className="text-sm text-on-surface-variant italic mt-1 leading-relaxed">
                            {ex.vi}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── AI Generated Examples ── */}
        {aiExamples.length > 0 && (
          <div className="mt-4 pt-3 border-t border-outline-variant/20 space-y-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 animate-pulse">
              <Sparkles className="w-2.5 h-2.5" /> Ví dụ sinh bởi AI
            </span>
            <div className="space-y-3">
              {aiExamples.map((ex, exIndex) => {
                const isSaved = savedExamples.some((s) => s.japanese === ex.japanese);
                return (
                  <div
                    key={exIndex}
                    className="p-4 relative group animate-fade-left"
                    style={{ background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.15)' }}
                  >
                    <div className="absolute right-3 top-3 flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleSaveExample(ex)}
                        className={`p-1.5 border transition-all ${
                          isSaved
                            ? 'text-amber-600 border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/20'
                            : 'text-emerald-700 border-emerald-700/10 hover:bg-emerald-700 hover:text-white'
                        }`}
                        title={isSaved ? "Bỏ ghim ví dụ" : "Ghim ví dụ"}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => speakJapanese(ex.japanese)}
                        className="p-1.5 text-emerald-700 border border-emerald-700/10 hover:bg-emerald-700 hover:text-white transition-all"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="pr-16 space-y-2">
                      <div>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 uppercase">
                          日本語
                        </span>
                        <p className="font-jp text-base font-bold text-on-surface mt-1 leading-loose">
                          {ex.japanese}
                        </p>
                      </div>
                      {ex.romaji && (
                        <p className="text-xs text-on-surface-variant font-mono">{ex.romaji}</p>
                      )}
                      {ex.vietnamese && (
                        <div className="pt-2 border-t border-outline-variant/20">
                          <span className="text-[9px] font-bold text-on-surface-variant bg-surface px-1.5 py-0.5 border border-outline-variant/30 uppercase">
                            Tiếng Việt
                          </span>
                          <p className="text-sm text-on-surface-variant italic mt-1 leading-relaxed">
                            {ex.vietnamese}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Pinned/Saved Examples Section ── */}
        {savedExamples.length > 0 && (
          <div className="mt-6 pt-4 border-t-2 border-dashed border-outline-variant/40 space-y-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              <Bookmark className="w-3 h-3 fill-current" /> Ví dụ đã lưu ({savedExamples.length})
            </span>
            <div className="space-y-3">
              {savedExamples.map((ex) => (
                <div
                  key={ex.id}
                  className="p-3.5 relative group bg-surface border border-outline-variant/30 hover:border-amber-500/20 transition-all sharp-shadow-sm"
                >
                  <div className="absolute right-3 top-3 flex items-center gap-1.5">
                    <button
                      onClick={() => speakJapanese(ex.japanese)}
                      className="p-1.5 text-primary border border-primary/10 hover:bg-primary hover:text-white transition-all"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSavedExample(ex.id)}
                      className="p-1.5 text-red-600 border border-red-200 hover:bg-red-50 transition-all"
                      title="Xóa ví dụ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="pr-16 space-y-1">
                    <div>
                      <span className="text-[8px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 border border-amber-200 uppercase tracking-widest">
                        SAVED
                      </span>
                      <p className="font-jp text-sm font-bold text-on-surface mt-1 leading-relaxed">
                        {ex.japanese}
                      </p>
                    </div>
                    {ex.romaji && (
                      <p className="text-[11px] text-on-surface-variant font-mono">{ex.romaji}</p>
                    )}
                    <p className="text-xs text-on-surface-variant italic mt-1 leading-relaxed">
                      {ex.vietnamese}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Interactive Practice Panel ── */}
        {showPractice && (
          <div className="mt-6 p-4 border-2 border-primary/20 bg-primary/[0.01] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                <PenTool className="w-3 h-3" /> Luyện đặt câu
              </span>
              {practiceResult && (
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                  practiceResult.isCorrect 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  Điểm: {practiceResult.score}/100
                </span>
              )}
            </div>

            {!practiceResult ? (
              <div className="space-y-3">
                <p className="text-xs text-on-surface-variant">
                  Hãy viết một câu tiếng Nhật sử dụng cấu trúc <strong className="text-primary">{card.front}</strong>:
                </p>
                <textarea
                  value={practiceText}
                  onChange={(e) => setPracticeText(e.target.value)}
                  placeholder="Nhập câu tiếng Nhật của bạn ở đây..."
                  className="w-full p-3 border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary transition-all font-jp"
                  rows={2}
                  disabled={checkingPractice}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowPractice(false);
                      handleResetPractice();
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-all"
                    disabled={checkingPractice}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleCheckPractice}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-container transition-all disabled:opacity-50"
                    disabled={checkingPractice || !practiceText.trim()}
                  >
                    {checkingPractice ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Đang kiểm tra...
                      </>
                    ) : (
                      'Kiểm tra câu'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-left">
                <div className="p-3 bg-surface-container-low border border-outline-variant/30 space-y-2">
                  <div className="text-xs">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Câu của bạn:</span>
                    <p className="font-jp font-semibold text-on-surface mt-0.5">{practiceText}</p>
                  </div>
                  <div className="text-xs border-t border-outline-variant/30 pt-2">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Đánh giá từ Sensei:</span>
                    <p className="text-on-surface mt-0.5 whitespace-pre-line leading-relaxed">{practiceResult.feedback}</p>
                  </div>
                  {practiceResult.suggestion && (
                    <div className="text-xs border-t border-outline-variant/30 pt-2">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Gợi ý cách diễn đạt tự nhiên hơn:</span>
                      <p className="font-jp text-emerald-950 font-semibold mt-0.5 leading-relaxed">{practiceResult.suggestion}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleResetPractice}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-container transition-all"
                  >
                    Đặt câu khác
                  </button>
                </div>
              </div>
            )}

            {/* Practice history log */}
            {practiceHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-2.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center">
                  <History className="w-3 h-3" /> Lịch sử đặt câu ({practiceHistory.length})
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {practiceHistory.map((hist) => (
                    <div
                      key={hist.id}
                      className="p-2.5 bg-surface-container-low border border-outline-variant/30 text-xs flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-jp font-semibold text-on-surface line-clamp-1">{hist.userAnswer}</span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border flex-shrink-0 ${
                          hist.isCorrect 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {hist.score}/100
                        </span>
                      </div>
                      <div className="text-[11px] text-on-surface-variant leading-relaxed">
                        <span className="font-semibold text-primary/80">Phản hồi:</span> {hist.feedback}
                      </div>
                      {hist.suggestion && (
                        <div className="text-[11px] text-emerald-950/80 leading-relaxed font-jp">
                          <span className="font-semibold text-emerald-800">Gợi ý:</span> {hist.suggestion}
                        </div>
                      )}
                      <span className="text-[9px] text-on-surface-variant/40 text-right">
                        {new Date(hist.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary Actions Footer */}
      <div className="flex gap-2 px-5 pb-4">
        <button
          onClick={handleGenerateExample}
          disabled={generatingExample}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-emerald-750 transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--tertiary, #4a6741)' }}
        >
          {generatingExample ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" /> Đang tạo...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" /> Làm ví dụ
            </>
          )}
        </button>

        <button
          onClick={() => {
            setShowPractice((v) => !v);
            if (showPractice) handleResetPractice();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-primary hover:bg-primary-container transition-all"
        >
          <PenTool className="w-3 h-3" /> Luyện đặt câu
        </button>
      </div>

      {/* Secondary Actions (Dictation / Shadowing) */}
      {card.example && (
        <div className="px-5 pb-4 pt-2 border-t border-outline-variant/20 flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/60">
            Luyện nghe & nói nâng cao:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onStudy(card, 'dictation')}
              className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-secondary hover:underline"
            >
              <Play className="w-2.5 h-2.5 fill-secondary" /> Chép chính tả
            </button>
            <span className="text-outline-variant/40 text-xs">|</span>
            <button
              onClick={() => onStudy(card, 'shadowing')}
              className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-primary hover:underline"
            >
              <Sparkles className="w-2.5 h-2.5" /> Shadowing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GrammarLessonPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [publicDecks, setPublicDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      flashcardApi.getPublicDeck(deckId),
      flashcardApi.getPublicDecks()
    ])
      .then(([deckData, publicDecksData]) => {
        setDeck(deckData);
        setPublicDecks(publicDecksData);
      })
      .catch((err) => console.error('Lỗi tải bài học ngữ pháp:', err))
      .finally(() => setLoading(false));
  }, [deckId]);

  useEffect(() => {
    setActiveIndex(0);
  }, [deckId]);

  const handleStudy = (card, mode) => {
    const { ja, vi } = parseExample(card.example);
    const params = new URLSearchParams({
      mode,
      japanese: ja,
      translation: vi,
      romaji: card.romaji || '',
      ...(mode === 'dictation' ? { keyword: card.front || '' } : {}),
    });
    navigate(`/listening?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-on-surface-variant font-medium">Đang tải bài học...</p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="max-w-md mx-auto p-8 text-center py-24">
        <p className="text-lg font-bold text-secondary mb-4">Không tìm thấy bài học!</p>
        <button
          onClick={() => navigate('/grammar')}
          className="px-4 py-2 border border-outline-variant bg-surface hover:bg-surface-container text-on-surface text-xs font-bold uppercase tracking-wider transition-all"
        >
          Quay lại Ngữ pháp
        </button>
      </div>
    );
  }

  const cards = deck.cards || [];

  const nextDeck = (() => {
    if (!deck || !publicDecks) return null;
    const book = getBookInfo(deck);
    const level = deck.jlptLevel || 5;

    // Lọc các deck cùng giáo trình, cùng cấp độ và cùng category (NGUPHAP)
    const siblingDecks = publicDecks
      .filter((d) => {
        const dBook = getBookInfo(d);
        const dLvl = d.jlptLevel || 5;
        return d.category === deck.category && dBook.id === book.id && dLvl === level;
      })
      .sort((a, b) => {
        const numA = getLessonNumber(a.name);
        const numB = getLessonNumber(b.name);
        if (numA !== numB) return numA - numB;
        return a.name.localeCompare(b.name);
      });

    // Tìm index của deck hiện tại
    const currentIndex = siblingDecks.findIndex((d) => d.id === deck.id);
    if (currentIndex !== -1 && currentIndex < siblingDecks.length - 1) {
      return siblingDecks[currentIndex + 1];
    }
    return null;
  })();

  const parentPath = (() => {
    if (!deck) return '/grammar';
    const book = getBookInfo(deck);
    const level = deck.jlptLevel || 5;
    if (book.id !== 'other') {
      return `/grammar/${book.id}/${level}`;
    }
    return '/grammar';
  })();

  return (
    <div className="max-w-4xl mx-auto w-full p-6 md:p-8 space-y-8 animate-fade-up">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-2 border-primary" style={{ minHeight: 130 }}>
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 asanoha-bg opacity-15" />
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-secondary" />

        <div className="relative z-10 p-7 md:p-9">
          <Link
            to={parentPath}
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white mb-4 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              {/* JLPT badge */}
              {deck.jlptLevel && (
                <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                    JLPT N{deck.jlptLevel} · Bài học ngữ pháp
                  </span>
                </div>
              )}
              <h1 className="font-jp text-2xl md:text-3xl font-bold text-white">{deck.name}</h1>
              {deck.description && (
                <p className="text-white/60 text-sm mt-2 max-w-xl leading-relaxed">{deck.description}</p>
              )}
            </div>

            <div className="text-center bg-white/10 px-5 py-3 border border-white/15 flex-shrink-0">
              <p className="text-2xl font-black text-white leading-none">{cards.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Cấu trúc</p>
            </div>
          </div>
        </div>

        <div className="absolute -right-4 -bottom-4 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none text-[140px]">
          文
        </div>
      </section>

      {/* ── INFO BAR ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 text-xs text-on-surface-variant">
        <FileText className="w-4 h-4" />
        <span>
          Bài học gồm <span className="font-bold text-on-surface">{cards.length}</span> điểm ngữ pháp.
          Học từng cấu trúc bằng cách chuyển trang bên dưới.
        </span>
      </div>

      {/* ── GRAMMAR CARDS (SLIDESHOW) ─────────────────────────────────── */}
      {cards.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant/30">
          <p className="text-on-surface-variant text-sm">Bài học này chưa có dữ liệu.</p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              <span>Tiến độ học</span>
              <span>{activeIndex + 1} / {cards.length}</span>
            </div>
            <div className="w-full h-2 bg-surface-container border border-outline-variant/30 rounded-none overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${((activeIndex + 1) / cards.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Active Card */}
          <div className="animate-fade-up">
            <GrammarCard
              key={cards[activeIndex].id}
              card={cards[activeIndex]}
              index={activeIndex}
              onStudy={handleStudy}
            />
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant bg-surface hover:bg-surface-container text-on-surface text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:hover:bg-surface disabled:cursor-not-allowed sharp-shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Trước đó
            </button>

            <span className="text-xs font-bold text-on-surface-variant bg-surface-container-low px-3 py-1 border border-outline-variant/30">
              Ngữ pháp {activeIndex + 1} / {cards.length}
            </span>

            {activeIndex < cards.length - 1 ? (
              <button
                onClick={() => setActiveIndex((prev) => Math.min(cards.length - 1, prev + 1))}
                className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant bg-surface hover:bg-surface-container text-on-surface text-xs font-bold uppercase tracking-wider transition-all sharp-shadow-sm"
              >
                Tiếp theo
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : nextDeck ? (
              <button
                onClick={() => navigate(`/grammar/${nextDeck.id}`)}
                className="flex items-center gap-1.5 px-4 py-2 border border-secondary bg-secondary hover:bg-secondary-dim text-white text-xs font-bold uppercase tracking-wider transition-all sharp-shadow-sm"
              >
                Bài tiếp theo: {cleanNextDeckName(nextDeck.name)}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate(parentPath)}
                className="flex items-center gap-1.5 px-4 py-2 border border-secondary bg-secondary hover:bg-secondary-dim text-white text-xs font-bold uppercase tracking-wider transition-all sharp-shadow-sm"
              >
                Hoàn thành
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
