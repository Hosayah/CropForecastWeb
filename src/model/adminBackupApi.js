import { createApiClient } from './createApiClient';

const api = createApiClient('adminBackups');

export const listBackupsApi = (params = {}) => api.get('', { params });
export const createBackupApi = (payload) => api.post('', payload);
export const restoreBackupApi = (id) => api.post(`/${id}/restore`);
export const deleteBackupApi = (id) => api.delete(`/${id}`);
export const downloadBackupApi = (id) => api.get(`/${id}/download`, { responseType: 'blob' });

export default api;
