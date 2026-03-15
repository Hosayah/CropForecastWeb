import { createApiClient } from './createApiClient';

const api = createApiClient('adminAuditLogs');

export const listAuditLogsApi = (params = {}) => api.get('', { params });

export default api;
