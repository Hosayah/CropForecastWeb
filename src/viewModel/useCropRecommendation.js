import { useEffect, useState, useCallback } from 'react';
import {
  farmRecommendationApi,
  generateFarmRecommendationApi
} from '../model/farmRecommendationApi';

export function useCropRecommendation({ farmId, season }) {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const fetchLatest = useCallback(async () => {
    if (!farmId) return;

    try {
      setLoading(true);
      const res = await farmRecommendationApi(farmId, { season });
      setRecommendation(res.data?.recommendations?.[0] || null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [farmId, season]);

  const generate = async () => {
    if (!farmId || !season) return;

    try {
      setGenerating(true);
      await generateFarmRecommendationApi(farmId, { season });
      await fetchLatest(); // 🔑 refresh after generation
    } catch (err) {
      setError(err);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  return {
    recommendation,
    loading,
    generating,
    error,
    generate
  };
}
