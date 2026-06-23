import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { coursesApi } from '../api/coursesApi';
import { flashcardApi } from '../api/flashcardApi';
import aiTutorApi from '../api/aiTutorApi';
import CollapsibleExample from '../components/CollapsibleExample';

function speakJapanese(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  
  // Extract just Japanese text block
  const jaText = text.split('\n')[0] || text;
  
  const utterance = new SpeechSynthesisUtterance(jaText);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}
import {
  ArrowLeft, ArrowRight, RotateCw, Check,
  Volume2, BookOpen, ChevronRight, ChevronLeft,
  Bookmark, Trash2, Play, Sparkles, PenTool,
  History, Loader2, X, Info, Award, FileText,
  Shuffle
} from 'lucide-react';

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

const PHASE = {
  THEORY: 'theory',
  REVIEW: 'review',
  GRAMMAR_REVIEW: 'grammar_review',
  TEST: 'test',
  RESULT: 'result',
};

const SKILL_LABELS = {
  VOCABULARY: { label: 'Từ vựng', color: 'bg-primary/8 text-primary border border-primary/20' },
  KANJI: { label: 'Hán tự', color: 'bg-secondary/8 text-secondary border border-secondary/20' },
  GRAMMAR: { label: 'Ngữ pháp', color: 'bg-tertiary/8 text-tertiary border border-tertiary/20' },
  READING: { label: 'Đọc hiểu', color: 'bg-blue-500/10 border border-blue-500/30 text-blue-700' },
  LISTENING: { label: 'Nghe hiểu', color: 'bg-teal-500/10 border border-teal-500/30 text-teal-700' },
};

/** Fisher–Yates shuffle (immutable). */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sinh câu hỏi trắc nghiệm: hỏi nghĩa (front → back) với 3 distractor random.
 */
function buildQuestions(cards, count) {
  if (!cards || cards.length < 2) return [];
  const pool = shuffle(cards);
  const selected = pool.slice(0, Math.min(count, pool.length));

  return selected.map((card) => {
    const distractorPool = cards.filter((c) => c.id !== card.id);
    const distractors = shuffle(distractorPool)
      .slice(0, 3)
      .map((c) => c.back);
    while (distractors.length < 3) {
      distractors.push('—');
    }
    return {
      id: card.id,
      question: card.front,
      hint: card.romaji,
      answer: card.back,
      options: shuffle([card.back, ...distractors]),
    };
  });
}

// ============================================================
// GRAMMAR CARD & REVIEW COMPONENTS
// ============================================================

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
              style={{ background: 'var(--primary, #1a237e)' }}
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
                    className="p-4 relative group bg-surface border border-outline-variant/30 hover:border-emerald-500/20 transition-all sharp-shadow-sm text-left"
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
                    className="p-4 relative group bg-surface border border-outline-variant/30 hover:border-emerald-500/20 transition-all sharp-shadow-sm text-left"
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
          <div className="mt-6 p-4 border-2 border-primary/20 bg-primary/[0.01] space-y-4 text-left">
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

// ============================================================
// LESSON STEPPER COMPONENT
// ============================================================
function LessonStepper({ currentPhase, onPhaseChange, lesson, hasResult, isPassed }) {
  const steps = useMemo(() => {
    if (!lesson) return [];
    
    const list = [{ id: PHASE.THEORY, label: 'Lý thuyết' }];

    const hasVocab = lesson.decks?.some((d) => d.role === 'VOCAB');
    const hasGrammar = lesson.decks?.some((d) => d.role === 'GRAMMAR');
    const hasTest = !!lesson.test;

    if (hasVocab) {
      list.push({ id: PHASE.REVIEW, label: 'Từ vựng' });
    }
    if (hasGrammar) {
      list.push({ id: PHASE.GRAMMAR_REVIEW, label: 'Ngữ pháp' });
    }
    if (hasTest) {
      list.push({ id: PHASE.TEST, label: 'Kiểm tra' });
    }
    if (hasResult || isPassed) {
      list.push({ id: PHASE.RESULT, label: 'Kết quả' });
    }

    const currentIdx = list.findIndex((s) => s.id === currentPhase);

    return list.map((step, idx) => {
      const isDone = isPassed || idx < currentIdx;
      const isLocked = !isPassed && idx > currentIdx;
      return {
        ...step,
        isDone,
        isLocked,
      };
    });
  }, [lesson, currentPhase, hasResult, isPassed]);

  return (
    <div className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 sharp-shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5 uppercase tracking-wider">
        <span>Giai đoạn học:</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:gap-3 overflow-x-auto w-full sm:w-auto">
        {steps.map((step, idx) => {
          const isActive = currentPhase === step.id;
          const isDone = step.isDone;
          const isLocked = step.isLocked;

          let btnClass = '';
          if (isActive) {
            btnClass = 'bg-primary text-white border-primary';
          } else if (isDone) {
            btnClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100/50';
          } else if (isLocked) {
            btnClass = 'bg-surface-container border-outline-variant/10 text-on-surface-variant/40 cursor-not-allowed opacity-50';
          } else {
            btnClass = 'bg-surface border-outline-variant/30 text-on-surface-variant hover:bg-surface-container hover:text-on-surface';
          }

          return (
            <button
              key={step.id}
              disabled={isLocked}
              onClick={() => onPhaseChange(step.id)}
              className={`flex items-center gap-2 px-3 py-2 border transition-all text-xs font-bold uppercase tracking-wider ${btnClass}`}
              title={isLocked ? 'Hoàn thành phần trước để mở khóa' : `Chuyển sang phần ${step.label}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border border-current text-[10px] ${
                isDone && !isActive ? 'bg-emerald-100 text-emerald-800' : ''
              }`}>
                {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
              </span>
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// GRAMMAR REVIEW PHASE (Slideshow of grammar cards)
// ============================================================
function GrammarReviewPhase({ cards, hasTest, courseSlug, courseTitle, onContinue, onFinish }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

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

  const isLast = activeIndex === cards.length - 1;

  if (cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center flex flex-col items-center bg-surface text-left">
        <p className="text-xl text-on-surface-variant font-medium mb-6">Bài này chưa có dữ liệu ngữ pháp.</p>
        <button
          onClick={hasTest ? onContinue : onFinish}
          className="px-6 py-3 bg-primary text-on-primary font-bold uppercase tracking-wider hover:opacity-90 transition-all sharp-shadow-sm"
        >
          {hasTest ? 'Sang phần kiểm tra →' : 'Hoàn thành bài học →'}
        </button>
      </div>
    );
  }

  const activeCard = cards[activeIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left">

      <div className="flex items-center gap-3 text-xs text-on-surface-variant">
        <FileText className="w-4 h-4 text-primary" />
        <span>
          Bài học gồm <span className="font-bold text-on-surface">{cards.length}</span> điểm ngữ pháp. Học từng cấu trúc bằng cách chuyển trang bên dưới.
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          <span>Tiến độ học ngữ pháp</span>
          <span>{activeIndex + 1} / {cards.length}</span>
        </div>
        <div className="w-full h-2.5 bg-surface-container overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-container transition-all duration-300 ease-out"
            style={{ width: `${((activeIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Active Card */}
      <div className="animate-fade-up">
        <GrammarCard
          key={activeCard.id}
          card={activeCard}
          index={activeIndex}
          onStudy={handleStudy}
        />
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
          disabled={activeIndex === 0}
          className="flex items-center gap-1.5 px-5 py-3 border border-outline-variant/40 text-on-surface-variant bg-surface-container-lowest hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold sharp-shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
          Trước đó
        </button>

        <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-4 py-2 border border-outline-variant/40">
          Ngữ pháp {activeIndex + 1} / {cards.length}
        </span>

        {activeIndex < cards.length - 1 ? (
          <button
            onClick={() => setActiveIndex((prev) => Math.min(cards.length - 1, prev + 1))}
            className="flex items-center gap-1.5 px-6 py-3 bg-primary hover:opacity-90 text-white font-bold uppercase tracking-wider transition-all sharp-shadow-sm"
          >
            Tiếp theo
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={hasTest ? onContinue : onFinish}
            className="flex items-center gap-1.5 px-6 py-3 bg-secondary hover:opacity-90 text-white font-bold uppercase tracking-wider transition-all sharp-shadow-sm"
          >
            {hasTest ? (
              <>
                Làm bài kiểm tra
                <ChevronRight className="w-5 h-5" />
              </>
            ) : (
              <>
                Hoàn thành bài học
                <Check className="w-5 h-5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// THEORY PHASE
// ============================================================
function TheoryPhase({ lesson, nextLesson, onContinue }) {
  const grammarDeck = lesson.decks?.find((d) => d.role === 'GRAMMAR');

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left">
      <div className="bg-surface-container-lowest border border-outline-variant/40 sharp-shadow p-6 md:p-10">

        <article className="prose prose-slate max-w-none text-on-surface prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-code:bg-surface-container prose-code:px-1 prose-code:text-on-surface">
          <ReactMarkdown>{lesson.theoryMd}</ReactMarkdown>
        </article>
      </div>

      {grammarDeck && (
        <div className="bg-primary/5 border border-primary/20 p-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-headline font-bold text-primary text-base">Thẻ ghi nhớ Ngữ pháp</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Bài học này bao gồm bộ thẻ luyện tập {grammarDeck.cardCount} mẫu cấu trúc ngữ pháp (Nghe phát âm, chép chính tả, shadowing & AI đặt câu).
            </p>
          </div>
          <Link
            to={`/grammar/${grammarDeck.deckId}`}
            target="_blank"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider transition-all sharp-shadow-sm shrink-0"
          >
            Luyện ngữ pháp
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onContinue}
          className="flex-1 sm:flex-initial px-6 py-3 bg-primary hover:opacity-90 text-on-primary font-bold uppercase tracking-wider transition-all text-center sharp-shadow-sm cursor-pointer"
        >
          {lesson.decks?.some((d) => d.role === 'VOCAB') ? 'Tiếp theo: Học từ vựng →' : 'Tiếp theo: Luyện ngữ pháp →'}
        </button>
        {nextLesson && (
          nextLesson.locked ? (
            <button
              disabled
              className="flex-1 sm:flex-initial px-6 py-3 bg-surface-container border border-outline-variant/30 text-on-surface-variant/40 font-bold uppercase tracking-wider cursor-not-allowed text-center flex items-center justify-center gap-1.5"
            >
              🔒 Bài {nextLesson.order} →
            </button>
          ) : (
            <Link
              to={`/learn/${nextLesson.id}`}
              className="flex-1 sm:flex-initial px-6 py-3 bg-surface-container-lowest border border-outline-variant/40 hover:bg-surface-container text-on-surface font-bold uppercase tracking-wider sharp-shadow-sm transition-all text-center flex items-center justify-center"
            >
              Bài {nextLesson.order} →
            </Link>
          )
        )}
      </div>
    </div>
  );
}

// ============================================================
// REVIEW PHASE — flashcard quick
// ============================================================
function ReviewPhase({ cards, courseSlug, courseTitle, onContinue }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledCards, setShuffledCards] = useState(() => cards || []);

  const card = shuffledCards[idx];
  const isLast = idx === shuffledCards.length - 1;

  useEffect(() => {
    const original = cards || [];
    if (!isShuffled) {
      setShuffledCards(original);
    } else {
      const shuffled = [...original];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setShuffledCards(shuffled);
    }
  }, [cards, isShuffled]);

  const next = useCallback(() => {
    if (isLast) {
      onContinue();
    } else {
      setIdx((prev) => prev + 1);
      setFlipped(false);
    }
  }, [isLast, onContinue]);

  const prev = useCallback(() => {
    if (idx > 0) {
      setIdx((prev) => prev - 1);
      setFlipped(false);
    }
  }, [idx]);

  // Autoplay feature
  useEffect(() => {
    if (!isAutoplay) return;

    const timer = setInterval(() => {
      if (!flipped) {
        setFlipped(true);
      } else {
        if (idx < shuffledCards.length - 1) {
          next();
        } else {
          setIsAutoplay(false);
        }
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [isAutoplay, flipped, idx, shuffledCards.length, next]);

  // Keyboard Navigation Hook
  useEffect(() => {
    if (!shuffledCards.length) return;

    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [idx, flipped, shuffledCards, next, prev]);

  if (!card) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center flex flex-col items-center bg-surface text-left">
        {courseSlug && (
          <div className="mb-4 w-full text-left">
            <Link
              to={`/courses/${courseSlug}`}
              className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              ← {courseTitle || 'Quay lại giáo trình'}
            </Link>
          </div>
        )}
        <p className="text-xl text-on-surface-variant font-medium mb-6">Bài này chưa có từ vựng để ôn.</p>
        <button
          onClick={onContinue}
          className="px-6 py-3 bg-primary text-on-primary font-bold uppercase tracking-wider hover:opacity-90 transition-all sharp-shadow-sm"
        >
          Sang phần kiểm tra →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      {/* Header & Progress */}
      <div className="mb-8">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h1 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">Ôn tập từ vựng</h1>
            <p className="text-sm font-medium text-on-surface-variant mt-1">Ghi nhớ nhanh trước khi kiểm tra</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">{idx + 1}</span>
            <span className="text-on-surface-variant font-medium"> / {shuffledCards.length}</span>
          </div>
        </div>

        <div className="w-full h-2.5 bg-surface-container overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-container transition-all duration-500 ease-out"
            style={{ width: `${((idx + 1) / shuffledCards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 3D Flashcard */}
      <div
        className="relative h-96 w-full cursor-pointer mb-8 group [perspective:1500px]"
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className="relative w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] [transform-style:preserve-3d]"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front face (Clean White + Sharp Shadow) */}
          <div
            className="absolute inset-0 bg-surface-container-lowest border-2 border-outline-variant/80 sharp-shadow flex flex-col items-center justify-between p-8 [backface-visibility:hidden] -webkit-backface-visibility-hidden"
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-secondary" />

            <div className="flex items-center justify-between w-full mt-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
                Mặt trước
              </span>
              {card.jlptLevel && (
                <span className="px-2.5 py-0.5 bg-primary/5 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                  JLPT N{card.jlptLevel}
                </span>
              )}
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <p className="font-jp text-5xl md:text-6xl font-bold text-on-surface text-center tracking-tight leading-snug">
                {card.front}
              </p>
              {card.romaji && (
                <p className="text-xl md:text-2xl text-on-surface-variant font-medium tracking-wide mt-2">
                  {card.romaji}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 hover:text-secondary transition-colors mt-auto">
              <RotateCw className="w-3.5 h-3.5" /> Nhấn để lật thẻ
            </div>
          </div>

          {/* Back face (Clean White + Sharp Shadow) */}
          <div
            className="absolute inset-0 bg-surface-container-lowest border-2 border-outline-variant/80 sharp-shadow flex flex-col items-center justify-between p-6 md:p-8 [backface-visibility:hidden] -webkit-backface-visibility-hidden"
            style={{ transform: 'rotateY(180deg)' }}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

            <div className="flex items-center justify-between w-full mt-2 text-on-surface-variant/70">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Mặt sau
              </span>
              <span className="font-jp text-sm font-bold">
                {card.front}
              </span>
            </div>

            {/* Middle Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md my-auto gap-4">
              <div className="text-center w-full">
                <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-1">Giải nghĩa & Cách đọc</p>
                {card.romaji && (
                  <p className="font-jp text-lg text-secondary font-bold mb-2">
                    {card.romaji}
                  </p>
                )}
                <p className="text-2xl md:text-3xl font-black text-on-surface tracking-wide leading-snug whitespace-pre-line">
                  {card.back}
                </p>
              </div>

              {card.example && (
                <CollapsibleExample 
                  example={card.example} 
                  onSpeak={speakJapanese} 
                  maxHeightClass="max-h-[110px]"
                />
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 hover:text-primary transition-colors mt-auto">
              <RotateCw className="w-3.5 h-3.5" /> Nhấn để lật lại
            </div>
          </div>
        </div>
      </div>

      {/* Controls matching standard vocabulary study page */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Autoplay */}
          <button
            type="button"
            onClick={() => setIsAutoplay(!isAutoplay)}
            className={`flex-1 sm:flex-initial px-4 py-3 border-2 border-outline-variant bg-surface-container-lowest text-xs font-bold uppercase tracking-wider transition-all sharp-shadow-sm ${
              isAutoplay ? 'text-secondary border-secondary bg-secondary/5 font-black' : 'text-on-surface hover:bg-surface-container'
            }`}
          >
            {isAutoplay ? 'Dừng chạy' : 'Tự chạy'}
          </button>

          {/* Shuffle */}
          <button
            type="button"
            onClick={() => {
              setIsShuffled(!isShuffled);
              setIdx(0);
              setFlipped(false);
            }}
            className={`flex-1 sm:flex-initial px-4 py-3 border-2 border-outline-variant bg-surface-container-lowest text-xs font-bold uppercase tracking-wider transition-all sharp-shadow-sm flex items-center justify-center gap-1.5 ${
              isShuffled ? 'text-secondary border-secondary bg-secondary/5 font-black' : 'text-on-surface hover:bg-surface-container'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>{isShuffled ? 'Thứ tự gốc' : 'Tráo thẻ'}</span>
          </button>
        </div>

        <div className="flex gap-2 flex-1 w-full">
          {/* Prev */}
          <button
            type="button"
            onClick={prev}
            disabled={idx === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all sharp-shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> <span>Trước</span>
          </button>

          {/* Next/Complete */}
          {isLast ? (
            <button
              type="button"
              onClick={next}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-on-secondary hover:bg-secondary-dim text-xs font-bold uppercase tracking-wider transition-all sharp-shadow-sm"
              style={{ background: 'var(--secondary)' }}
            >
              <span>Kiểm tra</span> <Check className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider transition-all sharp-shadow-sm"
            >
              <span>Tiếp theo</span> <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="text-[10px] text-on-surface-variant/60 font-semibold uppercase tracking-wider flex items-center gap-5">
          <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-white border border-outline-variant/40 rounded shadow-sm text-[9px]">⇦</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-outline-variant/40 rounded shadow-sm text-[9px]">⇨</kbd> Di chuyển</span>
          <span className="flex items-center gap-1.5"><kbd className="px-3 py-0.5 bg-white border border-outline-variant/40 rounded shadow-sm text-[9px]">Space / Enter</kbd> Lật thẻ</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TEST PHASE — multiple choice quiz
// ============================================================
function TestPhase({ questions, passScore, courseSlug, courseTitle, onFinish }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const q = questions[idx];
  const isLast = idx === questions.length - 1;

  const submit = () => {
    if (selected == null) return;
    setAnswers({ ...answers, [q.id]: selected });
    setShowFeedback(true);
  };

  const next = () => {
    setShowFeedback(false);
    setSelected(null);
    if (isLast) {
      // Tính điểm
      const finalAnswers = { ...answers, [q.id]: selected };
      const correct = questions.filter(
        (qq) => finalAnswers[qq.id] === qq.answer,
      ).length;
      const score = Math.round((correct / questions.length) * 100);
      onFinish({ score, correct, total: questions.length });
    } else {
      setIdx(idx + 1);
    }
  };

  if (!q) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center text-on-surface-variant bg-surface text-left">
        {courseSlug && (
          <div className="mb-4 text-left">
            <Link
              to={`/courses/${courseSlug}`}
              className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              ← {courseTitle || 'Quay lại giáo trình'}
            </Link>
          </div>
        )}
        Không có câu hỏi để kiểm tra.
      </div>
    );
  }

  const isCorrect = selected === q.answer;

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div className="mb-2 flex items-center justify-between text-sm text-on-surface-variant">
        <span>
          Câu {idx + 1} / {questions.length}
        </span>
        <span>Đạt {passScore}% để qua bài</span>
      </div>
      <div className="h-1.5 bg-surface-container overflow-hidden mb-6" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
        <div
          className="h-full bg-secondary transition-all"
          style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/40 sharp-shadow p-6 md:p-8 mb-4">
        <div className="text-xs text-on-surface-variant mb-2">Nghĩa của từ sau là?</div>
        <div className="font-jp text-3xl md:text-4xl font-extrabold text-on-surface mb-1">
          {q.question}
        </div>
        {q.hint && (
          <div className="text-sm text-on-surface-variant font-mono">{q.hint}</div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {q.options.map((opt) => {
          const isThis = selected === opt;
          const isAnswer = opt === q.answer;
          let cls = 'bg-surface-container-lowest border-outline-variant/40 hover:bg-surface-container text-on-surface';
          if (showFeedback) {
            if (isAnswer) cls = 'bg-green-500/10 border-green-500 text-green-700';
            else if (isThis) cls = 'bg-red-500/10 border-red-500 text-red-700';
            else cls = 'bg-surface-container-lowest border-outline-variant/20 opacity-60 text-on-surface-variant';
          } else if (isThis) {
            cls = 'bg-primary/5 border-primary text-primary';
          }
          return (
            <button
              key={opt}
              disabled={showFeedback}
              onClick={() => setSelected(opt)}
              className={`w-full text-left px-4 py-3 border-2 transition-colors font-medium ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {showFeedback ? (
        <button
          onClick={next}
          className={`w-full px-5 py-3 text-white font-bold uppercase tracking-wider sharp-shadow transition-colors ${
            isCorrect
              ? 'bg-green-600 hover:opacity-90'
              : 'bg-secondary hover:opacity-90'
          }`}
        >
          {isCorrect ? '✓ Đúng — ' : '✗ Sai — '}
          {isLast ? 'Xem kết quả' : 'Câu tiếp theo'}
        </button>
      ) : (
        <button
          onClick={submit}
          disabled={selected == null}
          className="w-full px-5 py-3 bg-primary hover:opacity-90 text-white font-bold uppercase tracking-wider sharp-shadow disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Kiểm tra đáp án
        </button>
      )}
    </div>
  );
}

// ============================================================
// RESULT PHASE
// ============================================================
function ResultPhase({ result, lesson, nextLesson, onRetry }) {
  const navigate = useNavigate();
  const { passed, score, passScore, correct, total } = result;

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">

      <div
        className={`border border-outline-variant/40 sharp-shadow p-8 md:p-10 text-center text-white ${
          passed
            ? 'bg-gradient-to-br from-primary to-primary-container'
            : 'bg-gradient-to-br from-secondary to-secondary-dim'
        }`}
      >
        <div className="text-5xl mb-3">{passed ? '✓' : '↻'}</div>
        <h2 className="text-2xl font-headline font-extrabold mb-1">
          {passed ? 'Hoàn thành bài!' : 'Chưa đạt'}
        </h2>
        <p className="text-white/80 text-sm">
          {passed
            ? 'Bạn đã pass bài học này.'
            : `Cần ít nhất ${passScore}% để pass. Hãy ôn lại từ vựng và thử lại.`}
        </p>

        <div className="mt-6 inline-flex items-baseline gap-2">
          <span className="text-5xl md:text-6xl font-black">{score}</span>
          <span className="text-xl font-bold">%</span>
        </div>
        <p className="text-white/80 text-sm mt-1">
          {correct} / {total} câu đúng
        </p>
      </div>

      <div className="flex flex-col gap-2 mt-6">
        {nextLesson && (
          !nextLesson.locked ? (
            <Link
              to={`/learn/${nextLesson.id}`}
              className="text-center px-5 py-3 bg-primary hover:opacity-90 text-white font-bold uppercase tracking-wider sharp-shadow transition-all"
            >
              Bài {nextLesson.order} →
            </Link>
          ) : (
            <button
              disabled
              className="px-5 py-3 bg-surface-container border border-outline-variant/30 text-on-surface-variant/40 font-bold uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              🔒 Bài {nextLesson.order} →
            </button>
          )
        )}

        {!passed ? (
          <button
            onClick={onRetry}
            className="px-5 py-3 bg-primary hover:opacity-90 text-white font-bold uppercase tracking-wider sharp-shadow transition-all"
          >
            Làm lại bài kiểm tra
          </button>
        ) : (
          <button
            onClick={onRetry}
            className="px-5 py-3 bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container transition-all font-bold uppercase tracking-wider sharp-shadow-sm"
          >
            Làm lại bài kiểm tra (Cải thiện điểm)
          </button>
        )}
        <Link
          to={`/courses/${lesson.course.slug}`}
          className="text-center px-5 py-3 bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container font-bold uppercase tracking-wider sharp-shadow-sm"
        >
          Quay lại giáo trình
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function CourseLessonPage() {
  const { lessonId } = useParams();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState(null);
  const [result, setResult] = useState(null);

  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => coursesApi.getLesson(lessonId),
    retry: false,
  });

  // Reset trạng thái khi chuyển sang bài học khác
  useEffect(() => {
    setPhase(null);
    setResult(null);
  }, [lessonId]);

  // Xác định phase bắt đầu của bài học sau khi tải xong dữ liệu
  useEffect(() => {
    if (lesson && phase === null) {
      const hasVocab = lesson.decks?.some((d) => d.role === 'VOCAB');
      const hasGrammar = lesson.decks?.some((d) => d.role === 'GRAMMAR');
      if (hasVocab) {
        setPhase(PHASE.THEORY);
      } else if (hasGrammar) {
        setPhase(PHASE.GRAMMAR_REVIEW);
      } else {
        setPhase(PHASE.THEORY);
      }
    }
  }, [lesson, phase]);

  // Tìm deck ngữ pháp của bài học (nếu có)
  const grammarDeck = useMemo(() => {
    if (!lesson) return null;
    return lesson.decks?.find((d) => d.role === 'GRAMMAR') ?? null;
  }, [lesson]);

  // Lấy chi tiết deck ngữ pháp
  const { data: grammarDeckData, isLoading: isLoadingGrammarDeck } = useQuery({
    queryKey: ['deck', grammarDeck?.deckId],
    queryFn: () => flashcardApi.getDeck(grammarDeck.deckId),
    enabled: !!grammarDeck?.deckId,
  });

  // Deck dùng làm test pool — nếu có test, dùng deckId của test; nếu không, dùng vocab deck đầu tiên
  const studyDeckId = useMemo(() => {
    if (!lesson) return null;
    if (lesson.test?.deckId) return lesson.test.deckId;
    return lesson.decks[0]?.deckId ?? null;
  }, [lesson]);

  const { data: deckData } = useQuery({
    queryKey: ['deck', studyDeckId],
    queryFn: () => flashcardApi.getDeck(studyDeckId),
    enabled: !!studyDeckId,
  });

  const { data: courseData } = useQuery({
    queryKey: ['course', lesson?.course?.slug],
    queryFn: () => coursesApi.getCourse(lesson.course.slug),
    enabled: !!lesson?.course?.slug,
  });

  const nextLesson = useMemo(() => {
    if (!courseData || !lesson) return null;
    return courseData.lessons.find((l) => l.order === lesson.order + 1);
  }, [courseData, lesson]);

  const startMutation = useMutation({
    mutationFn: () => coursesApi.startLesson(lessonId),
  });

  const completeMutation = useMutation({
    mutationFn: (score) => coursesApi.completeLesson(lessonId, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['course'] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['current-lesson'] });
    },
  });

  // Khi bắt đầu học (Vào review từ vựng hoặc review ngữ pháp) → mark started
  useEffect(() => {
    const isStudying = phase === PHASE.REVIEW || phase === PHASE.GRAMMAR_REVIEW;
    if (isStudying && lesson?.progress?.status === 'NOT_STARTED') {
      startMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const questions = useMemo(() => {
    if (!deckData?.cards || !lesson?.test) return [];
    return buildQuestions(deckData.cards, lesson.test.questionCount);
  }, [deckData, lesson]);

  if (isLoading || phase === null) {
    return (
      <div className="p-12 text-center text-on-surface-variant bg-surface">Đang tải bài học...</div>
    );
  }

  if (error) {
    const msg =
      error.response?.data?.message ||
      'Không tải được bài học. Bạn cần hoàn thành bài trước đó để mở khóa.';
    return (
      <div className="max-w-md mx-auto p-8 text-center bg-surface">
        <div className="text-secondary font-bold mb-2">⚠ {msg}</div>
        <Link
          to="/roadmap"
          className="inline-block mt-2 px-5 py-2 bg-primary hover:opacity-90 text-on-primary font-bold uppercase tracking-wider transition-all"
        >
          Về lộ trình
        </Link>
      </div>
    );
  }

  if (!lesson) return null;

  // Render active phase component inside unified layout
  let phaseContent = null;
  const isPassed = lesson.progress?.status === 'PASSED';
  const hasVocab = lesson.decks?.some((d) => d.role === 'VOCAB');
  const hasGrammar = lesson.decks?.some((d) => d.role === 'GRAMMAR');
  const hasTest = !!lesson.test;

  if (phase === PHASE.THEORY) {
    phaseContent = (
      <TheoryPhase
        lesson={lesson}
        nextLesson={nextLesson}
        onContinue={() => {
          if (hasVocab) setPhase(PHASE.REVIEW);
          else if (hasGrammar) setPhase(PHASE.GRAMMAR_REVIEW);
          else if (hasTest) setPhase(PHASE.TEST);
          else setPhase(PHASE.RESULT);
        }}
      />
    );
  } else if (phase === PHASE.REVIEW) {
    if (!deckData) {
      phaseContent = <div className="p-12 text-center text-gray-500">Đang tải từ vựng...</div>;
    } else {
      phaseContent = (
        <ReviewPhase
          cards={deckData.cards || []}
          courseSlug={lesson.course.slug}
          courseTitle={lesson.course.title}
          onContinue={() => {
            if (hasGrammar) {
              setPhase(PHASE.GRAMMAR_REVIEW);
            } else if (hasTest) {
              setPhase(PHASE.TEST);
            } else {
              setPhase(PHASE.RESULT);
            }
          }}
        />
      );
    }
  } else if (phase === PHASE.GRAMMAR_REVIEW) {
    if (!grammarDeck) {
      phaseContent = null;
    } else if (isLoadingGrammarDeck) {
      phaseContent = <div className="p-12 text-center text-gray-500">Đang tải thẻ ngữ pháp...</div>;
    } else {
      phaseContent = (
        <GrammarReviewPhase
          cards={grammarDeckData?.cards || []}
          hasTest={hasTest}
          courseSlug={lesson.course.slug}
          courseTitle={lesson.course.title}
          onContinue={() => setPhase(PHASE.TEST)}
          onFinish={async () => {
            const apiResult = await completeMutation.mutateAsync(100);
            setResult({ ...apiResult, correct: 1, total: 1 });
            setPhase(PHASE.RESULT);
          }}
        />
      );
    }
  } else if (phase === PHASE.TEST) {
    if (!deckData) {
      phaseContent = <div className="p-12 text-center text-gray-500">Đang chuẩn bị bài kiểm tra...</div>;
    } else if (questions.length === 0) {
      phaseContent = (
        <div className="max-w-md mx-auto p-8 text-center text-gray-600">
          Bài này chưa có đủ thẻ để làm bài kiểm tra (cần ít nhất 2 thẻ).
          <Link
            to={`/courses/${lesson.course.slug}`}
            className="block mt-4 text-indigo-600 hover:underline"
          >
            Về lộ trình
          </Link>
        </div>
      );
    } else {
      phaseContent = (
        <TestPhase
          questions={questions}
          passScore={lesson.test?.passScore ?? 70}
          courseSlug={lesson.course.slug}
          courseTitle={lesson.course.title}
          onFinish={async ({ score, correct, total }) => {
            const apiResult = await completeMutation.mutateAsync(score);
            setResult({ ...apiResult, correct, total });
            setPhase(PHASE.RESULT);
          }}
        />
      );
    }
  } else if (phase === PHASE.RESULT) {
    phaseContent = (
      <ResultPhase
        result={result}
        lesson={lesson}
        nextLesson={nextLesson}
        onRetry={() => {
          setResult(null);
          if (hasVocab) {
            setPhase(PHASE.REVIEW);
          } else if (hasGrammar) {
            setPhase(PHASE.GRAMMAR_REVIEW);
          } else {
            setPhase(PHASE.TEST);
          }
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 text-left">
      {/* Course Back Link & Lesson Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <Link
            to={`/courses/${lesson.course.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary font-medium transition-colors mb-2"
          >
            ← {lesson.course.title}
          </Link>
          <h1 className="text-xl md:text-2xl font-headline font-extrabold text-on-surface">
            Bài {lesson.order}: {lesson.title}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">{lesson.summary}</p>
        </div>
      </div>

      {/* Visual Stepper */}
      <LessonStepper
        currentPhase={phase}
        onPhaseChange={setPhase}
        lesson={lesson}
        hasResult={!!result}
        isPassed={isPassed}
      />

      {/* Phase Content */}
      <div className="mt-4">{phaseContent}</div>
    </div>
  );
}
