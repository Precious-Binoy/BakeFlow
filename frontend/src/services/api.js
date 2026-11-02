import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Global response interceptor for auth errors
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Only redirect if not already on the login page and not an auth check/login request
      const isAuthUrl = err.config?.url?.includes('/auth/login') || err.config?.url?.includes('/auth/me');
      if (!isAuthUrl && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
