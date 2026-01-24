import axios from 'axios';
import { API_URL } from './types';
import type { AuthResponse, LinksResponse, Link, ConfigResponse } from './types';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  
  register: (username: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { username, email, password }),
  
  googleAuth: (credential: string) =>
    api.post<AuthResponse>('/auth/google', { credential }),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
  
  getConfig: () =>
    api.get<ConfigResponse>('/config'),
};

// Links APIs
export const linksAPI = {
  getAll: (params?: { search?: string; category?: string; sortBy?: string }) =>
    api.get<LinksResponse>('/links', { params }),
  
  getOne: (id: number) =>
    api.get(`/links/${id}`),
  
  create: (link: Omit<Link, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
    api.post<{ success: boolean; message: string; link: Link }>('/links', link),
  
  update: (id: number, link: Omit<Link, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
    api.put<{ success: boolean; message: string; link: Link }>(`/links/${id}`, link),
  
  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/links/${id}`),
  
  getCategories: () =>
    api.get<{ success: boolean; categories: string[] }>('/links/categories/list'),
};

export default api;
