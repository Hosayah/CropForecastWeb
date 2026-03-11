import { useCallback, useState } from 'react';
import { getValidationJobApi, listValidationJobsApi } from 'model/mlApi';

export function useMlTrainingJobsViewModel() {
  const [jobs, setJobs] = useState([]);
  const [jobDetails, setJobDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
      setError(null);
    try {
      const res = await listValidationJobsApi();
      const list = res?.data?.data?.jobs || [];
      setJobs(list);
      return { success: true, jobs: list };
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'Failed to fetch validation jobs';
      setError(message);
      return { success: false, error: message, code: err?.response?.status || 500 };
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerTraining = useCallback(async () => {
    return { success: false, error: 'In-system training is not supported', code: 410 };
  }, []);

  const fetchJobDetails = useCallback(async (jobId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getValidationJobApi(jobId);
      const details = res?.data?.data || null;
      setJobDetails(details);
      return { success: true, data: details };
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'Failed to fetch validation job';
      setError(message);
      return { success: false, error: message, code: err?.response?.status || 500 };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    jobs,
    jobDetails,
    loading,
    submitting,
    error,
    fetchJobs,
    triggerTraining,
    fetchJobDetails
  };
}
