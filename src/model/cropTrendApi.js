import { createApiClient } from './createApiClient';

const api = createApiClient('cropTrend');
const CACHE_PREFIX = 'agrisense:cropTrendCache:';
const memoryCache = new Map();
const inflightRequests = new Map();

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function buildCacheKey(path, params) {
  return `${path}?${stableStringify(params || {})}`;
}

function toSessionKey(cacheKey) {
  return `${CACHE_PREFIX}${cacheKey}`;
}

function toResponse(data, cacheState = 'MISS', updatedAt = null) {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {
      'x-client-cache': cacheState,
      'x-client-cache-updated-at': updatedAt
    },
    config: {},
    request: null
  };
}

function readCachedEntry(cacheKey) {
  const now = Date.now();
  const inMemory = memoryCache.get(cacheKey);
  if (inMemory) {
    if (inMemory.expiresAt > now) return { entry: inMemory, isStale: false };
    return { entry: inMemory, isStale: true };
  }

  try {
    const raw = sessionStorage.getItem(toSessionKey(cacheKey));
    if (!raw) return { entry: null, isStale: false };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { entry: null, isStale: false };
    memoryCache.set(cacheKey, parsed);
    if (Number(parsed.expiresAt || 0) > now) return { entry: parsed, isStale: false };
    return { entry: parsed, isStale: true };
  } catch {
    return { entry: null, isStale: false };
  }
}

function writeCachedEntryWithEtag(cacheKey, data, ttlMs, etag) {
  const updatedAt = Date.now();
  const payload = {
    data,
    expiresAt: Date.now() + ttlMs,
    updatedAt,
    etag: etag || null
  };
  memoryCache.set(cacheKey, payload);
  try {
    sessionStorage.setItem(toSessionKey(cacheKey), JSON.stringify(payload));
  } catch {
    // Ignore storage write failures (e.g., private mode / quota).
  }
}

export function clearCropTrendCache() {
  memoryCache.clear();
  inflightRequests.clear();
  try {
    const keysToDelete = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) keysToDelete.push(key);
    }
    keysToDelete.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // No-op
  }
}

async function fetchAndCache(path, params, ttlMs, cacheKey, cachedEntry = null) {
  const headers = {};
  if (cachedEntry?.etag) {
    headers['If-None-Match'] = cachedEntry.etag;
  }

  const response = await api.get(path, {
    params,
    headers,
    validateStatus: (status) => (status >= 200 && status < 300) || status === 304
  });

  if (response.status === 304 && cachedEntry?.data) {
    writeCachedEntryWithEtag(cacheKey, cachedEntry.data, ttlMs, cachedEntry.etag);
    const revalidated = toResponse(cachedEntry.data, 'REVALIDATED', Date.now());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('agrisense:crop-trend-cache-updated', { detail: { cacheKey } }));
    }
    return revalidated;
  }

  const etag = response?.headers?.etag || null;
  writeCachedEntryWithEtag(cacheKey, response?.data, ttlMs, etag);
  response.headers = {
    ...(response.headers || {}),
    'x-client-cache': 'MISS',
    'x-client-cache-updated-at': Date.now()
  };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('agrisense:crop-trend-cache-updated', { detail: { cacheKey } }));
  }
  return response;
}

function cachedGet(path, params, { ttlMs = 60000, staleWhileRevalidate = true } = {}) {
  const cacheKey = buildCacheKey(path, params);
  const { entry, isStale } = readCachedEntry(cacheKey);

  if (entry && !isStale) {
    return Promise.resolve(toResponse(entry.data, 'HIT', entry.updatedAt || null));
  }

  if (entry && isStale && staleWhileRevalidate) {
    if (!inflightRequests.has(cacheKey)) {
      const refreshPromise = fetchAndCache(path, params, ttlMs, cacheKey, entry).finally(() => {
        inflightRequests.delete(cacheKey);
      });
      inflightRequests.set(cacheKey, refreshPromise);
    }
    return Promise.resolve(toResponse(entry.data, 'STALE', entry.updatedAt || null));
  }

  if (inflightRequests.has(cacheKey)) return inflightRequests.get(cacheKey);

  const requestPromise = fetchAndCache(path, params, ttlMs, cacheKey, entry).finally(() => {
    inflightRequests.delete(cacheKey);
  });
  inflightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

export const analyticsSummaryApi = (params) =>
  cachedGet('/analytics/summary', params, { ttlMs: 45000 });

export const analyticsTrendApi = (params) =>
  cachedGet('/analytics/trend', params, { ttlMs: 45000 });

export const analyticsRiskApi = (params) =>
  cachedGet('/analytics/risk-distribution', params, { ttlMs: 45000 });

export const analyticsRiskByCropApi = (params) =>
  cachedGet('/analytics/risk-by-crop', params, { ttlMs: 45000 });

export const analyticsAvailableCropsApi = (params) =>
  cachedGet('/analytics/available-crops', params, { ttlMs: 120000 });

export const analyticsAvailableCropsApiFresh = (params) =>
  cachedGet('/analytics/available-crops', params, { ttlMs: 120000, staleWhileRevalidate: false });

export const getForecastSnapshotApi = (params) =>
  cachedGet('/forecast/v1/snapshot', params, { ttlMs: 30000 });

export const getForecastSnapshotApiFresh = (params) =>
  cachedGet('/forecast/v1/snapshot', params, { ttlMs: 30000, staleWhileRevalidate: false });

export const getForecastSnapshotMetadataApi = (params) =>
  cachedGet('/forecast/v1/snapshot/metadata', params, { ttlMs: 60000 });

export const forecastBatchApi = (params) =>
  cachedGet('/forecast/batch', params, { ttlMs: 30000 });

export const forecastSnapshotCropOutlookApi = async (params) => {
  try {
    return await cachedGet('/forecast/v1/snapshot/crop-outlook', params, { ttlMs: 30000 });
  } catch (error) {
    if (error?.response?.status === 404) {
      return cachedGet('/forecast/v1/crop-outlook', params, { ttlMs: 30000 });
    }
    throw error;
  }
};

export const forecastSnapshotCropOutlookApiFresh = async (params) => {
  try {
    return await cachedGet('/forecast/v1/snapshot/crop-outlook', params, { ttlMs: 30000, staleWhileRevalidate: false });
  } catch (error) {
    if (error?.response?.status === 404) {
      return cachedGet('/forecast/v1/crop-outlook', params, { ttlMs: 30000, staleWhileRevalidate: false });
    }
    throw error;
  }
};

export const generateForecastSnapshotApi = async () => {
  const response = await api.post('/forecast/v1/generate');
  clearCropTrendCache();
  return response;
};

export default api;
