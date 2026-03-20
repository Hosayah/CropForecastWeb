import { useEffect, useState } from 'react';

import {
  getForecastSnapshotMetadataApiFresh,
  getForecastSnapshotProvinceDetailsApiFresh,
  getForecastSnapshotProvinceListApiFresh
} from 'model/cropTrendApi';
import { ALL_PROVINCES, getPayload } from './utils';

const INITIAL_PROVINCE_COUNT = 5;
const BACKGROUND_CHUNK_SIZE = 8;

function parseUpdatedAt(response) {
  const updatedAt = Number(response?.headers?.['x-client-cache-updated-at'] || 0);
  return updatedAt > 0 ? updatedAt : 0;
}

async function fetchProvinceSnapshot(province) {
  const response = await getForecastSnapshotProvinceDetailsApiFresh(province, { page: 1, per_page: 500, compact: 1 });
  const payload = getPayload(response);
  return {
    province: String(payload?.province || province).trim().toUpperCase(),
    recordCount: Number(payload?.recordCount || payload?.total || 0),
    rows: Array.isArray(payload?.rows) ? payload.rows : [],
    updatedAt: parseUpdatedAt(response)
  };
}

function mergeProvincePayloads(existing, incoming) {
  const merged = { ...(existing || {}) };
  incoming.forEach((item) => {
    if (!item?.province) return;
    merged[item.province] = {
      province: item.province,
      recordCount: Number(item.recordCount || 0),
      rows: Array.isArray(item.rows) ? item.rows : []
    };
  });
  return merged;
}

export default function useAnalystSnapshot() {
  const [snapshot, setSnapshot] = useState(null);
  const [provinceOptions, setProvinceOptions] = useState([ALL_PROVINCES]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snapshotLastUpdatedAt, setSnapshotLastUpdatedAt] = useState(0);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [loadedProvinceCount, setLoadedProvinceCount] = useState(0);
  const [totalProvinceCount, setTotalProvinceCount] = useState(0);
  const [firstLoadedProvince, setFirstLoadedProvince] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSnapshot() {
      setLoading(true);
      setError('');
      setIsBackgroundRefreshing(false);
      setLoadedProvinceCount(0);
      setTotalProvinceCount(0);
      setFirstLoadedProvince('');

      try {
        const [metaRes, listRes] = await Promise.all([
          getForecastSnapshotMetadataApiFresh(),
          getForecastSnapshotProvinceListApiFresh({ page: 1, per_page: 500 })
        ]);
        if (!active) return;

        const metaPayload = getPayload(metaRes);
        const listPayload = listRes?.data || {};

        if (metaPayload?.status === 'no_snapshot' || listPayload?.status === 'no_snapshot') {
          setSnapshot(null);
          setProvinceOptions([ALL_PROVINCES]);
          setLoading(false);
          return;
        }

        const provinceItems = Array.isArray(listPayload?.data)
          ? listPayload.data
              .map((item) => ({
                province: String(item?.province || '').trim().toUpperCase(),
                recordCount: Number(item?.recordCount || 0)
              }))
              .filter((item) => item.province)
          : [];

        const uniqueProvinceMap = new Map();
        provinceItems.forEach((item) => {
          if (!uniqueProvinceMap.has(item.province)) {
            uniqueProvinceMap.set(item.province, item);
            return;
          }
          const existing = uniqueProvinceMap.get(item.province);
          if (Number(item.recordCount || 0) > Number(existing?.recordCount || 0)) {
            uniqueProvinceMap.set(item.province, item);
          }
        });

        const provinceRecords = Array.from(uniqueProvinceMap.values());
        const sortedProvinceOptions = [...provinceRecords].map((item) => item.province).sort((a, b) => a.localeCompare(b));
        const rankedProvinces = [...provinceRecords]
          .sort((a, b) => Number(b.recordCount || 0) - Number(a.recordCount || 0) || a.province.localeCompare(b.province))
          .map((item) => item.province);

        const uniqueProvinces = rankedProvinces;
        const firstBatch = uniqueProvinces.slice(0, INITIAL_PROVINCE_COUNT);
        const remaining = uniqueProvinces.slice(INITIAL_PROVINCE_COUNT);
        const firstProvincePayloads = await Promise.all(firstBatch.map(fetchProvinceSnapshot));
        if (!active) return;

        const firstUpdatedAt = Math.max(
          parseUpdatedAt(metaRes),
          parseUpdatedAt(listRes),
          ...firstProvincePayloads.map((item) => Number(item.updatedAt || 0))
        );

        setProvinceOptions([ALL_PROVINCES, ...sortedProvinceOptions]);
        setTotalProvinceCount(sortedProvinceOptions.length);
        setLoadedProvinceCount(firstProvincePayloads.length);
        setFirstLoadedProvince(firstBatch[0] || sortedProvinceOptions[0] || '');
        setSnapshotLastUpdatedAt(firstUpdatedAt);
        setSnapshot({
          status: 'success',
          snapshotId: metaPayload?.snapshotId,
          metadata: metaPayload?.metadata || {},
          provinces: mergeProvincePayloads({}, firstProvincePayloads)
        });
        setLoading(false);

        if (!remaining.length) {
          setIsBackgroundRefreshing(false);
          return;
        }

        setIsBackgroundRefreshing(true);
        let mergedProvinces = mergeProvincePayloads({}, firstProvincePayloads);

        for (let index = 0; index < remaining.length && active; index += BACKGROUND_CHUNK_SIZE) {
          const chunk = remaining.slice(index, index + BACKGROUND_CHUNK_SIZE);
          const chunkPayloads = await Promise.all(chunk.map(fetchProvinceSnapshot));
          if (!active) return;
          mergedProvinces = mergeProvincePayloads(mergedProvinces, chunkPayloads);
          setLoadedProvinceCount(Object.keys(mergedProvinces).length);
          setSnapshot((prev) =>
            prev
              ? {
                  ...prev,
                  provinces: mergedProvinces
                }
              : prev
          );
          const chunkUpdatedAt = Math.max(...chunkPayloads.map((item) => Number(item.updatedAt || 0)), 0);
          if (chunkUpdatedAt > 0) {
            setSnapshotLastUpdatedAt((prev) => Math.max(prev, chunkUpdatedAt));
          }
        }
      } catch (err) {
        if (!active) return;
        setSnapshot(null);
        setProvinceOptions([ALL_PROVINCES]);
        setError(err?.response?.data?.error || 'Failed to load analyst snapshot.');
        setLoading(false);
      } finally {
        if (active) setIsBackgroundRefreshing(false);
      }
    }

    loadSnapshot();
    return () => {
      active = false;
    };
  }, []);

  return {
    snapshot,
    provinceOptions,
    loading,
    error,
    snapshotLastUpdatedAt,
    isBackgroundRefreshing,
    loadedProvinceCount,
    totalProvinceCount,
    firstLoadedProvince,
    allProvincesReady: totalProvinceCount > 0 && loadedProvinceCount >= totalProvinceCount
  };
}
