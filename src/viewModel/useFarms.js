import { useEffect, useState, useCallback, useMemo } from 'react';
import { listFarmsApi } from 'model/farmApi';

const DEFAULT_FARM_STORAGE_KEY = 'agrisense:default_farm_id';
const FARMS_CACHE_KEY = 'agrisense:farms_cache_v1';
const FARMS_CACHE_TTL_MS = 60 * 1000;

function readCachedFarms() {
  try {
    const raw = sessionStorage.getItem(FARMS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const rows = Array.isArray(parsed?.rows) ? parsed.rows : null;
    const updatedAt = Number(parsed?.updatedAt || 0);
    if (!rows || !Number.isFinite(updatedAt) || updatedAt <= 0) return null;
    return { rows, updatedAt, isFresh: Date.now() - updatedAt <= FARMS_CACHE_TTL_MS };
  } catch {
    return null;
  }
}

function writeCachedFarms(rows) {
  try {
    sessionStorage.setItem(
      FARMS_CACHE_KEY,
      JSON.stringify({
        rows: Array.isArray(rows) ? rows : [],
        updatedAt: Date.now()
      })
    );
  } catch {
    // Ignore cache write failures.
  }
}

export function useFarms() {
  const initialCache = readCachedFarms();
  const [farms, setFarms] = useState(() => (initialCache?.rows || []));
  const [loading, setLoading] = useState(() => !(initialCache?.rows?.length > 0));
  const [error, setError] = useState(null);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [defaultFarmId, setDefaultFarmIdState] = useState(() => localStorage.getItem(DEFAULT_FARM_STORAGE_KEY) || '');

  const syncDefaultFarm = useCallback((list, preferredId = null) => {
    const stored = localStorage.getItem(DEFAULT_FARM_STORAGE_KEY) || '';
    const desired = String(preferredId || defaultFarmId || stored || '');
    const hasDesired = list.some((farm) => String(farm.id) === desired);
    const next = hasDesired ? desired : list[0] ? String(list[0].id) : '';

    if (next) localStorage.setItem(DEFAULT_FARM_STORAGE_KEY, next);
    else localStorage.removeItem(DEFAULT_FARM_STORAGE_KEY);

    setDefaultFarmIdState(next);
    return next;
  }, [defaultFarmId]);

  const fetchFarms = useCallback(async (preferredId = null, options = {}) => {
    const background = Boolean(options?.background);
    try {
      if (background) setIsBackgroundRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await listFarmsApi();
      const list = Array.isArray(res.data) ? res.data : [];
      setFarms(list);
      writeCachedFarms(list);
      syncDefaultFarm(list, preferredId);
    } catch (err) {
      setError(err);
    } finally {
      if (background) setIsBackgroundRefreshing(false);
      else setLoading(false);
    }
  }, [syncDefaultFarm]);

  const setDefaultFarmId = useCallback((farmId) => {
    const next = String(farmId || '');
    setDefaultFarmIdState(next);
    if (next) localStorage.setItem(DEFAULT_FARM_STORAGE_KEY, next);
    else localStorage.removeItem(DEFAULT_FARM_STORAGE_KEY);
  }, []);

  useEffect(() => {
    const cache = readCachedFarms();
    const hasCachedRows = Array.isArray(cache?.rows) && cache.rows.length > 0;

    if (hasCachedRows && cache?.isFresh) {
      setFarms(cache.rows);
      setLoading(false);
      syncDefaultFarm(cache.rows);
      return;
    }

    fetchFarms(null, { background: hasCachedRows });
  }, [fetchFarms]);

  useEffect(() => {
    const handleFarmsMutated = () => {
      fetchFarms();
    };
    window.addEventListener('agrisense:farms-mutated', handleFarmsMutated);
    return () => window.removeEventListener('agrisense:farms-mutated', handleFarmsMutated);
  }, [fetchFarms]);

  const defaultFarm = useMemo(
    () => farms.find((farm) => String(farm.id) === String(defaultFarmId)) || null,
    [farms, defaultFarmId]
  );

  return {
    farms,
    loading,
    isBackgroundRefreshing,
    error,
    refresh: fetchFarms,
    defaultFarmId,
    defaultFarm,
    setDefaultFarmId
  };
}
