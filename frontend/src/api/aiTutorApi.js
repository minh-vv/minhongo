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
};

export default aiTutorApi;
