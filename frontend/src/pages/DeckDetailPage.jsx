import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashcardApi } from '../api/flashcardApi';
import { coursesApi } from '../api/coursesApi';
import { useAuth } from '../hooks/useAuth';
import KanjiInteractiveWorkspace from '../components/KanjiInteractiveWorkspace';
import CollapsibleExample from '../components/CollapsibleExample';
import BulkCardModal from '../components/BulkCardModal';
import { BookOpen, Layers, RefreshCw, HelpCircle, PenTool, CheckSquare, Lock, Copy } from 'lucide-react';

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

const JLPT_LEVELS = [5, 4, 3, 2, 1];

function CardModal({ isOpen, onClose, onSave, card, deckCategory }) {
  const [formData, setFormData] = useState({
    front: card?.front || '',
    back: card?.back || '',
    romaji: card?.romaji || '',
    example: card?.example || '',
    jlptLevel: card?.jlptLevel || 5,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  const isKanji = deckCategory === 'HANTU';
  const labels = {
    title: card ? (isKanji ? 'Sửa chữ Hán' : 'Sửa thẻ ghi nhớ') : (isKanji ? 'Thêm chữ Hán mới' : 'Thêm thẻ mới'),
    front: isKanji ? 'Chữ Hán (mặt trước) *' : 'Tiếng Nhật (mặt trước) *',
    frontPlaceholder: isKanji ? 'Ví dụ: 日' : 'Ví dụ: こんにちは',
    back: isKanji ? 'Âm Hán Việt / Nghĩa (mặt sau) *' : 'Nghĩa tiếng Việt (mặt sau) *',
    backPlaceholder: isKanji ? 'Ví dụ: Nhật, ngày, mặt trời' : 'Ví dụ: Xin chào',
    romaji: isKanji ? 'Cách đọc Onyomi/Kunyomi' : 'Romaji / Hiragana (cách đọc)',
    romajiPlaceholder: isKanji ? 'Ví dụ: ニチ, ジツ / ひ, -び' : 'Ví dụ: Konnichiwa / こんにちは',
    example: isKanji ? 'Từ ghép / Ví dụ' : 'Ví dụ câu',
    examplePlaceholder: isKanji ? 'Ví dụ: 日本 (にほん): Nhật Bản' : 'Ví dụ: こんにちは！元気ですか？',
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-up">
      <div className="bg-surface-container-lowest border border-outline-variant/40 sharp-shadow p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="font-headline text-lg font-bold text-on-surface mb-4 border-b border-outline-variant/20 pb-2">
          {labels.title}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              {labels.front}
            </label>
            <input
              type="text"
              required
              value={formData.front}
              onChange={(e) => setFormData({ ...formData, front: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface text-on-surface border border-outline-variant/60 focus:outline-none focus:border-secondary transition-colors"
              placeholder={labels.frontPlaceholder}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              {labels.back}
            </label>
            <input
              type="text"
              required
              value={formData.back}
              onChange={(e) => setFormData({ ...formData, back: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface text-on-surface border border-outline-variant/60 focus:outline-none focus:border-secondary transition-colors"
              placeholder={labels.backPlaceholder}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              {labels.romaji}
            </label>
            <input
              type="text"
              value={formData.romaji}
              onChange={(e) => setFormData({ ...formData, romaji: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface text-on-surface border border-outline-variant/60 focus:outline-none focus:border-secondary transition-colors"
              placeholder={labels.romajiPlaceholder}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              {labels.example}
            </label>
            <textarea
              value={formData.example}
              onChange={(e) => setFormData({ ...formData, example: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface text-on-surface border border-outline-variant/60 focus:outline-none focus:border-secondary transition-colors"
              rows={2}
              placeholder={labels.examplePlaceholder}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Cấp độ JLPT
            </label>
            <select
              value={formData.jlptLevel}
              onChange={(e) => setFormData({ ...formData, jlptLevel: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-sm bg-surface text-on-surface border border-outline-variant/60 focus:outline-none focus:border-secondary transition-colors cursor-pointer"
            >
              <option value="">Chọn cấp độ</option>
              {JLPT_LEVELS.map((level) => (
                <option key={level} value={level}>
                  JLPT N{level}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4 border-t border-outline-variant/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-outline-variant text-on-surface-variant hover:bg-surface-container text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-on-secondary hover:bg-secondary-dim text-xs font-bold uppercase tracking-wider transition-colors"
              style={{ background: 'var(--secondary)' }}
            >
              {card ? 'Lưu thẻ' : 'Thêm thẻ'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function DeckEditModal({ isOpen, onClose, onSave, deck }) {
  const [formData, setFormData] = useState({
    name: deck?.name || '',
    description: deck?.description || '',
    isPublic: deck?.isPublic || false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-up">
      <div className="bg-surface-container-lowest border border-outline-variant/40 sharp-shadow p-6 w-full max-w-md">
        <h3 className="font-headline text-lg font-bold text-on-surface mb-4 border-b border-outline-variant/20 pb-2">Chỉnh sửa bộ thẻ</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Tên bộ thẻ *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface text-on-surface border border-outline-variant/60 focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface text-on-surface border border-outline-variant/60 focus:outline-none focus:border-secondary transition-colors"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-4 h-4 border-outline-variant focus:ring-secondary text-secondary accent-secondary"
            />
            <label htmlFor="isPublic" className="text-xs font-semibold text-on-surface-variant cursor-pointer">
              Công khai (người khác có thể học)
            </label>
          </div>
          <div className="flex gap-3 pt-4 border-t border-outline-variant/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-outline-variant text-on-surface-variant hover:bg-surface-container text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-on-secondary hover:bg-secondary-dim text-xs font-bold uppercase tracking-wider transition-colors"
              style={{ background: 'var(--secondary)' }}
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function DeckDetailPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [showAddCard, setShowAddCard] = useState(false);
  const [showBulkAddCard, setShowBulkAddCard] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [showEditDeck, setShowEditDeck] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeKanjiCard, setActiveKanjiCard] = useState(null);
  const [forking, setForking] = useState(false);

  const handleForkDeck = async () => {
    setForking(true);
    try {
      const res = await flashcardApi.cloneDeck(deckId);
      alert(res.message || 'Đã sao chép bộ thẻ thành công!');
      navigate(`/deck/${res.deckId}`);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Có lỗi xảy ra khi sao chép bộ thẻ.');
    } finally {
      setForking(false);
    }
  };

  // Lấy thông tin deck
  const { data: deck, isLoading } = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => flashcardApi.getDeck(deckId),
  });

  const associatedCourse = useMemo(() => {
    return deck?.lessonDecks?.[0]?.lesson?.course;
  }, [deck]);

  const associatedLesson = useMemo(() => {
    return deck?.lessonDecks?.[0]?.lesson;
  }, [deck]);

  // Lấy thông tin lộ trình khóa học nếu có khóa học liên kết
  const { data: courseData } = useQuery({
    queryKey: ['course', associatedCourse?.slug],
    queryFn: () => coursesApi.getCourse(associatedCourse.slug),
    enabled: !!associatedCourse?.slug,
  });

  // Lấy danh sách public decks để xác định bài tiếp theo trong cùng giáo trình
  const { data: publicDecks } = useQuery({
    queryKey: ['publicDecks', deck?.category],
    queryFn: () => flashcardApi.getPublicDecks(),
    enabled: !!deck?.category,
  });

  const nextDeck = useMemo(() => {
    if (!deck || !publicDecks) return null;
    const book = getBookInfo(deck);
    const level = deck.jlptLevel || 5;

    // Lọc các deck cùng giáo trình, cùng cấp độ và cùng category
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
  }, [deck, publicDecks]);

  // Lấy stats
  const { data: stats } = useQuery({
    queryKey: ['deckStats', deckId],
    queryFn: () => flashcardApi.getDeckStats(deckId),
  });

  const hasExamples = useMemo(() => {
    return deck?.cards?.some((c) => {
      if (!c.example) return false;
      const jpLine = c.example.split('\n')[0] || '';
      return jpLine.includes(c.front);
    }) ?? false;
  }, [deck]);

  // Tạo thẻ mới
  const createCardMutation = useMutation({
    mutationFn: (data) => flashcardApi.createCard(deckId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
      queryClient.invalidateQueries({ queryKey: ['deckStats', deckId] });
      setShowAddCard(false);
    },
  });

  // Cập nhật thẻ
  const updateCardMutation = useMutation({
    mutationFn: ({ cardId, data }) => flashcardApi.updateCard(cardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
      setEditingCard(null);
    },
  });

  // Xóa thẻ
  const deleteCardMutation = useMutation({
    mutationFn: (cardId) => flashcardApi.deleteCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
      queryClient.invalidateQueries({ queryKey: ['deckStats', deckId] });
    },
  });

  // Cập nhật deck
  const updateDeckMutation = useMutation({
    mutationFn: (data) => flashcardApi.updateDeck(deckId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
      queryClient.invalidateQueries({ queryKey: ['myDecks'] });
      setShowEditDeck(false);
    },
  });

  // Xóa deck
  const deleteDeckMutation = useMutation({
    mutationFn: () => flashcardApi.deleteDeck(deckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDecks'] });
      navigate('/dashboard');
    },
  });

  // Lọc cards theo search
  const filteredCards = useMemo(() => {
    const cards = deck?.cards || [];
    const search = searchTerm.toLowerCase();
    return cards.filter((card) => {
      return (
        card.front.toLowerCase().includes(search) ||
        card.back.toLowerCase().includes(search) ||
        card.romaji?.toLowerCase().includes(search)
      );
    });
  }, [deck, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-fade-up">
        <div className="animate-spin w-8 h-8 border-2 border-outline-variant border-t-secondary rounded-full" />
        <p className="text-on-surface-variant text-sm font-semibold mt-4">Đang tải bộ thẻ...</p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="max-w-md mx-auto p-8 text-center py-16 animate-fade-up">
        <p className="font-headline text-lg font-bold text-secondary mb-4">Không tìm thấy bộ thẻ!</p>
        <Link to="/dashboard" className="px-4 py-2 border border-outline-variant bg-surface hover:bg-surface-container text-on-surface text-xs font-bold uppercase tracking-wider transition-all">
          Quay lại Dashboard
        </Link>
      </div>
    );
  }

  // Quyền chỉnh sửa
  const isOwner = deck?.userId === user?.id;
  const isAdmin = user?.isAdmin ?? false;
  const isCuratedDeck = ['HANTU', 'TUVUNG', 'NGUPHAP'].includes(deck?.category);
  const getParentPath = () => {
    if (!deck) return '/dashboard';
    
    // Check if it belongs to a curated textbook
    const book = getBookInfo(deck);
    const level = deck.jlptLevel || 5;
    let basePath = '/vocabulary';
    if (deck.category === 'HANTU') basePath = '/kanji';
    else if (deck.category === 'NGUPHAP') basePath = '/grammar';

    if (book.id !== 'other') {
      return `${basePath}/${book.id}/${level}`;
    }

    // Fallback if associated with a course
    if (associatedCourse) {
      return `/courses/${associatedCourse.slug}`;
    }

    // Curated non-textbook category
    const isCuratedDeck = ['HANTU', 'TUVUNG', 'NGUPHAP'].includes(deck.category);
    if (isCuratedDeck) {
      return basePath;
    }

    // Personal deck
    return '/self-study';
  };
  const parentPath = getParentPath();
  const canModify = isCuratedDeck ? isAdmin : isOwner;

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8 animate-fade-up">
      {/* Header / Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: 130 }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 60%, #0d1b5e 100%)'
        }} />
        <div className="absolute inset-0 asanoha-bg opacity-20" />
        <div className="absolute right-0 top-0 bottom-0 w-1" style={{ background: 'var(--secondary)' }} />

        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
          <div className="min-w-0">
            <Link
              to={parentPath}
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white mb-3 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại
            </Link>
            <h1 className="font-headline text-2xl md:text-3xl font-bold tracking-tight">{deck.name}</h1>
            {deck.description && (
              <p className="text-white/60 text-xs mt-1.5 max-w-lg leading-relaxed">{deck.description}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            {nextDeck && (
              <Link
                to={`/deck/${nextDeck.id}`}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-secondary hover:bg-secondary-dim transition-colors rounded flex items-center gap-1.5 shadow-sm"
                style={{ background: 'var(--secondary)' }}
              >
                Bài {getLessonNumber(nextDeck.name) !== 999 ? getLessonNumber(nextDeck.name) : nextDeck.name} →
              </Link>
            )}

            {!isOwner && deck.isPublic && deck.category === 'TUHOC' && !deck.user?.isAdmin && (
              <button
                onClick={handleForkDeck}
                disabled={forking}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-secondary hover:bg-secondary-dim disabled:opacity-60 transition-colors flex items-center gap-1.5 shadow-sm rounded"
                style={{ background: 'var(--secondary)' }}
              >
                <Copy className="w-3.5 h-3.5" />
                {forking ? 'Đang lưu...' : 'Lưu về thư viện'}
              </button>
            )}

            {canModify && (
              <>
                <button
                  onClick={() => setShowEditDeck(true)}
                  className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => {
                    if (confirm('Bạn có chắc muốn xóa bộ thẻ này?')) {
                      deleteDeckMutation.mutate();
                    }
                  }}
                  className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-on-secondary hover:bg-secondary-dim transition-colors"
                  style={{ background: 'var(--secondary)' }}
                >
                  Xóa bộ thẻ
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && deck?.category !== 'HANTU' && (
        (() => {
          const total = stats.totalCards || 1;
          const newPct = (stats.newCards / total) * 100;
          const learningPct = (stats.learning / total) * 100;
          const reviewPct = (stats.review / total) * 100;
          const masteredPct = (stats.mastered / total) * 100;
          return (
            <div className="bg-surface-container-lowest p-4 border border-outline-variant/30 rounded-lg space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <span>Tiến trình học tập</span>
                <span className="text-on-surface">{stats.totalCards} từ vựng</span>
              </div>
              
              {/* Segmented Progress Bar */}
              <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden border border-outline-variant/20">
                {stats.newCards > 0 && <div className="bg-blue-500 h-full transition-all" style={{ width: `${newPct}%` }} title={`Mới: ${stats.newCards}`} />}
                {stats.learning > 0 && <div className="bg-amber-500 h-full transition-all" style={{ width: `${learningPct}%` }} title={`Đang học: ${stats.learning}`} />}
                {stats.review > 0 && <div className="bg-emerald-600 h-full transition-all" style={{ width: `${reviewPct}%` }} title={`Ôn tập: ${stats.review}`} />}
                {stats.mastered > 0 && <div className="bg-purple-600 h-full transition-all" style={{ width: `${masteredPct}%` }} title={`Thành thạo: ${stats.mastered}`} />}
              </div>

              {/* Legend Row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                  <span>Mới: <strong className="text-on-surface">{stats.newCards}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                  <span>Đang học: <strong className="text-on-surface">{stats.learning}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></span>
                  <span>Ôn tập: <strong className="text-on-surface">{stats.review}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-purple-600 rounded-full"></span>
                  <span>Thành thạo: <strong className="text-on-surface">{stats.mastered}</strong></span>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* Learning Modes Toolbar & Actions (Search, Add Card) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        {deck?.category !== 'HANTU' ? (
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Thẻ ghi nhớ */}
            <Link
              to={`/study/${deckId}?mode=normal`}
              className="px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100/70 hover:border-emerald-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-md shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Thẻ ghi nhớ</span>
            </Link>

            {/* 2. Học SRS */}
            <Link
              to={`/study/${deckId}?mode=srs`}
              className="px-3.5 py-2 bg-indigo-50 text-indigo-800 border border-indigo-200/60 hover:bg-indigo-100/70 hover:border-indigo-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-md relative shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Học SRS</span>
              {stats?.dueToday > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-secondary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-surface-container-lowest">
                  {stats.dueToday}
                </span>
              )}
            </Link>

            {/* 3. Trắc nghiệm */}
            <Link
              to={`/practice/${deckId}?type=multiple-choice`}
              className="px-3.5 py-2 bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100/70 hover:border-amber-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-md shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Trắc nghiệm</span>
            </Link>

            {/* 4. Tự luận */}
            <Link
              to={`/practice/${deckId}?type=type-japanese`}
              className="px-3.5 py-2 bg-blue-50 text-blue-800 border border-blue-200/60 hover:bg-blue-100/70 hover:border-blue-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-md shadow-sm"
            >
              <PenTool className="w-3.5 h-3.5 text-blue-600" />
              <span>Tự luận</span>
            </Link>

            {/* 5. Hoàn thành câu */}
            {hasExamples ? (
              <Link
                to={`/practice/${deckId}?type=fill-sentence`}
                className="px-3.5 py-2 bg-rose-50 text-rose-800 border border-rose-200/60 hover:bg-rose-100/70 hover:border-rose-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-md shadow-sm"
              >
                <CheckSquare className="w-3.5 h-3.5 text-rose-600" />
                <span>Hoàn thành câu</span>
              </Link>
            ) : (
              <button
                disabled
                title="Cần câu ví dụ trong bộ thẻ để mở chế độ này"
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-400 opacity-60 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-md cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Hoàn thành câu</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 flex-shrink-0" style={{ background: 'var(--primary)' }} />
            <h2 className="text-sm font-headline font-bold text-on-surface-variant uppercase tracking-wider">
              Danh sách chữ Hán
            </h2>
            <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant text-[10px] font-black rounded-full">
              {deck?.cards?.length || 0}
            </span>
          </div>
        )}

        {/* Right side controls: compact search + action buttons */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end shrink-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant pointer-events-none"
              fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.34-4.34"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-2.5 py-1.5 text-xs bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant focus:outline-none w-32 focus:w-48 transition-all duration-300 border border-outline-variant/50 focus:border-secondary rounded-md shadow-sm"
            />
          </div>

          {canModify && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowBulkAddCard(true)}
                className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-on-surface bg-surface-container-lowest hover:bg-surface-container hover:text-secondary border border-outline-variant/60 transition-colors flex items-center justify-center gap-1 rounded-md shadow-sm"
                title="Thêm hàng loạt từ Excel"
              >
                <svg className="w-3.5 h-3.5 text-on-surface-variant" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-6v12" />
                </svg>
                <span className="hidden sm:inline">Hàng loạt</span>
                <span className="inline sm:hidden">Excel</span>
              </button>
              <button
                onClick={() => setShowAddCard(true)}
                className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-on-secondary hover:bg-secondary-dim transition-colors flex items-center justify-center gap-1.5 rounded-md shadow-sm"
                style={{ background: 'var(--secondary)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Thẻ</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card List */}
      {deck?.category === 'HANTU' ? (
        <div className="space-y-6">
          {/* Lưới tiến trình legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-on-surface-variant p-4 bg-surface-container-low/50 border border-outline-variant/20 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Trạng thái học tập:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-slate-50 border border-slate-200 rounded"></span>
              <span>Mới ({deck.cards.filter(c => !c.progress?.[0]).length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-amber-50 border border-amber-200 rounded"></span>
              <span>Đang học ({deck.cards.filter(c => c.progress?.[0]?.repetitions === 0).length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-blue-50 border border-blue-200 rounded"></span>
              <span>Ôn tập ({deck.cards.filter(c => c.progress?.[0]?.repetitions > 0 && c.progress?.[0]?.interval < 21).length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-emerald-50 border border-emerald-200 rounded"></span>
              <span>Thành thạo ({deck.cards.filter(c => c.progress?.[0]?.interval >= 21).length})</span>
            </div>
          </div>

          {filteredCards?.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant/30 sharp-shadow-sm rounded-lg">
              <p className="text-on-surface-variant text-sm font-medium">
                {searchTerm ? 'Không tìm thấy chữ Hán tự nào.' : 'Chưa có chữ Hán tự nào. Thêm thẻ để bắt đầu học!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 bg-surface-container-lowest p-6 border border-outline-variant/30 sharp-shadow-sm rounded-lg">
              {filteredCards.map((card) => {
                const progress = card.progress?.[0];
                let statusClass = "bg-slate-50 border-slate-200 hover:border-primary/50 text-slate-700";
                if (progress) {
                  if (progress.repetitions === 0) {
                    statusClass = "bg-amber-50 border-amber-200 hover:border-amber-400 text-amber-900";
                  } else if (progress.interval < 21) {
                    statusClass = "bg-blue-50 border-blue-200 hover:border-blue-400 text-blue-900";
                  } else {
                    statusClass = "bg-emerald-50 border-emerald-200 hover:border-emerald-400 text-emerald-900";
                  }
                }

                return (
                  <div
                    key={card.id}
                    onClick={() => setActiveKanjiCard(card)}
                    className={`group relative aspect-square flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-sm rounded-lg hover:sharp-shadow-sm border-2 ${statusClass}`}
                    style={{ minHeight: '85px' }}
                  >
                    {/* Admin Actions overlay */}
                    {canModify && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 z-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setEditingCard(card)}
                          className="p-1 bg-white hover:bg-slate-100 text-on-surface-variant hover:text-primary transition-colors border border-outline-variant/30 rounded"
                          title="Sửa thẻ"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Bạn có chắc muốn xóa chữ Hán tự này?')) {
                              deleteCardMutation.mutate(card.id);
                            }
                          }}
                          className="p-1 bg-white hover:bg-slate-100 text-on-surface-variant hover:text-secondary transition-colors border border-outline-variant/30 rounded"
                          title="Xóa thẻ"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Kanji Char */}
                    <span className="font-jp font-black text-2xl mb-1 select-none">{card.front}</span>
                    {/* Meaning */}
                    <span className="text-[10px] font-bold opacity-85 uppercase tracking-wide truncate max-w-[90%] select-none px-1">
                      {card.back}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow-sm overflow-hidden">
          {filteredCards?.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-on-surface-variant text-sm font-medium">
                {searchTerm ? 'Không tìm thấy thẻ nào.' : 'Chưa có thẻ nào. Thêm thẻ để bắt đầu học!'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/40">
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-16">STT</th>
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-36">Tiếng Nhật</th>
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-36">Hiragana</th>
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-48">Nghĩa tiếng Việt</th>
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Ví dụ</th>
                    {canModify && (
                      <th className="px-6 py-3.5 text-right text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-28">Hành động</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredCards?.map((card, index) => (
                    <tr key={card.id} className="hover:bg-surface-container/20 transition-colors">
                      <td className="px-6 py-4 text-xs font-semibold text-on-surface-variant tabular-nums">{index + 1}</td>
                      <td className="px-6 py-4 font-jp font-bold text-xl text-on-surface">{card.front}</td>
                      <td className="px-6 py-4 text-sm font-medium text-on-surface-variant font-jp">{card.romaji || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-on-surface">{card.back}</td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant leading-relaxed max-w-lg">
                        {card.example ? (
                          <CollapsibleExample 
                            example={card.example} 
                            onSpeak={speakJapanese} 
                            variant="text"
                          />
                        ) : '-'}
                      </td>
                      {canModify && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setEditingCard(card)}
                              className="p-1.5 text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Bạn có chắc muốn xóa thẻ này?')) {
                                  deleteCardMutation.mutate(card.id);
                                }
                              }}
                              className="p-1.5 text-on-surface-variant hover:text-secondary transition-colors hover:bg-surface-container rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddCard && (
        <CardModal
          isOpen={showAddCard}
          onClose={() => setShowAddCard(false)}
          onSave={createCardMutation.mutate}
          deckId={deckId}
          deckCategory={deck?.category}
        />
      )}

      {showBulkAddCard && (
        <BulkCardModal
          isOpen={showBulkAddCard}
          onClose={() => setShowBulkAddCard(false)}
          onSuccess={() => {
            setShowBulkAddCard(false);
            queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
            queryClient.invalidateQueries({ queryKey: ['deckStats', deckId] });
          }}
          deckId={deckId}
          deckCategory={deck?.category}
        />
      )}

      {editingCard && (
        <CardModal
          isOpen={!!editingCard}
          onClose={() => setEditingCard(null)}
          onSave={(data) => updateCardMutation.mutate({ cardId: editingCard.id, data })}
          card={editingCard}
          deckId={deckId}
          deckCategory={deck?.category}
        />
      )}

      {showEditDeck && (
        <DeckEditModal
          isOpen={showEditDeck}
          onClose={() => setShowEditDeck(false)}
          onSave={updateDeckMutation.mutate}
          deck={deck}
        />
      )}

      {activeKanjiCard && (
        <KanjiInteractiveWorkspace
          card={activeKanjiCard}
          onClose={() => setActiveKanjiCard(null)}
          accentColor="var(--primary)"
        />
      )}
    </div>
  );
}

