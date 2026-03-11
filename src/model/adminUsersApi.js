// features/adminUsers/model/adminUsersApi.js
import axios from 'axios';
import { API_BASES } from './apiBase';

const api = axios.create({
  baseURL: API_BASES.adminUsers,
  withCredentials: true
});

export const listUsersApi = () => api.get('');
export const createUserApi = (payload) => api.post('', payload);

export const updateUserRoleApi = (uid, role) => api.patch(`/${uid}/role`, { role });

export const deactivateUserApi = (uid) => api.patch(`/${uid}/deactivate`);

export const activateUserApi = (uid) => api.patch(`/${uid}/activate`);

export default api;
