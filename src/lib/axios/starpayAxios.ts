import axios from 'axios';

/**
 * Centralized Axios instance for external API calls (e.g. StarPay).
 * All requests go through this instance so interceptors apply globally.
 */
const axiosInstance = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token if present
axiosInstance.interceptors.request.use(
  (config) => {
    // Token injection is handled per-call from server-side context
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — just pass through
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default axiosInstance;
