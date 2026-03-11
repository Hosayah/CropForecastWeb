import { API_BASES } from './apiBase';
import { createApiClient } from './createApiClient';

const api = createApiClient(import.meta.env.VITE_API_BASE || API_BASES.recommendation);

export const farmRecommendationApi = (farmId, params = {}) =>
  api.get(`/v1/farms/${farmId}`, { params });

export const generateFarmRecommendationApi = (farmId, payload) =>
  api.post(`/v1/farms/${farmId}/generate`, payload);

export default api;
