import api from './axios';

export const adminApi = {
  // Dashboard stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // User management
  getUsers: async ({ search = '', page = 1, limit = 20, status = 'all' } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (status !== 'all') params.set('status', status);
    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  },

  toggleBlockUser: async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/toggle-block`);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Nội dung (deck)
  getDecks: async ({
    search = '',
    page = 1,
    limit = 20,
    visibility = 'all',
    category = '',
  } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (visibility !== 'all') params.set('visibility', visibility);
    if (category) params.set('category', category);
    const response = await api.get(`/admin/decks?${params.toString()}`);
    return response.data;
  },

  updateDeck: async (deckId, payload) => {
    const response = await api.patch(`/admin/decks/${deckId}`, payload);
    return response.data;
  },

  deleteDeck: async (deckId) => {
    const response = await api.delete(`/admin/decks/${deckId}`);
    return response.data;
  },

  // Cấu hình hệ thống
  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  patchSettings: async (payload) => {
    const response = await api.patch('/admin/settings', payload);
    return response.data;
  },
};
