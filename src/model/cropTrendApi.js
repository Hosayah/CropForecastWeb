import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'https://seriate-calorifically-ray.ngrok-free.dev/api/crop-trend',
  withCredentials: true,
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

export const analyticsSummaryApi = (params) =>
  api.get('/analytics/summary', { params });

export const analyticsTrendApi = (params) =>
  api.get('/analytics/trend', { params });

export const analyticsRiskApi = (params) =>
  api.get('/analytics/risk-distribution', { params });

export const analyticsAvailableCropsApi = (params) =>
  api.get('/analytics/available-crops', { params });


export default api;
