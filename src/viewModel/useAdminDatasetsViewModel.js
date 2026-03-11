import { useState } from 'react';
import {
  listDatasetsApi,
  uploadDatasetApi,
  updateDatasetStatusApi,
  activateDatasetApi,
  deleteDatasetApi,
  previewDatasetApi
} from '../model/adminDatasetsApi';

export function useAdminDatasetsViewModel() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);

  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const res = await listDatasetsApi();
      setDatasets(res.data.datasets || []);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadDataset = async (formData) => {
    await uploadDatasetApi(formData);
    await fetchDatasets();
  };

  const archiveDataset = async (dataset) => {
    await updateDatasetStatusApi(dataset.id, 'archived');
    await fetchDatasets();
  };

  const activateDataset = async (dataset) => {
    await activateDatasetApi(dataset.version);
    await fetchDatasets();
  };

  const deleteDataset = async (id) => {
    await deleteDatasetApi(id);
    await fetchDatasets();
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
