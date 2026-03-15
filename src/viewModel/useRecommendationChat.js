import { useCallback, useEffect, useState } from 'react';
import { chatWithFarmRecommendationApi } from 'model/farmRecommendationApi';

export function useRecommendationChat({ farmId, season, enabled }) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setQuestion('');
    setResponse(null);
    setError(null);
    setLoading(false);
  }, [farmId, season]);

  const askQuestion = useCallback(async () => {
    const trimmed = String(question || '').trim();
    if (!enabled || !farmId || !season || !trimmed) return null;

    setLoading(true);
    setError(null);
    try {
      const res = await chatWithFarmRecommendationApi(farmId, {
        season,
        question: trimmed
      });
      const payload = res?.data || null;
      setResponse(payload);
      return payload;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled, farmId, season, question]);

  const reset = useCallback(() => {
    setQuestion('');
    setResponse(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    question,
    setQuestion,
    response,
    loading,
    error,
    askQuestion,
    reset
  };
}
