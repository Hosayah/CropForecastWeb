import { useEffect, useState } from 'react';
import {
  analyticsSummaryApi,
  analyticsTrendApi,
  analyticsRiskApi,
  analyticsAvailableCropsApi
} from '../model/cropTrendApi';

export function useCropAnalytics({ horizon = 4, province = 'ALL', crops = [] }) {
  const [summary, setSummary] = useState([]);
  const [trend, setTrend] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableCrops, setAvailableCrops] = useState([]);


  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const cropsRes = await analyticsAvailableCropsApi({ province });

        setLoading(true);

        const [summaryRes, trendRes, riskRes] = await Promise.all([
          analyticsSummaryApi({ horizon, province }),
          analyticsTrendApi({ horizon, province, crop: crops }),
          analyticsRiskApi({ horizon, province })
        ]);

        if (!mounted) return;

        setAvailableCrops(cropsRes.data.crops);
        setSummary(summaryRes.data.summary);
        setTrend(trendRes.data);
        setRisk(riskRes.data);
      } catch (err) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => (mounted = false);
  }, [horizon, province, JSON.stringify(crops)]);

  return {
    summary,
    trend,
    risk,
    availableCrops,
    loading,
    error
  };
}
