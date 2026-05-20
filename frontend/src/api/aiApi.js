import axiosClient from './axios';

export const aiApi = {
  generateRoadmap: async (dto) => {
    const res = await axiosClient.post('/ai-roadmap/generate', dto);
    return res.data;
  },
  getMyRoadmaps: async () => {
    const res = await axiosClient.get('/ai-roadmap/my-roadmaps');
    return res.data;
  },
  getRoadmapById: async (id) => {
    const res = await axiosClient.get(`/ai-roadmap/${id}`);
    return res.data;
  },
  completeItem: async (itemId) => {
    const res = await axiosClient.patch(`/ai-roadmap/items/${itemId}/complete`);
    return res.data;
  },
  deleteRoadmap: async (id) => {
    const res = await axiosClient.delete(`/ai-roadmap/${id}`);
    return res.data;
  },
};
