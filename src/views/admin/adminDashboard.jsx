import { useEffect, useMemo, useState } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import { InputLabel } from '@mui/material';
import Divider from '@mui/material/Divider';

import MainCard from 'components/MainCard';
import AdminPageHeader from './components/AdminPageHeader';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import { LineChart } from '@mui/x-charts/LineChart';

import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import StorageIcon from '@mui/icons-material/Storage';
import RuleIcon from '@mui/icons-material/Rule';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import RefreshIcon from '@mui/icons-material/Refresh';
import MemoryIcon from '@mui/icons-material/Memory';
import SpeedIcon from '@mui/icons-material/Speed';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { listUsersApi } from 'model/adminUsersApi';
import { listDatasetsApi } from 'model/adminDatasetsApi';
import { listAuditLogsApi } from 'model/adminAuditApi';
import { listBackupsApi } from 'model/adminBackupApi';
import { getSystemConfigApi } from 'model/adminSystemConfigApi';
import { getCombinedLiveMonitoringApi } from 'model/adminMonitoringApi';

function AdminSummaryCard({ title, value, subtitle, icon, loading }) {
  return (
    <MainCard content={false} sx={{ height: '100%' }}>
      <Stack sx={{ p: 2.5 }} spacing={1.25}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>

          {icon && (
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover'
              }}
            >
              {icon}
            </Box>
          )}
        </Stack>

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

function formatTime(iso) {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function severityColor(severity) {
  const key = (severity || '').toUpperCase();
  if (key === 'CRITICAL') return 'error';
  if (key === 'WARNING') return 'warning';
  if (key === 'INFO') return 'info';
  return 'default';
}

function toFixed(value, digits = 2) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits) : '0.00';
}

function formatDuration(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n)) return '-';
  return `${n.toFixed(2)} ms`;
}

function formatShortTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [moduleOptions, setModuleOptions] = useState(['ALL']);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    activeUsers: 0,
    datasets: 0,
    auditEvents: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemState, setSystemState] = useState({
    maintenanceMode: false,
    aiForecastEnabled: false,
    backupCount: 0,
    latestBackup: '-'
  });
  const [monitoring, setMonitoring] = useState(null);
  const [monitoringLoading, setMonitoringLoading] = useState(true);
  const [monitoringError, setMonitoringError] = useState('');
  const [monitoringWarnings, setMonitoringWarnings] = useState([]);
  const [monitoringAvailability, setMonitoringAvailability] = useState({ localhost: false, render: false });
  const [monitoringHistory, setMonitoringHistory] = useState([]);

  const fetchDashboard = async () => {
    setError('');
    const initialLoad = loading;
    if (initialLoad) setLoading(true);
    else setRefreshing(true);

    try {
      const [usersRes, datasetsRes, auditRes, backupsRes, configRes] = await Promise.all([
        listUsersApi(),
        listDatasetsApi(),
        listAuditLogsApi(),
        listBackupsApi(),
        getSystemConfigApi()
      ]);

      const users = usersRes?.data?.users || [];
      const datasets = datasetsRes?.data?.datasets || [];
      const auditLogs = auditRes?.data?.logs || [];
      const backups = backupsRes?.data?.backups || [];
      const config = configRes?.data || {};

      const discoveredModules = Array.from(
        new Set(
          (auditLogs || [])
            .map((row) => String(row?.module || '').trim().toUpperCase())
            .filter(Boolean)
        )
      ).sort();
      const options = ['ALL', ...discoveredModules];
      setModuleOptions(options);

      const activeFilter = options.includes(moduleFilter) ? moduleFilter : 'ALL';
      if (activeFilter !== moduleFilter) {
        setModuleFilter(activeFilter);
      }

      const filteredLogs =
        activeFilter === 'ALL' ? auditLogs : auditLogs.filter((row) => String(row?.module || '').trim().toUpperCase() === activeFilter);
      const recentLogs = filteredLogs.slice(0, 5);

      setSummary({
        totalUsers: users.length,
        activeUsers: users.filter((u) => String(u?.status || '').toLowerCase() === 'active').length,
        datasets: datasets.length,
        auditEvents: auditLogs.length
      });

      setSystemState({
        maintenanceMode: !!config?.maintenanceMode,
        aiForecastEnabled: !!config?.aiForecastEnabled,
        backupCount: backups.length,
        latestBackup: backups[0]?.createdAt || '-'
      });

      setRecentActivity(
        recentLogs.map((row) => ({
          id: row?.id,
          module: row?.module || 'UNKNOWN',
          action: row?.action || 'UNKNOWN',
          detail: row?.message || '-',
          actor: row?.actor || 'unknown',
          severity: row?.severity || 'INFO',
          timestamp: row?.timestamp || ''
        }))
      );
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [moduleFilter]);

  useEffect(() => {
    let isMounted = true;
    let intervalId = null;

    const fetchLiveMonitoring = async (silent = false) => {
      if (!silent) setMonitoringLoading(true);
      try {
        const res = await getCombinedLiveMonitoringApi();
        if (!isMounted) return;
        setMonitoring(res?.aggregated || null);
        setMonitoringWarnings(res?.warnings || []);
        setMonitoringAvailability(res?.availability || { localhost: false, render: false });
        const next = res?.aggregated || {};
        const now = Date.now();
        setMonitoringHistory((prev) => {
          const merged = [
            ...prev,
            {
              ts: now,
              label: formatShortTime(now),
              avgDurationMs: Number(next?.requestMetrics?.avgDurationMs || 0),
              p95DurationMs: Number(next?.requestMetrics?.p95DurationMs || 0),
              rps: Number(next?.requestMetrics?.rps || 0)
            }
          ];
          return merged.slice(-30);
        });
        setMonitoringError('');
      } catch (err) {
        if (!isMounted) return;
        setMonitoringWarnings([]);
        setMonitoringAvailability({ localhost: false, render: false });
        setMonitoringError(err?.message || err?.response?.data?.error || 'Failed to load live monitoring.');
      } finally {
        if (isMounted) setMonitoringLoading(false);
      }
    };

    fetchLiveMonitoring(false);
    intervalId = setInterval(() => fetchLiveMonitoring(true), 5000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const modules = useMemo(() => moduleOptions, [moduleOptions]);

  const filteredActivity = recentActivity;

  const eventsLast24h = useMemo(() => {
    const threshold = Date.now() - 24 * 60 * 60 * 1000;
    return recentActivity.filter((item) => {
      const ms = new Date(item.timestamp).getTime();
      return !Number.isNaN(ms) && ms >= threshold;
    }).length;
  }, [recentActivity]);

  const processMetrics = monitoring?.process || {};
  const requestMetrics = monitoring?.requestMetrics || {};
  const slowestEndpoints = monitoring?.slowestEndpoints || [];
  const recentErrors = monitoring?.recentErrors || [];
  const historyLabels = monitoringHistory.map((h) => h.label);
  const historyAvgLatency = monitoringHistory.map((h) => h.avgDurationMs);
  const historyP95Latency = monitoringHistory.map((h) => h.p95DurationMs);
  const historyRps = monitoringHistory.map((h) => h.rps);
  const sourceLabels = [monitoringAvailability.localhost ? 'Localhost' : null, monitoringAvailability.render ? 'Render' : null].filter(Boolean);

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <AdminPageHeader title="Admin Dashboard" current="Dashboard" />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <InputLabel>Module:</InputLabel>
            <Select
              size="small"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 220 } }}
            >
              {modules.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchDashboard} disabled={loading || refreshing}>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Stack>
        </Stack>
      </Grid>

      {error && (
        <Grid size={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      )}

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard
          title="Total Users"
          value={summary.totalUsers}
          subtitle="All registered accounts"
          icon={<PeopleOutlineIcon fontSize="small" />}
          loading={loading}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard
          title="Active Users"
          value={summary.activeUsers}
          subtitle="Accounts currently enabled"
          icon={<VerifiedUserIcon fontSize="small" />}
          loading={loading}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard
          title="Datasets"
          value={summary.datasets}
          subtitle="Available dataset files"
          icon={<StorageIcon fontSize="small" />}
          loading={loading}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard
          title="Audit Events"
          value={summary.auditEvents}
          subtitle="Logged admin/system actions"
          icon={<RuleIcon fontSize="small" />}
          loading={loading}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MainCard content={false} sx={{ mt: 1.5 }}>
          {loading ? (
            <Stack sx={{ p: 2.5 }} spacing={1.5}>
              <Typography variant="h6">System Activity Overview</Typography>
              <Skeleton height={22} width="40%" />
              <Skeleton height={120} />
            </Stack>
          ) : (
            <Stack spacing={1.2} sx={{ p: 2.5 }}>
              <Typography variant="h6">System Activity Overview</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
                <Chip
                  label={`Maintenance: ${systemState.maintenanceMode ? 'ON' : 'OFF'}`}
                  color={systemState.maintenanceMode ? 'warning' : 'success'}
                  variant="outlined"
                />
                <Chip
                  label={`AI Forecast: ${systemState.aiForecastEnabled ? 'ENABLED' : 'DISABLED'}`}
                  color={systemState.aiForecastEnabled ? 'success' : 'default'}
                  variant="outlined"
                />
                <Chip label={`Backups: ${systemState.backupCount}`} color="info" variant="outlined" />
                <Chip label={`Events (24h): ${eventsLast24h}`} color="secondary" variant="outlined" />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Latest backup: {systemState.latestBackup}
              </Typography>
            </Stack>
          )}
        </MainCard>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MainCard sx={{ mt: 2 }} content={false}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Recent Activity</Typography>
              <Typography variant="caption" color="text.secondary">
                Filter: {moduleFilter}
              </Typography>
            </Stack>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Module</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Detail</TableCell>
                    <TableCell>Actor</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell align="right">Time</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading
                    ? Array.from({ length: 6 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Skeleton width={70} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={120} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width="90%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={90} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={70} />
                          </TableCell>
                          <TableCell align="right">
                            <Skeleton width={120} />
                          </TableCell>
                        </TableRow>
                      ))
                    : filteredActivity.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>
                            <Chip size="small" label={row.module} variant="outlined" />
                          </TableCell>
                          <TableCell>{row.action}</TableCell>
                          <TableCell>{row.detail}</TableCell>
                          <TableCell>{row.actor}</TableCell>
                          <TableCell>
                            <Chip size="small" label={row.severity} color={severityColor(row.severity)} variant="outlined" />
                          </TableCell>
                          <TableCell align="right">{formatTime(row.timestamp)}</TableCell>
                        </TableRow>
                      ))}

                  {!loading && filteredActivity.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary">
                          No activity found for this module.
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

      <Grid size={{ xs: 12 }}>
        <MainCard sx={{ mt: 2 }} content={false}>
          {monitoringLoading ? (
            <Stack sx={{ p: 2.5 }} spacing={1.5}>
              <Typography variant="h6">Live API Monitoring</Typography>
              <Skeleton height={20} width="45%" />
              <Skeleton height={90} />
              <Skeleton height={120} />
            </Stack>
          ) : (
            <Stack sx={{ p: 2.5 }} spacing={2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">Live API Monitoring</Typography>
                <Typography variant="caption" color="text.secondary">
                  Polled every 5 seconds
                </Typography>
              </Stack>

              {monitoringError ? <Alert severity="warning">{monitoringError}</Alert> : null}
              {!monitoringError && monitoringWarnings.length > 0 ? <Alert severity="info">{monitoringWarnings.join(' | ')}</Alert> : null}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap">
                <Chip
                  size="small"
                  color={monitoringAvailability.localhost ? 'success' : 'default'}
                  variant="outlined"
                  label={`Localhost ${monitoringAvailability.localhost ? 'connected' : 'offline'}`}
                />
                <Chip
                  size="small"
                  color={monitoringAvailability.render ? 'success' : 'default'}
                  variant="outlined"
                  label={`Render ${monitoringAvailability.render ? 'connected' : 'offline'}`}
                />
                {sourceLabels.length > 0 ? <Chip size="small" variant="outlined" label={`Sources: ${sourceLabels.join(' + ')}`} /> : null}
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <MainCard content={false} sx={{ border: 1, borderColor: 'divider' }}>
                    <Stack sx={{ p: 2 }} spacing={1.25}>
                      <Typography variant="subtitle1">Latency Trend</Typography>
                      {monitoringHistory.length < 2 ? (
                        <Skeleton height={220} />
                      ) : (
                        <LineChart
                          height={250}
                          margin={{ top: 20, right: 20, bottom: 20, left: 45 }}
                          grid={{ horizontal: true, vertical: false }}
                          xAxis={[{ scaleType: 'point', data: historyLabels }]}
                          yAxis={[{ label: 'ms' }]}
                          series={[
                            {
                              id: 'avg-latency',
                              type: 'line',
                              label: 'Avg',
                              data: historyAvgLatency,
                              color: '#4caf50',
                              showMark: false,
                              area: true
                            },
                            {
                              id: 'p95-latency',
                              type: 'line',
                              label: 'P95',
                              data: historyP95Latency,
                              color: '#90caf9',
                              showMark: false,
                              area: false
                            }
                          ]}
                        />
                      )}
                    </Stack>
                  </MainCard>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <MainCard content={false} sx={{ border: 1, borderColor: 'divider' }}>
                    <Stack sx={{ p: 2 }} spacing={1.25}>
                      <Typography variant="subtitle1">RPS Trend</Typography>
                      {monitoringHistory.length < 2 ? (
                        <Skeleton height={220} />
                      ) : (
                        <LineChart
                          height={250}
                          margin={{ top: 20, right: 20, bottom: 20, left: 45 }}
                          grid={{ horizontal: true, vertical: false }}
                          xAxis={[{ scaleType: 'point', data: historyLabels }]}
                          yAxis={[{ label: 'rps' }]}
                          series={[
                            {
                              id: 'rps',
                              type: 'line',
                              label: 'RPS',
                              data: historyRps,
                              color: '#ff9800',
                              showMark: false,
                              area: true
                            }
                          ]}
                        />
                      )}
                    </Stack>
                  </MainCard>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <MainCard content={false} sx={{ border: 1, borderColor: 'divider' }}>
                    <Stack sx={{ p: 2 }} spacing={1.25}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <MemoryIcon fontSize="small" />
                        <Typography variant="subtitle1">Process</Typography>
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap">
                        <Chip label={`CPU ${toFixed(processMetrics.cpuPercent)}%`} size="small" color="info" variant="outlined" />
                        <Chip
                          label={`RAM ${toFixed(processMetrics.memoryRssMb)} MB (${toFixed(processMetrics.memoryPercent)}%)`}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                        <Chip label={`Threads ${processMetrics.threadCount || 0}`} size="small" variant="outlined" />
                        <Chip label={`Uptime ${processMetrics.uptimeMinutes || 0} min`} size="small" variant="outlined" />
                        <Chip label={`Instances ${processMetrics.instanceCount || 0}`} size="small" variant="outlined" />
                      </Stack>
                    </Stack>
                  </MainCard>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <MainCard content={false} sx={{ border: 1, borderColor: 'divider' }}>
                    <Stack sx={{ p: 2 }} spacing={1.25}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SpeedIcon fontSize="small" />
                        <Typography variant="subtitle1">Request Metrics</Typography>
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap">
                        <Chip label={`RPS ${toFixed(requestMetrics.rps)}`} size="small" color="success" variant="outlined" />
                        <Chip label={`Avg ${formatDuration(requestMetrics.avgDurationMs)}`} size="small" variant="outlined" />
                        <Chip label={`P95 ${formatDuration(requestMetrics.p95DurationMs)}`} size="small" variant="outlined" />
                        <Chip label={`Tracked ${requestMetrics.trackedRequests || 0}`} size="small" variant="outlined" />
                      </Stack>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Error rate: {toFixed(requestMetrics.errorRatePercent, 4)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, Number(requestMetrics.errorRatePercent) || 0)}
                          color={Number(requestMetrics.errorRatePercent) > 5 ? 'warning' : 'info'}
                          sx={{ mt: 0.75 }}
                        />
                      </Box>
                    </Stack>
                  </MainCard>
                </Grid>
              </Grid>

              <Divider />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Slowest Endpoints
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Method</TableCell>
                          <TableCell>Path</TableCell>
                          <TableCell align="right">Count</TableCell>
                          <TableCell align="right">Avg</TableCell>
                          <TableCell align="right">Min</TableCell>
                          <TableCell align="right">Max</TableCell>
                          <TableCell align="right">Errors</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {slowestEndpoints.slice(0, 8).map((row) => (
                          <TableRow key={`${row.method}-${row.path}`} hover>
                            <TableCell>{row.method}</TableCell>
                            <TableCell>{row.path}</TableCell>
                            <TableCell align="right">{row.count}</TableCell>
                            <TableCell align="right">{formatDuration(row.avgDurationMs)}</TableCell>
                            <TableCell align="right">{formatDuration(row.minDurationMs)}</TableCell>
                            <TableCell align="right">{formatDuration(row.maxDurationMs)}</TableCell>
                            <TableCell align="right">{row.errorCount}</TableCell>
                          </TableRow>
                        ))}
                        {slowestEndpoints.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7}>
                              <Typography variant="body2" color="text.secondary">
                                No endpoint telemetry yet.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Recent Errors
                  </Typography>
                  <Stack spacing={1}>
                    {recentErrors.slice(0, 6).map((errorItem, idx) => (
                      <MainCard key={`${errorItem.timestamp}-${idx}`} content={false} sx={{ border: 1, borderColor: 'divider' }}>
                        <Stack sx={{ p: 1.5 }} spacing={0.5}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <ErrorOutlineIcon fontSize="small" color="error" />
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(errorItem.timestamp)}
                            </Typography>
                          </Stack>
                          <Typography variant="body2">
                            {errorItem.method} {errorItem.path}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {errorItem.status ? `Status ${errorItem.status}` : 'Error'}
                            {errorItem.error_type ? ` • ${errorItem.error_type}` : ''}
                            {errorItem.source ? ` • ${errorItem.source}` : ''}
                          </Typography>
                        </Stack>
                      </MainCard>
                    ))}
                    {recentErrors.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No recent errors.
                      </Typography>
                    ) : null}
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          )}
        </MainCard>
      </Grid>
    </Grid>
  );
}



