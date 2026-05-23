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
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fade-up">
      {/* Stats Bar */}
      {stats && (
        <div className="max-w-2xl mx-auto">
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
        </div>
      )}

      {/* Mode Toggle */}
      <div className="max-w-2xl mx-auto">
        <div className="flex bg-surface-container-low border border-outline-variant/30 p-1">
          <Link
            to={`/study/${deckId}?mode=normal`}
            className={`flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'normal'
                ? 'bg-surface-container-lowest text-secondary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Học thường
          </Link>
          <Link
            to={`/study/${deckId}?mode=srs`}
            className={`flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'srs'
                ? 'bg-surface-container-lowest text-secondary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            SRS ({dueData?.dueCount || 0} due)
          </Link>
        </div>
      </div>

      {/* Study Content */}
      {mode === 'srs' ? (
        <SRSStudy dueData={dueData} />
      ) : (
        <FlashcardStudy deck={deck} />
      )}
    </div>
  );
}
