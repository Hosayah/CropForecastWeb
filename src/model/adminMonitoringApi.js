import axios from 'axios';
import { API_BASES } from './apiBase';

const api = axios.create({
  baseURL: API_BASES.adminMonitoring,
  withCredentials: true
});

export const getLiveMonitoringApi = () => api.get('/live');

export const getCombinedLiveMonitoringApi = async () => {
  const response = await api.get('/combined');
  return response.data;
};

export default api;
