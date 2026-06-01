import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashcardApi } from '../api/flashcardApi';

const JLPT_LEVELS = [5, 4, 3, 2, 1];

function CardModal({ isOpen, onClose, onSave, card }) {
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-up">
      <div className="bg-surface-container-lowest border border-outline-variant/40 sharp-shadow p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="font-headline text-lg font-bold text-on-surface mb-4 border-b border-outline-variant/20 pb-2">
          {card ? 'Sửa thẻ ghi nhớ' : 'Thêm thẻ mới'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Tiếng Nhật (mặt trước) *
            </label>
            <input
              type="text"
              required
              value={formData.front}
              onChange={(e) => setFormData({ ...formData, front: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface text-on-surface border border-outline-variant/60 focus:outline-none focus:border-secondary transition-colors"
              placeholder="Ví dụ: こんにちは"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Nghĩa tiếng Việt (mặt sau) *
            </label>
            <input
              type="text"
              required
              value={formData.back}
              onChange={(e) => setFormData({ ...formData, back: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface text-on-surface border border-outline-variant/60 focus:outline-none focus:border-secondary transition-colors"
              placeholder="Ví dụ: Xin chào"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Romaji (cách đọc)
            </label>
            <input
              type="text"
              value={formData.romaji}
              onChange={(e) => setFormData({ ...formData, romaji: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface text-on-surface border border-outline-variant/60 focus:outline-none focus:border-secondary transition-colors"
              placeholder="Ví dụ: Konnichiwa"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Ví dụ câu
            </label>
            <textarea
              value={formData.example}
              onChange={(e) => setFormData({ ...formData, example: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface text-on-surface border border-outline-variant/60 focus:outline-none focus:border-secondary transition-colors"
              rows={2}
              placeholder="Ví dụ: こんにちは！元気ですか？"
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
    </div>
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

  return (
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
    </div>
  );
}

export default function DeckDetailPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddCard, setShowAddCard] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [showEditDeck, setShowEditDeck] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Lấy thông tin deck
  const { data: deck, isLoading } = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => flashcardApi.getDeck(deckId),
  });

  // Lấy stats
  const { data: stats } = useQuery({
    queryKey: ['deckStats', deckId],
    queryFn: () => flashcardApi.getDeckStats(deckId),
  });

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
  const filteredCards = deck?.cards?.filter((card) => {
    const search = searchTerm.toLowerCase();
    return (
      card.front.toLowerCase().includes(search) ||
      card.back.toLowerCase().includes(search) ||
      card.romaji?.toLowerCase().includes(search)
    );
  });

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
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white mb-3 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại
            </button>
            <h1 className="font-headline text-2xl md:text-3xl font-bold tracking-tight">{deck.name}</h1>
            {deck.description && (
              <p className="text-white/60 text-xs mt-1.5 max-w-lg leading-relaxed">{deck.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
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
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-surface-container-lowest p-4 text-center border border-outline-variant/30 sharp-shadow-sm">
            <div className="text-2xl font-black text-on-surface leading-none">{stats.totalCards}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mt-1.5">Tổng thẻ</div>
          </div>
          <div className="bg-surface-container-lowest p-4 text-center border border-outline-variant/30 border-t-2 border-t-blue-500 sharp-shadow-sm">
            <div className="text-2xl font-black text-blue-600 leading-none">{stats.newCards}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mt-1.5">Mới</div>
          </div>
          <div className="bg-surface-container-lowest p-4 text-center border border-outline-variant/30 border-t-2 border-t-amber-500 sharp-shadow-sm">
            <div className="text-2xl font-black text-amber-600 leading-none">{stats.learning}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mt-1.5">Đang học</div>
          </div>
          <div className="bg-surface-container-lowest p-4 text-center border border-outline-variant/30 border-t-2 border-t-green-600 sharp-shadow-sm">
            <div className="text-2xl font-black text-green-600 leading-none">{stats.review}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mt-1.5">Ôn tập</div>
          </div>
          <div className="bg-surface-container-lowest p-4 text-center border border-outline-variant/30 border-t-2 border-t-purple-600 sharp-shadow-sm">
            <div className="text-2xl font-black text-purple-600 leading-none">{stats.mastered}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mt-1.5">Thành thạo</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/study/${deckId}?mode=normal`}
            className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Học thường
          </Link>
          <Link
            to={`/study/${deckId}?mode=srs`}
            className="px-4 py-2 bg-secondary hover:bg-secondary-dim text-on-secondary text-xs font-bold uppercase tracking-wider transition-colors"
            style={{ background: 'var(--secondary)' }}
          >
            Học SRS ({stats?.dueToday || 0})
          </Link>
          <Link
            to={`/quiz/${deckId}`}
            className="px-4 py-2 border border-outline-variant bg-surface hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            Làm Quiz
          </Link>
          <Link
            to={`/exercises/${deckId}`}
            className="px-4 py-2 border border-outline-variant bg-surface hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Bài tập
          </Link>
          <Link
            to={`/lesson/${deckId}`}
            className="px-4 py-2 border border-outline-variant bg-surface hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Học bài
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant pointer-events-none"
              fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.34-4.34"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm thẻ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant focus:outline-none w-48 sm:w-60"
              style={{ border: '1px solid rgba(0,0,0,0.12)' }}
            />
          </div>
          <button
            onClick={() => setShowAddCard(true)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-secondary hover:bg-secondary-dim transition-colors flex items-center gap-1.5"
            style={{ background: 'var(--secondary)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Thêm thẻ
          </button>
        </div>
      </div>

      {/* Card List */}
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
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Tiếng Nhật</th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Romaji</th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Nghĩa tiếng Việt</th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-24">Cấp độ</th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-28">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredCards?.map((card, index) => (
                  <tr key={card.id} className="hover:bg-surface-container/20 transition-colors">
                    <td className="px-6 py-4 text-xs font-semibold text-on-surface-variant tabular-nums">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-jp font-bold text-xl text-on-surface">{card.front}</div>
                      {card.example && (
                        <div className="text-xs text-on-surface-variant mt-1 max-w-md leading-relaxed">{card.example}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{card.romaji || '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-on-surface">{card.back}</td>
                    <td className="px-6 py-4">
                      {card.jlptLevel && (
                        <span className="px-2.5 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                          N{card.jlptLevel}
                        </span>
                      )}
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddCard && (
        <CardModal
          isOpen={showAddCard}
          onClose={() => setShowAddCard(false)}
          onSave={createCardMutation.mutate}
          deckId={deckId}
        />
      )}

      {editingCard && (
        <CardModal
          isOpen={!!editingCard}
          onClose={() => setEditingCard(null)}
          onSave={(data) => updateCardMutation.mutate({ cardId: editingCard.id, data })}
          card={editingCard}
          deckId={deckId}
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
    </div>
  );
}

