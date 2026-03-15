import { useState } from 'react';
import {
  listDatasetsApi,
  uploadDatasetApi,
  updateDatasetStatusApi,
  activateDatasetApi,
  deleteDatasetApi,
  previewDatasetApi
} from '../model/adminDatasetsApi';
import { getAdminPageCache, setAdminPageCache } from '../model/adminPageCache';

const DATASETS_CACHE_KEY = 'admin-datasets';

export function useAdminDatasetsViewModel() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, archived: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 25,
    total: 0,
    totalPages: 1
  });

  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchDatasets = async ({ force = false, page = 1, perPage = 25 } = {}) => {
    const cacheKey = `${DATASETS_CACHE_KEY}:${page}:${perPage}`;
    const cached = !force ? getAdminPageCache(cacheKey) : null;
    if (cached) {
      setDatasets(cached.datasets || []);
      setStats(cached.stats || { total: 0, active: 0, archived: 0 });
      setPagination(
        cached.pagination || {
          page,
          perPage,
          total: (cached.datasets || []).length,
          totalPages: 1
        }
      );
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const res = await listDatasetsApi({ page, per_page: perPage });
      const nextDatasets = res.data.datasets || [];
      const nextStats = res.data.stats || { total: 0, active: 0, archived: 0 };
      const nextPagination = res.data.pagination || {
        page,
        perPage,
        total: nextDatasets.length,
        totalPages: 1
      };
      setDatasets(nextDatasets);
      setStats(nextStats);
      setPagination(nextPagination);
      setAdminPageCache(cacheKey, { datasets: nextDatasets, stats: nextStats, pagination: nextPagination });
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadDataset = async (formData) => {
    await uploadDatasetApi(formData);
    await fetchDatasets({ force: true, page: pagination.page, perPage: pagination.perPage });
  };

  const archiveDataset = async (dataset) => {
    await updateDatasetStatusApi(dataset.id, 'archived');
    await fetchDatasets({ force: true, page: pagination.page, perPage: pagination.perPage });
  };

  const activateDataset = async (dataset) => {
    await activateDatasetApi(dataset.version);
    await fetchDatasets({ force: true, page: pagination.page, perPage: pagination.perPage });
  };

  const deleteDataset = async (id) => {
    await deleteDatasetApi(id);
    await fetchDatasets({ force: true, page: pagination.page, perPage: pagination.perPage });
  };

  const previewDataset = async (id) => {
    setPreviewLoading(true);
    try {
      const res = await previewDatasetApi(id);
      setPreviewData(res.data);
    } catch (err) {
      throw err;
    } finally {
      setPreviewLoading(false);
    }
  };

  const clearPreview = () => {
    setPreviewData(null);
  };

  return {
    datasets,
    stats,
    pagination,
    loading,
    fetchDatasets,
    uploadDataset,
    archiveDataset,
    activateDataset,
    deleteDataset,
    previewDataset,
    previewData,
    previewLoading,
    clearPreview
  };
}
