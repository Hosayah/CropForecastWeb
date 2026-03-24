import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';

import VisibilityIcon from '@mui/icons-material/Visibility';

import MainCard from 'components/MainCard';
import AnalystPageHeader from './components/AnalystPageHeader';
import { listAuditLogsApi } from 'model/adminAuditApi';
import { downloadCsv } from 'utils/csv';

function SummaryCard({ title, value, subtitle, loading }) {
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

export default function AnalystAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  useEffect(() => {
    let mounted = true;

    async function loadLogs() {
      setLoading(true);
      setError('');
      try {
        const response = await listAuditLogsApi();
        if (!mounted) return;
        const payload = response?.data?.data || response?.data || {};
        const rows = Array.isArray(payload?.logs) ? payload.logs : [];
        setLogs(rows.filter((log) => log.module !== 'SECURITY'));
      } catch (err) {
        if (!mounted) return;
        setLogs([]);
        setError(err?.response?.data?.error || 'Failed to load audit logs.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadLogs();
    return () => {
      mounted = false;
    };
  }, []);

  const modules = useMemo(() => ['ALL', ...Array.from(new Set(logs.map((log) => log.module).filter(Boolean))).sort()], [logs]);
  const severities = useMemo(() => ['ALL', ...Array.from(new Set(logs.map((log) => log.severity).filter(Boolean))).sort()], [logs]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = [...logs];

    if (moduleFilter !== 'ALL') {
      list = list.filter((log) => log.module === moduleFilter);
    }

    if (severityFilter !== 'ALL') {
      list = list.filter((log) => log.severity === severityFilter);
    }

    if (query) {
      list = list.filter((log) =>
        [log.action, log.actor, log.target, log.message, log.module].some((field) => String(field || '').toLowerCase().includes(query))
      );
    }

    list.sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
    return list;
  }, [logs, moduleFilter, severityFilter, search]);

  const pagedLogs = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredLogs.slice(start, start + rowsPerPage);
  }, [filteredLogs, page, rowsPerPage]);

  const stats = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return {
      totalLogs: logs.length,
      todayLogs: logs.filter((log) => String(log.timestamp || '').startsWith(todayKey)).length,
      authEvents: logs.filter((log) => log.module === 'AUTH').length,
      visibleAdminActions: filteredLogs.filter((log) => String(log.actor || '').includes('@')).length
    };
  }, [logs, filteredLogs]);

  const openDetails = (log) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const handleExport = () => {
    if (!filteredLogs.length) {
      setToast({
        open: true,
        severity: 'info',
        message: 'There are no audit logs to export for the current filters.'
      });
      return;
    }

    const rows = [
      ['Timestamp', 'Module', 'Severity', 'Action', 'Actor', 'Target', 'Message', 'IP'],
      ...filteredLogs.map((log) => [
        log.timestamp || '',
        log.module || '',
        log.severity || '',
        log.action || '',
        log.actor || '',
        log.target || '',
        log.message || '',
        log.ip || ''
      ])
    ];

    const suffix = [moduleFilter, severityFilter, search.trim() ? 'search' : null].filter(Boolean).join('_').toLowerCase();
    downloadCsv(`analyst_audit_logs_${suffix || 'all'}.csv`, rows);
    setToast({
      open: true,
      severity: 'success',
      message: `Exported ${filteredLogs.length} audit log${filteredLogs.length === 1 ? '' : 's'}.`
    });
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
          <AnalystPageHeader title="Audit Logs & Security Monitoring" current="Audit Logs" />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField size="small" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." />

            <Stack direction="row" spacing={1} alignItems="center">
              <InputLabel>Module:</InputLabel>
              <Select size="small" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                {modules.map((module) => (
                  <MenuItem key={module} value={module}>
                    {module}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <InputLabel>Severity:</InputLabel>
              <Select size="small" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                {severities.map((severity) => (
                  <MenuItem key={severity} value={severity}>
                    {severity}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Button variant="outlined" disabled>
              Refresh
            </Button>

            <Button variant="contained" onClick={handleExport}>
              Export
            </Button>
          </Stack>
        </Stack>
      </Grid>

      {error ? (
        <Grid size={12}>
          <Alert severity={error.toLowerCase().includes('forbidden') ? 'warning' : 'error'}>{error}</Alert>
        </Grid>
      ) : null}

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard title="Total Logs" value={stats.totalLogs} subtitle="All recorded events" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard title="Today" value={stats.todayLogs} subtitle="Logs created today" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard title="Auth Events" value={stats.authEvents} subtitle="Login and token events" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard title="Visible Admin Actions" value={stats.visibleAdminActions} subtitle="Current page matches" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MainCard content={false} sx={{ mt: 1.5 }}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Logs</Typography>
              <Typography variant="caption" color="text.secondary">
                Showing {loading ? '...' : filteredLogs.length} result(s) from the latest 500 logs
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
                          <TableCell>
                            <Skeleton width={120} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={90} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={90} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={120} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={120} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={100} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width="80%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={60} />
                          </TableCell>
                        </TableRow>
                      ))
                    : pagedLogs.map((log) => (
                        <TableRow key={log.id || `${log.timestamp}-${log.action}`} hover>
                          <TableCell>{log.timestamp}</TableCell>
                          <TableCell>
                            <ModuleChip module={log.module} />
                          </TableCell>
                          <TableCell>
                            <SeverityChip severity={log.severity} />
                          </TableCell>
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
              <Typography variant="body2">
                <strong>Timestamp:</strong> {selectedLog.timestamp}
              </Typography>
              <Typography variant="body2">
                <strong>Action:</strong> {selectedLog.action}
              </Typography>
              <Typography variant="body2">
                <strong>Actor:</strong> {selectedLog.actor}
              </Typography>
              <Typography variant="body2">
                <strong>Target:</strong> {selectedLog.target}
              </Typography>
              <Typography variant="body2">
                <strong>IP:</strong> {selectedLog.ip || '-'}
              </Typography>
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
