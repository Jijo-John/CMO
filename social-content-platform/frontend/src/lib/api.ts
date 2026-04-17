import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentBusinessId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  register: (email: string, password: string, fullName: string) =>
    api.post('/api/auth/register', { email, password, fullName }),
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (data: { fullName?: string; avatarUrl?: string }) =>
    api.put('/api/auth/profile', data),
};

// Business APIs
export const businessApi = {
  getAll: () => api.get('/api/businesses'),
  getById: (id: string) => api.get(`/api/businesses/${id}`),
  create: (name: string, logoUrl?: string) =>
    api.post('/api/businesses', { name, logoUrl }),
  update: (id: string, data: { name?: string; logoUrl?: string }) =>
    api.put(`/api/businesses/${id}`, data),
  delete: (id: string) => api.delete(`/api/businesses/${id}`),
  getMembers: (id: string) => api.get(`/api/businesses/${id}/members`),
  inviteUser: (businessId: string, email: string, role: string) =>
    api.post(`/api/businesses/${businessId}/invite`, { email, role }),
  updateUserRole: (businessId: string, userId: string, role: string) =>
    api.put(`/api/businesses/${businessId}/users/${userId}/role`, { role }),
  removeUser: (businessId: string, userId: string) =>
    api.delete(`/api/businesses/${businessId}/users/${userId}`),
};

// Content APIs
export const contentApi = {
  getAll: (businessId: string, params?: { status?: string; platform?: string; search?: string; page?: number; limit?: number }) =>
    api.get(`/api/businesses/${businessId}/content`, { params }),
  getById: (businessId: string, id: string) =>
    api.get(`/api/businesses/${businessId}/content/${id}`),
  create: (businessId: string, data: { title: string; caption?: string; hashtags?: string[]; scheduledDate?: string; platformIds?: string[] }) =>
    api.post(`/api/businesses/${businessId}/content`, data),
  update: (businessId: string, id: string, data: { title?: string; caption?: string; hashtags?: string[]; scheduledDate?: string }) =>
    api.put(`/api/businesses/${businessId}/content/${id}`, data),
  delete: (businessId: string, id: string) =>
    api.delete(`/api/businesses/${businessId}/content/${id}`),
  submitForReview: (businessId: string, id: string) =>
    api.post(`/api/businesses/${businessId}/content/${id}/submit-review`),
  approve: (businessId: string, id: string) =>
    api.post(`/api/businesses/${businessId}/content/${id}/approve`),
  reject: (businessId: string, id: string, reason: string) =>
    api.post(`/api/businesses/${businessId}/content/${id}/reject`, { reason }),
  markAsPosted: (businessId: string, id: string, platformIds?: string[]) =>
    api.post(`/api/businesses/${businessId}/content/${id}/mark-posted`, { platformIds }),
};

// Media APIs
export const mediaApi = {
  upload: (businessId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/businesses/${businessId}/media/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: (businessId: string, params?: { type?: string; page?: number; limit?: number }) =>
    api.get(`/api/businesses/${businessId}/media`, { params }),
  getById: (id: string) => api.get(`/api/media/${id}`),
  download: (id: string) => api.get(`/api/media/${id}/download`, { responseType: 'blob' }),
  delete: (businessId: string, id: string) =>
    api.delete(`/api/businesses/${businessId}/media/${id}`),
};

// Platform APIs
export const platformApi = {
  getAll: () => api.get('/api/platforms'),
  getById: (id: string) => api.get(`/api/platforms/${id}`),
};

export default api;
