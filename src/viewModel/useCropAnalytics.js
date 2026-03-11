import { useEffect, useMemo, useState } from 'react';
import { getForecastSnapshotApi, getForecastSnapshotApiFresh } from '../model/cropTrendApi';
import {
  flattenSnapshotRows,
  filterRowsByFarmScope,
  aggregateSummary,
  aggregateTrend,
  aggregateRisk,
  getAvailableCrops
} from '../utils/helper/snapshotAnalytics';

export function useCropAnalytics({
  horizon = 4,
  farms = [],
  farmsLoading = false,
  scope = 'ALL_MY_FARMS',
  selectedFarmId = null,
  selectedProvince = null
}) {
  const [snapshot, setSnapshot] = useState(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snapshotStatus, setSnapshotStatus] = useState('idle');
  const [snapshotLastUpdatedAt, setSnapshotLastUpdatedAt] = useState(0);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSnapshot() {
      try {
        setSnapshotLoading(true);
        setError(null);

        // Replaces the old flow that called /analytics/* and live forecast routes per view update.
        // Snapshot is fetched once, then all summary/trend/risk values are computed client-side.
        const response = await getForecastSnapshotApi({ compact: 1 });
        const payload = response.data || {};
        const cacheState = String(response?.headers?.['x-client-cache'] || '').toUpperCase();
        const updatedAt = Number(response?.headers?.['x-client-cache-updated-at'] || 0);

        if (!mounted) return;

        if (payload.status === 'no_snapshot') {
          setSnapshot(null);
          setSnapshotStatus('no_snapshot');
          return;
        }

        setSnapshot(payload);
        setSnapshotStatus('ready');
        if (updatedAt > 0) setSnapshotLastUpdatedAt(updatedAt);
        if (cacheState === 'STALE') {
          setIsBackgroundRefreshing(true);
          try {
            try {
              const freshRes = await getForecastSnapshotApiFresh({ compact: 1 });
              if (!mounted) return;
              const freshPayload = freshRes?.data || {};
              if (freshPayload?.status !== 'no_snapshot') {
                setSnapshot(freshPayload);
                setSnapshotStatus('ready');
              }
              const freshUpdatedAt = Number(freshRes?.headers?.['x-client-cache-updated-at'] || 0);
              if (freshUpdatedAt > 0) setSnapshotLastUpdatedAt(freshUpdatedAt);
            } catch {
              // Keep stale payload rendered if background refresh fails.
            }
          } finally {
            if (mounted) setIsBackgroundRefreshing(false);
          }
        } else {
          setIsBackgroundRefreshing(false);
        }
      } catch (err) {
        if (mounted) {
          const status = err?.response?.status;
          const message = err?.response?.data?.error || '';
          if (status === 400 && String(message).toLowerCase().includes('create at least one farm')) {
            setSnapshot(null);
            setError(null);
            setSnapshotStatus('no_farms');
          } else {
            setError(err);
            setSnapshotStatus('error');
          }
          setIsBackgroundRefreshing(false);
        }
      } finally {
        if (mounted) setSnapshotLoading(false);
      }
    }

    loadSnapshot();
    return () => {
      mounted = false;
    };
  }, []);

  const effectiveSnapshotStatus = useMemo(() => {
    if (!farmsLoading && (!Array.isArray(farms) || farms.length === 0)) {
      return 'no_farms';
    }
    return snapshotStatus;
  }, [farmsLoading, farms, snapshotStatus]);

  const computed = useMemo(() => {
    const rows = flattenSnapshotRows(snapshot);
    const scopedRows = filterRowsByFarmScope(rows, farms, scope, selectedFarmId, selectedProvince);
    const metadata = snapshot?.metadata || {};

    return {
      summary: aggregateSummary(scopedRows, horizon),
      trend: aggregateTrend(scopedRows, metadata.basePeriod, horizon),
      risk: aggregateRisk(scopedRows, horizon),
      availableCrops: getAvailableCrops(scopedRows, horizon),
      scopedRowsCount: scopedRows.length
    };
  }, [snapshot, farms, scope, selectedFarmId, selectedProvince, horizon]);

  return {
    summary: computed.summary,
    trend: computed.trend,
    risk: computed.risk,
    availableCrops: computed.availableCrops,
    loading: farmsLoading || snapshotLoading,
    error,
    snapshotStatus: effectiveSnapshotStatus,
    snapshotMetadata: snapshot?.metadata || null,
    scopedRowsCount: computed.scopedRowsCount,
    snapshotLastUpdatedAt,
    isBackgroundRefreshing
  };
}
