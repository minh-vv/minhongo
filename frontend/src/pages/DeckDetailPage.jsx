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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {card ? 'Sửa thẻ' : 'Thêm thẻ mới'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiếng Nhật (mặt trước) *
            </label>
            <input
              type="text"
              required
              value={formData.front}
              onChange={(e) => setFormData({ ...formData, front: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ví dụ: こんにちは"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nghĩa tiếng Việt (mặt sau) *
            </label>
            <input
              type="text"
              required
              value={formData.back}
              onChange={(e) => setFormData({ ...formData, back: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ví dụ: Xin chào"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Romaji (cách đọc)
            </label>
            <input
              type="text"
              value={formData.romaji}
              onChange={(e) => setFormData({ ...formData, romaji: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ví dụ: Konnichiwa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ví dụ câu
            </label>
            <textarea
              value={formData.example}
              onChange={(e) => setFormData({ ...formData, example: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Ví dụ: こんにちは！元気ですか？"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cấp độ JLPT
            </label>
            <select
              value={formData.jlptLevel}
              onChange={(e) => setFormData({ ...formData, jlptLevel: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn cấp độ</option>
              {JLPT_LEVELS.map((level) => (
                <option key={level} value={level}>
                  JLPT N{level}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {card ? 'Lưu' : 'Thêm'}
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Chỉnh sửa bộ thẻ</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên bộ thẻ *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              Công khai (người khác có thể học)
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">Không tìm thấy bộ thẻ!</p>
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Quay lại Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{deck.name}</h1>
                {deck.description && (
                  <p className="text-sm text-gray-500">{deck.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditDeck(true)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Chỉnh sửa
              </button>
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc muốn xóa bộ thẻ này?')) {
                    deleteDeckMutation.mutate();
                  }
                }}
                className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalCards}</div>
              <div className="text-sm text-gray-500">Tổng thẻ</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.newCards}</div>
              <div className="text-sm text-blue-500">Mới</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.learning}</div>
              <div className="text-sm text-orange-500">Đang học</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.review}</div>
              <div className="text-sm text-green-500"> Ôn tập</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.mastered}</div>
              <div className="text-sm text-purple-500">Thành thạo</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="max-w-6xl mx-auto px-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/study/${deckId}?mode=normal`}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Học thường
            </Link>
            <Link
              to={`/study/${deckId}?mode=srs`}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Học SRS ({stats?.dueToday || 0})
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm thẻ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowAddCard(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm thẻ
            </button>
          </div>
        </div>
      </div>

      {/* Card List */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredCards?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm ? 'Không tìm thấy thẻ nào.' : 'Chưa có thẻ nào. Thêm thẻ để bắt đầu học!'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiếng Nhật</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Romaji</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nghĩa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">JLPT</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCards?.map((card, index) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{card.front}</div>
                      {card.example && (
                        <div className="text-sm text-gray-500 mt-1">{card.example}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{card.romaji || '-'}</td>
                    <td className="px-6 py-4 text-gray-900">{card.back}</td>
                    <td className="px-6 py-4">
                      {card.jlptLevel && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                          N{card.jlptLevel}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingCard(card)}
                          className="p-2 text-gray-500 hover:text-blue-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Bạn có chắc muốn xóa thẻ này?')) {
                              deleteCardMutation.mutate(card.id);
                            }
                          }}
                          className="p-2 text-gray-500 hover:text-red-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      <CardModal
        isOpen={showAddCard}
        onClose={() => setShowAddCard(false)}
        onSave={createCardMutation.mutate}
        deckId={deckId}
      />

      <CardModal
        isOpen={!!editingCard}
        onClose={() => setEditingCard(null)}
        onSave={(data) => updateCardMutation.mutate({ cardId: editingCard.id, data })}
        card={editingCard}
        deckId={deckId}
      />

      <DeckEditModal
        isOpen={showEditDeck}
        onClose={() => setShowEditDeck(false)}
        onSave={updateDeckMutation.mutate}
        deck={deck}
      />
    </div>
  );
}
