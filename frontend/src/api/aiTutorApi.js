import axiosInstance from './axios';

const aiTutorApi = {
  /**
   * Yêu cầu AI giải thích chi tiết một cụm từ, câu hoặc điểm ngữ pháp
   * @param {Object} data - { text, context }
   */
  explain: async (data) => {
    const response = await axiosInstance.post('/ai-tutor/explain', data);
    return response.data;
  },

  /**
   * AI Đánh giá câu trả lời của user (đúng sai, gợi ý sửa lỗi)
   * @param {Object} data - { userAnswer, question, expectedAnswer }
   */
  evaluate: async (data) => {
    const response = await axiosInstance.post('/ai-tutor/evaluate', data);
    return response.data;
  },

  /**
   * Gửi tin nhắn luyện chat với AI
   * @param {Object} data - { history: [{role, parts}], message }
   */
  chat: async (data) => {
    const response = await axiosInstance.post('/ai-tutor/chat', data);
    return response.data;
  },

  /**
   * Tạo ví dụ mới cho ngữ pháp từ AI
   * @param {Object} data - { grammarStructure, meaning }
   */
  grammarExample: async (data) => {
    const response = await axiosInstance.post('/ai-tutor/grammar-example', data);
    return response.data;
  },

  /**
   * Lấy lịch sử luyện tập của thẻ ngữ pháp
   * @param {string} cardId
   */
  getPracticeHistory: async (cardId) => {
    const response = await axiosInstance.get(`/ai-tutor/practice-history/${cardId}`);
    return response.data;
  },

  /**
   * Ghim/Lưu câu ví dụ từ AI vào cơ sở dữ liệu
   * @param {Object} data - { cardId, japanese, romaji, vietnamese }
   */
  saveExample: async (data) => {
    const response = await axiosInstance.post('/ai-tutor/save-example', data);
    return response.data;
  },

  /**
   * Xóa câu ví dụ đã lưu
   * @param {string} id
   */
  deleteSavedExample: async (id) => {
    const response = await axiosInstance.delete(`/ai-tutor/save-example/${id}`);
    return response.data;
  },

  /**
   * Lấy danh sách ví dụ đã lưu của thẻ ngữ pháp
   * @param {string} cardId
   */
  getSavedExamples: async (cardId) => {
    const response = await axiosInstance.get(`/ai-tutor/saved-examples/${cardId}`);
    return response.data;
  },
};

export default aiTutorApi;
