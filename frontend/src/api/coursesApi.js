import api from './axios';

export const coursesApi = {
  // ========== COURSES ==========

  listCourses: async () => {
    const response = await api.get('/courses');
    return response.data;
  },

  getCourse: async (slug) => {
    const response = await api.get(`/courses/${slug}`);
    return response.data;
  },

  enroll: async (slug, { targetDate, goal } = {}) => {
    const response = await api.post(`/courses/${slug}/enroll`, {
      targetDate: targetDate || undefined,
      goal: goal || undefined,
    });
    return response.data;
  },

  myCourses: async () => {
    const response = await api.get('/me/courses');
    return response.data;
  },

  getCurrentLesson: async () => {
    const response = await api.get('/me/current-lesson');
    return response.data;
  },

  // ========== LESSONS ==========

  getLesson: async (lessonId) => {
    const response = await api.get(`/lessons/${lessonId}`);
    return response.data;
  },

  startLesson: async (lessonId) => {
    const response = await api.post(`/lessons/${lessonId}/start`);
    return response.data;
  },

  completeLesson: async (lessonId, score) => {
    const response = await api.post(`/lessons/${lessonId}/complete`, { score });
    return response.data;
  },
};
