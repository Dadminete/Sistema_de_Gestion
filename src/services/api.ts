import axios from 'axios';

// Get dynamic API base URL
const getAPIBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    const trimmed = envUrl.replace(/\/$/, '');
    return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
  }
  // Fallback to dynamic detection
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol.replace(':', '');
  return `${protocol}://${hostname}${port}/api`;
};

const NORMALIZED_BASE = getAPIBaseURL();

const api = axios.create({
  baseURL: NORMALIZED_BASE,
});

api.interceptors.request.use(config => {
  // Try to get the token from either localStorage or sessionStorage
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

export default api;
