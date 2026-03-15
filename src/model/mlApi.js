import { createApiClient } from './createApiClient';

const api = createApiClient('ml');

export const listModelsApi = () => api.get('/models');
export const getMlDashboardCompactApi = () => api.get('/dashboard/compact');
export const getMlDashboardSummaryApi = () => api.get('/dashboard/summary');
export const getMlDashboardSnapshotApi = () => api.get('/dashboard/snapshot');

export const updateModelStatusApi = (version, status) =>
  api.patch(`/models/${encodeURIComponent(version)}/status`, { status });

export const approveModelApi = (version) =>
  api.post(`/models/${encodeURIComponent(version)}/approve`);

export const evaluateModelApi = (version, payload) =>
  api.post(`/models/${encodeURIComponent(version)}/evaluate`, payload);

export const compareModelsApi = (versions, datasetVersion) =>
  api.get('/models/compare', {
    params: {
      versions: versions.join(','),
      ...(datasetVersion ? { datasetVersion } : {})
    }
  });

export const getModelPerformanceHistoryApi = (version) =>
  api.get(`/models/${encodeURIComponent(version)}/performance-history`);

export const getPerformanceTrendApi = (datasetVersion) =>
  api.get('/models/performance-trend', { params: { datasetVersion } });

export const uploadModelApi = (formData, onUploadProgress) =>
  api.post('/models/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  });

export const listValidationJobsApi = () => api.get('/models/validation-jobs');

export const getValidationJobApi = (jobId) => api.get(`/models/validation-jobs/${encodeURIComponent(jobId)}`);

// Backward-compatible aliases (deprecated naming)
export const listTrainingJobsApi = listValidationJobsApi;
export const getTrainingJobApi = getValidationJobApi;

export default api;
