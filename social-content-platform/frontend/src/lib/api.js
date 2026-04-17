export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

import axios from 'axios';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const businessId = localStorage.getItem('selectedBusinessId');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      if (businessId && !config.url?.startsWith('/auth')) {
        config.headers['X-Business-ID'] = businessId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

export const businessAPI = {
  getAll: () => api.get('/businesses'),
  create: (data) => api.post('/businesses', data),
  getById: (id) => api.get(`/businesses/${id}`),
  update: (id, data) => api.put(`/businesses/${id}`, data),
  delete: (id) => api.delete(`/businesses/${id}`),
};

export const contentAPI = {
  getAll: (params) => api.get('/content', { params }),
  getById: (id) => api.get(`/content/${id}`),
  create: (data) => api.post('/content', data),
  update: (id, data) => api.put(`/content/${id}`, data),
  delete: (id) => api.delete(`/content/${id}`),
  submitForReview: (id) => api.post(`/content/${id}/submit`),
  approve: (id) => api.post(`/content/${id}/approve`),
  reject: (id, reason) => api.post(`/content/${id}/reject`, { reason }),
  markAsPosted: (id) => api.post(`/content/${id}/mark-posted`),
};

export const mediaAPI = {
  getAll: (params) => api.get('/media', { params }),
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/media/${id}`),
};

export const userAPI = {
  getTeamMembers: () => api.get('/users'),
  inviteMember: (email, role) => api.post('/users/invite', { email, role }),
  updateRole: (userId, role) => api.put(`/users/${userId}/role`, { role }),
  removeMember: (userId) => api.delete(`/users/${userId}`),
  acceptInvitation: (token) => api.post('/users/accept-invitation', { token }),
};

export default api;
