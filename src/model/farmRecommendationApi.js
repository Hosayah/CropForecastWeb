import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE ||
    'https://seriate-calorifically-ray.ngrok-free.dev/recommendation',
  withCredentials: true,
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

export const farmRecommendationApi = (farmId, params = {}) =>
  api.get(`/v1/farms/${farmId}`, { params });

export const generateFarmRecommendationApi = (farmId, payload) =>
  api.post(`/v1/farms/${farmId}/generate`, payload);

export default api;
