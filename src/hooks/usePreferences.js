import { useCallback, useMemo } from 'react';

export function usePreferences() {
  const getString = useCallback((key, fallback = null) => {
    const value = localStorage.getItem(key);
    return value ?? fallback;
  }, []);

  const setString = useCallback((key, value) => {
    if (value === null || value === undefined || value === '') {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, String(value));
  }, []);

  const getJson = useCallback((key, fallback) => {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }, []);

  const setJson = useCallback((key, value) => {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  }, []);

  const remove = useCallback((key) => {
    localStorage.removeItem(key);
  }, []);

  return useMemo(
    () => ({
      getString,
      setString,
      getJson,
      setJson,
      remove
    }),
    [getString, setString, getJson, setJson, remove]
  );
}
