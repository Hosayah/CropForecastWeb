import axios from 'axios';
import { getNamespaceTarget, resolveApiBase } from './apiBase';

const refreshPromises = new Map();
let maintenanceEventDispatched = false;

function shouldBypassRefresh(url = '') {
  return url.includes('/login') || url.includes('/register') || url.includes('/refresh') || url.includes('/logout');
}

export function createApiClient(namespace, options = {}) {
  const forcedTarget = options.forcedTarget || null;
  const client = axios.create({
    baseURL: resolveApiBase(namespace, forcedTarget),
    withCredentials: true
  });

  client.interceptors.request.use((config) => {
    const resolvedTarget = getNamespaceTarget(namespace, forcedTarget);
    config.baseURL = resolveApiBase(namespace, resolvedTarget);
    config._agrisenseTarget = resolvedTarget;
    return config;
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
        const requestTarget = originalRequest?._agrisenseTarget || getNamespaceTarget(namespace, forcedTarget);
        if (!refreshPromises.has(requestTarget)) {
          const refreshPromise = axios
            .post(resolveApiBase('auth', requestTarget), {}, { withCredentials: true })
            .finally(() => {
              refreshPromises.delete(requestTarget);
            });
          refreshPromises.set(requestTarget, refreshPromise);
        }
        await refreshPromises.get(requestTarget);
        return client(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
  );

  return client;
}
