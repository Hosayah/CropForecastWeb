import axios from 'axios';
import { API_BASES } from './apiBase';

const api = axios.create({
  baseURL: API_BASES.adminSystemConfig,
  withCredentials: true
});

export const getSystemConfigApi = () => api.get('');
export const updateSystemConfigApi = (data) => api.patch('', data);

export default api;
