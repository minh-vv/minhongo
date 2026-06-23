import api from './axios';

export const flashcardApi = {
  // ========== DECK APIs ==========

  getDecks: async () => {
    const response = await api.get('/flashcards');
    return response.data;
  },

  getPublicDecks: async () => {
    const response = await api.get('/flashcards/public');
    return response.data;
  },

  getPublicDeck: async (deckId) => {
    const response = await api.get(`/flashcards/public/${deckId}`);
    return response.data;
  },

  getDeck: async (deckId) => {
    const response = await api.get(`/flashcards/${deckId}`);
    return response.data;
  },

  createDeck: async (data) => {
    const response = await api.post('/flashcards', data);
    return response.data;
  },

  updateDeck: async (deckId, data) => {
    const response = await api.put(`/flashcards/${deckId}`, data);
    return response.data;
  },

  deleteDeck: async (deckId) => {
    const response = await api.delete(`/flashcards/${deckId}`);
    return response.data;
  },

  /**
   * Toggle trạng thái công khai của deck (chỉ chủ sở hữu).
   * @param {string} deckId
   * @param {boolean} isPublic - true: publish ra cộng đồng, false: chuyển về private
   */
  publishDeck: async (deckId, isPublic) => {
    const response = await api.patch(`/flashcards/${deckId}/publish`, { isPublic });
    return response.data;
  },

  /**
   * Clone một deck công khai về thư viện cá nhân.
   * @param {string} deckId - ID của deck công khai cần clone
   */
  cloneDeck: async (deckId) => {
    const response = await api.post(`/flashcards/${deckId}/clone`);
    return response.data;
  },

  // ========== CARD APIs ==========

  createCard: async (deckId, data) => {
    const response = await api.post(`/flashcards/${deckId}/cards`, data);
    return response.data;
  },

  createCardsBulk: async (deckId, cards) => {
    const response = await api.post(`/flashcards/${deckId}/cards/bulk`, { cards });
    return response.data;
  },

  updateCard: async (cardId, data) => {
    const response = await api.put(`/flashcards/cards/${cardId}`, data);
    return response.data;
  },

  deleteCard: async (cardId) => {
    const response = await api.delete(`/flashcards/cards/${cardId}`);
    return response.data;
  },

  // ========== STATS APIs ==========

  getStudyHistory: async (days = 30) => {
    const response = await api.get(`/flashcards/stats/history?days=${days}`);
    return response.data;
  },

  getGamificationSummary: async () => {
    const response = await api.get('/flashcards/stats/gamification');
    return response.data;
  },

  getLeaderboard: async (days = 30, limit = 20) => {
    const response = await api.get(`/flashcards/stats/leaderboard?days=${days}&limit=${limit}`);
    return response.data;
  },

  // ========== SRS APIs ==========

  getDueCards: async (deckId) => {
    const response = await api.get(`/flashcards/${deckId}/due`);
    return response.data;
  },

  getDeckStats: async (deckId) => {
    const response = await api.get(`/flashcards/${deckId}/stats`);
    return response.data;
  },

  reviewCard: async (cardId, quality) => {
    const response = await api.post(`/flashcards/cards/${cardId}/review`, { quality });
    return response.data;
  },

  toggleStarCard: async (cardId) => {
    const response = await api.post(`/flashcards/cards/${cardId}/star`);
    return response.data;
  },

  // ========== IMPORT ANKI APIs ==========

  previewAnkiFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/flashcards/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  importAnkiFile: async (file, options) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deckName', options.deckName);
    formData.append('description', options.description || '');
    formData.append('frontField', options.frontField || '');
    formData.append('backField', options.backField || '');
    formData.append('romajiField', options.romajiField || '');
    formData.append('exampleField', options.exampleField || '');
    if (options.isPublic !== undefined) formData.append('isPublic', String(options.isPublic));
    if (options.category)   formData.append('category', options.category);
    if (options.jlptLevel)  formData.append('jlptLevel', String(options.jlptLevel));
    const response = await api.post('/flashcards/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
