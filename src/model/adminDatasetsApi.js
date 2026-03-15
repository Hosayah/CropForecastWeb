import { createApiClient } from './createApiClient';

const api = createApiClient('adminDatasets');

// LIST
export const listDatasetsApi = (params = {}) => api.get('', { params });

// UPLOAD
export const uploadDatasetApi = (formData) =>
  api.post('', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const updateDatasetStatusApi = (id, status) =>
  api.patch(`/${id}/status`, { status });

export const activateDatasetApi = (version) =>
  api.patch(`/${encodeURIComponent(version)}/activate`);

// DELETE
export const deleteDatasetApi = (id) =>
  api.delete(`/${id}`);

// PREVIEW
export const previewDatasetApi = (id, limit = 50) =>
  api.get(`/${id}/preview?limit=${limit}`);

export default api;
