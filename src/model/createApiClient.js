import axios from 'axios';
import { API_BASES } from './apiBase';

let refreshPromise = null;
let maintenanceEventDispatched = false;

function shouldBypassRefresh(url = '') {
  return url.includes('/login') || url.includes('/register') || url.includes('/refresh') || url.includes('/logout');
}

export function createApiClient(baseURL) {
  const client = axios.create({
    baseURL,
    withCredentials: true
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error?.config;
      const status = error?.response?.status;
      const requestPath = originalRequest?.url || '';
      const errorMessage = String(error?.response?.data?.error || '').toLowerCase();

      if (status === 503 && errorMessage.includes('maintenance')) {
        if (!maintenanceEventDispatched && typeof window !== 'undefined') {
          maintenanceEventDispatched = true;
          window.dispatchEvent(
            new CustomEvent('agrisense:maintenance-mode', {
              detail: { message: error?.response?.data?.error || 'System is under maintenance' }
            })
          );
        }
        return Promise.reject(error);
      }

      if (status !== 401 || !originalRequest || originalRequest._retry || shouldBypassRefresh(requestPath)) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASES.auth}/refresh`, {}, { withCredentials: true })
            .finally(() => {
              refreshPromise = null;
            });
        }
        await refreshPromise;
        return client(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
  );

  return client;
}
