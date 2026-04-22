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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">Có lỗi xảy ra!</p>
          <p className="text-gray-500">{error.message}</p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Stats Bar */}
      {stats && (
        <div className="max-w-2xl mx-auto mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm flex justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.newCards}</div>
              <div className="text-xs text-gray-500">Mới</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-500">{stats.learning}</div>
              <div className="text-xs text-gray-500">Đang học</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">{stats.review}</div>
              <div className="text-xs text-gray-500"> Ôn tập</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-500">{stats.mastered}</div>
              <div className="text-xs text-gray-500">Thành thạo</div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Link
            to={`/study/${deckId}?mode=normal`}
            className={`flex-1 py-2 px-4 rounded-md text-center font-medium transition-colors ${
              mode === 'normal'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Học thường
          </Link>
          <Link
            to={`/study/${deckId}?mode=srs`}
            className={`flex-1 py-2 px-4 rounded-md text-center font-medium transition-colors ${
              mode === 'srs'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
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
