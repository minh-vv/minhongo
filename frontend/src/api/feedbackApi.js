import api from './axios';

export const feedbackApi = {
  // User: gửi feedback mới (multipart/form-data)
  submit: async (formData) => {
    const response = await api.post('/feedback', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // User: xem feedback của mình
  getMine: async ({ page = 1, limit = 10 } = {}) => {
    const response = await api.get(`/feedback/mine?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Admin: lấy tất cả feedback
  getAll: async ({ page = 1, limit = 20, type = 'all', status = 'all' } = {}) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (type !== 'all') params.set('type', type);
    if (status !== 'all') params.set('status', status);
    const response = await api.get(`/admin/feedbacks?${params.toString()}`);
    return response.data;
  },

  // Admin: thống kê
  getStats: async () => {
    const response = await api.get('/admin/feedbacks/stats');
    return response.data;
  },

  // Admin: cập nhật feedback
  update: async (id, payload) => {
    const response = await api.patch(`/admin/feedbacks/${id}`, payload);
    return response.data;
  },

  // Admin: xóa feedback
  remove: async (id) => {
    const response = await api.delete(`/admin/feedbacks/${id}`);
    return response.data;
  },

  // User & Admin: gửi phản hồi/comment
  addComment: async (id, message) => {
    const response = await api.post(`/feedback/${id}/comment`, { message });
    return response.data;
  },
};
