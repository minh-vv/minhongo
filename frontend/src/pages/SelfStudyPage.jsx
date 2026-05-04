import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import ImportAnkiModal from '../components/ImportAnkiModal';
import PageShell from '../components/PageShell';
import { useAuth } from '../hooks/useAuth';
import LoginPrompt from '../components/LoginPrompt';

/* ── icon (book-open / Lucide) ──────────────────────────── */
const IconBookOpen = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 7v14"/>
    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>
  </svg>
);

/* ── deck card ───────────────────────────────────────────── */
function DeckCard({ deck }) {
  return (
    <Link to={`/deck/${deck.id}`}
      className="group relative bg-surface-container-lowest p-5 flex flex-col gap-3 transition-all hover:sharp-shadow-sm overflow-hidden"
      style={{ border: '1px solid rgba(0,0,0,0.07)' }}
    >
      {/* Top accent bar on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'var(--secondary)' }} />

      <div className="flex items-start justify-between">
        <span className="px-2 py-px text-[9px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(198,40,40,0.08)', color: 'var(--secondary)' }}>
          Tự học
        </span>
        <span className="flex items-center gap-1 text-xs text-on-surface-variant">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          {deck._count?.cards || 0} thẻ
        </span>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-on-surface text-sm mb-1 leading-tight group-hover:text-secondary transition-colors">
          {deck.name}
        </h3>
        {deck.description && (
          <p className="text-on-surface-variant text-xs line-clamp-2 leading-relaxed">{deck.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-auto"
        style={{ color: 'var(--secondary)' }}>
        Mở bộ thẻ
        <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/>
        </svg>
      </div>

      {/* Ghost kanji */}
      <div className="absolute -right-2 -bottom-2 font-jp font-bold leading-none select-none pointer-events-none text-on-surface/[0.03]"
        style={{ fontSize: 72 }}>覚</div>
    </Link>
  );
}

/* ── empty state ─────────────────────────────────────────── */
function EmptyState({ onCreateClick }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center"
      style={{ border: '2px dashed rgba(0,0,0,0.1)' }}>
      <div className="w-16 h-16 flex items-center justify-center mb-4" style={{ background: 'rgba(198,40,40,0.06)' }}>
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
          style={{ color: 'var(--secondary)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      </div>
      <h3 className="font-semibold text-on-surface text-sm mb-1">Bạn chưa có bộ thẻ nào</h3>
      <p className="text-xs text-on-surface-variant mb-5 max-w-xs leading-relaxed">
        Tạo bộ flashcard riêng hoặc import từ Anki để bắt đầu luyện tập theo cách của bạn.
      </p>
      <button onClick={onCreateClick}
        className="px-5 py-2 text-xs font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-colors"
        style={{ background: 'var(--secondary)' }}>
        Tạo bộ thẻ đầu tiên
      </button>
    </div>
  );
}

/* ── main page ───────────────────────────────────────────── */
export default function SelfStudyPage() {
  const { isAuthenticated } = useAuth();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newDeck, setNewDeck] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="p-6 md:p-8">
        <LoginPrompt
          title="Đăng nhập để dùng Tự học"
          description="Tạo flashcard riêng, import từ Anki và ôn tập SRS — tất cả chỉ dành cho thành viên."
        />
      </div>
    );
  }

  const fetchDecks = () => {
    setLoading(true);
    axios.get('/flashcards')
      .then((res) => setDecks(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDecks(); }, []);

  const handleCreateDeck = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await axios.post('/flashcards', newDeck);
      setNewDeck({ name: '', description: '' });
      setShowCreateModal(false);
      fetchDecks();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  /* action buttons passed to PageShell */
  const actions = (
    <>
      <button onClick={() => setShowImportModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
        style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
        </svg>
        Import Anki
      </button>
      <button onClick={() => setShowCreateModal(true)}
        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-colors"
        style={{ background: 'var(--secondary)' }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Tạo bộ thẻ
      </button>
    </>
  );

  return (
    <div className="p-4 md:p-6">
      <PageShell
        icon={<IconBookOpen />}
        title="Học Flashcard"
        subtitle="Spaced Repetition System (SM-2)"
        actions={actions}
      >
        {/* ── deck list ──────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-7 h-7 border-2 border-outline-variant border-t-secondary animate-spin"
              style={{ borderRadius: '50%' }} />
            <p className="text-xs text-on-surface-variant font-mono tracking-widest uppercase">Đang tải...</p>
          </div>
        ) : decks.length === 0 ? (
          <EmptyState onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {decks.map((deck) => <DeckCard key={deck.id} deck={deck} />)}
          </div>
        )}
      </PageShell>

      {/* ── create modal ─────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest w-full max-w-md p-6 sharp-shadow"
            style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
            <div className="flex items-center justify-between mb-5"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '1rem' }}>
              <h2 className="font-headline font-bold text-on-surface">Tạo bộ thẻ mới</h2>
              <button onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Tên bộ thẻ <span style={{ color: 'var(--secondary)' }}>*</span>
                </label>
                <input type="text" required value={newDeck.name}
                  onChange={(e) => setNewDeck({ ...newDeck, name: e.target.value })}
                  placeholder="VD: Từ vựng bài 1, Ngữ pháp N3..."
                  className="w-full px-3 py-2 bg-surface text-on-surface text-sm outline-none"
                  style={{ border: '1px solid rgba(0,0,0,0.15)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Mô tả
                </label>
                <textarea value={newDeck.description}
                  onChange={(e) => setNewDeck({ ...newDeck, description: e.target.value })}
                  placeholder="Mô tả ngắn về bộ thẻ này..."
                  rows={3}
                  className="w-full px-3 py-2 bg-surface text-on-surface text-sm outline-none resize-none"
                  style={{ border: '1px solid rgba(0,0,0,0.15)' }} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 text-sm font-bold text-on-secondary hover:bg-secondary-dim disabled:opacity-60 transition-colors"
                  style={{ background: 'var(--secondary)' }}>
                  {creating ? 'Đang tạo...' : 'Tạo bộ thẻ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <ImportAnkiModal
          isOpen={true}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => { setShowImportModal(false); fetchDecks(); }}
        />
      )}
    </div>
  );
}
