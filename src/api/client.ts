import axios from 'axios';

// URL API backend.
// - Production (Vercel): set VITE_API_URL di project settings, mis.
//   https://survey-api.vercel.app  → request ke https://survey-api.vercel.app/api/...
// - Development: biarkan kosong → pakai proxy dev Vite ('/api' → localhost:4000).
const API_URL = import.meta.env.VITE_API_URL ?? '';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalid/expired — clear session & redirect
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export interface ApiResponse<T> {
  data: T;
}
