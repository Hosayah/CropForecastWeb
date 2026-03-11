import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MainCard from 'components/MainCard';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';

import { useMlTrainingJobsViewModel } from 'viewModel/useMlTrainingJobsViewModel';
import MlSummaryCard from 'views/ml/components/MlSummaryCard';

const RUNNING_STATUSES = new Set(['queued', 'running']);

function statusChip(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'queued') return <Chip size="small" label="Queued" color="default" variant="outlined" />;
  if (normalized === 'running') return <Chip size="small" label="Running" color="info" variant="outlined" />;
  if (normalized === 'completed') return <Chip size="small" label="Completed" color="success" variant="outlined" />;
  return <Chip size="small" label="Failed" color="error" variant="outlined" />;
}

export default function TrainingJobs() {
  const navigate = useNavigate();
  const { jobs, loading, error, fetchJobs } = useMlTrainingJobsViewModel();
  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (!error) return;
    setToast({
      open: true,
      severity: error.includes('Forbidden') || error.includes('permission') ? 'warning' : 'error',
      message: error.includes('Forbidden') || error.includes('permission') ? 'Permission denied' : error
    });
  }, [error]);

  const hasRunning = useMemo(
    () => jobs.some((job) => RUNNING_STATUSES.has(String(job.validationStatus || job.status || '').toLowerCase())),
    [jobs]
  );
  const summary = useMemo(
    () => ({
      total: jobs.length,
      running: jobs.filter((job) => RUNNING_STATUSES.has(String(job.validationStatus || job.status || '').toLowerCase())).length,
      completed: jobs.filter((job) => String(job.validationStatus || job.status || '').toLowerCase() === 'completed').length,
      failed: jobs.filter((job) => String(job.validationStatus || job.status || '').toLowerCase() === 'failed').length
    }),
    [jobs]
  );

  useEffect(() => {
    if (!hasRunning) return undefined;
    const timer = setInterval(() => {
      fetchJobs();
    }, 5000);
    return () => clearInterval(timer);
  }, [hasRunning, fetchJobs]);

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack spacing={0.75}>
            <Typography variant="h5">Validation Jobs</Typography>
            <Breadcrumbs separator="/" aria-label="breadcrumb">
              <Link component={RouterLink} underline="hover" color="inherit" to="/">
                Home
              </Link>
              <Typography variant="body2" color="text.secondary">
                ML Management
              </Typography>
              <Typography variant="body2" color="text.primary">
                Validation Jobs
              </Typography>
            </Breadcrumbs>
          </Stack>
          <Button variant="contained" onClick={() => navigate('/ml/models')}>
            Register Model
          </Button>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MlSummaryCard title="Total Jobs" value={summary.total} subtitle="Validation job records" loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MlSummaryCard title="Running" value={summary.running} subtitle="Queued and running" loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MlSummaryCard title="Completed" value={summary.completed} subtitle="Finished successfully" loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MlSummaryCard title="Failed" value={summary.failed} subtitle="Needs review" loading={loading} />
      </Grid>

      <Grid size={12}>
        <MainCard content={false}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Job ID</TableCell>
                    <TableCell>Model Version</TableCell>
                    <TableCell>Dataset Version</TableCell>
                    <TableCell>Validation Status</TableCell>
                    <TableCell>Validated At</TableCell>
                    <TableCell>Completed At</TableCell>
                    <TableCell>Validated By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading &&
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={`training-skeleton-${idx}`}>
                        <TableCell><Skeleton width={140} /></TableCell>
                        <TableCell><Skeleton width={90} /></TableCell>
                        <TableCell><Skeleton width={120} /></TableCell>
                        <TableCell><Skeleton width={90} /></TableCell>
                        <TableCell><Skeleton width={130} /></TableCell>
                        <TableCell><Skeleton width={130} /></TableCell>
                        <TableCell><Skeleton width={200} /></TableCell>
                      </TableRow>
                    ))}

                  {!loading &&
                    jobs.map((job) => (
                      <TableRow
                        key={job.jobId}
                        hover
                        onClick={() => navigate(`/ml/validation-jobs/${job.jobId}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{job.jobId}</TableCell>
                        <TableCell>{job.modelVersion || '-'}</TableCell>
                        <TableCell>{job.datasetVersion || '-'}</TableCell>
                        <TableCell>{statusChip(job.validationStatus || job.status)}</TableCell>
                        <TableCell>{job.validatedAt || '-'}</TableCell>
                        <TableCell>{job.completedAt || '-'}</TableCell>
                        <TableCell>{job.validatedBy || '-'}</TableCell>
                      </TableRow>
                    ))}

                  {!loading && jobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography variant="body2" color="text.secondary">
                          No validation jobs yet.
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

      <Snackbar
        open={toast.open}
        autoHideDuration={2600}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
