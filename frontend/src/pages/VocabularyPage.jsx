import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';

const jlptLevels = [5, 4, 3, 2, 1];

function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-blue-100 border-t-blue-600" />
      <p className="text-sm text-gray-400">Đang tải...</p>
    </div>
  );
}

function EmptyState({ onClear, hasFilter }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h10M4 18h7" />
        </svg>
      </div>
      <h3 className="font-semibold text-gray-700 mb-1">
        {hasFilter ? 'Không có deck ở cấp độ này' : 'Chưa có deck từ vựng nào'}
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        {hasFilter ? 'Thử chọn cấp độ khác hoặc xem tất cả.' : 'Admin sẽ cập nhật nội dung sớm.'}
      </p>
      {hasFilter && (
        <button onClick={onClear} className="text-sm text-blue-600 font-medium hover:underline">
          Xem tất cả cấp độ
        </button>
      )}
    </div>
  );
}

function DeckCard({ deck }) {
  return (
    <Link
      to={`/deck/${deck.id}`}
      className="group bg-white rounded-2xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">
          JLPT N{deck.jlptLevel}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 10V5a2 2 0 012-2z" />
          </svg>
          {deck._count?.cards || 0} thẻ
        </span>
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-blue-700 transition-colors">
          {deck.name}
        </h3>
        {deck.description && (
          <p className="text-gray-500 text-sm line-clamp-2">{deck.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1 text-blue-500 text-xs font-medium mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
        Học ngay
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export default function VocabularyPage() {
  const [decks, setDecks] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/flashcards/public')
      .then((res) => setDecks(res.data.filter((d) => d.category === 'TUVUNG')))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = selectedLevel ? decks.filter((d) => d.jlptLevel === selectedLevel) : decks;

  return (
    <div className="p-8 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h7" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Từ vựng</h1>
          <p className="text-gray-500 text-sm mt-0.5">Học từ vựng tiếng Nhật theo chủ đề và cấp độ JLPT</p>
        </div>
      </div>

      {/* JLPT filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Cấp độ:</span>
        <button
          onClick={() => setSelectedLevel(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
            selectedLevel === null ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>
        {jlptLevels.map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              selectedLevel === level ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            N{level}
          </button>
        ))}
        {decks.length > 0 && (
          <span className="ml-auto text-xs text-gray-400">{filtered.length} / {decks.length} deck</span>
        )}
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState hasFilter={selectedLevel !== null} onClear={() => setSelectedLevel(null)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((deck) => <DeckCard key={deck.id} deck={deck} />)}
        </div>
      )}
    </div>
  );
}
