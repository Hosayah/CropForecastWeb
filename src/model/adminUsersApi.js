// features/adminUsers/model/adminUsersApi.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://seriate-calorifically-ray.ngrok-free.dev/admin/v1/users',
  withCredentials: true,
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

export const listUsersApi = () => api.get('');
export const createUserApi = (payload) => api.post('', payload);

export const updateUserRoleApi = (uid, role) => api.patch(`/${uid}/role`, { role });

export const deactivateUserApi = (uid) => api.patch(`/${uid}/deactivate`);

export const activateUserApi = (uid) => api.patch(`/${uid}/activate`);

export default api;
