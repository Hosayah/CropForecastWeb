import { useState } from 'react';
import {
  getSystemConfigApi,
  updateSystemConfigApi
} from '../model/adminSystemConfigApi';
import {
  getForecastSnapshotApi,
  generateForecastSnapshotApi
} from '../model/cropTrendApi';
import { listModelsApi } from '../model/mlApi';
import { listDatasetsApi } from '../model/adminDatasetsApi';

function extractApiError(err, fallback) {
  const data = err?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  return fallback;
}

export function useAdminSystemConfigViewModel() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [generatingSnapshot, setGeneratingSnapshot] = useState(false);
  const [latestSnapshot, setLatestSnapshot] = useState(null);
  const [snapshotStatus, setSnapshotStatus] = useState('idle');
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [modelVersions, setModelVersions] = useState([]);
  const [datasetVersions, setDatasetVersions] = useState([]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await getSystemConfigApi();
      setConfig(res.data);
    } catch (err) {
      console.error("Failed to fetch config", err);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (data) => {
    setSaving(true);
    try {
      await updateSystemConfigApi(data);
      await fetchConfig();
      return { success: true };
    } catch (err) {
      console.error("Failed to update config", err);
      return { success: false, error: extractApiError(err, 'Failed to update config') };
    } finally {
      setSaving(false);
    }
  };

  const fetchLatestSnapshot = async () => {
    setSnapshotLoading(true);
    try {
      const res = await getForecastSnapshotApi();
      const payload = res.data || {};

      if (payload.status === 'no_snapshot') {
        setLatestSnapshot(null);
        setSnapshotStatus('no_snapshot');
      } else {
        setLatestSnapshot(payload);
        setSnapshotStatus('ready');
      }

      return { success: true, data: payload };
    } catch (err) {
      console.error('Failed to fetch latest snapshot', err);
      setSnapshotStatus('error');
      return { success: false, error: extractApiError(err, 'Failed to fetch snapshot') };
    } finally {
      setSnapshotLoading(false);
    }
  };

  const generateSnapshot = async () => {
    setGeneratingSnapshot(true);
    try {
      const res = await generateForecastSnapshotApi();
      await fetchLatestSnapshot();
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Failed to generate snapshot', err);
      return { success: false, error: extractApiError(err, 'Failed to generate snapshot') };
    } finally {
      setGeneratingSnapshot(false);
    }
  };

  const fetchVersionOptions = async () => {
    setOptionsLoading(true);
    try {
      const [modelsRes, datasetsRes] = await Promise.all([listModelsApi(), listDatasetsApi()]);
      const models = modelsRes?.data?.data?.models || [];
      const datasets = datasetsRes?.data?.datasets || [];

      const modelVersionValues = Array.from(
        new Set(models.map((m) => m?.version).filter((v) => typeof v === 'string' && v.trim()))
      );
      const datasetVersionValues = Array.from(
        new Set(datasets.map((d) => d?.version).filter((v) => typeof v === 'string' && v.trim()))
      );

      setModelVersions(modelVersionValues.sort());
      setDatasetVersions(datasetVersionValues.sort());
      return { success: true };
    } catch (err) {
      return { success: false, error: extractApiError(err, 'Failed to load version options') };
    } finally {
      setOptionsLoading(false);
    }
  };

  return {
    config,
    loading,
    saving,
    fetchConfig,
    updateConfig,
    snapshotLoading,
    generatingSnapshot,
    latestSnapshot,
    snapshotStatus,
    fetchLatestSnapshot,
    generateSnapshot,
    optionsLoading,
    modelVersions,
    datasetVersions,
    fetchVersionOptions
  };
}
