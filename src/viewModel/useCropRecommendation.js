import { useEffect, useState, useCallback } from 'react';
import { farmRecommendationApi, generateFarmRecommendationApi } from '../model/farmRecommendationApi';

const CACHE_PREFIX = 'agrisense:recommendation:latest:';
const CACHE_TTL_MS = 20_000;

export function clearRecommendationCache() {
  try {
    const keysToDelete = [];
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key && key.startsWith(CACHE_PREFIX)) keysToDelete.push(key);
    }
    keysToDelete.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Ignore cache cleanup failures.
  }
}

function cacheKey(farmId, season) {
  return `${CACHE_PREFIX}${String(farmId || '')}|${String(season || '')}`;
}

function readCache(key) {
  if (!key) return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(key, recommendation) {
  if (!key) return;
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        recommendation: recommendation || null,
        updatedAt: Date.now()
      })
    );
  } catch {
    // no-op
  }
}

export function useCropRecommendation({ farmId, season }) {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(0);

  const fetchLatest = useCallback(async (forceRefresh = false) => {
    if (!farmId) {
      setRecommendation(null);
      setError(null);
      setLoading(false);
      setIsBackgroundRefreshing(false);
      return null;
    }

    const key = cacheKey(farmId, season);
    const cached = readCache(key);
    const now = Date.now();
    const hasCached = cached && Object.prototype.hasOwnProperty.call(cached, 'recommendation');
    const cachedUpdatedAt = Number(cached?.updatedAt || 0);
    const isFresh = hasCached && cachedUpdatedAt > 0 && (now - cachedUpdatedAt) <= CACHE_TTL_MS;

    try {
      setError(null);

      if (hasCached) {
        setRecommendation(cached.recommendation ?? null);
        setLastUpdatedAt(cachedUpdatedAt);
        setLoading(false);
        setIsBackgroundRefreshing(!isFresh);
      } else {
        setLoading(true);
        setIsBackgroundRefreshing(false);
      }

      if (isFresh && !forceRefresh) return cached?.recommendation ?? null;

      const res = await farmRecommendationApi(farmId, { season });
      const next = res.data?.recommendations?.[0] || null;
      setRecommendation(next);
      writeCache(key, next);
      setLastUpdatedAt(Date.now());
      return next;
    } catch (err) {
      const status = Number(err?.response?.status || 0);
      if (status === 404) {
        // No recommendation generated yet for this farm/season.
        setRecommendation(null);
        writeCache(key, null);
        setLastUpdatedAt(Date.now());
        setError(null);
        return null;
      } else {
        setError(err);
        return null;
      }
    } finally {
      setLoading(false);
      setIsBackgroundRefreshing(false);
    }
  }, [farmId, season]);

  const generate = async () => {
    if (!farmId || !season) return;

    try {
      setGenerating(true);
      await generateFarmRecommendationApi(farmId, { season });

      // Backend generation can finish slightly after request returns.
      // Poll a few times with forced fetch to avoid showing stale empty state.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const latest = await fetchLatest(true);
        if (latest) break;
        await new Promise((resolve) => setTimeout(resolve, 900));
      }
    } catch (err) {
      setError(err);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchLatest(false);
  }, [fetchLatest]);

  return {
    recommendation,
    loading,
    generating,
    isBackgroundRefreshing,
    lastUpdatedAt,
    error,
    generate
  };
}
