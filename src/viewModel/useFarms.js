// viewModel/useFarms.js
import { useEffect, useState, useCallback } from 'react';
import { listFarmsApi } from 'model/farmApi';

export function useFarms() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFarms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listFarmsApi();
      setFarms(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  return {
    farms,
    loading,
    error,
    refresh: fetchFarms // ✅ REAL refresh
  };
}
