/**
 * PublicContentPage — shared layout for admin-curated content pages
 * (Kanji, Vocabulary, Grammar). Admin can upload Anki decks; all users can study.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import ImportAnkiModal from './ImportAnkiModal';
import PageHeader from './PageHeader';

const cleanDeckName = (name) => {
  if (!name) return '';
  const regex = /^\s*(?:mimikara|shinkanzen|kanzen|minna|soumatome|somatome|try!?|genki|dekiru)(?:\s+(?:oboeru|master|no\s+nihongo|tăng\s+cường\s+ngữ\s+pháp))?\s*(?:n\d+)?\s*[-——–—]\s*/i;
  return name.replace(regex, '').trim();
};

const cleanDeckDescription = (desc) => {
  if (!desc) return '';
  return desc.replace(/\s*bám\s+sát\s+sách\s+.*$/i, '').trim();
};

const JLPT_LEVELS = [5, 4, 3, 2, 1];

/** Chủ đề học — keyword matching trên tên/mô tả deck */
const THEMES = [
  { id: 'travel',   icon: '✈️',  label: 'Du lịch',   keywords: ['du lịch', 'travel', 'airport', 'sân bay', 'khách sạn', 'hotel'] },
  { id: 'work',     icon: '💼',  label: 'Công việc', keywords: ['công việc', 'business', 'work', 'văn phòng', 'office', 'phỏng vấn'] },
  { id: 'food',     icon: '🍱',  label: 'Ẩm thực',  keywords: ['ẩm thực', 'đồ ăn', 'food', 'nhà hàng', 'restaurant', 'nấu ăn'] },
  { id: 'family',   icon: '👨‍👩‍👧', label: 'Gia đình', keywords: ['gia đình', 'family', 'bố', 'mẹ', 'anh', 'chị', 'em'] },
  { id: 'school',   icon: '🏫',  label: 'Học đường', keywords: ['trường', 'school', 'học sinh', 'giáo viên', 'lớp học', 'education'] },
  { id: 'shopping', icon: '🛍️', label: 'Mua sắm',   keywords: ['mua sắm', 'shopping', 'chợ', 'cửa hàng', 'store', 'price'] },
  { id: 'health',   icon: '🏥',  label: 'Sức khỏe', keywords: ['bệnh viện', 'sức khỏe', 'health', 'bác sĩ', 'doctor', 'thuốc'] },
  { id: 'nature',   icon: '🌿',  label: 'Thiên nhiên', keywords: ['thiên nhiên', 'nature', 'động vật', 'animal', 'thời tiết', 'weather'] },
  { id: 'daily',    icon: '🏠',  label: 'Hằng ngày', keywords: ['hằng ngày', 'daily', 'thói quen', 'routine', 'sinh hoạt', 'nhà'] },
];

/** Kiểm tra deck có thuộc theme không dựa trên keyword matching */
function deckMatchesTheme(deck, theme) {
  const text = `${deck.name} ${deck.description || ''}`.toLowerCase();
  return theme.keywords.some((kw) => text.includes(kw.toLowerCase()));
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'az',     label: 'A đến Z'  },
  { value: 'za',     label: 'Z đến A'  },
  { value: 'cards',  label: 'Nhiều thẻ nhất' },
];

function sortDecks(decks, sort) {
  const copy = [...decks];
  switch (sort) {
    case 'oldest': return copy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case 'az':     return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'za':     return copy.sort((a, b) => b.name.localeCompare(a.name));
    case 'cards':  return copy.sort((a, b) => (b._count?.cards || 0) - (a._count?.cards || 0));
    default:       return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

const getBookInfo = (deck) => {
  const nameLower = deck.name.toLowerCase();
  const descLower = (deck.description || '').toLowerCase();
  
  if (nameLower.includes('minna') || nameLower.includes('nihongo') || descLower.includes('minna')) {
    return {
      id: 'minna',
      title: 'Minna no Nihongo',
      japaneseTitle: 'みんなの日本語 第二版',
      description: 'Giáo trình cốt lõi và phổ biến nhất cho người mới học tiếng Nhật.',
    };
  }
  
  if (nameLower.includes('kanzen') || nameLower.includes('shin kanzen') || nameLower.includes('shinkanzen') || descLower.includes('kanzen')) {
    return {
      id: 'kanzen',
      title: 'Shin Kanzen Master',
      japaneseTitle: '新完全マスター',
      description: 'Giáo trình chuyên sâu phục vụ luyện thi JLPT từ trung cấp đến cao cấp.',
    };
  }

  if (nameLower.includes('soumatome') || nameLower.includes('somatome') || descLower.includes('soumatome')) {
    return {
      id: 'soumatome',
      title: 'Nihongo Soumatome',
      japaneseTitle: '日本語総まとめ',
      description: 'Giáo trình tổng hợp kiến thức trọng tâm cho kỳ thi JLPT.',
    };
  }

  if (nameLower.includes('mimikara') || nameLower.includes('mimi kara') || descLower.includes('mimikara')) {
    return {
      id: 'mimikara',
      title: 'Mimikara Oboeru',
      japaneseTitle: '耳から覚える',
      description: 'Giáo trình luyện nghe và ghi nhớ từ vựng/ngữ pháp cực kỳ hiệu quả.',
    };
  }

  if (nameLower.includes('try') || descLower.includes('try!')) {
    return {
      id: 'try',
      title: 'Try! Tăng cường ngữ pháp',
      japaneseTitle: 'TRY! 日本語能力試験',
      description: 'Giáo trình hệ thống hóa ngữ pháp theo cấp độ JLPT kèm bài tập thực hành.',
    };
  }

  if (nameLower.includes('genki') || descLower.includes('genki')) {
    return {
      id: 'genki',
      title: 'Genki',
      japaneseTitle: 'げんき',
      description: 'Giáo trình tiếng Nhật tích hợp phổ biến ở các nước phương Tây.',
    };
  }

  if (nameLower.includes('dekiru') || descLower.includes('dekiru')) {
    return {
      id: 'dekiru',
      title: 'Dekiru Nihongo',
      japaneseTitle: 'できる日本語',
      description: 'Giáo trình giao tiếp sinh động theo định hướng hành động.',
    };
  }
  
  return {
    id: 'other',
    title: 'Giáo trình & Tài liệu khác',
    japaneseTitle: 'その他',
    description: 'Các bộ từ vựng, tài liệu học tập chọn lọc bổ trợ.',
  };
};

const getBookLevelCardMeta = (bookId, level, category) => {
  const isGrammar = category === 'NGUPHAP';
  const isVocab = category === 'TUVUNG';
  const isKanji = category === 'HANTU';

  let typeText = 'Bài học';
  if (isGrammar) typeText = 'Ngữ pháp';
  else if (isVocab) typeText = 'Từ vựng';
  else if (isKanji) typeText = 'Hán tự';

  if (bookId === 'minna') {
    if (level === 5) {
      return {
        topText: 'みんなの日本語 初級I 第2版',
        bottomDesc: `Minna no Nihongo Sơ cấp 1 - ${typeText}`,
      };
    } else {
      return {
        topText: 'みんなの日本語 初級II 第2版',
        bottomDesc: `Minna no Nihongo Sơ cấp 2 - ${typeText}`,
      };
    }
  }

  if (bookId === 'kanzen') {
    return {
      topText: `新完全マスター N${level}`,
      bottomDesc: `Luyện ${typeText.toLowerCase()} N${level} chuyên sâu`,
    };
  }

  if (bookId === 'soumatome') {
    return {
      topText: `日本語総まとめ N${level}`,
      bottomDesc: `Lộ trình Soumatome N${level} - ${typeText}`,
    };
  }

  if (bookId === 'mimikara') {
    return {
      topText: `耳から覚える N${level}`,
      bottomDesc: `Luyện ${typeText.toLowerCase()} Mimikara N${level}`,
    };
  }

  if (bookId === 'try') {
    return {
      topText: `TRY! 日本語能力試験 N${level}`,
      bottomDesc: `Học ${typeText.toLowerCase()} qua TRY! N${level}`,
    };
  }

  if (bookId === 'genki') {
    return {
      topText: `Genki ${level === 5 ? 'I' : 'II'}`,
      bottomDesc: `Giáo trình Genki - ${typeText} N${level}`,
    };
  }

  if (bookId === 'dekiru') {
    return {
      topText: `できる日本語 N${level}`,
      bottomDesc: `Giao tiếp sinh động Dekiru N${level}`,
    };
  }

  return {
    topText: `Tài liệu ôn luyện N${level}`,
    bottomDesc: `Tổng hợp ${typeText.toLowerCase()} N${level}`,
  };
};

const groupDecksByBookAndLevel = (decks, category) => {
  const booksMap = {};

  decks.forEach((deck) => {
    const book = getBookInfo(deck);
    const level = deck.jlptLevel || 5;

    if (!booksMap[book.id]) {
      booksMap[book.id] = {
        id: book.id,
        title: book.title,
        japaneseTitle: book.japaneseTitle,
        description: book.description,
        levels: {},
      };
    }

    if (!booksMap[book.id].levels[level]) {
      booksMap[book.id].levels[level] = [];
    }

    booksMap[book.id].levels[level].push(deck);
  });

  const BOOK_ORDER = ['minna', 'kanzen', 'soumatome', 'mimikara', 'try', 'genki', 'dekiru', 'other'];

  return Object.values(booksMap)
    .map((book) => {
      const sortedLevels = Object.keys(book.levels)
        .map(Number)
        .sort((a, b) => b - a);

      return {
        ...book,
        levelsList: sortedLevels.map((lvl) => ({
          level: lvl,
          decks: book.levels[lvl],
          count: book.levels[lvl].length,
        })),
      };
    })
    .sort((a, b) => BOOK_ORDER.indexOf(a.id) - BOOK_ORDER.indexOf(b.id));
};

function DeckCard({ deck, accentColor }) {
  return (
    <Link
      to={`/deck/${deck.id}`}
      className="group relative bg-surface-container-lowest p-6 flex flex-col gap-4 transition-all hover:sharp-shadow-sm overflow-hidden"
      style={{ border: '1px solid rgba(0,0,0,0.07)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: accentColor }} />

      <div className="flex items-start justify-between">
        <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
          style={{ background: `color-mix(in srgb, ${accentColor} 10%, transparent)`, color: accentColor }}>
          JLPT N{deck.jlptLevel || '?'}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-on-surface-variant">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          {deck._count?.cards || 0} thẻ
        </span>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-on-surface text-base mb-1.5 leading-snug">{cleanDeckName(deck.name)}</h3>
        {deck.description && (
          <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">{cleanDeckDescription(deck.description)}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity mt-auto"
        style={{ color: accentColor }}>
        Học ngay
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function EmptyState({ hasFilter, onClear, ghostChar, accentColor }) {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="font-black mb-4 select-none leading-none" style={{ fontFamily: 'serif', fontSize: 72, color: `color-mix(in srgb, ${accentColor} 10%, transparent)` }}>
        {ghostChar}
      </div>
      <p className="text-on-surface-variant font-medium mb-3">
        {hasFilter ? 'Không có deck ở cấp độ này' : 'Admin sẽ cập nhật nội dung sớm.'}
      </p>
      {hasFilter && (
        <button onClick={onClear}
          className="text-xs font-bold uppercase tracking-wider px-4 py-1.5 transition-colors"
          style={{ color: accentColor, border: `1px solid ${accentColor}` }}>
          Xem tất cả cấp độ
        </button>
      )}
    </div>
  );
}

const getLessonNumber = (name) => {
  const match = name.match(/Bài\s*(?:học\s*)?(\d+)/i);
  return match ? parseInt(match[1]) : 999;
};

export default function PublicContentPage({ title, subtitle, category, accentColor, ghostChar }) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;
  const navigate = useNavigate();
  const location = useLocation();
  const { bookId, level } = useParams();

  const basePath = useMemo(() => {
    return location.pathname.startsWith('/kanji') ? '/kanji' : '/vocabulary';
  }, [location.pathname]);

  const [decks, setDecks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const selectedBookLevel = useMemo(() => {
    if (!bookId || !level) return null;
    return { bookId, level: parseInt(level) };
  }, [bookId, level]);

  const fetchDecks = useCallback(() => {
    setLoading(true);
    axios.get('/flashcards/public')
      .then((res) => setDecks(res.data.filter((d) => d.category === category)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => { fetchDecks(); }, [fetchDecks]);

  const filtered = useMemo(() => {
    let result = decks;

    if (selectedBookLevel) {
      result = result.filter((d) => {
        const book = getBookInfo(d);
        const lvl = d.jlptLevel || 5;
        return book.id === selectedBookLevel.bookId && lvl === selectedBookLevel.level;
      });
    }

    return result.sort((a, b) => {
      const numA = getLessonNumber(a.name);
      const numB = getLessonNumber(b.name);
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });
  }, [decks, selectedBookLevel]);

  const groupedBooks = useMemo(() => {
    if (selectedBookLevel) return [];
    return groupDecksByBookAndLevel(decks, category);
  }, [decks, category, selectedBookLevel]);

  const totalCards = decks.reduce((sum, d) => sum + (d._count?.cards || 0), 0);

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8">

      {/* ── HERO & BREADCRUMBS MERGED ─────────────────────────────── */}
      <PageHeader
        tag={selectedBookLevel ? undefined : "JLPT N5 → N1"}
        title={selectedBookLevel ? `${getBookInfo({ name: selectedBookLevel.bookId }).title} N${selectedBookLevel.level}` : title}
        subtitle={selectedBookLevel ? getBookLevelCardMeta(selectedBookLevel.bookId, selectedBookLevel.level, category).bottomDesc : subtitle}
        ghostChar={ghostChar}
        accentColor={accentColor}
        backLink={selectedBookLevel ? basePath : undefined}
        backText={selectedBookLevel ? "Quay lại" : undefined}
        rightContent={
          selectedBookLevel ? (
            <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
              <div className="flex gap-2 text-white text-xs font-bold bg-white/10 px-3 py-1.5 border border-white/10 backdrop-blur-sm">
                <span>{filtered.length} bài học</span>
                <span className="text-white/30">|</span>
                <span>{filtered.reduce((sum, d) => sum + (d._count?.cards || 0), 0)} {category === 'TUVUNG' ? 'từ vựng' : category === 'HANTU' ? 'hán tự' : 'thẻ'}</span>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-on-secondary hover:bg-secondary-dim transition-colors"
                  style={{ background: 'var(--secondary)' }}
                >
                  Upload Anki
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-3 flex-shrink-0">
              <div className="text-center bg-white/10 px-5 py-3"
                style={{ backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-2xl font-black text-white leading-none">{decks.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Bộ thẻ</p>
              </div>
              <div className="text-center bg-white/10 px-5 py-3"
                style={{ backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-2xl font-black text-white leading-none">{totalCards}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Thẻ học</p>
              </div>
            </div>
          )
        }
      >
        {selectedBookLevel && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white/85 mb-4">
              <span className="cursor-pointer hover:text-white transition-colors" onClick={() => navigate(basePath)}>Tất cả giáo trình</span>
              <span className="text-white/40">/</span>
              <span>{getBookInfo({ name: selectedBookLevel.bookId }).title}</span>
              <span className="text-white/40">/</span>
              <span className="font-bold text-white">Cấp độ N{selectedBookLevel.level}</span>
            </div>
            <h1 className="font-headline text-2xl md:text-3xl font-bold text-white leading-tight">
              {getBookInfo({ name: selectedBookLevel.bookId }).title} N{selectedBookLevel.level}
            </h1>
            <p className="text-white/60 text-xs mt-1 font-medium">
              {getBookLevelCardMeta(selectedBookLevel.bookId, selectedBookLevel.level, category).bottomDesc}
            </p>
          </div>
        )}
      </PageHeader>

      {/* Admin Actions Bar (only home view) */}
      {!selectedBookLevel && isAdmin && (
        <div className="flex justify-end pb-2">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-on-secondary hover:bg-secondary-dim transition-colors"
            style={{ background: 'var(--secondary)' }}
          >
            Upload Anki
          </button>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="animate-spin font-black text-7xl" style={{ color: accentColor, animationDuration: '2s' }}>
            {ghostChar}
          </div>
          <p className="text-on-surface-variant font-medium mt-4">Đang tải...</p>
        </div>
      ) : !selectedBookLevel ? (
        /* Render Books & Levels cards */
        <div className="space-y-12 animate-fade-up">
          {groupedBooks.map((book) => (
            <div key={book.id} className="space-y-6">
              <div className="border-l-4 pl-3" style={{ borderColor: accentColor || 'var(--primary)' }}>
                <h2 className="text-xl md:text-2xl font-bold text-on-surface font-headline">{book.title}</h2>
                <p className="text-xs text-on-surface-variant font-medium mt-1">
                  {book.japaneseTitle} {book.description ? `• ${book.description}` : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {book.levelsList.map(({ level, decks: levelDecks, count }) => {
                  const meta = getBookLevelCardMeta(book.id, level, category);
                  return (
                    <button
                      key={level}
                      onClick={() => navigate(`${basePath}/${book.id}/${level}`)}
                      className="group relative flex flex-col justify-between bg-surface-container-lowest p-5 transition-all sharp-shadow hover:sharp-shadow-sm hover:-translate-y-0.5 text-left w-full border-2 border-outline-variant/50 overflow-hidden min-h-[180px]"
                    >
                      {/* Top accent line */}
                      <div className="absolute top-0 left-0 right-0 h-1 transition-all"
                        style={{ background: accentColor || 'var(--primary)' }} />

                      <div className="flex items-start justify-between w-full mb-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 bg-primary/5">
                          JLPT N{level}
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-bold">
                          {count} bài học
                        </span>
                      </div>

                      <div className="flex-1 mb-3">
                        <h3 className="font-bold text-on-surface text-base mb-1 group-hover:text-primary transition-colors">
                          Cấp độ N{level}
                        </h3>
                        <p className="text-[11px] text-on-surface-variant line-clamp-1 mb-0.5 font-semibold">
                          {meta.topText}
                        </p>
                        <p className="text-xs text-on-surface-variant/80 line-clamp-2 leading-relaxed">
                          {meta.bottomDesc}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-opacity mt-auto"
                        style={{ color: accentColor || 'var(--primary)' }}>
                        Xem bài học
                        <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          hasFilter={!!selectedBookLevel}
          onClear={() => navigate(basePath)}
          ghostChar={ghostChar}
          accentColor={accentColor}
        />
      ) : (
        /* Render Decks in a timeline flow */
        <div className="space-y-8 animate-fade-up">
          <div className="flex items-center justify-between text-sm text-on-surface-variant px-1">
            <p>
              Hiển thị <span className="font-bold text-on-surface">{filtered.length}</span> bài học
            </p>
          </div>

          <div className="relative border-l-2 border-primary/20 ml-6 pl-8 py-2 space-y-6">
            {filtered.map((deck, index) => {
              const lessonNum = getLessonNumber(deck.name);
              const displayNum = lessonNum !== 999 ? lessonNum : index + 1;
              
              let unitText = 'thẻ';
              if (category === 'TUVUNG') unitText = 'từ vựng';
              else if (category === 'HANTU') unitText = 'hán tự';

              return (
                <div key={deck.id} className="relative">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[46px] top-6 w-8 h-8 rounded-full bg-surface-container-lowest border-2 flex items-center justify-center text-xs font-black shadow-sm"
                    style={{ borderColor: accentColor || 'var(--primary)', color: accentColor || 'var(--primary)' }}>
                    {displayNum}
                  </div>

                  {/* Card Content */}
                  <Link
                    to={`/deck/${deck.id}`}
                    className="group bg-surface-container-lowest border-2 border-outline-variant/50 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all sharp-shadow hover:sharp-shadow-sm hover:-translate-y-0.5 w-full text-left"
                  >
                    <div className="space-y-1">
                      <h3 className="font-jp font-bold text-on-surface text-base group-hover:text-primary transition-colors">
                        {cleanDeckName(deck.name)}
                      </h3>
                      {deck.description && (
                        <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">
                          {cleanDeckDescription(deck.description)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-outline-variant/20">
                      <span className="text-xs font-bold px-2.5 py-1 bg-surface-container text-on-surface border border-outline-variant/40">
                        {deck._count?.cards || 0} {unitText}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                        style={{ color: accentColor || 'var(--primary)' }}>
                        Học ngay
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin: Import Anki Modal */}
      {isAdmin && showUpload && (
        <ImportAnkiModal
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); fetchDecks(); }}
          isAdmin={true}
          defaultCategory={category}
        />
      )}
    </div>
  );
}
