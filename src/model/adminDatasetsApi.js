import axios from 'axios';
import { API_BASES } from './apiBase';

const api = axios.create({
  baseURL: API_BASES.adminDatasets,
  withCredentials: true
});

// LIST
export const listDatasetsApi = () => api.get('');

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
