import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === 'development'
      ? import.meta.env.VITE_API_BASE_URL_DEV
      : import.meta.env.VITE_API_BASE_URL_PROD,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get the Auth0 token function that was exposed globally
    const getAccessTokenSilently = (window as any).__getAccessTokenSilently;

    if (getAccessTokenSilently) {
      try {
        const token = await getAccessTokenSilently();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to get access token:', error);
        // Let the request proceed without token, server will return 401
      }
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // If we get a 401 and haven't retried yet, try to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const getAccessTokenSilently = (window as any).__getAccessTokenSilently;

      if (getAccessTokenSilently) {
        try {
          // Force a fresh token (Auth0 will use refresh token if needed)
          const token = await getAccessTokenSilently({ cacheMode: 'off' });

          if (token) {
            // Retry the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Token refresh failed, user needs to re-authenticate
          // Redirect to login or let Auth0 handle it
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
