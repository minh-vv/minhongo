import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const { bookId, level } = useParams();

  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  const selectedBookLevel = useMemo(() => {
    if (!bookId || !level) return null;
    return { bookId, level: parseInt(level) };
  }, [bookId, level]);

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

  const filteredDecks = useMemo(() => {
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
    return groupDecksByBookAndLevel(decks);
  }, [decks, selectedBookLevel]);

  const totalGrammarPoints = decks.reduce((sum, d) => sum + (d._count?.cards || 0), 0);

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8 min-h-screen">

      {/* ── HERO & BREADCRUMBS MERGED ─────────────────────────────── */}
      <section className="relative overflow-hidden animate-fade-up border-2 border-primary" style={{ minHeight: selectedBookLevel ? undefined : 140 }}>
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 asanoha-bg opacity-15" />
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-secondary" />

        {selectedBookLevel ? (
          /* Merged layout when a book level is selected */
          <div className="relative z-10 p-6 md:p-8 flex flex-col gap-6">
            {/* Top row: Back button & Breadcrumbs */}
            <div className="flex flex-wrap items-center gap-3 text-white/80">
              <button
                onClick={() => navigate('/grammar')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white border border-white/20 hover:bg-white/10 transition-all rounded backdrop-blur-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại
              </button>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/85">
                <span className="cursor-pointer hover:text-white transition-colors" onClick={() => navigate('/grammar')}>Tất cả giáo trình</span>
                <span className="text-white/40">/</span>
                <span>{getBookInfo({ name: selectedBookLevel.bookId }).title}</span>
                <span className="text-white/40">/</span>
                <span className="font-bold text-white">Cấp độ N{selectedBookLevel.level}</span>
              </div>
            </div>

            {/* Bottom row: Title & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-headline text-2xl md:text-3xl font-bold text-white leading-tight">
                  {getBookInfo({ name: selectedBookLevel.bookId }).title} N{selectedBookLevel.level}
                </h1>
                <p className="text-white/60 text-xs mt-1 font-medium">
                  {getBookLevelCardMeta(selectedBookLevel.bookId, selectedBookLevel.level).bottomDesc}
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-2 text-white text-xs font-bold bg-white/10 px-3 py-1.5 border border-white/10 backdrop-blur-sm shrink-0 self-start md:self-auto">
                <span>{filteredDecks.length} bài học</span>
                <span className="text-white/30">|</span>
                <span>{filteredDecks.reduce((sum, d) => sum + (d._count?.cards || 0), 0)} cấu trúc</span>
              </div>
            </div>
          </div>
        ) : (
          /* Default full hero layout */
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
        )}

        <div className="absolute -right-6 -bottom-6 font-jp font-bold text-white/[0.03] leading-none select-none pointer-events-none text-[180px]">
          文
        </div>
      </section>

      {/* ── CONTENT AREA ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-on-surface-variant font-medium">Đang nạp dữ liệu ngữ pháp...</p>
        </div>
      ) : !selectedBookLevel ? (
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
                      onClick={() => navigate(`/grammar/${book.id}/${level}`)}
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
            Hãy thử đặt lại bộ lọc để hiển thị toàn bộ bài học.
          </p>
          <button
            onClick={() => { navigate('/grammar'); }}
            className="mt-4 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary border-2 border-primary hover:bg-primary hover:text-white transition-all sharp-shadow-sm"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        /* Render Decks in a timeline flow */
        <div className="space-y-8 animate-fade-up">
          <div className="flex items-center justify-between text-sm text-on-surface-variant px-1">
            <p>
              Hiển thị <span className="font-bold text-on-surface">{filteredDecks.length}</span> bài học ngữ pháp
            </p>
          </div>

          <div className="relative border-l-2 border-primary/20 ml-6 pl-8 py-2 space-y-6">
            {filteredDecks.map((deck, index) => {
              const lessonNum = getLessonNumber(deck.name);
              const displayNum = lessonNum !== 999 ? lessonNum : index + 1;
              return (
                <div key={deck.id} className="relative">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[46px] top-6 w-8 h-8 rounded-full bg-surface-container-lowest border-2 border-primary flex items-center justify-center text-xs font-black text-primary shadow-sm">
                    {displayNum}
                  </div>

                  {/* Lesson card content */}
                  <button
                    onClick={() => navigate(`/grammar/${deck.id}`)}
                    className="group bg-surface-container-lowest border-2 border-outline-variant/50 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all sharp-shadow hover:sharp-shadow-sm hover:-translate-y-0.5 w-full text-left"
                  >
                    <div className="space-y-1">
                      <h3 className="font-jp font-bold text-on-surface text-base group-hover:text-primary transition-colors flex items-center gap-2">
                        {deck.name}
                      </h3>
                      {deck.description && (
                        <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">
                          {deck.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-outline-variant/20">
                      <span className="text-xs font-bold px-2.5 py-1 bg-surface-container text-on-surface border border-outline-variant/40">
                        {deck._count?.cards || 0} cấu trúc
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                        Xem lý thuyết <ChevronRight className="w-4.5 h-4.5" />
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}