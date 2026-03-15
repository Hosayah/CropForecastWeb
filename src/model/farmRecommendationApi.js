import { createApiClient } from './createApiClient';

const api = createApiClient('recommendation');

export const farmRecommendationApi = (farmId, params = {}) =>
  api.get(`/v1/farms/${farmId}`, { params });

export const generateFarmRecommendationApi = (farmId, payload) =>
  api.post(`/v1/farms/${farmId}/generate`, payload);

export const chatWithFarmRecommendationApi = (farmId, payload) =>
  api.post(`/v1/farms/${farmId}/chat`, payload);

export default api;
