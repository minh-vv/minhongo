import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashcardApi } from '../api/flashcardApi';
import { useAuth } from '../hooks/useAuth';
import { Search, Copy, Layers, ExternalLink, Filter, BookOpen } from 'lucide-react';
import PageHeader from '../components/PageHeader';

// Định nghĩa danh mục
const CATEGORIES = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'TUHOC', label: 'Tự học', color: 'var(--secondary)' },
  { value: 'TUVUNG', label: 'Từ vựng', color: '#1565c0' },
  { value: 'NGUPHAP', label: 'Ngữ pháp', color: '#006064' },
  { value: 'HANTU', label: 'Hán tự', color: '#b45309' },
];

const JLPT_LEVELS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 5, label: 'N5' },
  { value: 4, label: 'N4' },
  { value: 3, label: 'N3' },
  { value: 2, label: 'N2' },
  { value: 1, label: 'N1' },
];

function SectionHeader({ title, count }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1.5 h-6 flex-shrink-0" style={{ background: 'var(--secondary)' }} />
      <h2 className="text-lg font-headline font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      {count !== undefined && (
        <span className="px-2 py-0.5 text-xs font-black bg-surface-container text-on-surface-variant">
          {count}
        </span>
      )}
      <div className="flex-1 h-px ml-1 hidden sm:block"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)' }} />
    </div>
  );
}

export default function CommunityPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, openLogin } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');

  // Lấy danh sách public decks
  const { data: decks = [], isLoading, error } = useQuery({
    queryKey: ['publicDecksList'],
    queryFn: flashcardApi.getPublicDecks,
  });

  // Lọc chỉ giữ lại các bộ thẻ do người dùng tạo (không phải admin)
  const communityDecks = useMemo(() => {
    return decks.filter((d) => !d.user?.isAdmin);
  }, [decks]);

  // Mutation để fork deck
  const forkMutation = useMutation({
    mutationFn: (deckId) => flashcardApi.cloneDeck(deckId),
    onSuccess: (data) => {
      alert(data.message || 'Đã sao chép bộ thẻ vào thư viện cá nhân của bạn!');
      queryClient.invalidateQueries({ queryKey: ['myDecks'] });
      navigate(`/deck/${data.deckId}`);
    },
    onError: (err) => {
      console.error(err);
      alert(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu bộ thẻ.');
    }
  });

  // Xử lý khi nhấn nút Lưu về thư viện (Fork)
  const handleFork = (deckId) => {
    if (!isAuthenticated) {
      if (confirm('Vui lòng đăng nhập để lưu bộ thẻ này về thư viện cá nhân của bạn. Đăng nhập ngay?')) {
        openLogin();
      }
      return;
    }
    forkMutation.mutate(deckId);
  };

  // Lọc danh sách decks
  const filteredDecks = useMemo(() => {
    return communityDecks.filter((deck) => {
      const matchesSearch = 
        deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (deck.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'ALL' || deck.category === selectedCategory;
      
      const matchesLevel = 
        selectedLevel === 'ALL' || 
        deck.jlptLevel === Number(selectedLevel);

      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [communityDecks, searchTerm, selectedCategory, selectedLevel]);

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-10">
      
      {/* ── HERO ────────────────────────────────────────────── */}
      <PageHeader
        tag="Chia sẻ & Học hỏi"
        title="Bộ thẻ cộng đồng"
        subtitle="Khám phá và học các bộ thẻ được chia sẻ từ cộng đồng."
        ghostChar="仲"
        rightContent={
          <div className="flex gap-3 flex-shrink-0">
            <div className="text-center bg-white/10 px-5 py-3"
              style={{ backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-2xl font-black text-white leading-none">
                {communityDecks.length}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Bộ thẻ chia sẻ</p>
            </div>
          </div>
        }
      />

      {/* ── SEARCH & FILTER TOOLBAR ─────────────────────────── */}
      <section className="bg-surface-container-lowest p-6 border border-outline-variant/30 sharp-shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm bộ thẻ theo tên hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface text-on-surface placeholder:text-on-surface-variant focus:outline-none border border-outline-variant/50 focus:border-secondary transition-colors"
            />
          </div>

          {/* Bộ lọc cấp độ JLPT */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 w-full md:w-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Cấp độ JLPT:
            </span>
            <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
              {JLPT_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  onClick={() => setSelectedLevel(lvl.value)}
                  className={`px-3 py-1.5 text-xs font-bold transition-all border ${
                    selectedLevel === lvl.value
                      ? 'bg-secondary text-white border-secondary'
                      : 'bg-surface text-on-surface-variant border-outline-variant/30 hover:border-outline-variant'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Folder Tabs cho danh mục */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-outline-variant/30">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.value;
            const count = cat.value === 'ALL'
              ? communityDecks.length
              : communityDecks.filter(d => d.category === cat.value).length;

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
                {cat.label}
                <span className={`px-1.5 py-px text-[10px] font-black leading-none ${
                  isActive ? 'bg-secondary text-white' : 'bg-surface-container text-on-surface-variant'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── DECKS LIST ──────────────────────────────────────── */}
      <section>
        <SectionHeader title="Bộ thẻ được cộng đồng chia sẻ" count={filteredDecks.length} />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-outline-variant border-t-secondary animate-spin rounded-full" />
            <p className="text-xs text-on-surface-variant font-mono tracking-widest uppercase">Đang tải...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-surface-container-lowest border border-red-200 text-red-800 p-6">
            <p className="font-semibold text-sm">Có lỗi xảy ra khi lấy danh sách bộ thẻ.</p>
            <p className="text-xs mt-1">Vui lòng thử lại sau.</p>
          </div>
        ) : filteredDecks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-surface-container-lowest border-2 border-dashed border-outline-variant/30">
            <div className="w-12 h-12 flex items-center justify-center mb-4 bg-slate-100 rounded-full">
              <Layers className="w-6 h-6 text-on-surface-variant/40" />
            </div>
            <h3 className="font-bold text-on-surface text-sm mb-1">Không tìm thấy bộ thẻ nào</h3>
            <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
              Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc danh mục và cấp độ JLPT.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDecks.map((deck) => {
              const isOwn = deck.userId === user?.id;
              const catObj = CATEGORIES.find(c => c.value === deck.category) || CATEGORIES[1];
              return (
                <div
                  key={deck.id}
                  className="group relative bg-surface-container-lowest p-6 flex flex-col gap-4 border border-outline-variant/30 transition-all hover:sharp-shadow-sm overflow-hidden"
                >
                  {/* Category Border Decorator */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: catObj.color || 'var(--secondary)' }} />

                  {/* Header info */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 font-bold uppercase tracking-wider text-[10px] rounded"
                      style={{ background: `${catObj.color || 'var(--secondary)'}15`, color: catObj.color || 'var(--secondary)' }}>
                      {catObj.label}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-on-surface-variant">
                      <BookOpen className="w-3.5 h-3.5" />
                      {deck._count?.cards || 0} thẻ
                    </span>
                  </div>

                  {/* Name and Description */}
                  <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-on-surface text-base group-hover:text-secondary transition-colors leading-tight line-clamp-1">
                      {deck.name}
                    </h3>
                    {deck.description ? (
                      <p className="text-on-surface-variant text-xs leading-relaxed line-clamp-2">
                        {deck.description}
                      </p>
                    ) : (
                      <p className="text-on-surface-variant/40 text-xs italic">Không có mô tả.</p>
                    )}
                  </div>

                  {/* Metadata: JLPT, Creator */}
                  <div className="flex items-center justify-between text-xs border-t border-outline-variant/15 pt-3.5 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-wider">Người chia sẻ</span>
                      <span className="font-bold text-on-surface truncate max-w-[150px]">
                        {isOwn ? 'Bạn (Cá nhân)' : (deck.user?.name || 'Thành viên')}
                      </span>
                    </div>
                    {deck.jlptLevel && (
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-wider block">Trình độ</span>
                        <span className="px-2 py-px bg-amber-100 text-amber-900 font-black rounded text-[10px]">
                          JLPT N{deck.jlptLevel}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2.5 mt-2">
                    <Link
                      to={`/deck/${deck.id}`}
                      className="flex-1 py-2 text-center border border-outline-variant text-on-surface-variant hover:bg-surface-container text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Học thử
                    </Link>
                    
                    {isOwn ? (
                      <Link
                        to={`/deck/${deck.id}`}
                        className="flex-1 py-2 text-center text-white bg-primary hover:bg-primary-container text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                      >
                        Vào xem
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleFork(deck.id)}
                        disabled={forkMutation.isPending && forkMutation.variables === deck.id}
                        className="flex-1 py-2 text-center text-on-secondary hover:bg-secondary-dim disabled:opacity-60 transition-colors text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                        style={{ background: 'var(--secondary)' }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {forkMutation.isPending && forkMutation.variables === deck.id ? 'Đang lưu...' : 'Lưu lại'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
