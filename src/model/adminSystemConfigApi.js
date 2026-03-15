import { createApiClient } from './createApiClient';

const api = createApiClient('adminSystemConfig');

export const getSystemConfigApi = () => api.get('');
export const updateSystemConfigApi = (data) => api.patch('', data);

export default api;
