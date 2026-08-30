import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cleantrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cleantrack_token');
      localStorage.removeItem('cleantrack_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ─── Requests ──────────────────────────────
export const requestsAPI = {
  create: (data) => api.post('/requests', data),
  getAll: (params) => api.get('/requests', { params }),
  getById: (id) => api.get(`/requests/${id}`),
  assign: (id, staffId) => api.patch(`/requests/${id}/assign`, { staffId }),
  start: (id) => api.patch(`/requests/${id}/start`),
  complete: (id) => api.patch(`/requests/${id}/complete`),
  fail: (id, data) => api.patch(`/requests/${id}/fail`, data),
  close: (id) => api.patch(`/requests/${id}/close`),
  reraise: (id, data) => api.post(`/requests/${id}/reraise`, data),
};

// ─── Blocks ────────────────────────────────
export const blocksAPI = {
  getAll: () => api.get('/blocks'),
};

// ─── Users ─────────────────────────────────
export const usersAPI = {
  getStaff: (blockId) => api.get('/users/staff', { params: { blockId } }),
};

export default api;
