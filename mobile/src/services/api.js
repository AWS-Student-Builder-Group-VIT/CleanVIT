import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://clean-vit.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('cleantrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Error reading token:', e);
  }
  return config;
});

// Handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['cleantrack_token', 'cleantrack_user']);
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
  updatePushToken: (token) => api.put('/users/push-token', { token }),
};

export default api;
