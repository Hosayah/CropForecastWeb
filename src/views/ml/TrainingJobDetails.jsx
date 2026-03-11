import { useEffect } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';

import MainCard from 'components/MainCard';
import { useMlTrainingJobsViewModel } from 'viewModel/useMlTrainingJobsViewModel';
import MlSummaryCard from 'views/ml/components/MlSummaryCard';

function statusChip(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'queued') return <Chip size="small" label="Queued" variant="outlined" />;
  if (normalized === 'running') return <Chip size="small" label="Running" color="info" variant="outlined" />;
  if (normalized === 'completed') return <Chip size="small" label="Completed" color="success" variant="outlined" />;
  return <Chip size="small" label="Failed" color="error" variant="outlined" />;
}

export default function TrainingJobDetails() {
  const { jobId } = useParams();
  const { jobDetails, loading, error, fetchJobDetails } = useMlTrainingJobsViewModel();

  useEffect(() => {
    if (!jobId) return;
    fetchJobDetails(jobId);
  }, [jobId, fetchJobDetails]);

  useEffect(() => {
    if (!jobId) return undefined;
    const shouldPoll = ['queued', 'running'].includes(String(jobDetails?.validationStatus || jobDetails?.status || '').toLowerCase());
    if (!shouldPoll) return undefined;
    const timer = setInterval(() => fetchJobDetails(jobId), 5000);
    return () => clearInterval(timer);
  }, [jobId, jobDetails?.status, jobDetails?.validationStatus, fetchJobDetails]);

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack spacing={0.75}>
          <Typography variant="h5">Validation Job Details</Typography>
          <Breadcrumbs separator="/" aria-label="breadcrumb">
            <Link component={RouterLink} underline="hover" color="inherit" to="/">
              Home
            </Link>
            <Typography variant="body2" color="text.secondary">
              ML Management
            </Typography>
            <Link component={RouterLink} underline="hover" color="inherit" to="/ml/validation-jobs">
              Validation Jobs
            </Link>
            <Typography variant="body2" color="text.primary">
              {jobId || 'Details'}
            </Typography>
          </Breadcrumbs>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <MlSummaryCard
          title="Status"
          value={String(jobDetails?.validationStatus || jobDetails?.status || '-').toUpperCase()}
          subtitle="Current validation state"
          loading={loading}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <MlSummaryCard
          title="Model Version"
          value={jobDetails?.modelVersion || '-'}
          subtitle="Target model"
          loading={loading}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <MlSummaryCard
          title="Dataset Version"
          value={jobDetails?.datasetVersion || '-'}
          subtitle="Validation dataset"
          loading={loading}
        />
      </Grid>

      <Grid size={12}>
        <MainCard>
          {loading && (
            <Stack spacing={1.25}>
              <Skeleton width={180} />
              <Skeleton width={240} />
              <Skeleton width={220} />
            </Stack>
          )}

          {!loading && error && <Alert severity="error">{error}</Alert>}

          {!loading && !error && jobDetails && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1">Status</Typography>
                {statusChip(jobDetails.validationStatus || jobDetails.status)}
              </Stack>
              <Typography variant="body2">Job ID: {jobDetails.jobId}</Typography>
              <Typography variant="body2">Model Version: {jobDetails.modelVersion}</Typography>
              <Typography variant="body2">Dataset Version: {jobDetails.datasetVersion}</Typography>
              <Typography variant="body2">Validated By: {jobDetails.validatedBy || '-'}</Typography>
              <Typography variant="body2">Validated At: {jobDetails.validatedAt || '-'}</Typography>
              <Typography variant="body2">Completed At: {jobDetails.completedAt || '-'}</Typography>

              {jobDetails.errorMessage && <Alert severity="error">{jobDetails.errorMessage}</Alert>}

              <Divider />
              <Typography variant="subtitle1">Validation Logs</Typography>
              <Stack spacing={0.5}>
                {(jobDetails.logs || []).map((entry, idx) => (
                  <Typography key={`${jobDetails.jobId}-log-${idx}`} variant="caption" color="text.secondary">
                    {entry}
                  </Typography>
                ))}
              </Stack>
            </Stack>
          )}
        </MainCard>
      </Grid>
    </Grid>
  );
}
