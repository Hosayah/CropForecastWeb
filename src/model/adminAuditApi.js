import axios from 'axios';

const api = axios.create({
  baseURL: 'https://seriate-calorifically-ray.ngrok-free.dev/admin/v1/audit-logs',
  withCredentials: true,
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

export const listAuditLogsApi = () => api.get('');

export default api;
