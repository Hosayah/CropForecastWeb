import { useState } from 'react';
import {
  createBackupApi,
  deleteBackupApi,
  downloadBackupApi,
  listBackupsApi,
  restoreBackupApi
} from '../model/adminBackupApi';
import { getAdminPageCache, setAdminPageCache } from '../model/adminPageCache';

const BACKUPS_CACHE_KEY = 'admin-backups';

export function useAdminBackupViewModel() {
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState({
    totalBackups: 0,
    latestBackup: '-',
    storageUsedBytes: 0,
    restorePoints: 0
  });
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 25,
    total: 0,
    totalPages: 1
  });

  const applyBackupsPayload = (payload) => {
    setBackups(payload.backups || []);
    setStats(
      payload.stats || {
        totalBackups: 0,
        latestBackup: '-',
        storageUsedBytes: 0,
        restorePoints: 0
      }
    );
    setPagination(
      payload.pagination || {
        page: 1,
        perPage: 25,
        total: (payload.backups || []).length,
        totalPages: 1
      }
    );
  };

  const fetchBackups = async ({ force = false, page = 1, perPage = 25 } = {}) => {
    const cacheKey = `${BACKUPS_CACHE_KEY}:${page}:${perPage}`;
    const cached = !force ? getAdminPageCache(cacheKey) : null;
    if (cached) {
      applyBackupsPayload(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const res = await listBackupsApi({ page, per_page: perPage });
      const payload = {
        backups: res.data.backups || [],
        stats: res.data.stats || {
          totalBackups: 0,
          latestBackup: '-',
          storageUsedBytes: 0,
          restorePoints: 0
        },
        pagination: res.data.pagination || {
          page,
          perPage,
          total: (res.data.backups || []).length,
          totalPages: 1
        }
      };
      applyBackupsPayload(payload);
      setAdminPageCache(cacheKey, payload);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (payload) => {
    setBusy(true);
    try {
      const res = await createBackupApi(payload);
      await fetchBackups({ force: true, page: pagination.page, perPage: pagination.perPage });
      return res.data;
    } finally {
      setBusy(false);
    }
  };

  const restoreBackup = async (id) => {
    setBusy(true);
    try {
      const res = await restoreBackupApi(id);
      await fetchBackups({ force: true, page: pagination.page, perPage: pagination.perPage });
      return res.data;
    } finally {
      setBusy(false);
    }
  };

  const removeBackup = async (id) => {
    setBusy(true);
    try {
      await deleteBackupApi(id);
      await fetchBackups({ force: true, page: pagination.page, perPage: pagination.perPage });
    } finally {
      setBusy(false);
    }
  };

  const downloadBackup = async (id) => {
    const response = await downloadBackupApi(id);
    const contentDisposition = response.headers?.['content-disposition'] || '';
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] || `backup_${id}.zip`;

    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  return {
    backups,
    stats,
    pagination,
    loading,
    busy,
    fetchBackups,
    createBackup,
    restoreBackup,
    removeBackup,
    downloadBackup
  };
}
