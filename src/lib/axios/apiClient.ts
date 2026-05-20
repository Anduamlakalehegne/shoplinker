import axios from 'axios';

/**
 * Axios client for same-origin API routes from the browser.
 * StarPay secrets are never sent from here — only internal /api/* calls.
 */
const apiClient = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
