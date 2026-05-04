import api from './axios';

export const flashcardApi = {
  // Deck APIs
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

  // Card APIs
  createCard: async (deckId, data) => {
    const response = await api.post(`/flashcards/${deckId}/cards`, data);
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

  // SRS APIs
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

  // Import Anki APIs
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
