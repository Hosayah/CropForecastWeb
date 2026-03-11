import { useState } from 'react';
import { approveModelApi, listModelsApi, updateModelStatusApi } from 'model/mlApi';

export function useMlModelsViewModel() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listModelsApi();
      const list = res?.data?.data?.models || [];
      setModels(list);
      return { success: true, models: list };
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'Failed to fetch models';
      setError(message);
      return { success: false, error: message, code: err?.response?.status || 500 };
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (version, status) => {
    setUpdating(true);
    setError(null);
    try {
      const res = await updateModelStatusApi(version, status);
      const updated = res?.data?.data || null;
      setModels((prev) => prev.map((m) => (m.version === version ? { ...m, ...updated } : m)));
      return { success: true, data: updated };
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'Failed to update model status';
      setError(message);
      return { success: false, error: message, code: err?.response?.status || 500 };
    } finally {
      setUpdating(false);
    }
  };

  const approveModel = async (version) => {
    setUpdating(true);
    setError(null);
    try {
      const res = await approveModelApi(version);
      return { success: true, data: res?.data?.data || null };
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'Failed to activate model';
      setError(message);
      return { success: false, error: message, code: err?.response?.status || 500 };
    } finally {
      setUpdating(false);
    }
  };

  return {
    models,
    loading,
    error,
    updating,
    fetchModels,
    changeStatus,
    approveModel
  };
}
