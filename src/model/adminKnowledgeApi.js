import { createApiClient } from './createApiClient';

const api = createApiClient('adminKnowledge');

export const getKnowledgeStatusApi = () => api.get('/status');
export const getKnowledgeWorkflowApi = () => api.get('/workflow');
export const scanKnowledgeWorkflowApi = () => api.post('/scan');
export const uploadKnowledgeRawFilesApi = (formData) =>
  api.post('/raw-files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
export const deleteKnowledgeRawFileApi = (filename) =>
  api.delete(`/raw-files/${encodeURIComponent(filename)}`);
export const buildKnowledgeWorkflowApi = () => api.post('/build');
export const validateKnowledgeWorkflowApi = () => api.post('/validate');
export const getKnowledgePublishReadinessApi = () => api.get('/publish-readiness');
export const registerKnowledgeDocumentApi = (payload) => api.post('/documents', payload);
export const updateKnowledgeDocumentApi = (documentId, payload) =>
  api.patch(`/documents/${encodeURIComponent(documentId)}`, payload);
export const deleteKnowledgeDocumentApi = (documentId) =>
  api.delete(`/documents/${encodeURIComponent(documentId)}`);

export default api;
