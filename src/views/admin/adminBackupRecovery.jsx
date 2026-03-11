import { useEffect, useMemo, useState } from 'react';
import { useAdminBackupViewModel } from 'viewModel/useAdminBackupViewModel';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { InputLabel } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import AddIcon from '@mui/icons-material/Add';
import RestoreIcon from '@mui/icons-material/Restore';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import StorageIcon from '@mui/icons-material/Storage';
import RefreshIcon from '@mui/icons-material/Refresh';

import MainCard from 'components/MainCard';
import AdminPageHeader from './components/AdminPageHeader';

function AdminSummaryCard({ title, value, subtitle, loading }) {
  return (
    <MainCard content={false} sx={{ height: '100%' }}>
      <Stack sx={{ p: 2.5 }} spacing={1.25}>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        {loading ? (
          <>
            <Skeleton height={34} width="55%" />
            <Skeleton height={18} width="75%" />
          </>
        ) : (
          <>
            <Typography variant="h4">{value}</Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </>
        )}
      </Stack>
    </MainCard>
  );
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i += 1;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function StatusChip({ status }) {
  const cfg = useMemo(() => {
    switch (status) {
      case 'ready':
        return { label: 'READY', color: 'success' };
      case 'failed':
        return { label: 'FAILED', color: 'error' };
      case 'restoring':
        return { label: 'RESTORING', color: 'warning' };
      default:
        return { label: (status || 'UNKNOWN').toUpperCase(), color: 'default' };
    }
  }, [status]);

  return <Chip size="small" label={cfg.label} color={cfg.color} variant="outlined" />;
}

export default function AdminBackupRecovery() {
  const { backups, stats, loading, busy, fetchBackups, createBackup, restoreBackup, removeBackup, downloadBackup } =
    useAdminBackupViewModel();

  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });
  const BACKUP_TYPES = useMemo(() => ['FULL', 'DATASETS_ONLY', 'CONFIG_ONLY'], []);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    backupType: 'FULL',
    notes: ''
  });

  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);

  useEffect(() => {
    fetchBackups();
  }, []);

  const filteredBackups = useMemo(() => {
    let list = [...backups];
    if (typeFilter !== 'ALL') list = list.filter((b) => b.backupType === typeFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          (b.id || '').toLowerCase().includes(q) ||
          (b.backupType || '').toLowerCase().includes(q) ||
          (b.createdBy || '').toLowerCase().includes(q) ||
          (b.location || '').toLowerCase().includes(q) ||
          (b.notes || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => (b.createdAtIso || '').localeCompare(a.createdAtIso || ''));
    return list;
  }, [backups, typeFilter, search]);

  const openCreate = () => {
    setCreateForm({ backupType: 'FULL', notes: '' });
    setCreateOpen(true);
  };

  const handleCreateBackup = async () => {
    try {
      await createBackup(createForm);
      setCreateOpen(false);
      setToast({ open: true, severity: 'success', message: 'Backup created successfully.' });
    } catch (err) {
      setToast({ open: true, severity: 'error', message: err?.response?.data?.error || 'Create backup failed.' });
    }
  };

  const openRestoreConfirm = (backup) => {
    setRestoreTarget(backup);
    setRestoreOpen(true);
  };

  const handleRestoreBackup = async () => {
    if (!restoreTarget) return;
    try {
      await restoreBackup(restoreTarget.id);
      setRestoreOpen(false);
      setRestoreTarget(null);
      setToast({ open: true, severity: 'warning', message: 'Restore completed.' });
    } catch (err) {
      setToast({ open: true, severity: 'error', message: err?.response?.data?.error || 'Restore failed.' });
    }
  };

  const handleDownload = async (id) => {
    try {
      await downloadBackup(id);
      setToast({ open: true, severity: 'info', message: 'Backup download started.' });
    } catch (err) {
      setToast({ open: true, severity: 'error', message: err?.response?.data?.error || 'Download failed.' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeBackup(id);
      setToast({ open: true, severity: 'info', message: 'Backup deleted.' });
    } catch (err) {
      setToast({ open: true, severity: 'error', message: err?.response?.data?.error || 'Delete failed.' });
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchBackups();
      setToast({ open: true, severity: 'success', message: 'Backups refreshed.' });
    } catch {
      setToast({ open: true, severity: 'error', message: 'Refresh failed.' });
    }
  };

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <AdminPageHeader title="Backup & Recovery" current="Backup & Recovery" />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search backups..."
              sx={{ minWidth: { xs: '100%', sm: 240 } }}
            />

            <Stack direction="row" spacing={1} alignItems="center">
              <InputLabel>Type:</InputLabel>
              <Select
                size="small"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                sx={{ minWidth: { xs: '100%', sm: 170 } }}
              >
                <MenuItem value="ALL">ALL</MenuItem>
                {BACKUP_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={busy || loading}>
              Refresh
            </Button>

            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={busy}>
              Create Backup
            </Button>
          </Stack>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard title="Total Backups" value={stats.totalBackups || 0} subtitle="All backup snapshots" loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard title="Latest Backup" value={stats.latestBackup || '-'} subtitle="Most recent snapshot" loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard
          title="Storage Used"
          value={formatBytes(stats.storageUsedBytes || 0)}
          subtitle="Total backup file sizes"
          loading={loading}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard title="Restore Points" value={stats.restorePoints || 0} subtitle="Backups ready to restore" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MainCard content={false} sx={{ mt: 1.5 }}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Backup History</Typography>
              <Typography variant="caption" color="text.secondary">
                Showing {loading ? '...' : filteredBackups.length} result(s)
              </Typography>
            </Stack>
            <Divider />

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Created</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading
                    ? Array.from({ length: 8 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Skeleton width={130} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={100} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={90} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={80} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={140} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width="90%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton width="80%" />
                          </TableCell>
                          <TableCell align="right">
                            <Skeleton width={140} />
                          </TableCell>
                        </TableRow>
                      ))
                    : filteredBackups.map((b) => (
                        <TableRow key={b.id} hover>
                          <TableCell>{b.createdAt}</TableCell>
                          <TableCell>
                            <Chip size="small" label={(b.backupType || '').replace('_', ' ')} variant="outlined" icon={<StorageIcon />} />
                          </TableCell>
                          <TableCell>
                            <StatusChip status={b.status} />
                          </TableCell>
                          <TableCell>{formatBytes(b.sizeBytes)}</TableCell>
                          <TableCell>{b.createdBy}</TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                              {b.location}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {b.notes || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="Download backup">
                                <span>
                                  <IconButton size="small" onClick={() => handleDownload(b.id)} disabled={busy}>
                                    <FileDownloadIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Restore from this backup">
                                <span>
                                  <IconButton size="small" onClick={() => openRestoreConfirm(b)} disabled={busy || b.status !== 'ready'}>
                                    <RestoreIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Delete backup">
                                <span>
                                  <IconButton size="small" onClick={() => handleDelete(b.id)} disabled={busy}>
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}

                  {!loading && filteredBackups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Typography variant="body2" color="text.secondary">
                          No backups found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </MainCard>
      </Grid>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Backup</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              This will create a server snapshot of datasets and/or system configuration.
            </Typography>

            <Stack spacing={1}>
              <InputLabel>Backup Type</InputLabel>
              <Select value={createForm.backupType} onChange={(e) => setCreateForm((p) => ({ ...p, backupType: e.target.value }))}>
                <MenuItem value="FULL">FULL</MenuItem>
                <MenuItem value="DATASETS_ONLY">DATASETS ONLY</MenuItem>
                <MenuItem value="CONFIG_ONLY">CONFIG ONLY</MenuItem>
              </Select>
            </Stack>

            <Stack spacing={1}>
              <InputLabel>Notes (optional)</InputLabel>
              <TextField
                placeholder="Describe why this backup was created..."
                value={createForm.notes}
                onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
                multiline
                minRows={3}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateBackup} disabled={busy} startIcon={busy ? <CircularProgress size={18} /> : null}>
            {busy ? 'Creating...' : 'Create Backup'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={restoreOpen} onClose={() => setRestoreOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Confirm Restore</DialogTitle>
        <DialogContent dividers>
          {restoreTarget ? (
            <Stack spacing={1.5}>
              <Alert severity="warning">Restoring will overwrite current datasets and/or config for selected scope.</Alert>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Restore from backup
                </Typography>
                <Typography variant="body2">{restoreTarget.id}</Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2">{restoreTarget.createdAt}</Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body2">{(restoreTarget.backupType || '').replace('_', ' ')}</Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Location
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.25 }}>
                  <Typography variant="body2">{restoreTarget.location}</Typography>
                </Paper>
              </Stack>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No backup selected.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleRestoreBackup}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={18} /> : null}
          >
            {busy ? 'Restoring...' : 'Restore'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={2200} onClose={() => setToast((p) => ({ ...p, open: false }))}>
        <Alert onClose={() => setToast((p) => ({ ...p, open: false }))} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
