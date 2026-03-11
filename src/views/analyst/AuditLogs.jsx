import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { InputLabel } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';

import MainCard from 'components/MainCard';
import AnalystPageHeader from './components/AnalystPageHeader';
import { listAuditLogsApi } from 'model/adminAuditApi';

export default function AnalystAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

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
        setLogs(rows);
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

  const modules = useMemo(
    () => ['ALL', ...Array.from(new Set(logs.map((log) => log.module).filter((module) => module && module !== 'SECURITY'))).sort()],
    [logs]
  );
  const severities = useMemo(() => ['ALL', ...Array.from(new Set(logs.map((log) => log.severity).filter(Boolean))).sort()], [logs]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (log.module === 'SECURITY') return false;
      if (moduleFilter !== 'ALL' && log.module !== moduleFilter) return false;
      if (severityFilter !== 'ALL' && log.severity !== severityFilter) return false;
      if (!query) return true;
      return [log.action, log.actor, log.target, log.message, log.module].some((field) => String(field || '').toLowerCase().includes(query));
    });
  }, [logs, moduleFilter, severityFilter, search]);

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
          <AnalystPageHeader title="Audit Logs" current="Audit Logs" />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
            <TextField size="small" placeholder="Search logs..." value={search} onChange={(event) => setSearch(event.target.value)} />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <InputLabel>Module:</InputLabel>
              <Select size="small" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} sx={{ minWidth: 160 }}>
                {modules.map((module) => (
                  <MenuItem key={module} value={module}>
                    {module}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <InputLabel>Severity:</InputLabel>
              <Select size="small" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} sx={{ minWidth: 160 }}>
                {severities.map((severity) => (
                  <MenuItem key={severity} value={severity}>
                    {severity}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Stack>
        </Stack>
      </Grid>

      {error ? (
        <Grid size={12}>
          <Alert severity={error.toLowerCase().includes('forbidden') ? 'warning' : 'error'}>{error}</Alert>
        </Grid>
      ) : null}

      <Grid size={12}>
        <MainCard content={false}>
          <Stack sx={{ p: 2.5 }} spacing={1.5}>
            <Typography variant="h6">Audit Timeline</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Module</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Actor</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading
                    ? Array.from({ length: 8 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell><Skeleton width={130} /></TableCell>
                          <TableCell><Skeleton width={80} /></TableCell>
                          <TableCell><Skeleton width={90} /></TableCell>
                          <TableCell><Skeleton width={120} /></TableCell>
                          <TableCell><Skeleton width={120} /></TableCell>
                          <TableCell><Skeleton width={100} /></TableCell>
                          <TableCell><Skeleton width={220} /></TableCell>
                        </TableRow>
                      ))
                    : filteredLogs.map((log) => (
                        <TableRow key={log.id || `${log.timestamp}-${log.action}`} hover>
                          <TableCell>{log.timestamp || '-'}</TableCell>
                          <TableCell>{log.module || '-'}</TableCell>
                          <TableCell>
                            <Chip size="small" variant="outlined" label={log.severity || 'INFO'} color={log.severity === 'CRITICAL' ? 'error' : 'default'} />
                          </TableCell>
                          <TableCell>{log.action || '-'}</TableCell>
                          <TableCell>{log.actor || '-'}</TableCell>
                          <TableCell>{log.target || '-'}</TableCell>
                          <TableCell>{log.message || '-'}</TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}
