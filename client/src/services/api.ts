import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
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
  async (config: InternalAxiosRequestConfig) => {
    const { token, isAuthenticated } = useAuthStore.getState();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (isAuthenticated) {
      // If authenticated but no token, this is a problem
      console.error('API request made without token despite being authenticated. Request may fail.');
      // You could potentially reject the request here or try to get a token
      // For now, let it proceed and let the server return 401
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
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const { isAuthenticated } = useAuthStore.getState();
      
      if (isAuthenticated) {
        console.log('401 error but user is authenticated, might be missing token');
        // Don't logout immediately, let the auth provider handle token recovery
        // The token check interval should fix this
        return Promise.reject(error);
      } else {
        console.log('401 error - Token expired or invalid, clearing auth state');
        useAuthStore.getState().logout();
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;