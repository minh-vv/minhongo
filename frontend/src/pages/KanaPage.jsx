import { useState, useEffect, useCallback, useMemo } from 'react';
import { Volume2, Shuffle, Check, X, RotateCw, ChevronRight, Keyboard, Info, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '../components/PageHeader';

// ── KANA DATA ───────────────────────────────────────────────────────────────
const HIRAGANA = {
  vowels: [
    { kana: 'あ', romaji: 'a' }, { kana: 'い', romaji: 'i' }, { kana: 'う', romaji: 'u' },
    { kana: 'え', romaji: 'e' }, { kana: 'お', romaji: 'o' },
  ],
  ka: [
    { kana: 'か', romaji: 'ka' }, { kana: 'き', romaji: 'ki' }, { kana: 'く', romaji: 'ku' },
    { kana: 'け', romaji: 'ke' }, { kana: 'こ', romaji: 'ko' },
  ],
  sa: [
    { kana: 'さ', romaji: 'sa' }, { kana: 'し', romaji: 'shi' }, { kana: 'す', romaji: 'su' },
    { kana: 'せ', romaji: 'se' }, { kana: 'そ', romaji: 'so' },
  ],
  ta: [
    { kana: 'た', romaji: 'ta' }, { kana: 'ち', romaji: 'chi' }, { kana: 'つ', romaji: 'tsu' },
    { kana: 'て', romaji: 'te' }, { kana: 'と', romaji: 'to' },
  ],
  na: [
    { kana: 'な', romaji: 'na' }, { kana: 'に', romaji: 'ni' }, { kana: 'ぬ', romaji: 'nu' },
    { kana: 'ね', romaji: 'ne' }, { kana: 'の', romaji: 'no' },
  ],
  ha: [
    { kana: 'は', romaji: 'ha' }, { kana: 'ひ', romaji: 'hi' }, { kana: 'ふ', romaji: 'fu' },
    { kana: 'へ', romaji: 'he' }, { kana: 'ほ', romaji: 'ho' },
  ],
  ma: [
    { kana: 'ま', romaji: 'ma' }, { kana: 'み', romaji: 'mi' }, { kana: 'む', romaji: 'mu' },
    { kana: 'め', romaji: 'me' }, { kana: 'も', romaji: 'mo' },
  ],
  ya: [
    { kana: 'や', romaji: 'ya' }, null, { kana: 'ゆ', romaji: 'yu' },
    null, { kana: 'よ', romaji: 'yo' },
  ],
  ra: [
    { kana: 'ら', romaji: 'ra' }, { kana: 'り', romaji: 'ri' }, { kana: 'る', romaji: 'ru' },
    { kana: 'れ', romaji: 're' }, { kana: 'ろ', romaji: 'ro' },
  ],
  wa: [
    { kana: 'わ', romaji: 'wa' }, null, null,
    null, { kana: 'を', romaji: 'wo' },
  ],
  n: [
    { kana: 'ん', romaji: 'n' },
  ],
  // Dakuten
  ga: [
    { kana: 'が', romaji: 'ga' }, { kana: 'ぎ', romaji: 'gi' }, { kana: 'ぐ', romaji: 'gu' },
    { kana: 'げ', romaji: 'ge' }, { kana: 'ご', romaji: 'go' },
  ],
  za: [
    { kana: 'ざ', romaji: 'za' }, { kana: 'じ', romaji: 'ji' }, { kana: 'ず', romaji: 'zu' },
    { kana: 'ぜ', romaji: 'ze' }, { kana: 'ぞ', romaji: 'zo' },
  ],
  da: [
    { kana: 'だ', romaji: 'da' }, { kana: 'ぢ', romaji: 'di' }, { kana: 'づ', romaji: 'du' },
    { kana: 'で', romaji: 'de' }, { kana: 'ど', romaji: 'do' },
  ],
  ba: [
    { kana: 'ば', romaji: 'ba' }, { kana: 'び', romaji: 'bi' }, { kana: 'ぶ', romaji: 'bu' },
    { kana: 'べ', romaji: 'be' }, { kana: 'ぼ', romaji: 'bo' },
  ],
  pa: [
    { kana: 'ぱ', romaji: 'pa' }, { kana: 'ぴ', romaji: 'pi' }, { kana: 'ぷ', romaji: 'pu' },
    { kana: 'ぺ', romaji: 'pe' }, { kana: 'ぽ', romaji: 'po' },
  ],
};

const KATAKANA = {
  vowels: [
    { kana: 'ア', romaji: 'a' }, { kana: 'イ', romaji: 'i' }, { kana: 'ウ', romaji: 'u' },
    { kana: 'エ', romaji: 'e' }, { kana: 'オ', romaji: 'o' },
  ],
  ka: [
    { kana: 'カ', romaji: 'ka' }, { kana: 'キ', romaji: 'ki' }, { kana: 'ク', romaji: 'ku' },
    { kana: 'ケ', romaji: 'ke' }, { kana: 'コ', romaji: 'ko' },
  ],
  sa: [
    { kana: 'サ', romaji: 'sa' }, { kana: 'シ', romaji: 'shi' }, { kana: 'ス', romaji: 'su' },
    { kana: 'セ', romaji: 'se' }, { kana: 'ソ', romaji: 'so' },
  ],
  ta: [
    { kana: 'タ', romaji: 'ta' }, { kana: 'チ', romaji: 'chi' }, { kana: 'ツ', romaji: 'tsu' },
    { kana: 'テ', romaji: 'te' }, { kana: 'ト', romaji: 'to' },
  ],
  na: [
    { kana: 'ナ', romaji: 'na' }, { kana: 'ニ', romaji: 'ni' }, { kana: 'ヌ', romaji: 'nu' },
    { kana: 'ネ', romaji: 'ne' }, { kana: 'ノ', romaji: 'no' },
  ],
  ha: [
    { kana: 'ハ', romaji: 'ha' }, { kana: 'ヒ', romaji: 'hi' }, { kana: 'フ', romaji: 'fu' },
    { kana: 'ヘ', romaji: 'he' }, { kana: 'ホ', romaji: 'ho' },
  ],
  ma: [
    { kana: 'マ', romaji: 'ma' }, { kana: 'ミ', romaji: 'mi' }, { kana: 'ム', romaji: 'mu' },
    { kana: 'メ', romaji: 'me' }, { kana: 'モ', romaji: 'mo' },
  ],
  ya: [
    { kana: 'ヤ', romaji: 'ya' }, null, { kana: 'ユ', romaji: 'yu' },
    null, { kana: 'ヨ', romaji: 'yo' },
  ],
  ra: [
    { kana: 'ラ', romaji: 'ra' }, { kana: 'リ', romaji: 'ri' }, { kana: 'ル', romaji: 'ru' },
    { kana: 'レ', romaji: 're' }, { kana: 'ロ', romaji: 'ro' },
  ],
  wa: [
    { kana: 'ワ', romaji: 'wa' }, null, null,
    null, { kana: 'ヲ', romaji: 'wo' },
  ],
  n: [
    { kana: 'ン', romaji: 'n' },
  ],
  // Dakuten
  ga: [
    { kana: 'ガ', romaji: 'ga' }, { kana: 'ギ', romaji: 'gi' }, { kana: 'グ', romaji: 'gu' },
    { kana: 'ゲ', romaji: 'ge' }, { kana: 'ゴ', romaji: 'go' },
  ],
  za: [
    { kana: 'ザ', romaji: 'za' }, { kana: 'ジ', romaji: 'ji' }, { kana: 'ズ', romaji: 'zu' },
    { kana: 'ゼ', romaji: 'ze' }, { kana: 'ゾ', romaji: 'zo' },
  ],
  da: [
    { kana: 'ダ', romaji: 'da' }, { kana: 'ヂ', romaji: 'di' }, { kana: 'ヅ', romaji: 'du' },
    { kana: 'デ', romaji: 'de' }, { kana: 'ド', romaji: 'do' },
  ],
  ba: [
    { kana: 'バ', romaji: 'ba' }, { kana: 'ビ', romaji: 'bi' }, { kana: 'ブ', romaji: 'bu' },
    { kana: 'ベ', romaji: 'be' }, { kana: 'ボ', romaji: 'bo' },
  ],
  pa: [
    { kana: 'パ', romaji: 'pa' }, { kana: 'ピ', romaji: 'pi' }, { kana: 'プ', romaji: 'pu' },
    { kana: 'ペ', romaji: 'pe' }, { kana: 'ポ', romaji: 'po' },
  ],
};

const BASIC_ROWS = ['vowels', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa', 'n'];
const DAKUTEN_ROWS = ['ga', 'za', 'da', 'ba', 'pa'];
const ROW_LABELS = {
  vowels: 'Nguyên âm', ka: 'K', sa: 'S', ta: 'T', na: 'N', ha: 'H',
  ma: 'M', ya: 'Y', ra: 'R', wa: 'W', n: 'N đặc biệt',
  ga: 'G (゛)', za: 'Z (゛)', da: 'D (゛)', ba: 'B (゛)', pa: 'P (゜)',
};
const VOWEL_HEADERS = ['a', 'i', 'u', 'e', 'o'];

// ── TTS ─────────────────────────────────────────────────────────────────────
function speakJapanese(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.8;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

// ── KANA CELL COMPONENT ─────────────────────────────────────────────────────
function KanaCell({ item, isActive, onClick }) {
  if (!item) {
    return <div className="w-full aspect-square" />;
  }

  return (
    <button
      onClick={() => onClick(item)}
      className={`group relative w-full aspect-square flex flex-col items-center justify-center transition-all duration-200 border-2 hover:-translate-y-0.5 ${
        isActive
          ? 'border-secondary bg-secondary/5 sharp-shadow-sm scale-105'
          : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/40 hover:bg-surface-container-low/50'
      }`}
    >
      <span className={`font-jp text-2xl sm:text-3xl font-bold leading-none transition-colors ${
        isActive ? 'text-secondary' : 'text-on-surface group-hover:text-primary'
      }`}>
        {item.kana}
      </span>
      <span className={`text-[10px] sm:text-xs font-semibold mt-1 transition-colors ${
        isActive ? 'text-secondary/70' : 'text-on-surface-variant/60'
      }`}>
        {item.romaji}
      </span>
      {/* Hover TTS hint */}
      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Volume2 className="w-3 h-3 text-primary/40" />
      </div>
    </button>
  );
}

// ── KANA TABLE COMPONENT ────────────────────────────────────────────────────
function KanaTable({ data, title, activeKana, onCellClick, showDakuten }) {
  const rows = showDakuten ? [...BASIC_ROWS, ...DAKUTEN_ROWS] : BASIC_ROWS;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 flex-shrink-0" style={{ background: 'var(--primary)' }} />
        <h2 className="font-headline text-lg font-bold text-on-surface uppercase tracking-wider">{title}</h2>
      </div>

      {/* Column headers */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'minmax(40px, 60px) repeat(5, 1fr)' }}>
        <div />
        {VOWEL_HEADERS.map((v) => (
          <div key={v} className="text-center text-[10px] font-bold uppercase tracking-widest text-primary/50 py-1">
            {v}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-1.5">
        {rows.map((rowKey) => {
          const rowData = data[rowKey];
          if (!rowData) return null;

          // Separator before dakuten section
          const isDakutenStart = rowKey === 'ga';

          return (
            <div key={rowKey}>
              {isDakutenStart && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-outline-variant/30" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/50">
                    Đục âm & Bán đục âm (濁音・半濁音)
                  </span>
                  <div className="flex-1 h-px bg-outline-variant/30" />
                </div>
              )}
              <div className="grid gap-1.5" style={{ gridTemplateColumns: 'minmax(40px, 60px) repeat(5, 1fr)' }}>
                {/* Row label */}
                <div className="flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 bg-surface-container/50 border border-outline-variant/20">
                  {ROW_LABELS[rowKey]}
                </div>
                {/* Cells */}
                {rowKey === 'n' ? (
                  <>
                    <KanaCell
                      item={rowData[0]}
                      isActive={activeKana?.kana === rowData[0]?.kana}
                      onClick={onCellClick}
                    />
                    <div /><div /><div /><div />
                  </>
                ) : (
                  rowData.map((item, idx) => (
                    <KanaCell
                      key={idx}
                      item={item}
                      isActive={activeKana?.kana === item?.kana}
                      onClick={onCellClick}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── TYPING GUIDE COMPONENT ──────────────────────────────────────────────────
function TypingGuide() {
  const [expanded, setExpanded] = useState(false);

  const guides = [
    {
      platform: 'Windows',
      icon: '🖥️',
      steps: [
        'Mở Settings → Time & Language → Language & Region',
        'Nhấn "Add a language" → tìm "Japanese" (日本語)',
        'Cài đặt xong, nhấn Windows + Space để chuyển sang bàn phím tiếng Nhật',
        'Gõ chữ Romaji (vd: "ka" → か), nhấn Space để chuyển sang Kanji, nhấn Enter để xác nhận',
      ],
    },
    {
      platform: 'macOS',
      icon: '🍎',
      steps: [
        'Mở System Settings → Keyboard → Input Sources',
        'Nhấn "+" → tìm "Japanese" → chọn "Hiragana"',
        'Nhấn Control + Space hoặc Fn để chuyển bàn phím',
        'Gõ Romaji → nhấn Space để chọn Kanji → Enter xác nhận',
      ],
    },
    {
      platform: 'Android',
      icon: '📱',
      steps: [
        'Cài ứng dụng Gboard từ Play Store (nếu chưa có)',
        'Mở Settings → System → Languages & input → Virtual keyboard → Gboard',
        'Nhấn Languages → Add keyboard → tìm "Japanese"',
        'Khi gõ, nhấn giữ nút Globe 🌐 trên bàn phím để chuyển sang tiếng Nhật',
      ],
    },
    {
      platform: 'iPhone / iPad',
      icon: '📱',
      steps: [
        'Mở Settings → General → Keyboard → Keyboards',
        'Nhấn "Add New Keyboard..." → chọn "Japanese" → Romaji',
        'Khi gõ, nhấn nút Globe 🌐 trên bàn phím để chuyển sang tiếng Nhật',
        'Gõ Romaji → chọn chữ Kana/Kanji từ gợi ý phía trên bàn phím',
      ],
    },
  ];

  return (
    <div className="bg-surface-container-lowest border-2 border-outline-variant/40 sharp-shadow overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-container-low/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-primary/5 border border-primary/20 flex-shrink-0">
            <Keyboard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-on-surface text-base">Hướng dẫn gõ tiếng Nhật</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Cách cài đặt bàn phím tiếng Nhật trên các thiết bị</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-on-surface-variant" /> : <ChevronDown className="w-5 h-5 text-on-surface-variant" />}
      </button>

      {expanded && (
        <div className="border-t border-outline-variant/30 p-5 space-y-5 animate-fade-up">
          {/* Quick tip */}
          <div className="p-4 bg-primary/[0.03] border border-primary/15 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
              <Info className="w-3.5 h-3.5" /> Mẹo nhanh
            </div>
            <p className="text-sm text-on-surface leading-relaxed">
              Bạn <strong>không cần</strong> nhớ vị trí phím tiếng Nhật! Chỉ cần gõ bằng <strong>Romaji</strong> (chữ La-tinh)
              và hệ thống sẽ tự chuyển sang Hiragana/Katakana. Ví dụ: gõ <kbd className="px-1.5 py-0.5 bg-white border border-outline-variant/50 text-xs font-bold mx-0.5">sakura</kbd> →
              <span className="font-jp font-bold text-primary mx-1">さくら</span> →
              nhấn Space →
              <span className="font-jp font-bold text-primary mx-1">桜</span>
            </p>
          </div>

          {/* Platform guides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guides.map((guide) => (
              <div key={guide.platform} className="border border-outline-variant/30 bg-surface p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{guide.icon}</span>
                  <h4 className="font-bold text-on-surface text-sm">{guide.platform}</h4>
                </div>
                <ol className="space-y-2">
                  {guide.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-2.5 text-xs text-on-surface-variant leading-relaxed">
                      <span className="w-5 h-5 flex items-center justify-center bg-surface-container text-on-surface-variant text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── QUIZ COMPONENT ──────────────────────────────────────────────────────────
function KanaQuiz({ kanaType }) {
  const data = kanaType === 'hiragana' ? HIRAGANA : KATAKANA;
  const allKana = useMemo(() => {
    return Object.values(data).flat().filter(Boolean);
  }, [data]);

  const [quizActive, setQuizActive] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  const QUIZ_COUNT = 10;

  const startQuiz = useCallback(() => {
    const shuffled = [...allKana].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(QUIZ_COUNT, shuffled.length));

    const qs = selected.map((item) => {
      const wrongPool = allKana.filter((k) => k.romaji !== item.romaji);
      const distractors = [...wrongPool].sort(() => Math.random() - 0.5).slice(0, 3).map(k => k.romaji);
      const options = [...distractors, item.romaji].sort(() => Math.random() - 0.5);
      return { kana: item.kana, answer: item.romaji, options };
    });

    setQuestions(qs);
    setCurrentIdx(0);
    setScore(0);
    setAnswered(null);
    setSelectedOption(null);
    setQuizActive(true);
  }, [allKana]);

  const handleAnswer = (opt) => {
    if (answered !== null) return;
    const correct = opt === questions[currentIdx].answer;
    if (correct) setScore((s) => s + 1);
    setAnswered(correct);
    setSelectedOption(opt);
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      // Quiz finished - show results
      setQuizActive(false);
    } else {
      setCurrentIdx((i) => i + 1);
      setAnswered(null);
      setSelectedOption(null);
    }
  };

  const current = questions[currentIdx];
  const isFinished = !quizActive && questions.length > 0 && currentIdx + 1 >= questions.length;

  if (!quizActive && !isFinished) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 mx-auto bg-primary/5 border-2 border-primary/20 flex items-center justify-center">
          <span className="font-jp text-2xl font-bold text-primary">
            {kanaType === 'hiragana' ? 'あ' : 'ア'}
          </span>
        </div>
        <div>
          <h3 className="font-bold text-on-surface text-lg">
            Kiểm tra {kanaType === 'hiragana' ? 'Hiragana' : 'Katakana'}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            {QUIZ_COUNT} câu hỏi ngẫu nhiên · Xem chữ → chọn Romaji đúng
          </p>
        </div>
        <button
          onClick={startQuiz}
          className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-primary hover:bg-primary-container transition-all sharp-shadow-sm"
        >
          Bắt đầu kiểm tra
        </button>
      </div>
    );
  }

  if (isFinished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="text-center py-8 space-y-5 animate-fade-up">
        <div className="text-5xl font-black text-on-surface">{pct}%</div>
        <p className="text-sm text-on-surface-variant">
          Đúng <span className="font-bold text-emerald-700">{score}</span> / {questions.length} câu
        </p>
        <div className="h-2.5 bg-surface-container border border-outline-variant/20 overflow-hidden max-w-xs mx-auto">
          <div
            className="h-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: pct >= 80 ? '#2e7d32' : pct >= 50 ? 'var(--primary)' : 'var(--secondary)' }}
          />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: pct >= 80 ? '#2e7d32' : pct >= 50 ? 'var(--primary)' : 'var(--secondary)' }}>
          {pct >= 90 ? 'Xuất sắc! 🎉' : pct >= 70 ? 'Tốt lắm! 👍' : pct >= 50 ? 'Khá ổn!' : 'Cần luyện thêm! 💪'}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={startQuiz}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-primary hover:bg-primary-container transition-all"
          >
            <RotateCw className="w-3.5 h-3.5" /> Làm lại
          </button>
          <button
            onClick={() => { setQuestions([]); setQuizActive(false); }}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant border border-outline-variant hover:bg-surface-container transition-all"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-surface-container border border-outline-variant/20 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
          {currentIdx + 1}/{questions.length}
        </span>
      </div>

      {/* Question */}
      <div className="text-center py-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
          Chữ này đọc là gì?
        </span>
        <p className="font-jp text-7xl font-bold text-on-surface mt-3 mb-2">{current.kana}</p>
        <button
          onClick={() => speakJapanese(current.kana)}
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-secondary transition-colors"
        >
          <Volume2 className="w-3.5 h-3.5" /> Nghe phát âm
        </button>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        {current.options.map((opt, i) => {
          let cls = 'border-outline-variant/50 bg-surface-container-lowest text-on-surface hover:border-primary hover:-translate-y-0.5';
          if (answered !== null) {
            if (opt === current.answer) {
              cls = 'border-emerald-600 bg-emerald-50/50 text-emerald-800 font-bold';
            } else if (opt === selectedOption) {
              cls = 'border-secondary bg-red-50/50 text-secondary font-bold';
            } else {
              cls = 'border-outline-variant/20 text-on-surface-variant/40 opacity-50';
            }
          }
          return (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              className={`p-4 text-center text-lg font-bold border-2 transition-all duration-150 ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Result + Next */}
      {answered !== null && (
        <div className="flex flex-col items-center gap-3 animate-fade-up">
          <div className={`flex items-center gap-2 px-4 py-2 text-sm font-bold ${
            answered ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' : 'text-secondary bg-red-50 border border-red-200'
          }`}>
            {answered ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {answered ? 'Chính xác!' : `Đáp án đúng: ${current.answer}`}
          </div>
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-primary hover:bg-primary-container transition-all"
          >
            {currentIdx + 1 >= questions.length ? 'Xem kết quả' : 'Tiếp theo'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── MAIN KANA PAGE ──────────────────────────────────────────────────────────
export default function KanaPage() {
  const [activeTab, setActiveTab] = useState('hiragana');
  const [activeKana, setActiveKana] = useState(null);
  const [showDakuten, setShowDakuten] = useState(true);
  const [activeSection, setActiveSection] = useState('chart'); // 'chart' | 'quiz' | 'typing'

  const data = activeTab === 'hiragana' ? HIRAGANA : KATAKANA;
  const totalBasic = Object.entries(data).filter(([k]) => BASIC_ROWS.includes(k)).reduce((sum, [, v]) => sum + v.filter(Boolean).length, 0);
  const totalDakuten = Object.entries(data).filter(([k]) => DAKUTEN_ROWS.includes(k)).reduce((sum, [, v]) => sum + v.filter(Boolean).length, 0);

  const handleCellClick = (item) => {
    setActiveKana(item);
    speakJapanese(item.kana);
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8 min-h-screen">
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <PageHeader
        tag="Nền tảng cơ bản"
        title="Bảng chữ cái"
        subtitle="Học Hiragana & Katakana — nền tảng không thể thiếu để bắt đầu hành trình tiếng Nhật."
        ghostChar="字"
        rightContent={
          <div className="flex gap-3 flex-shrink-0">
            <div className="text-center bg-white/10 px-5 py-3 border border-white/10 sharp-shadow-sm">
              <p className="text-2xl font-black text-white leading-none">{totalBasic}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Cơ bản</p>
            </div>
            <div className="text-center bg-white/10 px-5 py-3 border border-white/10 sharp-shadow-sm">
              <p className="text-2xl font-black text-white leading-none">{totalDakuten}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Đục âm</p>
            </div>
          </div>
        }
      />

      {/* ── TAB SWITCH: HIRAGANA / KATAKANA ──────────────────────── */}
      <div className="flex items-center gap-0 bg-surface-container border border-outline-variant/30 p-1 w-fit">
        {[
          { id: 'hiragana', label: 'Hiragana', sub: 'ひらがな' },
          { id: 'katakana', label: 'Katakana', sub: 'カタカナ' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setActiveKana(null); }}
            className={`px-6 py-3 text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <span className="font-jp text-base">{tab.sub}</span>
            <span className="uppercase tracking-wider text-xs">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── SECTION TABS ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: 'chart', label: 'Bảng chữ cái', icon: null },
          { id: 'quiz', label: 'Kiểm tra', icon: <Shuffle className="w-3.5 h-3.5" /> },
          { id: 'typing', label: 'Hướng dẫn gõ', icon: <Keyboard className="w-3.5 h-3.5" /> },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all ${
              activeSection === sec.id
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/30 hover:text-on-surface'
            }`}
          >
            {sec.icon}
            {sec.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────── */}
      {activeSection === 'chart' && (
        <div className="space-y-6 animate-fade-up">
          {/* Toggle dakuten */}
          <div className="flex items-center gap-3 p-3 bg-surface-container/50 border border-outline-variant/20">
            <input
              type="checkbox"
              id="showDakuten"
              checked={showDakuten}
              onChange={(e) => setShowDakuten(e.target.checked)}
              className="w-4 h-4 border-outline-variant focus:ring-primary text-primary accent-primary cursor-pointer"
            />
            <label htmlFor="showDakuten" className="text-xs font-bold text-on-surface cursor-pointer select-none uppercase tracking-wider">
              Hiện đục âm & bán đục âm (゛゜)
            </label>
          </div>

          {/* Active kana detail */}
          {activeKana && (
            <div className="bg-surface-container-lowest border-2 border-primary/30 p-6 flex items-center gap-6 sharp-shadow animate-fade-up">
              <div className="w-24 h-24 flex items-center justify-center bg-primary/5 border-2 border-primary/20 flex-shrink-0">
                <span className="font-jp text-5xl font-bold text-primary">{activeKana.kana}</span>
              </div>
              <div className="space-y-2 flex-1">
                <p className="text-2xl font-bold text-on-surface">{activeKana.romaji}</p>
                <p className="text-xs text-on-surface-variant">
                  {activeTab === 'hiragana' ? 'Hiragana' : 'Katakana'} ·
                  Nhấn vào ô khác để nghe phát âm
                </p>
              </div>
              <button
                onClick={() => speakJapanese(activeKana.kana)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-container transition-all flex-shrink-0"
              >
                <Volume2 className="w-4 h-4" /> Nghe lại
              </button>
            </div>
          )}

          {/* Kana table */}
          <KanaTable
            data={data}
            title={activeTab === 'hiragana' ? 'Bảng Hiragana (ひらがな)' : 'Bảng Katakana (カタカナ)'}
            activeKana={activeKana}
            onCellClick={handleCellClick}
            showDakuten={showDakuten}
          />
        </div>
      )}

      {activeSection === 'quiz' && (
        <div className="bg-surface-container-lowest border-2 border-outline-variant/40 sharp-shadow p-6 md:p-8 max-w-xl mx-auto animate-fade-up">
          <KanaQuiz kanaType={activeTab} />
        </div>
      )}

      {activeSection === 'typing' && (
        <div className="animate-fade-up">
          <TypingGuide />
        </div>
      )}
    </div>
  );
}
