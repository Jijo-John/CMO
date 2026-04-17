import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) => 
    api.post('/auth/register', { email, password, name }),
  getMe: () => api.get('/auth/me'),
};

// Business APIs
export const businessAPI = {
  getAll: () => api.get('/businesses'),
  create: (name: string, logo?: string) => 
    api.post('/businesses', { name, logo }),
  getById: (id: string) => api.get(`/businesses/${id}`),
  update: (id: string, data: { name?: string; logo?: string }) => 
    api.put(`/businesses/${id}`, data),
  delete: (id: string) => api.delete(`/businesses/${id}`),
  getTeam: (id: string) => api.get(`/businesses/${id}/team`),
  inviteUser: (businessId: string, userId: string, role: string) => 
    api.post(`/businesses/${businessId}/team/invite`, { userId, role }),
  updateUserRole: (businessId: string, userId: string, role: string) => 
    api.put(`/businesses/${businessId}/team/${userId}/role`, { role }),
  removeUser: (businessId: string, userId: string) => 
    api.delete(`/businesses/${businessId}/team/${userId}`),
  getActivity: (id: string, limit?: number) => 
    api.get(`/businesses/${id}/activity?limit=${limit || 50}`),
};

// Platform APIs
export const platformAPI = {
  getAll: () => api.get('/platforms'),
  getById: (id: string) => api.get(`/platforms/${id}`),
};

// Content APIs
export const contentAPI = {
  getAll: (businessId: string, filters?: { status?: string; platformId?: string; search?: string }) => 
    api.get(`/businesses/${businessId}/content`, { params: filters }),
  getById: (id: string) => api.get(`/content/${id}`),
  create: (businessId: string, data: { title: string; caption?: string; hashtags?: string; platformIds?: string[] }) => 
    api.post(`/businesses/${businessId}/content`, data),
  update: (id: string, data: { title?: string; caption?: string; hashtags?: string; scheduled_date?: string }) => 
    api.put(`/content/${id}`, data),
  updateStatus: (id: string, status: string) => 
    api.patch(`/content/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/content/${id}`),
  addPlatform: (contentId: string, platformId: string, caption?: string) => 
    api.post(`/content/${contentId}/platforms/${platformId}`, { platformCaption: caption }),
  removePlatform: (contentId: string, platformId: string) => 
    api.delete(`/content/${contentId}/platforms/${platformId}`),
  updatePlatformCaption: (contentId: string, platformId: string, caption: string) => 
    api.put(`/content/${contentId}/platforms/${platformId}/caption`, { caption }),
  getStats: (businessId: string) => api.get(`/businesses/${businessId}/content/stats`),
  schedule: (contentId: string, scheduledDate: string) => 
    api.put(`/content/${contentId}/schedule`, { scheduledDate }),
};

// Media APIs
export const mediaAPI = {
  upload: (businessId: string, contentId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentId', contentId);
    return api.post(`/businesses/${businessId}/media/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: (businessId: string, search?: string) => 
    api.get(`/businesses/${businessId}/media`, { params: { search } }),
  download: (mediaId: string) => 
    api.get(`/media/${mediaId}/download`, { responseType: 'blob' }),
  delete: (mediaId: string, businessId: string) => 
    api.delete(`/media/${mediaId}`, { params: { businessId } }),
};

// Calendar APIs
export const calendarAPI = {
  getEvents: (businessId: string, params?: { year?: string; month?: string; view?: string }) => 
    api.get(`/businesses/${businessId}/calendar`, { params }),
};

export default api;
