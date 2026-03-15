const DEFAULT_TTL_MS = 30 * 1000;

const store = new Map();

export function getAdminPageCache(key, ttlMs = DEFAULT_TTL_MS) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) return null;
  return entry.value;
}

export function setAdminPageCache(key, value) {
  store.set(key, {
    value,
    timestamp: Date.now()
  });
}

export function clearAdminPageCache(key) {
  if (!key) {
    store.clear();
    return;
  }
  store.delete(key);
}
