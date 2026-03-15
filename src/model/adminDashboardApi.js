import { createApiClient } from './createApiClient';

const api = createApiClient('adminDashboard');

export const getAdminDashboardCompactApi = (module = 'ALL') => api.get('/compact', { params: { module } });

export const getAdminDashboardSummaryApi = () => api.get('/summary');

export const getAdminDashboardActivityApi = (module = 'ALL', limit = 5) =>
  api.get('/activity', { params: { module, limit } });

export default api;
