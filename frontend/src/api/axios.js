import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('parkora_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('parkora_token')) {
      localStorage.removeItem('parkora_token');
      localStorage.removeItem('parkora_user');
      window.dispatchEvent(new Event('parkora:logout'));
    }
    return Promise.reject(err);
  },
);

/** Extracts a human-readable message from an Axios error. */
export const errMsg = (err) =>
  err.response?.data?.errors?.map((e) => `${e.field}: ${e.message}`).join(', ') ||
  err.response?.data?.message ||
  err.message ||
  'Something went wrong';

export default api;
