import { useState } from 'react';
import {
  createBackupApi,
  deleteBackupApi,
  downloadBackupApi,
  listBackupsApi,
  restoreBackupApi
} from '../model/adminBackupApi';

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

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await listBackupsApi();
      setBackups(res.data.backups || []);
      setStats(
        res.data.stats || {
          totalBackups: 0,
          latestBackup: '-',
          storageUsedBytes: 0,
          restorePoints: 0
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (payload) => {
    setBusy(true);
    try {
      const res = await createBackupApi(payload);
      await fetchBackups();
      return res.data;
    } finally {
      setBusy(false);
    }
  };

  const restoreBackup = async (id) => {
    setBusy(true);
    try {
      const res = await restoreBackupApi(id);
      await fetchBackups();
      return res.data;
    } finally {
      setBusy(false);
    }
  };

  const removeBackup = async (id) => {
    setBusy(true);
    try {
      await deleteBackupApi(id);
      await fetchBackups();
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
    loading,
    busy,
    fetchBackups,
    createBackup,
    restoreBackup,
    removeBackup,
    downloadBackup
  };
}
