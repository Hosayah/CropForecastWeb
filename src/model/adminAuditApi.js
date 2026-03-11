import axios from 'axios';
import { API_BASES } from './apiBase';

const api = axios.create({
  baseURL: API_BASES.adminAuditLogs,
  withCredentials: true
});

export const listAuditLogsApi = () => api.get('');

export default api;
