import { useState } from 'react';
import { listAuditLogsApi } from '../model/adminAuditApi';
import { getAdminPageCache, setAdminPageCache } from '../model/adminPageCache';

const AUDIT_CACHE_KEY = 'admin-audit-logs';

export function useAdminAuditViewModel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    authEvents: 0,
    windowLimit: 500
  });

  const fetchLogs = async ({ force = false, module = 'ALL', severity = 'ALL' } = {}) => {
    const cacheKey = `${AUDIT_CACHE_KEY}:${module}:${severity}`;
    const cached = !force ? getAdminPageCache(cacheKey) : null;
    if (cached) {
      setLogs(cached.logs);
      setStats(cached.stats);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const res = await listAuditLogsApi({ module, severity });
      const nextLogs = res.data.logs || [];
      const nextStats = res.data.stats || {
        totalLogs: nextLogs.length,
        todayLogs: 0,
        authEvents: 0,
        windowLimit: 500
      };
      setLogs(nextLogs);
      setStats(nextStats);
      setAdminPageCache(cacheKey, {
        logs: nextLogs,
        stats: nextStats
      });
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  return { logs, stats, loading, fetchLogs };
}
