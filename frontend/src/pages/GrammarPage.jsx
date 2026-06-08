import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  HelpCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { flashcardApi } from '../api/flashcardApi';

const JLPT_LEVELS = [5, 4, 3, 2, 1];

/** Sắp xếp số bài của giáo trình */
const getLessonNumber = (name) => {
  const match = name.match(/Bài\s*(?:học\s*)?(\d+)/i);
  return match ? parseInt(match[1]) : 999;
};

const getBookInfo = (deck) => {
  const nameLower = deck.name.toLowerCase();
  const descLower = (deck.description || '').toLowerCase();
  
  if (nameLower.includes('minna') || nameLower.includes('nihongo') || descLower.includes('minna') || nameLower === 'minna') {
    return {
      id: 'minna',
      title: 'Minna no Nihongo',
      japaneseTitle: 'みんなの日本語 第二版',
      description: 'Giáo trình cốt lõi và phổ biến nhất cho người mới học tiếng Nhật.',
    };
  }

  if (nameLower.includes('soumatome & shinkanzen') || nameLower.includes('soumatome and shinkanzen') || nameLower.includes('soumatome-shinkanzen') || nameLower === 'soumatome-shinkanzen') {
    return {
      id: 'soumatome-shinkanzen',
      title: 'Soumatome & Shinkanzen',
      japaneseTitle: '総まとめ & 新完全マスター',
      description: 'Giáo trình tổng hợp và luyện thi JLPT từ trung cấp đến cao cấp.',
    };
  }
  
  if (nameLower.includes('kanzen') || nameLower.includes('shin kanzen') || nameLower.includes('shinkanzen') || descLower.includes('kanzen') || nameLower === 'kanzen') {
    return {
      id: 'kanzen',
      title: 'Shin Kanzen Master',
      japaneseTitle: '新完全マスター',
      description: 'Giáo trình chuyên sâu phục vụ luyện thi JLPT từ trung cấp đến cao cấp.',
    };
  }

  if (nameLower.includes('soumatome') || nameLower.includes('somatome') || descLower.includes('soumatome') || nameLower === 'soumatome') {
    return {
      id: 'soumatome',
      title: 'Nihongo Soumatome',
      japaneseTitle: '日本語総まとめ',
      description: 'Giáo trình tổng hợp kiến thức trọng tâm cho kỳ thi JLPT.',
    };
  }

  if (nameLower.includes('mimikara') || nameLower.includes('mimi kara') || descLower.includes('mimikara') || nameLower === 'mimikara') {
    return {
      id: 'mimikara',
      title: 'Mimikara Oboeru',
      japaneseTitle: '耳から覚える',
      description: 'Giáo trình luyện nghe và ghi nhớ từ vựng/ngữ pháp cực kỳ hiệu quả.',
    };
  }

  if (nameLower.includes('try') || descLower.includes('try!') || nameLower === 'try') {
    return {
      id: 'try',
      title: 'Try! Tăng cường ngữ pháp',
      japaneseTitle: 'TRY! 日本語能力試験',
      description: 'Giáo trình hệ thống hóa ngữ pháp theo cấp độ JLPT kèm bài tập thực hành.',
    };
  }

  if (nameLower.includes('genki') || descLower.includes('genki') || nameLower === 'genki') {
    return {
      id: 'genki',
      title: 'Genki',
      japaneseTitle: 'げんき',
      description: 'Giáo trình tiếng Nhật tích hợp phổ biến ở các nước phương Tây.',
    };
  }

  if (nameLower.includes('dekiru') || descLower.includes('dekiru') || nameLower === 'dekiru') {
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

const getBookLevelCardMeta = (bookId, level) => {
  const typeText = 'Ngữ pháp';

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

  if (bookId === 'soumatome-shinkanzen') {
    return {
      topText: `総まとめ & 新完全マスター N${level}`,
      bottomDesc: `Giáo trình Soumatome & Shinkanzen N${level} - ${typeText}`,
    };
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

const groupDecksByBookAndLevel = (decks) => {
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

  const BOOK_ORDER = ['minna', 'soumatome-shinkanzen', 'kanzen', 'soumatome', 'mimikara', 'try', 'genki', 'dekiru', 'other'];

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

const groupDecksIntoParts = (decksList, bookId, level) => {
  if (!decksList || decksList.length === 0) return [];
  
  const sortedDecks = [...decksList].sort((a, b) => {
    const numA = getLessonNumber(a.name);
    const numB = getLessonNumber(b.name);
    if (numA !== numB) return numA - numB;
    return a.name.localeCompare(b.name);
  });

  if (bookId === 'minna') {
    const parts = [];
    const startLesson = level === 4 ? 26 : 1;
    const endLesson = level === 4 ? 50 : 25;
    
    for (let i = startLesson; i <= endLesson; i += 5) {
      const partStart = i;
      const partEnd = Math.min(i + 4, endLesson);
      const partDecks = sortedDecks.filter((d) => {
        const num = getLessonNumber(d.name);
        return num >= partStart && num <= partEnd;
      });
      
      if (partDecks.length > 0) {
        parts.push({
          title: `Bài học ${partStart} - ${partEnd}`,
          decks: partDecks,
        });
      }
    }
    
    const matchedDecks = new Set(parts.flatMap(p => p.decks.map(d => d.id)));
    const otherDecks = sortedDecks.filter(d => !matchedDecks.has(d.id));
    if (otherDecks.length > 0) {
      parts.push({
        title: 'Tài liệu bổ trợ',
        decks: otherDecks,
      });
    }
    
    return parts;
  }

  if (bookId === 'soumatome-shinkanzen') {
    const parts = [];
    if (level === 3 || level === 2) {
      for (let week = 1; week <= 7; week++) {
        const partStart = (week - 1) * 7 + 1;
        const partEnd = Math.min(week * 7, 50);
        const partDecks = sortedDecks.filter((d) => {
          const num = getLessonNumber(d.name);
          return num >= partStart && num <= partEnd;
        });
        
        if (partDecks.length > 0) {
          parts.push({
            title: `Tuần ${week} (Bài học ${partStart} - ${partEnd})`,
            decks: partDecks,
          });
        }
      }
    } else if (level === 1) {
      for (let p = 1; p <= 8; p++) {
        const partStart = (p - 1) * 10 + 1;
        const partEnd = p * 10;
        const partDecks = sortedDecks.filter((d) => {
          const num = getLessonNumber(d.name);
          return num >= partStart && num <= partEnd;
        });
        
        if (partDecks.length > 0) {
          parts.push({
            title: `Chương ${p} (Bài học ${partStart} - ${partEnd})`,
            decks: partDecks,
          });
        }
      }
    } else {
      for (let i = 1; i <= sortedDecks.length; i += 10) {
        const partStart = i;
        const partEnd = Math.min(i + 9, sortedDecks.length);
        const partDecks = sortedDecks.slice(partStart - 1, partEnd);
        parts.push({
          title: `Phần ${Math.floor(i/10) + 1}`,
          decks: partDecks,
        });
      }
    }
    
    const matchedDecks = new Set(parts.flatMap(p => p.decks.map(d => d.id)));
    const otherDecks = sortedDecks.filter(d => !matchedDecks.has(d.id));
    if (otherDecks.length > 0) {
      parts.push({
        title: 'Tài liệu bổ trợ',
        decks: otherDecks,
      });
    }
    
    return parts;
  }

  if (bookId === 'kanzen') {
    const parts = [];
    const totalLessons = 26;
    for (let i = 1; i <= totalLessons; i += 5) {
      const partStart = i;
      const partEnd = Math.min(i + 4, totalLessons);
      const partDecks = sortedDecks.filter((d) => {
        const num = getLessonNumber(d.name);
        return num >= partStart && num <= partEnd;
      });
      
      if (partDecks.length > 0) {
        parts.push({
          title: `Chương ${Math.floor((i - 1) / 5) + 1} (Bài ${partStart} - ${partEnd})`,
          decks: partDecks,
        });
      }
    }
    
    const matchedDecks = new Set(parts.flatMap(p => p.decks.map(d => d.id)));
    const otherDecks = sortedDecks.filter(d => !matchedDecks.has(d.id));
    if (otherDecks.length > 0) {
      parts.push({
        title: 'Tài liệu bổ trợ',
        decks: otherDecks,
      });
    }
    
    return parts;
  }

  return [{
    title: 'Danh sách bài học',
    decks: sortedDecks,
  }];
};

export default function GrammarPage() {
  const navigate = useNavigate();

  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(5);
  const [selectedBookLevel, setSelectedBookLevel] = useState(null); // { bookId, level }
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    flashcardApi.getPublicDecks()
      .then((data) => {
        const grammarDecks = data.filter((d) => d.category === 'NGUPHAP');
        setDecks(grammarDecks);
      })
      .catch((err) => console.error('Lỗi khi tải danh sách bộ thẻ ngữ pháp:', err))
      .finally(() => setLoading(false));
  }, []);

  const isSearchingGlobally = !!searchQuery.trim() && !selectedBookLevel;

  const filteredDecks = useMemo(() => {
    let result = decks;

    if (selectedBookLevel) {
      result = result.filter((d) => {
        const book = getBookInfo(d);
        const lvl = d.jlptLevel || 5;
        return book.id === selectedBookLevel.bookId && lvl === selectedBookLevel.level;
      });
    } else {
      if (selectedLevel !== null) result = result.filter((d) => d.jlptLevel === selectedLevel);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((d) =>
        d.name.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => {
      const numA = getLessonNumber(a.name);
      const numB = getLessonNumber(b.name);
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });
  }, [decks, selectedBookLevel, selectedLevel, searchQuery]);

  const groupedBooks = useMemo(() => {
    if (isSearchingGlobally || selectedBookLevel) return [];
    const filtered = selectedLevel !== null
      ? decks.filter((d) => d.jlptLevel === selectedLevel)
      : decks;
    return groupDecksByBookAndLevel(filtered);
  }, [decks, isSearchingGlobally, selectedBookLevel, selectedLevel]);

  const totalGrammarPoints = decks.reduce((sum, d) => sum + (d._count?.cards || 0), 0);

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8 min-h-screen">

      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden animate-fade-up border-2 border-primary" style={{ minHeight: 140 }}>
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 asanoha-bg opacity-15" />
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-secondary" />

        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 mb-3"
              style={{ backdropFilter: 'blur(4px)' }}>
              <span className="w-1.5 h-1.5 rotate-45 bg-secondary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                Học & Tra Cứu Chuyên Sâu
              </span>
            </div>
            <h1 className="font-jp text-3xl md:text-4xl font-bold text-white tracking-wide">
              文法 • TRANG HỌC NGỮ PHÁP
            </h1>
            <p className="text-white/60 text-sm mt-2 max-w-xl font-medium">
              Click vào bài học để xem lý thuyết đầy đủ, ví dụ thực tế và luyện tập ngay.
            </p>
          </div>

          <div className="flex gap-3 flex-shrink-0">
            <div className="text-center bg-white/5 px-5 py-3 border border-white/10 sharp-shadow-sm">
              <p className="text-2xl font-black text-white leading-none">{decks.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Bài học</p>
            </div>
            <div className="text-center bg-white/5 px-5 py-3 border border-white/10 sharp-shadow-sm">
              <p className="text-2xl font-black text-white leading-none">{totalGrammarPoints}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Cấu trúc</p>
            </div>
          </div>
        </div>

        <div className="absolute -right-6 -bottom-6 font-jp font-bold text-white/[0.03] leading-none select-none pointer-events-none text-[180px]">
          文
        </div>
      </section>

      {/* ── SEARCH & LEVEL FILTERS ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pb-4 border-b border-outline-variant/40">

        {/* JLPT Level tabs — only show when not inside a selected book-level */}
        {!selectedBookLevel ? (
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <button
              onClick={() => setSelectedLevel(null)}
              className="whitespace-nowrap px-4 py-2 text-xs font-bold transition-all uppercase tracking-wider border border-outline-variant/60 sharp-shadow-sm shrink-0"
              style={selectedLevel === null
                ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                : { background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)' }
              }
            >
              Tất cả cấp độ
            </button>
            {JLPT_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className="whitespace-nowrap px-4 py-2 text-xs font-bold transition-all uppercase tracking-wider border border-outline-variant/60 sharp-shadow-sm shrink-0"
                style={selectedLevel === level
                  ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                  : { background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)' }
                }
              >
                JLPT N{level}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Bộ lọc & Sắp xếp bài học
          </div>
        )}

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            placeholder={selectedBookLevel ? "Tìm kiếm trong bài học..." : "Tìm kiếm bài học ngữ pháp..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant focus:outline-none border-2 border-outline-variant/40"
          />
        </div>
      </div>

      {/* ── Breadcrumb & Back button Header ────────────────────── */}
      {selectedBookLevel && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedBookLevel(null)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-primary border-2 border-primary/20 hover:bg-primary/5 transition-all rounded"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant/80">
              <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => setSelectedBookLevel(null)}>Tất cả giáo trình</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span>{getBookInfo({ name: selectedBookLevel.bookId }).title}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span className="font-bold text-on-surface">Cấp độ N{selectedBookLevel.level}</span>
            </div>
          </div>
        </div>
      )}

      {isSearchingGlobally && (
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSearchQuery(''); setSelectedLevel(null); }}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-primary border-2 border-primary/20 hover:bg-primary/5 transition-all rounded"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách sách
            </button>
            <span className="text-xs font-bold text-on-surface-variant">
              Kết quả tìm kiếm toàn hệ thống
            </span>
          </div>
        </div>
      )}

      {/* ── CONTENT AREA ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-on-surface-variant font-medium">Đang nạp dữ liệu ngữ pháp...</p>
        </div>
      ) : !selectedBookLevel && !isSearchingGlobally ? (
        /* Render Books & Levels cards */
        <div className="space-y-12">
          {groupedBooks.map((book) => (
            <div key={book.id} className="space-y-6">
              <div className="border-l-4 pl-3" style={{ borderColor: 'var(--primary)' }}>
                <h2 className="text-xl md:text-2xl font-bold text-on-surface font-headline">{book.title}</h2>
                <p className="text-xs text-on-surface-variant font-medium mt-1">
                  {book.japaneseTitle} {book.description ? `• ${book.description}` : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {book.levelsList.map(({ level, decks: levelDecks, count }) => {
                  const meta = getBookLevelCardMeta(book.id, level);
                  return (
                    <button
                      key={level}
                      onClick={() => setSelectedBookLevel({ bookId: book.id, level })}
                      className="group relative flex flex-col justify-between bg-surface-container-lowest p-5 transition-all sharp-shadow hover:sharp-shadow-sm hover:-translate-y-0.5 text-left w-full border-2 border-outline-variant/50 overflow-hidden min-h-[180px]"
                    >
                      {/* Top accent line */}
                      <div className="absolute top-0 left-0 right-0 h-1 transition-all bg-primary" />

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

                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary transition-opacity mt-auto">
                        Xem bài học
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-surface-container-lowest border border-outline-variant/30 p-8 sharp-shadow">
          <HelpCircle className="w-16 h-16 text-on-surface-variant/40 mb-4" />
          <h3 className="font-bold text-on-surface text-lg">Không tìm thấy bài học phù hợp</h3>
          <p className="text-on-surface-variant text-sm mt-1 max-w-md">
            Hãy thử đổi cấp độ JLPT hoặc từ khóa tìm kiếm khác.
          </p>
          <button
            onClick={() => { setSelectedLevel(5); setSearchQuery(''); setSelectedBookLevel(null); }}
            className="mt-4 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary border-2 border-primary hover:bg-primary hover:text-white transition-all sharp-shadow-sm"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between text-sm text-on-surface-variant px-1">
            <p>
              Hiển thị <span className="font-bold text-on-surface">{filteredDecks.length}</span> bài học ngữ pháp
            </p>
          </div>

          {selectedBookLevel ? (
            <div className="space-y-12">
              {groupDecksIntoParts(filteredDecks, selectedBookLevel.bookId, selectedBookLevel.level).map((part, pIdx) => (
                <div key={pIdx} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2">
                    <span className="w-1.5 h-6 bg-primary" />
                    <h3 className="font-bold text-on-surface text-lg">{part.title}</h3>
                    <span className="text-xs text-on-surface-variant bg-surface-container-low px-2 py-0.5 font-bold border border-outline-variant/20">
                      {part.decks.length} bài học
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {part.decks.map((deck) => (
                      <button
                        key={deck.id}
                        onClick={() => navigate(`/grammar/${deck.id}`)}
                        className="group bg-surface-container-lowest border-2 border-outline-variant/50 overflow-hidden transition-all sharp-shadow hover:sharp-shadow-sm hover:-translate-y-0.5 text-left w-full"
                      >
                        <div
                          className="h-1 w-full transition-all"
                          style={{ background: 'var(--primary)', opacity: 0 }}
                          ref={(el) => {
                            if (el) {
                              const btn = el.closest('button');
                              if (btn) {
                                btn.addEventListener('mouseenter', () => { el.style.opacity = '1'; });
                                btn.addEventListener('mouseleave', () => { el.style.opacity = '0'; });
                              }
                            }
                          }}
                        />
                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary/5 text-primary flex-shrink-0 flex flex-col items-center justify-center border border-primary/20">
                              <span className="text-[10px] font-bold text-primary/75 leading-none">JLPT</span>
                              <span className="text-lg font-bold leading-none mt-0.5">N{deck.jlptLevel || '?'}</span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="font-jp font-bold text-on-surface text-base leading-snug group-hover:text-primary transition-colors">
                                {deck.name}
                              </h3>
                              {deck.description && (
                                <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                                  {deck.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/20">
                            <span className="text-xs font-semibold px-2 py-1 bg-surface-container text-on-surface border border-outline-variant/40">
                              {deck._count?.cards || 0} cấu trúc
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                              Xem lý thuyết <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDecks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => navigate(`/grammar/${deck.id}`)}
                  className="group bg-surface-container-lowest border-2 border-outline-variant/50 overflow-hidden transition-all sharp-shadow hover:sharp-shadow-sm hover:-translate-y-0.5 text-left w-full"
                >
                  <div
                    className="h-1 w-full transition-all"
                    style={{ background: 'var(--primary)', opacity: 0 }}
                    ref={(el) => {
                      if (el) {
                        const btn = el.closest('button');
                        if (btn) {
                          btn.addEventListener('mouseenter', () => { el.style.opacity = '1'; });
                          btn.addEventListener('mouseleave', () => { el.style.opacity = '0'; });
                        }
                      }
                    }}
                  />
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/5 text-primary flex-shrink-0 flex flex-col items-center justify-center border border-primary/20">
                        <span className="text-[10px] font-bold text-primary/75 leading-none">JLPT</span>
                        <span className="text-lg font-bold leading-none mt-0.5">N{deck.jlptLevel || '?'}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-jp font-bold text-on-surface text-base leading-snug group-hover:text-primary transition-colors">
                          {deck.name}
                        </h3>
                        {deck.description && (
                          <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                            {deck.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/20">
                      <span className="text-xs font-semibold px-2 py-1 bg-surface-container text-on-surface border border-outline-variant/40">
                        {deck._count?.cards || 0} điểm ngữ pháp
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Xem lý thuyết <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}