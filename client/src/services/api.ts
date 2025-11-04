import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { useAuthStore } from '@/stores/authStore';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      // console.log('401 error - Token expired or invalid, clearing auth state');
      useAuthStore.getState().logout();
      // Don't redirect here - let Auth0 handle it naturally
      // The app will show LoginPage when isAuthenticated becomes false
    }
    return Promise.reject(error);
  }
);

export default api;