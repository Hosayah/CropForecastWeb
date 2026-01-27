import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE ||
    'https://seriate-calorifically-ray.ngrok-free.dev/farms',
  withCredentials: true,
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

export const listFarmsApi = () => api.get('/v1');
export const createFarmApi = (data) => api.post('/v1', data);
export const updateFarmApi = (id, data) => api.put(`/v1/${id}`, data);

export default api;
