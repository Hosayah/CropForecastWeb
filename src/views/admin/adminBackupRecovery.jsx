import { useEffect, useMemo, useState } from 'react';

// material-ui
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

// table
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

// dialog
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// snackbar
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

// icons
import AddIcon from '@mui/icons-material/Add';
import RestoreIcon from '@mui/icons-material/Restore';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import StorageIcon from '@mui/icons-material/Storage';
import RefreshIcon from '@mui/icons-material/Refresh';

// project imports
import MainCard from 'components/MainCard';

// ==============================|| HELPERS ||============================== //

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
  if (!bytes && bytes !== 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
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

// ==============================|| ADMIN BACKUP & RECOVERY ||============================== //

export default function AdminBackupRecovery() {
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  const BACKUP_TYPES = useMemo(() => ['FULL', 'DATASETS_ONLY', 'CONFIG_ONLY'], []);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const [backups, setBackups] = useState([]);

  const [stats, setStats] = useState({
    totalBackups: 0,
    latestBackup: '—',
    storageUsed: '—',
    restorePoints: 0
  });

  // create backup dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    backupType: 'FULL',
    notes: ''
  });

  // restore confirm dialog
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);

  useEffect(() => {
    // ✅ Replace later with backend:
    // GET /api/admin/backups
    const mockFetch = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 750));

      const mock = [
        {
          id: 'b1',
          createdAt: '2026-01-31 18:55',
          backupType: 'FULL',
          status: 'ready',
          sizeBytes: 28400231,
          createdBy: 'admin@agrisense.com',
          location: '/storage/backups/backup_2026-01-31_full.zip',
          notes: 'Before major dataset update'
        },
        {
          id: 'b2',
          createdAt: '2026-01-20 10:12',
          backupType: 'DATASETS_ONLY',
          status: 'ready',
          sizeBytes: 18450211,
          createdBy: 'admin@agrisense.com',
          location: '/storage/backups/backup_2026-01-20_datasets.zip',
          notes: 'Datasets snapshot'
        },
        {
          id: 'b3',
          createdAt: '2026-01-10 09:40',
          backupType: 'CONFIG_ONLY',
          status: 'ready',
          sizeBytes: 82011,
          createdBy: 'admin@agrisense.com',
          location: '/storage/backups/backup_2026-01-10_config.json',
          notes: ''
        }
      ];

      setBackups(mock);

      const totalBackups = mock.length;
      const latestBackup = mock[0]?.createdAt || '—';
      const storageUsedBytes = mock.reduce((sum, b) => sum + (b.sizeBytes || 0), 0);
      const restorePoints = mock.filter((b) => b.status === 'ready').length;

      setStats({
        totalBackups,
        latestBackup,
        storageUsed: formatBytes(storageUsedBytes),
        restorePoints
      });

      setLoading(false);
    };

    mockFetch();
  }, []);

  const filteredBackups = useMemo(() => {
    let list = [...backups];

    if (typeFilter !== 'ALL') list = list.filter((b) => b.backupType === typeFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.backupType.toLowerCase().includes(q) ||
          b.createdBy.toLowerCase().includes(q) ||
          b.location.toLowerCase().includes(q) ||
          (b.notes || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return list;
  }, [backups, typeFilter, search]);

  const openCreate = () => {
    setCreateForm({ backupType: 'FULL', notes: '' });
    setCreateOpen(true);
  };

  const createBackupUIOnly = () => {
    // ✅ UI-only simulation
    const newBackup = {
      id: `b_${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      backupType: createForm.backupType,
      status: 'ready',
      sizeBytes: Math.floor(1000000 + Math.random() * 20000000),
      createdBy: 'admin@agrisense.com',
      location: `/storage/backups/backup_${Date.now()}.zip`,
      notes: createForm.notes
    };

    setBackups((prev) => [newBackup, ...prev]);
    setCreateOpen(false);

    setToast({
      open: true,
      severity: 'success',
      message: 'Backup created (UI only). Backend backup action comes later.'
    });
  };

  const openRestoreConfirm = (backup) => {
    setRestoreTarget(backup);
    setRestoreOpen(true);
  };

  const restoreUIOnly = () => {
    setRestoreOpen(false);

    setToast({
      open: true,
      severity: 'warning',
      message: 'Restore triggered (UI only). Backend restore action comes later.'
    });
  };

  const downloadUIOnly = () => {
    setToast({
      open: true,
      severity: 'info',
      message: 'Download endpoint will be added later.'
    });
  };

  const deleteBackupUIOnly = (id) => {
    setBackups((prev) => prev.filter((b) => b.id !== id));
    setToast({
      open: true,
      severity: 'info',
      message: 'Backup deleted (UI only).'
    });
  };

  const refreshUIOnly = () => {
    setToast({
      open: true,
      severity: 'success',
      message: 'Refreshed (UI only).'
    });
  };

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* row 1 */}
      <Grid size={12}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Typography variant="h5">Backup & Recovery</Typography>

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

            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refreshUIOnly}>
              Refresh
            </Button>

            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Create Backup
            </Button>
          </Stack>
        </Stack>
      </Grid>

      {/* stats */}
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard title="Total Backups" value={stats.totalBackups} subtitle="All backup snapshots" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard title="Latest Backup" value={stats.latestBackup} subtitle="Most recent snapshot" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard title="Storage Used" value={stats.storageUsed} subtitle="Total backup file sizes" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard title="Restore Points" value={stats.restorePoints} subtitle="Backups ready to restore" loading={loading} />
      </Grid>

      {/* backups table */}
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
                    ? Array.from({ length: 9 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell><Skeleton width={130} /></TableCell>
                          <TableCell><Skeleton width={100} /></TableCell>
                          <TableCell><Skeleton width={90} /></TableCell>
                          <TableCell><Skeleton width={80} /></TableCell>
                          <TableCell><Skeleton width={140} /></TableCell>
                          <TableCell><Skeleton width="90%" /></TableCell>
                          <TableCell><Skeleton width="80%" /></TableCell>
                          <TableCell align="right"><Skeleton width={140} /></TableCell>
                        </TableRow>
                      ))
                    : filteredBackups.map((b) => (
                        <TableRow key={b.id} hover>
                          <TableCell>{b.createdAt}</TableCell>
                          <TableCell>
                            <Chip size="small" label={b.backupType.replace('_', ' ')} variant="outlined" icon={<StorageIcon />} />
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
                              {b.notes || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="Download (later)">
                                <IconButton size="small" onClick={downloadUIOnly}>
                                  <FileDownloadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Restore from this backup">
                                <IconButton size="small" onClick={() => openRestoreConfirm(b)}>
                                  <RestoreIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Delete (UI only)">
                                <IconButton size="small" onClick={() => deleteBackupUIOnly(b.id)}>
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
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

      {/* Create Backup Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Backup</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              This will create a snapshot of datasets and system configuration (UI only for now).
            </Typography>

            <Stack spacing={1}>
              <InputLabel>Backup Type</InputLabel>
              <Select
                value={createForm.backupType}
                onChange={(e) => setCreateForm((p) => ({ ...p, backupType: e.target.value }))}
              >
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
          <Button variant="contained" onClick={createBackupUIOnly}>
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreOpen} onClose={() => setRestoreOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Confirm Restore</DialogTitle>
        <DialogContent dividers>
          {restoreTarget ? (
            <Stack spacing={1.5}>
              <Alert severity="warning">
                Restoring will overwrite current system data. This action is risky and should only be done by admins.
              </Alert>

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
                <Typography variant="body2">{restoreTarget.backupType.replace('_', ' ')}</Typography>
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
          <Button variant="contained" color="warning" onClick={restoreUIOnly}>
            Restore
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar open={toast.open} autoHideDuration={2200} onClose={() => setToast((p) => ({ ...p, open: false }))}>
        <Alert onClose={() => setToast((p) => ({ ...p, open: false }))} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
