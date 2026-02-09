import { useState } from 'react';
import { listAuditLogsApi } from '../model/adminAuditApi';

export function useAdminAuditViewModel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await listAuditLogsApi();
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  return { logs, loading, fetchLogs };
}
