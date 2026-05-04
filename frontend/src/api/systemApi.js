import api from './axios';

/** Cấu hình công khai — không cần đăng nhập */
export const systemApi = {
  getPublicConfig: async () => {
    const { data } = await api.get('/system/public-config');
    return data;
  },
};
