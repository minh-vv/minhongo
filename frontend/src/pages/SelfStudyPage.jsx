import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import ImportAnkiModal from '../components/ImportAnkiModal';
import { useAuth } from '../hooks/useAuth';
import LoginPrompt from '../components/LoginPrompt';

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-1.5 h-6 flex-shrink-0" style={{ background: 'var(--secondary)' }} />
        <h2 className="text-lg font-headline font-bold text-on-surface truncate"
          style={{ letterSpacing: '-0.01em' }}>
          {title}
        </h2>
        <div className="flex-1 h-px ml-1 hidden sm:block"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)' }} />
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// Category definitions
const CATEGORIES = [
  {
    value: 'ALL',
    label: 'Tất cả',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    value: 'TUHOC',
    label: 'Tự học',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    ghost: '覚',
    color: 'var(--secondary)',
  },
  {
    value: 'TUVUNG',
    label: 'Từ vựng',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    ghost: '語',
    color: '#1565c0',
  },
  {
    value: 'NGUPHAP',
    label: 'Ngữ pháp',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    ghost: '文',
    color: '#006064',
  },
  {
    value: 'HANTU',
    label: 'Hán tự',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
    ghost: '漢',
    color: '#b45309',
  },
];

function DeckCard({ deck }) {
  const cat = CATEGORIES.find((c) => c.value === deck.category);
  return (
    <Link to={`/deck/${deck.id}`}
      className="group relative bg-surface-container-lowest p-5 flex flex-col gap-3 transition-all hover:sharp-shadow-sm overflow-hidden"
      style={{ border: '1px solid rgba(0,0,0,0.07)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: cat?.color || 'var(--secondary)' }} />

      <div className="flex items-start justify-between">
        <span className="px-2 py-px text-[9px] font-bold uppercase tracking-wider"
          style={{ background: `${cat?.color || 'var(--secondary)'}18`, color: cat?.color || 'var(--secondary)' }}>
          {cat?.label || 'Tự học'}
        </span>
        <span className="flex items-center gap-1 text-xs text-on-surface-variant">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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
        style={{ color: cat?.color || 'var(--secondary)' }}>
        Mở bộ thẻ
        <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
        </svg>
      </div>

      <div className="absolute -right-2 -bottom-2 font-jp font-bold leading-none select-none pointer-events-none text-on-surface/[0.03]"
        style={{ fontSize: 72 }}>{cat?.ghost || '覚'}</div>
    </Link>
  );
}

function EmptyState({ onCreateClick }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-surface-container-lowest"
      style={{ border: '2px dashed rgba(0,0,0,0.1)' }}>
      <div className="w-16 h-16 flex items-center justify-center mb-4"
        style={{ background: 'rgba(198,40,40,0.06)' }}>
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
          style={{ color: 'var(--secondary)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 className="font-semibold text-on-surface text-sm mb-1">Chưa có bộ thẻ nào</h3>
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

export default function SelfStudyPage() {
  const { isAuthenticated } = useAuth();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newDeck, setNewDeck] = useState({ name: '', description: '', category: 'TUHOC', isPublic: false });
  const [creating, setCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const fetchDecks = () => {
    setLoading(true);
    axios.get('/flashcards')
      .then((res) => setDecks(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated) fetchDecks();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <LoginPrompt
        title="Đăng nhập để dùng Tự học"
        description="Tạo flashcard riêng, import từ Anki và ôn tập SRS — tất cả chỉ dành cho thành viên."
        ghostChar="覚"
      />
    );
  }

  const handleCreateDeck = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await axios.post('/flashcards', newDeck);
      setNewDeck({ name: '', description: '', category: 'TUHOC', isPublic: false });
      setShowCreateModal(false);
      fetchDecks();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const filteredDecks = selectedCategory === 'ALL'
    ? decks
    : decks.filter((d) => d.category === selectedCategory);

  const countByCategory = (cat) =>
    cat === 'ALL' ? decks.length : decks.filter((d) => d.category === cat).length;

  const actions = (
    <div className="flex items-center gap-2">
      <button onClick={() => setShowImportModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
        style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Import Anki
      </button>
      <button onClick={() => setShowCreateModal(true)}
        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-colors"
        style={{ background: 'var(--secondary)' }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Tạo bộ thẻ
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-10">

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden animate-fade-up" style={{ minHeight: 130 }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 60%, #0d1b5e 100%)'
        }} />
        <div className="absolute inset-0 asanoha-bg opacity-20" />
        <div className="absolute right-0 top-0 bottom-0 w-1" style={{ background: 'var(--secondary)' }} />

        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 mb-4"
              style={{ backdropFilter: 'blur(4px)' }}>
              <span className="w-1.5 h-1.5 rotate-45" style={{ background: 'var(--secondary)' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                Spaced Repetition System · SM-2
              </span>
            </div>
            <h1 className="font-headline text-3xl font-bold text-white"
              style={{ letterSpacing: '-0.02em' }}>
              Kho cá nhân
            </h1>
            <p className="text-white/50 text-sm mt-2 max-w-md">
              Tạo bộ thẻ riêng hoặc import từ Anki, ôn tập theo thuật toán SRS để ghi nhớ lâu.
            </p>
          </div>

          <div className="flex gap-3 flex-shrink-0">
            <div className="text-center bg-white/10 px-5 py-3"
              style={{ backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-2xl font-black text-white leading-none">{decks.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Bộ thẻ</p>
            </div>
            <div className="text-center bg-white/10 px-5 py-3"
              style={{ backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-2xl font-black text-white leading-none">
                {decks.reduce((sum, d) => sum + (d._count?.cards || 0), 0)}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Thẻ học</p>
            </div>
          </div>
        </div>

        <div className="absolute -right-4 -bottom-4 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none"
          style={{ fontSize: 160 }}>覚</div>
      </section>

      {/* ── CATEGORY FOLDER TABS ─────────────────────────────── */}
      <section>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 border-b border-outline-variant/30 mb-6">
          {CATEGORIES.map((cat) => {
            const count = countByCategory(cat.value);
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0 border-b-2 -mb-px"
                style={isActive
                  ? { color: 'var(--secondary)', borderColor: 'var(--secondary)', background: 'rgba(198,40,40,0.04)' }
                  : { color: 'var(--on-surface-variant)', borderColor: 'transparent' }
                }
              >
                <span style={{ color: isActive ? (cat.color || 'var(--secondary)') : 'var(--on-surface-variant)' }}>
                  {cat.icon}
                </span>
                {cat.label}
                <span
                  className="px-1.5 py-px text-[10px] font-black leading-none"
                  style={{
                    background: isActive ? 'var(--secondary)' : 'rgba(0,0,0,0.07)',
                    color: isActive ? '#fff' : 'var(--on-surface-variant)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <SectionHeader
          title={
            selectedCategory === 'ALL'
              ? 'Tất cả bộ thẻ'
              : `${CATEGORIES.find((c) => c.value === selectedCategory)?.label} — Bộ thẻ của bạn`
          }
          action={actions}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-7 h-7 border-2 border-outline-variant border-t-secondary animate-spin"
              style={{ borderRadius: '50%' }} />
            <p className="text-xs text-on-surface-variant font-mono tracking-widest uppercase">Đang tải...</p>
          </div>
        ) : filteredDecks.length === 0 ? (
          <EmptyState onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDecks.map((deck) => <DeckCard key={deck.id} deck={deck} />)}
          </div>
        )}
      </section>

      {/* ── CREATE DECK MODAL ───────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest w-full max-w-md p-6 sharp-shadow"
            style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
            <div className="flex items-center justify-between mb-5 pb-4"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <h2 className="font-headline font-bold text-on-surface">Tạo bộ thẻ mới</h2>
              <button onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Tên bộ thẻ <span style={{ color: 'var(--secondary)' }}>*</span>
                </label>
                <input type="text" required value={newDeck.name}
                  onChange={(e) => setNewDeck({ ...newDeck, name: e.target.value })}
                  placeholder="VD: Từ vựng bài 1, Ngữ pháp N3..."
                  className="w-full px-3 py-2 bg-surface text-on-surface text-sm outline-none"
                  style={{ border: '1px solid rgba(0,0,0,0.15)' }} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Danh mục
                </label>
                <select value={newDeck.category}
                  onChange={(e) => setNewDeck({ ...newDeck, category: e.target.value })}
                  className="w-full px-3 py-2 bg-surface text-on-surface text-sm outline-none"
                  style={{ border: '1px solid rgba(0,0,0,0.15)' }}>
                  {CATEGORIES.filter(c => c.value !== 'ALL').map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Mô tả
                </label>
                <textarea value={newDeck.description}
                  onChange={(e) => setNewDeck({ ...newDeck, description: e.target.value })}
                  placeholder="Mô tả ngắn về bộ thẻ này..."
                  rows={3}
                  className="w-full px-3 py-2 bg-surface text-on-surface text-sm outline-none resize-none"
                  style={{ border: '1px solid rgba(0,0,0,0.15)' }} />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="createIsPublic"
                  checked={newDeck.isPublic}
                  onChange={(e) => setNewDeck({ ...newDeck, isPublic: e.target.checked })}
                  className="w-4 h-4 border-outline-variant focus:ring-secondary text-secondary accent-secondary cursor-pointer"
                />
                <label htmlFor="createIsPublic" className="text-xs font-semibold text-on-surface-variant cursor-pointer select-none">
                  Công khai bộ thẻ lên cộng đồng
                </label>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-on-secondary hover:bg-secondary-dim disabled:opacity-60 transition-colors"
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
