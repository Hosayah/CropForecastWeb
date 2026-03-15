import { useEffect, useMemo, useState } from 'react';

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
import TablePagination from '@mui/material/TablePagination';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';

import MainCard from 'components/MainCard';
import AdminPageHeader from './components/AdminPageHeader';
import { useAdminAuditViewModel } from 'viewModel/useAdminAuditViewModel';

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
            <Typography variant="h4">{typeof value === 'number' ? value.toLocaleString() : value}</Typography>
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

export default function AdminAuditLogs() {
  const MODULES = useMemo(() => ['ALL', 'AUTH', 'USERS', 'DATASETS', 'SYSTEM', 'ML', 'BACKUPS'], []);
  const SEVERITIES = useMemo(() => ['ALL', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'], []);

  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  const { logs, stats, loading, fetchLogs } = useAdminAuditViewModel();

  useEffect(() => {
    setPage(0);
    fetchLogs({ module: moduleFilter, severity: severityFilter });
  }, [moduleFilter, severityFilter]);

  const filteredLogs = useMemo(() => {
    let list = [...logs].filter((log) => log.module !== 'SECURITY');

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (log) =>
          log.action?.toLowerCase().includes(q) ||
          log.actor?.toLowerCase().includes(q) ||
          log.target?.toLowerCase().includes(q) ||
          log.message?.toLowerCase().includes(q) ||
          log.module?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return list;
  }, [logs, search]);

  const pagedLogs = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredLogs.slice(start, start + rowsPerPage);
  }, [filteredLogs, page, rowsPerPage]);

  const visibleAdminActions = useMemo(() => pagedLogs.filter((log) => log.actor?.includes('@')).length, [pagedLogs]);

  useEffect(() => {
    setPage(0);
  }, [search]);

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
          <AdminPageHeader title="Audit Logs & Security Monitoring" current="Audit Logs" />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField size="small" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." />

            <Stack direction="row" spacing={1} alignItems="center">
              <InputLabel>Module:</InputLabel>
              <Select size="small" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                {MODULES.map((module) => (
                  <MenuItem key={module} value={module}>
                    {module}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <InputLabel>Severity:</InputLabel>
              <Select size="small" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                {SEVERITIES.map((severity) => (
                  <MenuItem key={severity} value={severity}>
                    {severity}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() =>
                fetchLogs({
                  force: true,
                  module: moduleFilter,
                  severity: severityFilter
                })
              }
            >
              Refresh
            </Button>

            <Button variant="contained" startIcon={<FileDownloadIcon />}>
              Export
            </Button>
          </Stack>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard title="Total Logs" value={stats.totalLogs} subtitle="All recorded events" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard title="Today" value={stats.todayLogs} subtitle="Logs created today" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard title="Auth Events" value={stats.authEvents} subtitle="Login and token events" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard title="Visible Admin Actions" value={visibleAdminActions} subtitle="Current page matches" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MainCard content={false} sx={{ mt: 1.5 }}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Logs</Typography>
              <Typography variant="caption" color="text.secondary">
                Showing {loading ? '...' : filteredLogs.length} result(s) from the latest {stats.windowLimit || 500} logs
              </Typography>
            </Stack>

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
                    : pagedLogs.map((log) => (
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
              <TablePagination
                component="div"
                count={filteredLogs.length}
                page={page}
                onPageChange={(_, nextPage) => setPage(nextPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10) || 25);
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </TableContainer>
          </Stack>
        </MainCard>
      </Grid>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Log Details</DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Stack spacing={1}>
              <Typography variant="body2"><strong>Timestamp:</strong> {selectedLog.timestamp}</Typography>
              <Typography variant="body2"><strong>Action:</strong> {selectedLog.action}</Typography>
              <Typography variant="body2"><strong>Actor:</strong> {selectedLog.actor}</Typography>
              <Typography variant="body2"><strong>Target:</strong> {selectedLog.target}</Typography>
              <Typography variant="body2"><strong>IP:</strong> {selectedLog.ip || '-'} </Typography>
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

      <Snackbar open={toast.open} autoHideDuration={2200} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
