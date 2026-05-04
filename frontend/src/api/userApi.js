import api from './axios';

export const userApi = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateProfile: async ({ name, learningGoal }) => {
    const response = await api.patch('/users/me', { name, learningGoal });
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.patch('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  removeAvatar: async () => {
    const response = await api.delete('/users/me/avatar');
    return response.data;
  },
};
