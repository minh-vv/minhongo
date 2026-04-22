import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import PageShell from '../components/PageShell';

const jlptLevels = [5, 4, 3, 2, 1];

const IconKanji = () => (
  <span className="text-3xl font-black leading-none" style={{ fontFamily: 'serif', color: '#fff' }}>漢</span>
);

function DeckCard({ deck }) {
  return (
    <Link to={`/deck/${deck.id}`}
      className="group relative bg-surface-container-lowest p-5 flex flex-col gap-3 transition-all hover:sharp-shadow-sm overflow-hidden"
      style={{ border: '1px solid rgba(0,0,0,0.07)' }}>

      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'var(--primary)' }} />

      <div className="flex items-start justify-between">
        <span className="px-2 py-px text-[9px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(26,35,126,0.08)', color: 'var(--primary)' }}>
          JLPT N{deck.jlptLevel || '?'}
        </span>
        <span className="flex items-center gap-1 text-xs text-on-surface-variant">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 10V5a2 2 0 012-2z"/>
          </svg>
          {deck._count?.cards || 0} thẻ
        </span>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-on-surface text-sm mb-1 leading-tight group-hover:text-primary transition-colors">
          {deck.name}
        </h3>
        {deck.description && (
          <p className="text-on-surface-variant text-xs line-clamp-2 leading-relaxed">{deck.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-auto"
        style={{ color: 'var(--primary)' }}>
        Học ngay
        <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/>
        </svg>
      </div>

      {/* Ghost kanji */}
      <div className="absolute -right-2 -bottom-2 font-jp font-bold leading-none select-none pointer-events-none text-on-surface/[0.03]"
        style={{ fontSize: 80 }}>漢</div>
    </Link>
  );
}

function EmptyState({ onClear, hasFilter }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center"
      style={{ border: '2px dashed rgba(0,0,0,0.1)' }}>
      <div className="font-jp font-black mb-4 select-none" style={{ fontFamily: 'serif', fontSize: 56, color: 'rgba(26,35,126,0.1)' }}>漢</div>
      <h3 className="font-semibold text-on-surface text-sm mb-1">
        {hasFilter ? 'Không có deck ở cấp độ này' : 'Chưa có deck Hán tự nào'}
      </h3>
      <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
        {hasFilter ? 'Thử chọn cấp độ khác hoặc xem tất cả.' : 'Admin sẽ cập nhật nội dung sớm.'}
      </p>
      {hasFilter && (
        <button onClick={onClear}
          className="text-xs font-bold uppercase tracking-wider hover:underline"
          style={{ color: 'var(--primary)' }}>
          Xem tất cả cấp độ
        </button>
      )}
    </div>
  );
}

export default function KanjiPage() {
  const [decks, setDecks] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/flashcards/public')
      .then((res) => setDecks(res.data.filter((d) => d.category === 'HANTU')))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = selectedLevel ? decks.filter((d) => d.jlptLevel === selectedLevel) : decks;

  return (
    <div className="p-4 md:p-6">
      <PageShell
        icon={<IconKanji />}
        title="Hán tự"
        subtitle="Kanji theo cấp độ JLPT N5 → N1"
      >
        {/* JLPT filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mr-1 font-mono">
            Cấp độ:
          </span>
          {[null, ...jlptLevels].map((lvl) => (
            <button key={lvl ?? 'all'}
              onClick={() => setSelectedLevel(lvl)}
              className="px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all"
              style={selectedLevel === lvl
                ? { background: 'var(--primary)', color: '#fff' }
                : { background: 'rgba(0,0,0,0.05)', color: 'var(--on-surface-variant)' }
              }>
              {lvl === null ? 'Tất cả' : `N${lvl}`}
            </button>
          ))}
          {decks.length > 0 && (
            <span className="ml-auto text-[10px] font-mono text-on-surface-variant">
              {filtered.length} / {decks.length} deck
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-7 h-7 border-2 border-outline-variant border-t-primary animate-spin"
              style={{ borderRadius: '50%', borderTopColor: 'var(--primary)' }} />
            <p className="text-xs text-on-surface-variant font-mono tracking-widest uppercase">Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasFilter={selectedLevel !== null} onClear={() => setSelectedLevel(null)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((deck) => <DeckCard key={deck.id} deck={deck} />)}
          </div>
        )}
      </PageShell>
    </div>
  );
}
