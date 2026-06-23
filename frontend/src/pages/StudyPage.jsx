import { useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { flashcardApi } from '../api/flashcardApi';
import FlashcardStudy from '../components/FlashcardStudy';
import SRSStudy from '../components/SRSStudy';

export default function StudyPage() {
  const { deckId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'normal';

  // Lấy deck thông thường
  const { data: deck, isLoading: deckLoading, error: deckError } = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => flashcardApi.getDeck(deckId),
    enabled: mode === 'normal',
  });

  // Lấy thẻ cần ôn (SRS)
  const { data: dueData, isLoading: dueLoading, error: dueError } = useQuery({
    queryKey: ['dueCards', deckId],
    queryFn: () => flashcardApi.getDueCards(deckId),
    enabled: mode === 'srs',
  });

  // Lấy stats cho deck
  const { data: stats } = useQuery({
    queryKey: ['deckStats', deckId],
    queryFn: () => flashcardApi.getDeckStats(deckId),
  });

  const starredOnly = searchParams.get('starred') === 'true';

  const filteredDeck = useMemo(() => {
    if (!deck) return null;
    if (!starredOnly) return deck;
    return {
      ...deck,
      cards: deck.cards.filter(c => c.progress?.[0]?.isStarred)
    };
  }, [deck, starredOnly]);

  const filteredDueData = useMemo(() => {
    if (!dueData) return null;
    if (!starredOnly) return dueData;
    return {
      ...dueData,
      dueCards: dueData.dueCards.filter(c => c.progress?.[0]?.isStarred)
    };
  }, [dueData, starredOnly]);

  const deckName = (mode === 'normal' ? deck?.name : dueData?.deck?.name) + (starredOnly ? ' (★ Đã đánh dấu sao)' : '');
  const isLoading = mode === 'normal' ? deckLoading : dueLoading;
  const error = mode === 'normal' ? deckError : dueError;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-fade-up">
        <div className="animate-spin w-8 h-8 border-2 border-outline-variant border-t-secondary rounded-full" />
        <p className="text-on-surface-variant text-sm font-semibold mt-4">Đang tải dữ liệu học...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-8 text-center py-16 animate-fade-up">
        <p className="font-headline text-lg font-bold text-secondary mb-2">Có lỗi xảy ra!</p>
        <p className="text-on-surface-variant text-sm mb-4">{error.message}</p>
        <Link
          to="/dashboard"
          className="px-4 py-2 border border-outline-variant bg-surface hover:bg-surface-container text-on-surface text-xs font-bold uppercase tracking-wider transition-all"
        >
          Quay lại Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-up">
      {/* Header Block */}
      <div>
        <Link
          to={`/deck/${deckId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại bộ thẻ
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-2xl font-bold text-on-surface">
              {mode === 'srs' ? 'Học SRS' : 'Học Thẻ ghi nhớ (Flashcard)'}
            </h1>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && mode === 'srs' && (
        <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow-sm flex justify-around py-4 text-center">
          <div>
            <div className="text-2xl font-black text-blue-600 leading-none">{stats.newCards}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mt-1.5">Mới</div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 leading-none">{stats.learning}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mt-1.5">Đang học</div>
          </div>
          <div>
            <div className="text-2xl font-black text-green-600 leading-none">{stats.review}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mt-1.5">Ôn tập</div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-600 leading-none">{stats.mastered}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mt-1.5">Thành thạo</div>
          </div>
        </div>
      )}

      {/* Study Content */}
      {mode === 'srs' ? (
        <SRSStudy dueData={filteredDueData} starredOnly={starredOnly} />
      ) : (
        <FlashcardStudy deck={filteredDeck} starredOnly={starredOnly} />
      )}
    </div>
  );
}
