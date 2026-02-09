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
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';

// project imports
import MainCard from 'components/MainCard';

// 🔥 ViewModel
import { useAdminAuditViewModel } from 'viewModel/useAdminAuditViewModel';

// ==============================|| SMALL HELPERS ||============================== //

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
            <Typography variant="h4">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </>
        )}
      </Stack>
    </MainCard>
  );
}

function ModuleChip({ module }) {
  const cfg = useMemo(() => {
    switch (module) {
      case 'AUTH':
        return { label: 'AUTH', color: 'primary' };
      case 'USERS':
        return { label: 'USERS', color: 'success' };
      case 'DATASETS':
        return { label: 'DATASETS', color: 'warning' };
      case 'SYSTEM':
        return { label: 'SYSTEM', color: 'default' };
      case 'SECURITY':
        return { label: 'SECURITY', color: 'error' };
      default:
        return { label: module || 'OTHER', color: 'default' };
    }
  }, [module]);

  return <Chip size="small" label={cfg.label} color={cfg.color} variant="outlined" />;
}

function SeverityChip({ severity }) {
  const cfg = useMemo(() => {
    switch (severity) {
      case 'INFO':
        return { label: 'INFO', color: 'default' };
      case 'WARNING':
        return { label: 'WARNING', color: 'warning' };
      case 'ERROR':
        return { label: 'ERROR', color: 'error' };
      case 'CRITICAL':
        return { label: 'CRITICAL', color: 'error' };
      default:
        return { label: severity || 'INFO', color: 'default' };
    }
  }, [severity]);

  return <Chip size="small" label={cfg.label} color={cfg.color} variant="outlined" />;
}

// ==============================|| ADMIN AUDIT LOGS ||============================== //

export default function AdminAuditLogs() {
  const MODULES = useMemo(() => ['ALL', 'AUTH', 'USERS', 'DATASETS', 'SYSTEM', 'SECURITY'], []);
  const SEVERITIES = useMemo(() => ['ALL', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'], []);

  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  // 🔥 REAL DATA FROM VIEWMODEL
  const { logs, loading, fetchLogs } = useAdminAuditViewModel();

  useEffect(() => {
    fetchLogs();
  }, []);

  // 🔥 Dynamic stats
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    const totalLogs = logs.length;

    const todayLogs = logs.filter((l) =>
      l.timestamp?.startsWith(todayStr)
    ).length;

    const securityEvents = logs.filter(
      (l) => l.module === 'SECURITY'
    ).length;

    const adminActions = logs.filter(
      (l) => l.actor?.includes('@')
    ).length;

    return { totalLogs, todayLogs, securityEvents, adminActions };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    let list = [...logs];

    if (moduleFilter !== 'ALL')
      list = list.filter((l) => l.module === moduleFilter);

    if (severityFilter !== 'ALL')
      list = list.filter((l) => l.severity === severityFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.action?.toLowerCase().includes(q) ||
          l.actor?.toLowerCase().includes(q) ||
          l.target?.toLowerCase().includes(q) ||
          l.message?.toLowerCase().includes(q) ||
          l.module?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) =>
      (b.timestamp || '').localeCompare(a.timestamp || '')
    );

    return list;
  }, [logs, moduleFilter, severityFilter, search]);

  const openDetails = (log) => {
    setSelectedLog(log);
    setDetailsOpen(true);
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
          <Typography variant="h5">Audit Logs & Security Monitoring</Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
            />

            <Stack direction="row" spacing={1} alignItems="center">
              <InputLabel>Module:</InputLabel>
              <Select size="small" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                {MODULES.map((m) => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <InputLabel>Severity:</InputLabel>
              <Select size="small" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                {SEVERITIES.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </Stack>

            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchLogs}>
              Refresh
            </Button>

            <Button variant="contained" startIcon={<FileDownloadIcon />}>
              Export
            </Button>
          </Stack>
        </Stack>
      </Grid>

      {/* Stats */}
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard title="Total Logs" value={stats.totalLogs} subtitle="All recorded events" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard title="Today" value={stats.todayLogs} subtitle="Logs created today" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard title="Security Events" value={stats.securityEvents} subtitle="Unauthorized/blocked attempts" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard title="Admin Actions" value={stats.adminActions} subtitle="Changes made by admins" loading={loading} />
      </Grid>

      {/* Logs Table */}
      <Grid size={{ xs: 12 }}>
        <MainCard content={false} sx={{ mt: 1.5 }}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Typography variant="h6">Logs</Typography>

            <Divider />

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Module</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Actor</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell align="right">Details</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading
                    ? Array.from({ length: 8 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell><Skeleton width={120} /></TableCell>
                          <TableCell><Skeleton width={90} /></TableCell>
                          <TableCell><Skeleton width={90} /></TableCell>
                          <TableCell><Skeleton width={120} /></TableCell>
                          <TableCell><Skeleton width={120} /></TableCell>
                          <TableCell><Skeleton width={100} /></TableCell>
                          <TableCell><Skeleton width="80%" /></TableCell>
                          <TableCell><Skeleton width={60} /></TableCell>
                        </TableRow>
                      ))
                    : filteredLogs.map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell>{log.timestamp}</TableCell>
                          <TableCell><ModuleChip module={log.module} /></TableCell>
                          <TableCell><SeverityChip severity={log.severity} /></TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>{log.actor}</TableCell>
                          <TableCell>{log.target}</TableCell>
                          <TableCell>{log.message}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="View details">
                              <IconButton size="small" onClick={() => openDetails(log)}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </MainCard>
      </Grid>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Log Details</DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Stack spacing={1}>
              <Typography variant="body2"><strong>Timestamp:</strong> {selectedLog.timestamp}</Typography>
              <Typography variant="body2"><strong>Action:</strong> {selectedLog.action}</Typography>
              <Typography variant="body2"><strong>Actor:</strong> {selectedLog.actor}</Typography>
              <Typography variant="body2"><strong>Target:</strong> {selectedLog.target}</Typography>
              <Typography variant="body2"><strong>IP:</strong> {selectedLog.ip || '—'}</Typography>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="body2">{selectedLog.message}</Typography>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={2200}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
