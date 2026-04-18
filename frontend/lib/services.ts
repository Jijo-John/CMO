import { User, Business, Content, Platform, Media } from '@/types';
import api from './api';

// Auth API
export const authApi = {
  register: async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Business API
export const businessApi = {
  getBusinesses: async () => {
    const response = await api.get('/businesses');
    return response.data;
  },

  createBusiness: async (name: string, logo?: string) => {
    const response = await api.post('/businesses', { name, logo });
    return response.data;
  },

  getBusiness: async (businessId: string) => {
    const response = await api.get(`/businesses/${businessId}`);
    return response.data;
  },

  updateBusiness: async (businessId: string, data: { name?: string; logo?: string }) => {
    const response = await api.put(`/businesses/${businessId}`, data);
    return response.data;
  },

  deleteBusiness: async (businessId: string) => {
    const response = await api.delete(`/businesses/${businessId}`);
    return response.data;
  },

  getUsers: async (businessId: string) => {
    const response = await api.get(`/businesses/${businessId}/users`);
    return response.data;
  },

  inviteUser: async (businessId: string, email: string, role: string) => {
    const response = await api.post(`/businesses/${businessId}/users/invite`, { email, role });
    return response.data;
  },

  acceptInvite: async (token: string) => {
    const response = await api.post('/businesses/accept-invite', { token });
    return response.data;
  },

  updateUserRole: async (businessId: string, userId: string, role: string) => {
    const response = await api.put(`/businesses/${businessId}/users/${userId}/role`, { role });
    return response.data;
  },

  removeUser: async (businessId: string, userId: string) => {
    const response = await api.delete(`/businesses/${businessId}/users/${userId}`);
    return response.data;
  },
};

// Content API
export const contentApi = {
  getContent: async (businessId: string, params?: { status?: string; platform?: string; search?: string }) => {
    const response = await api.get(`/content/business/${businessId}`, { params });
    return response.data;
  },

  getContentItem: async (contentId: string) => {
    const response = await api.get(`/content/${contentId}`);
    return response.data;
  },

  createContent: async (businessId: string, data: {
    title: string;
    caption?: string;
    hashtags?: string;
    platformIds?: string[];
    mediaIds?: string[];
    scheduledDate?: string;
  }) => {
    const response = await api.post(`/content/business/${businessId}`, data);
    return response.data;
  },

  updateContent: async (contentId: string, data: Partial<Content>) => {
    const response = await api.put(`/content/${contentId}`, data);
    return response.data;
  },

  updateStatus: async (contentId: string, status: string) => {
    const response = await api.patch(`/content/${contentId}/status`, { status });
    return response.data;
  },

  deleteContent: async (contentId: string) => {
    const response = await api.delete(`/content/${contentId}`);
    return response.data;
  },

  getDashboardStats: async (businessId: string) => {
    const response = await api.get(`/content/dashboard/${businessId}/stats`);
    return response.data;
  },
};

// Media API
export const mediaApi = {
  getMedia: async (businessId: string, params?: { type?: string }) => {
    const response = await api.get(`/media/business/${businessId}`, { params });
    return response.data;
  },

  uploadMedia: async (businessId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/media/business/${businessId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteMedia: async (mediaId: string) => {
    const response = await api.delete(`/media/${mediaId}`);
    return response.data;
  },

  getPlatforms: async () => {
    const response = await api.get('/media/platforms');
    return response.data;
  },

  getCalendarEvents: async (businessId: string, params?: { year?: string; month?: string }) => {
    const response = await api.get(`/media/calendar/${businessId}/events`, { params });
    return response.data;
  },
};
