import { createApiClient } from './createApiClient';

const api = createApiClient('adminUsers');

export const listUsersApi = (params = {}) => api.get('', { params });
export const createUserApi = (payload) => api.post('', payload);
export const updateUserRoleApi = (uid, role) => api.patch(`/${uid}/role`, { role });
export const deactivateUserApi = (uid) => api.patch(`/${uid}/deactivate`);
export const activateUserApi = (uid) => api.patch(`/${uid}/activate`);

export default api;
