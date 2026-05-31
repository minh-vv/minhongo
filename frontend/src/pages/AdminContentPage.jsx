import { useState, useEffect, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { adminApi } from '../api/adminApi';

const DECK_CATEGORIES = [
  { value: '', label: 'Mọi danh mục' },
  { value: 'HANTU', label: 'Hán tự' },
  { value: 'TUVUNG', label: 'Từ vựng' },
  { value: 'NGUPHAP', label: 'Ngữ pháp' },
  { value: 'TUHOC', label: 'Tự học' },
];

function SectionHeader({ title, accent = 'var(--secondary)', action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-6 flex-shrink-0" style={{ background: accent }} />
        <h2 className="text-lg font-headline font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
          {title}
        </h2>
        <div className="flex-1 h-px ml-1" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)' }} />
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  );
}

function StatCard({ label, value, icon, accentColor = 'var(--secondary)' }) {
  return (
    <div className="bg-surface-container-lowest p-5 relative overflow-hidden animate-fade-up"
      style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: accentColor }} />
      <div className="pl-3">
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">{label}</p>
        <p className="text-3xl font-black text-on-surface leading-none mb-0.5">{value ?? '—'}</p>
      </div>
      <div className="absolute -right-1 -bottom-2 text-5xl opacity-[0.04] pointer-events-none select-none">{icon}</div>
    </div>
  );
}

function DeckEditModal({ deck, onClose, onSave, isPending }) {
  const [name, setName] = useState(deck?.name || '');
  const [description, setDescription] = useState(deck?.description || '');
  const [isPublic, setIsPublic] = useState(!!deck?.isPublic);
  const [category, setCategory] = useState(deck?.category || 'TUHOC');
  const [jlptLevel, setJlptLevel] = useState(deck?.jlptLevel ? String(deck.jlptLevel) : '');

  useEffect(() => {
    if (!deck) return;
    setName(deck.name || '');
    setDescription(deck.description || '');
    setIsPublic(!!deck.isPublic);
    setCategory(deck.category || 'TUHOC');
    setJlptLevel(deck.jlptLevel ? String(deck.jlptLevel) : '');
  }, [deck]);

  if (!deck) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const jlpt = jlptLevel === '' ? undefined : parseInt(jlptLevel, 10);
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      isPublic,
      category,
      jlptLevel: Number.isNaN(jlpt) ? undefined : jlpt,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-surface-container-lowest w-full max-w-md p-6 sharp-shadow max-h-[90vh] overflow-y-auto"
        style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
        <h3 className="font-headline font-bold text-on-surface mb-4">Chỉnh sửa deck</h3>
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Tên</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={200}
              className="mt-1 w-full px-3 py-2 bg-surface-container-lowest outline-none"
              style={{ border: '1px solid rgba(0,0,0,0.12)' }} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Mô tả</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000}
              className="mt-1 w-full px-3 py-2 bg-surface-container-lowest outline-none resize-none"
              style={{ border: '1px solid rgba(0,0,0,0.12)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Danh mục</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-surface-container-lowest outline-none text-on-surface"
                style={{ border: '1px solid rgba(0,0,0,0.12)' }}>
                {DECK_CATEGORIES.filter((c) => c.value).map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">JLPT</label>
              <select value={jlptLevel} onChange={(e) => setJlptLevel(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-surface-container-lowest outline-none text-on-surface"
                style={{ border: '1px solid rgba(0,0,0,0.12)' }}>
                <option value="">—</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={String(n)}>N{n}</option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="rounded border-gray-300" />
            <span className="text-on-surface font-medium">Hiển thị công khai (Khóa học)</span>
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose} disabled={isPending}
            className="flex-1 px-4 py-2 text-sm font-medium text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors disabled:opacity-50">
            Hủy
          </button>
          <button type="submit" disabled={isPending}
            className="flex-1 px-4 py-2 text-sm font-bold text-on-secondary hover:bg-secondary-dim transition-colors disabled:opacity-50"
            style={{ background: 'var(--secondary)' }}>
            {isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </form>
    </div>
  );
}

function DeleteDeckModal({ deck, onConfirm, onCancel, isPending }) {
  if (!deck) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-lowest w-full max-w-sm p-6 sharp-shadow" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
        <h3 className="font-headline font-bold text-on-surface mb-2">Xóa deck?</h3>
        <p className="text-sm text-on-surface-variant mb-5">
          Deck <span className="font-semibold text-on-surface">{deck.name}</span> và tất cả thẻ, tiến độ liên quan sẽ bị xóa vĩnh viễn.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={isPending}
            className="flex-1 px-4 py-2 text-sm font-medium bg-surface-container disabled:opacity-50">Hủy</button>
          <button type="button" onClick={onConfirm} disabled={isPending}
            className="flex-1 px-4 py-2 text-sm font-bold text-on-secondary disabled:opacity-50"
            style={{ background: 'var(--secondary)' }}>
            {isPending ? '...' : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminContentPage() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [visibility, setVisibility] = useState('all');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [editingDeck, setEditingDeck] = useState(null);
  const [deletingDeck, setDeletingDeck] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleVisibilityChange = useCallback((v) => { setVisibility(v); setPage(1); }, []);
  const handleCategoryChange = useCallback((c) => { setCategory(c); setPage(1); }, []);

  const isAdminUser = !!(isAuthenticated && currentUser?.isAdmin);

  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getStats,
    staleTime: 30_000,
    enabled: isAdminUser,
  });

  const { data: decksData, isLoading, isFetching } = useQuery({
    queryKey: ['adminDecks', debouncedSearch, visibility, category, page],
    queryFn: () => adminApi.getDecks({
      search: debouncedSearch,
      visibility,
      category,
      page,
    }),
    keepPreviousData: true,
    enabled: isAdminUser,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updateDeck(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDecks'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setEditingDeck(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteDeck(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDecks'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setDeletingDeck(null);
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: ({ id, isPublic }) => adminApi.updateDeck(id, { isPublic }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDecks'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentUser && !currentUser.isAdmin) return <Navigate to="/dashboard" replace />;

  const decks = decksData?.decks || [];
  const totalPages = decksData?.totalPages || 1;
  const total = decksData?.total || 0;

  const catLabel = (c) => DECK_CATEGORIES.find((x) => x.value === c)?.label || c;

  const STAT_CARDS = [
    { label: 'Tổng deck', value: stats?.totalDecks, icon: '📚', accentColor: 'var(--primary)' },
    { label: 'Deck công khai', value: stats?.publicDecks, icon: '🌐', accentColor: '#2e7d32' },
    { label: 'Tổng thẻ', value: stats?.totalCards, icon: '🃏', accentColor: '#6a1b9a' },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-10">

      <section className="relative overflow-hidden animate-fade-up" style={{ minHeight: 140 }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 55%, #0d1b5e 100%)',
        }} />
        <div className="absolute inset-0 asanoha-bg opacity-20" />
        <div className="absolute right-0 top-0 bottom-0 w-1" style={{ background: 'var(--secondary)' }} />

        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 mb-4" style={{ backdropFilter: 'blur(4px)' }}>
              <span className="w-1.5 h-1.5 rotate-45 flex-shrink-0" style={{ background: 'var(--secondary)' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                Admin · Nội dung
              </span>
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-white leading-tight" style={{ letterSpacing: '-0.02em' }}>
              Quản lý nội dung hệ thống
            </h1>
            <p className="text-white/50 text-sm mt-2">
              Duyệt deck, chỉnh sửa hiển thị công khai và xóa nội dung không phù hợp
            </p>
            <Link
              to="/admin/courses"
              className="mt-4 inline-block px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-colors"
              style={{ backdropFilter: 'blur(4px)' }}
            >
              Quản lý lộ trình & bài học →
            </Link>
          </div>
          <div className="flex-shrink-0 text-center bg-white/10 px-8 py-4"
            style={{ backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-4xl font-black text-white leading-none">{stats?.totalDecks ?? '—'}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Deck</p>
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none" style={{ fontSize: 160 }}>内</div>
      </section>

      <section>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {STAT_CARDS.map((s, i) => (
            <div key={s.label} style={{ animationDelay: `${i * 60}ms` }}>
              <StatCard {...s} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Danh sách deck"
          action={isFetching && !isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <div className="w-3 h-3 border border-outline-variant border-t-secondary animate-spin rounded-full" />
              Đang cập nhật...
            </div>
          )}
        />

        <div className="bg-surface-container-lowest" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex flex-col gap-3 p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'var(--surface-container-low)' }}>
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên hoặc mô tả..."
                  className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest text-on-surface text-sm outline-none"
                  style={{ border: '1px solid rgba(0,0,0,0.12)' }}
                />
              </div>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-3 py-2 text-sm bg-surface-container-lowest text-on-surface outline-none"
                style={{ border: '1px solid rgba(0,0,0,0.12)' }}
              >
                {DECK_CATEGORIES.map((c) => (
                  <option key={c.value || 'all'} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-0.5 bg-surface-container p-0.5" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
              {[
                { value: 'all', label: 'Tất cả' },
                { value: 'public', label: 'Công khai' },
                { value: 'private', label: 'Riêng tư' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleVisibilityChange(tab.value)}
                  className="px-3 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    background: visibility === tab.value ? 'var(--surface-container-lowest)' : 'transparent',
                    color: visibility === tab.value ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                    boxShadow: visibility === tab.value ? '1px 1px 0 0 rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-2.5 border-b text-xs text-on-surface-variant" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
            {isLoading ? 'Đang tải...' : `Tìm thấy ${total} deck`}
            {debouncedSearch && ` · "${debouncedSearch}"`}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-on-surface-variant">
              <div className="w-5 h-5 border-2 border-outline-variant border-t-secondary animate-spin rounded-full" />
              <span className="text-sm">Đang tải dữ liệu...</span>
            </div>
          ) : decks.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">📭</p>
              <p className="font-semibold text-on-surface text-sm">Không có deck nào khớp bộ lọc</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'var(--surface-container-low)' }}>
                    {['Deck', 'Chủ sở hữu', 'Thẻ', 'Danh mục', 'JLPT', 'Công khai', 'Hành động'].map((h, i) => (
                      <th key={h} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ${i === 2 || i === 5 ? 'text-center' : ''} ${i === 6 ? 'text-right' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {decks.map((deck, rowIdx) => {
                    const isEven = rowIdx % 2 === 0;
                    return (
                      <tr
                        key={deck.id}
                        className="border-b transition-colors"
                        style={{
                          borderColor: 'rgba(0,0,0,0.04)',
                          background: isEven ? 'var(--surface-container-lowest)' : 'var(--surface)',
                        }}
                      >
                        <td className="px-4 py-3 max-w-[220px]">
                          <Link to={`/deck/${deck.id}`} className="text-sm font-semibold hover:underline line-clamp-2" style={{ color: 'var(--primary)' }}>
                            {deck.name}
                          </Link>
                          {deck.description && (
                            <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">{deck.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant">
                          <div className="font-medium text-on-surface">{deck.user?.name || '—'}</div>
                          <div className="truncate max-w-[160px]">{deck.user?.email}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-bold">{deck._count?.cards ?? 0}</td>
                        <td className="px-4 py-3 text-xs">{catLabel(deck.category)}</td>
                        <td className="px-4 py-3 text-xs text-center">{deck.jlptLevel ? `N${deck.jlptLevel}` : '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            disabled={togglePublicMutation.isPending}
                            onClick={() => togglePublicMutation.mutate({ id: deck.id, isPublic: !deck.isPublic })}
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 transition-colors disabled:opacity-40"
                            style={{
                              background: deck.isPublic ? 'rgba(46,125,50,0.12)' : 'rgba(0,0,0,0.06)',
                              color: deck.isPublic ? '#2e7d32' : 'var(--on-surface-variant)',
                              border: `1px solid ${deck.isPublic ? 'rgba(46,125,50,0.25)' : 'rgba(0,0,0,0.1)'}`,
                            }}
                          >
                            {deck.isPublic ? 'Công khai' : 'Riêng tư'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingDeck(deck)}
                              className="px-2 py-1 text-[10px] font-bold uppercase bg-surface-container hover:bg-surface-container-high"
                              style={{ border: '1px solid rgba(0,0,0,0.1)' }}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingDeck(deck)}
                              className="p-1 text-on-surface-variant hover:text-secondary"
                              title="Xóa deck"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'var(--surface-container-low)' }}>
              <p className="text-xs text-on-surface-variant">
                Trang <span className="font-bold text-on-surface">{page}</span> / {totalPages}
              </p>
              <div className="flex gap-1">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-semibold disabled:opacity-30" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>←</button>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold disabled:opacity-30" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>→</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {editingDeck && (
        <DeckEditModal
          deck={editingDeck}
          onClose={() => setEditingDeck(null)}
          onSave={(payload) => updateMutation.mutate({ id: editingDeck.id, payload })}
          isPending={updateMutation.isPending}
        />
      )}
      {deletingDeck && (
        <DeleteDeckModal
          deck={deletingDeck}
          onConfirm={() => deleteMutation.mutate(deletingDeck.id)}
          onCancel={() => setDeletingDeck(null)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
