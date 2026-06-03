import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Volume2,
  BookOpen,
  FileText,
  Play,
  Sparkles,
  Loader2,
  ChevronRight,
  PenTool,
} from 'lucide-react';
import { flashcardApi } from '../api/flashcardApi';
import aiTutorApi from '../api/aiTutorApi';

/** Parse ví dụ: "日本語（Vietnamese translation）" */
function parseExample(exampleText) {
  if (!exampleText) return { ja: '', vi: '' };
  const regex = /([^（(]+)[（(]([^）)]+)[）)]/;
  const match = exampleText.match(regex);
  if (match) return { ja: match[1].trim(), vi: match[2].trim() };
  return { ja: exampleText, vi: '' };
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

/** Single grammar point card */
function GrammarCard({ card, index, onStudy }) {
  const [expanded, setExpanded] = useState(false);
  const parsedEx = parseExample(card.example);

  // AI-driven Grammar practice states
  const [aiExamples, setAiExamples] = useState([]);
  const [generatingExample, setGeneratingExample] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [practiceText, setPracticeText] = useState('');
  const [checkingPractice, setCheckingPractice] = useState(false);
  const [practiceResult, setPracticeResult] = useState(null);

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
      });
      setPracticeResult(result);
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
          <p className="font-medium text-on-surface text-sm leading-relaxed">{card.back}</p>
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
              <div
                className="p-4 relative group"
                style={{ background: 'rgba(0,100,70,0.03)', border: '1px solid rgba(0,100,70,0.15)' }}
              >
                {/* TTS button */}
                <button
                  onClick={() => speakJapanese(parsedEx.ja)}
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
                      {parsedEx.ja}
                    </p>
                  </div>
                  {parsedEx.vi && (
                    <div className="pt-2 border-t border-outline-variant/20">
                      <span className="text-[9px] font-bold text-on-surface-variant bg-surface px-1.5 py-0.5 border border-outline-variant/30 uppercase">
                        Tiếng Việt
                      </span>
                      <p className="text-sm text-on-surface-variant italic mt-1 leading-relaxed">
                        {parsedEx.vi}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI Generated Examples ── */}
        {aiExamples.length > 0 && (
          <div className="mt-4 pt-3 border-t border-outline-variant/20 space-y-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              <Sparkles className="w-2.5 h-2.5" /> Ví dụ sinh bởi AI
            </span>
            <div className="space-y-3">
              {aiExamples.map((ex, exIndex) => (
                <div
                  key={exIndex}
                  className="p-4 relative group animate-fade-left"
                  style={{ background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.15)' }}
                >
                  <button
                    onClick={() => speakJapanese(ex.japanese)}
                    className="absolute right-3 top-3 p-1.5 text-emerald-700 border border-emerald-700/10 hover:bg-emerald-700 hover:text-white transition-all"
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
              ))}
            </div>
          </div>
        )}

        {/* ── Interactive Practice Panel ── */}
        {showPractice && (
          <div className="mt-4 p-4 border-2 border-primary/20 bg-primary/[0.01] space-y-3">
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    flashcardApi.getPublicDeck(deckId)
      .then((data) => setDeck(data))
      .catch((err) => console.error('Lỗi tải bài học ngữ pháp:', err))
      .finally(() => setLoading(false));
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

  return (
    <div className="max-w-4xl mx-auto w-full p-6 md:p-8 space-y-8 animate-fade-up">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-2 border-primary" style={{ minHeight: 130 }}>
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 asanoha-bg opacity-15" />
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-secondary" />

        <div className="relative z-10 p-7 md:p-9">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate('/grammar')}
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white mb-4 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Ngữ pháp
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
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
          Click từng mục để xem ví dụ và luyện tập.
        </span>
      </div>

      {/* ── GRAMMAR CARDS ─────────────────────────────────────────── */}
      {cards.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant/30">
          <p className="text-on-surface-variant text-sm">Bài học này chưa có dữ liệu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((card, index) => (
            <GrammarCard key={card.id} card={card} index={index} onStudy={handleStudy} />
          ))}
        </div>
      )}
    </div>
  );
}
