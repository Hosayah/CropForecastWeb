import axios from 'axios';
import { API_BASES } from './apiBase';

const api = axios.create({
  baseURL: API_BASES.adminBackups,
  withCredentials: true
});

export const listBackupsApi = () => api.get('');
export const createBackupApi = (payload) => api.post('', payload);
export const restoreBackupApi = (id) => api.post(`/${id}/restore`);
export const deleteBackupApi = (id) => api.delete(`/${id}`);
export const downloadBackupApi = (id) => api.get(`/${id}/download`, { responseType: 'blob' });

export default api;
