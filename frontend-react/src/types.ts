export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Link {
  id: number;
  user_id: number;
  url: string;
  title: string;
  description?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface LinksResponse {
  success: boolean;
  count: number;
  links: Link[];
}

export interface ConfigResponse {
  success: boolean;
  googleClientId: string;
}
