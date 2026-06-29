import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getKanjiData } from '../utils/kanjiDataN5';
import CollapsibleExample from './CollapsibleExample';

const parseKanjiBack = (backText) => {
  if (!backText) return {};
  const lines = backText.split('\n');
  const info = {
    meaning: '',
    hanViet: '',
    boThu: '',
    on: '',
    kun: '',
    examplesOn: [],
    examplesKun: [],
    mnemonic: ''
  };
  
  let currentSection = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('Ý nghĩa:')) {
      info.meaning = trimmed.replace('Ý nghĩa:', '').trim();
    } else if (trimmed.startsWith('Âm Hán Việt:')) {
      info.hanViet = trimmed.replace('Âm Hán Việt:', '').trim();
    } else if (trimmed.startsWith('Bộ thủ:')) {
      info.boThu = trimmed.replace('Bộ thủ:', '').trim();
    } else if (trimmed.startsWith('Onyomi (Âm On):') || trimmed.startsWith('Onyomi:')) {
      info.on = trimmed.replace(/Onyomi\s*\(Âm\s*On\):\s*|Onyomi:\s*/gi, '').trim();
    } else if (trimmed.startsWith('Kunyomi (Âm Kun):') || trimmed.startsWith('Kunyomi:')) {
      info.kun = trimmed.replace(/Kunyomi\s*\(Âm\s*Kun\):\s*|Kunyomi:\s*/gi, '').trim();
    } else if (trimmed.startsWith('Cách ghi nhớ:')) {
      info.mnemonic = trimmed.replace('Cách ghi nhớ:', '').trim();
    } else if (trimmed.startsWith('Ví dụ Onyomi:')) {
      currentSection = 'examplesOn';
    } else if (trimmed.startsWith('Ví dụ Kunyomi:')) {
      currentSection = 'examplesKun';
    } else if (trimmed.startsWith('-') && currentSection) {
      info[currentSection].push(trimmed.replace(/^-/, '').trim());
    }
  }
  return info;
};

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

export default function KanjiInteractiveWorkspace({ card, onClose, accentColor = 'var(--primary)' }) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [practiceMode, setPracticeMode] = useState('animate'); // 'animate' or 'quiz'
  const [quizSuccess, setQuizSuccess] = useState(false);
  const [writerInstance, setWriterInstance] = useState(null);
  
  const canvasContainerRef = useRef(null);
  const kanjiChar = card?.front ? card.front.trim()[0] : '';
  const kanjiInfo = getKanjiData(kanjiChar);
  const parsedBack = useMemo(() => parseKanjiBack(card?.back), [card?.back]);

  // Hàm phụ trợ để hủy hoạt ảnh và quiz một cách an toàn
  const safeCancel = (writer) => {
    if (!writer) return;
    try {
      if (typeof writer.cancelAnimation === 'function') {
        writer.cancelAnimation();
      }
      if (typeof writer.cancelQuiz === 'function') {
        writer.cancelQuiz();
      }
    } catch (e) {
      console.warn('Lỗi khi hủy hoạt ảnh/quiz của HanziWriter:', e);
    }
  };

  // 1. Tải thư viện Hanzi Writer dynamically từ CDN
  useEffect(() => {
    if (window.HanziWriter) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      setScriptError(true);
      console.error('Không thể tải thư viện Hanzi Writer từ CDN.');
    };
    document.body.appendChild(script);

    return () => {
      // Giữ script để tránh tải lại ở lần sau
    };
  }, []);

  // 2. Khởi tạo HanziWriter khi script đã tải và DOM container đã sẵn sàng
  useEffect(() => {
    if (!isScriptLoaded || !canvasContainerRef.current || !kanjiChar) return;

    // Reset container trước khi vẽ để tránh tạo lặp
    canvasContainerRef.current.innerHTML = '';
    setQuizSuccess(false);

    try {
      // Giải quyết CSS variable thành màu Hex/RGB thực tế để SVG của HanziWriter nhận biết chính xác
      let strokeColorVal = accentColor || '#1e3a8a';
      if (strokeColorVal.startsWith('var(')) {
        const varName = strokeColorVal.substring(4, strokeColorVal.length - 1).trim();
        const resolved = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        if (resolved) {
          strokeColorVal = resolved;
        }
      }

      const writer = window.HanziWriter.create(canvasContainerRef.current, kanjiChar, {
        width: 200,
        height: 200,
        padding: 15,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 200,
        showOutline: true,
        strokeColor: strokeColorVal,
        outlineColor: '#cbd5e1', // Sử dụng màu xám đậm hơn (#cbd5e1 thay vì #f1f5f9) để outline hiện rõ trên nền trắng
        drawingColor: '#2563eb',
        drawingWidth: 6,
        showCharacter: true,
        // Nạp nét viết tiếng Nhật chuẩn từ CDN
        charDataLoader: function(char, onLoad, onError) {
          fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data-jp@latest/${char}.json`)
            .then(res => {
              if (!res.ok) {
                throw new Error('Không có nét Nhật Bản, chuyển sang nét mặc định');
              }
              return res.json();
            })
            .then(onLoad)
            .catch(() => {
              // Fallback về dữ liệu nét mặc định (Chinese) nếu không có nét vẽ JP đặc thù
              fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${char}.json`)
                .then(res => res.json())
                .then(onLoad)
                .catch(onError);
            });
        }
      });

      setWriterInstance(writer);

      // Chạy hoạt ảnh ngay khi mở trang
      writer.animateCharacter();

      return () => {
        if (writer) {
          safeCancel(writer);
        }
      };
    } catch (err) {
      console.error('Lỗi khi khởi tạo Hanzi Writer:', err);
      setScriptError(true);
    }
  }, [isScriptLoaded, kanjiChar, accentColor]);

  // 3. Xử lý các chế độ tương tác
  const handlePlayAnimation = useCallback(() => {
    if (!writerInstance) return;
    setQuizSuccess(false);
    safeCancel(writerInstance);
    writerInstance.showCharacter();
    writerInstance.animateCharacter();
  }, [writerInstance]);

  const handleStartQuiz = useCallback(() => {
    if (!writerInstance) return;
    setQuizSuccess(false);
    safeCancel(writerInstance);
    writerInstance.quiz({
      onComplete: (summary) => {
        setQuizSuccess(true);
        console.log('Quiz hoàn thành:', summary);
      }
    });
  }, [writerInstance]);

  const handleReset = () => {
    if (!writerInstance) return;
    setQuizSuccess(false);
    safeCancel(writerInstance);
    writerInstance.showCharacter();
    if (practiceMode === 'quiz') {
      handleStartQuiz();
    } else {
      writerInstance.animateCharacter();
    }
  };

  // Đồng bộ chế độ tập luyện
  useEffect(() => {
    if (!writerInstance) return;
    if (practiceMode === 'quiz') {
      handleStartQuiz();
    } else {
      handlePlayAnimation();
    }
  }, [practiceMode, writerInstance, handlePlayAnimation, handleStartQuiz]);

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-surface-container-lowest border border-outline-variant/40 sharp-shadow-lg w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col md:flex-row relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Nút đóng */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-on-surface-variant hover:text-on-surface transition-colors hover:bg-surface-container rounded-full"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── BÊN TRÁI: BẢNG VẼ NÉT & ĐỒ HỌA ────────────────────── */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col items-center gap-4 border-b md:border-b-0 md:border-r border-outline-variant/20 bg-surface-container-low/30 overflow-y-auto">
          
          <div className="w-full text-center mb-4">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase text-primary border border-primary/20 bg-primary/5">
              HỌC VIẾT KANJI
            </span>
            <h3 className="font-headline text-3xl font-black text-on-surface mt-2 font-jp">{kanjiChar}</h3>
            <p className="text-xs text-on-surface-variant/80 mt-1 font-semibold uppercase tracking-wider">
              {parsedBack.hanViet || card?.romaji || 'Đang tải'} • {parsedBack.meaning || 'Đang tải'}
            </p>
          </div>

          {/* Canvas vẽ nét */}
          <div className="relative w-[220px] h-[220px] bg-white border-2 border-outline-variant/60 flex items-center justify-center shadow-inner rounded-lg overflow-hidden group">
            {/* Background lưới chữ điền mờ ảo */}
            <div className="absolute inset-0 pointer-events-none border-dashed border-slate-200 border-t border-b border-l border-r" 
                 style={{
                   backgroundImage: `linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)`,
                   backgroundPosition: 'center',
                   backgroundSize: '100% 100%'
                 }}>
              <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-slate-200" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px border-l border-dashed border-slate-200" />
            </div>

            {/* Hanzi Writer Canvas Holder */}
            <div ref={canvasContainerRef} className="z-10 cursor-pointer" />

            {/* Trạng thái tải thư viện */}
            {!isScriptLoaded && !scriptError && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95">
                <div className="animate-spin w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full" />
                <p className="text-[10px] font-bold text-on-surface-variant uppercase mt-3 tracking-wider">Đang tải bảng vẽ...</p>
              </div>
            )}

            {scriptError && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 p-4 text-center">
                <p className="text-sm font-bold text-secondary">Chữ Hán tự: {kanjiChar}</p>
                <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">Không thể tải hoạt ảnh nét vẽ. Bạn vẫn có thể thực hành bằng cách nhìn và viết lên giấy.</p>
              </div>
            )}

            {/* Thông báo vẽ thành công */}
            {quizSuccess && (
              <div className="absolute inset-0 z-20 bg-green-500/95 flex flex-col items-center justify-center text-white animate-fade-in">
                <svg className="w-12 h-12 animate-bounce" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-bold text-sm uppercase tracking-widest mt-3">Rất chính xác!</p>
                <button onClick={handleReset} className="mt-4 px-3 py-1 bg-white text-green-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors">
                  Viết lại
                </button>
              </div>
            )}
          </div>

          {/* Điều khiển tập viết */}
          <div className="w-full mt-5 space-y-3">
            <div className="flex bg-surface-container border border-outline-variant/30 p-1 rounded-md">
              <button 
                onClick={() => setPracticeMode('animate')}
                className={`flex-1 py-1.5 text-center text-xs font-bold uppercase tracking-wider transition-all rounded ${
                  practiceMode === 'animate' 
                    ? 'bg-surface-container-lowest text-primary shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Xem hướng dẫn
              </button>
              <button 
                onClick={() => setPracticeMode('quiz')}
                disabled={scriptError}
                className={`flex-1 py-1.5 text-center text-xs font-bold uppercase tracking-wider transition-all rounded disabled:opacity-50 ${
                  practiceMode === 'quiz' 
                    ? 'bg-surface-container-lowest text-primary shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Tự viết nét
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={practiceMode === 'quiz' ? handleStartQuiz : handlePlayAnimation}
                className="flex-1 py-2 text-xs font-bold uppercase tracking-wider border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {practiceMode === 'quiz' ? 'Bắt đầu lại' : 'Chạy lại'}
              </button>
              <button 
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
              >
                Xóa vẽ
              </button>
            </div>
          </div>
        </div>

        {/* ── BÊN PHẢI: GIẢI PHẪU BỘ THỦ, MNEMONICS & TỪ GHÉP ────── */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col min-h-0 overflow-hidden relative">
          
          {/* Header tĩnh không cuộn để chứa tiêu đề và tạo khoảng trống tránh đè nút đóng */}
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15 mb-4 pr-12">
            <h4 className="font-headline text-md font-bold text-on-surface flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Chi tiết chữ Hán
            </h4>
          </div>

          {/* Nội dung chi tiết cuộn độc lập */}
          <div className="flex-1 overflow-y-auto space-y-5 pr-1.5 custom-scrollbar">
            {/* 1. Phân tích bộ thủ */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5 font-headline">
                <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Phân tích bộ thủ (Radicals)
              </h5>
              <div className="p-3 bg-surface-container-low border border-outline-variant/30 rounded-md">
                <p className="text-xs font-bold text-on-surface">
                  {kanjiInfo?.radicalExplanation || (parsedBack.boThu ? `Bộ thủ tạo thành: ${parsedBack.boThu}` : 'Đang cập nhật bộ thủ...')}
                </p>
                {kanjiInfo?.radicals && kanjiInfo.radicals.length > 0 ? (
                  <div className="flex gap-2 mt-2">
                    {kanjiInfo.radicals.map((rad, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-surface-container-lowest border border-outline-variant/30 text-xs font-bold text-primary rounded font-jp">
                        {rad}
                      </span>
                    ))}
                  </div>
                ) : parsedBack.boThu ? (
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-surface-container-lowest border border-outline-variant/30 text-xs font-bold text-primary rounded font-jp">
                      {parsedBack.boThu.split(' ')[0]}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* 2. Ý nghĩa / Câu chuyện liên tưởng */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5 font-headline">
                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Ý nghĩa / Mnemonic
              </h5>
              <div className="p-3 bg-amber-500/5 border border-amber-500/15 text-on-surface text-xs leading-relaxed italic rounded-md">
                {kanjiInfo?.mnemonic 
                  ? `"${kanjiInfo.mnemonic}"` 
                  : parsedBack.mnemonic 
                    ? `"${parsedBack.mnemonic}"` 
                    : (parsedBack.meaning ? `Ý nghĩa: ${parsedBack.meaning}` : 'Đang biên soạn câu chuyện gợi nhớ cho chữ Kanji này...')}
              </div>
            </div>

            {/* 3. Onyomi / Kunyomi */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low border border-outline-variant/20 p-3 rounded-md">
                <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 font-headline">
                  Onyomi (Âm On)
                </h5>
                <p className="font-jp font-black text-sm text-primary">
                  {parsedBack.on && parsedBack.on !== '-' ? parsedBack.on : 'Không có'}
                </p>
              </div>
              <div className="bg-surface-container-low border border-outline-variant/20 p-3 rounded-md">
                <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 font-headline">
                  Kunyomi (Âm Kun)
                </h5>
                <p className="font-jp font-black text-sm text-secondary">
                  {parsedBack.kun && parsedBack.kun !== '-' ? parsedBack.kun : 'Không có'}
                </p>
              </div>
            </div>

            {/* 4. Từ ghép phổ biến (Jukugo) */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5 font-headline">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                Từ ghép phổ biến
              </h5>
              <div className="space-y-3">
                {kanjiInfo?.jukugo && kanjiInfo.jukugo.length > 0 ? (
                  <div className="space-y-1.5">
                    {kanjiInfo.jukugo.map((jk, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-surface-container-low border border-outline-variant/20 rounded hover:bg-surface-container transition-all text-xs">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-jp font-black text-sm text-on-surface">{jk.word}</span>
                          <span className="text-[10px] text-on-surface-variant/80 font-medium font-jp">({jk.reading})</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 border border-emerald-100 rounded">
                          {jk.meaning}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (parsedBack.examplesOn && parsedBack.examplesOn.length > 0) || (parsedBack.examplesKun && parsedBack.examplesKun.length > 0) ? (
                  <div className="space-y-3">
                    {parsedBack.examplesOn && parsedBack.examplesOn.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5 font-headline">• Từ ghép Onyomi</p>
                        <div className="space-y-1">
                          {parsedBack.examplesOn.map((ex, idx) => (
                            <div key={idx} className="p-2 bg-surface-container-low border border-outline-variant/15 rounded text-xs font-jp text-on-surface font-semibold">
                              {ex}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {parsedBack.examplesKun && parsedBack.examplesKun.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5 font-headline">• Từ ghép Kunyomi</p>
                        <div className="space-y-1">
                          {parsedBack.examplesKun.map((ex, idx) => (
                            <div key={idx} className="p-2 bg-surface-container-low border border-outline-variant/15 rounded text-xs font-jp text-on-surface font-semibold">
                              {ex}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant italic">Đang cập nhật các từ ghép...</p>
                )}
              </div>
            </div>

            {/* Ví dụ của thẻ - di chuyển vào trong vùng cuộn để tạo trải nghiệm tự nhiên */}
            {card?.example && (
              <div className="pt-4 border-t border-outline-variant/20">
                <CollapsibleExample 
                  example={card.example} 
                  onSpeak={speakJapanese} 
                  containerClass="w-full p-3 bg-surface-container-low/40 border border-outline-variant/20 border-l-4 border-l-primary text-left rounded"
                  maxHeightClass="max-h-[120px]"
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
