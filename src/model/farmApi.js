import { API_BASES } from './apiBase';
import { createApiClient } from './createApiClient';

const api = createApiClient(import.meta.env.VITE_API_BASE || API_BASES.farms);

export const listFarmsApi = () => api.get('/v1');
export const createFarmApi = (data) => api.post('/v1', data);
export const updateFarmApi = (id, data) => api.put(`/v1/${id}`, data);
export const deleteFarmApi = (id) => api.delete(`/v1/${id}`);

export default api;
