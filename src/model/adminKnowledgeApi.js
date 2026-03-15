import { createApiClient } from './createApiClient';

const api = createApiClient('adminKnowledge');

export const getKnowledgeStatusApi = () => api.get('/status');

export default api;
