import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';

import MainCard from 'components/MainCard';
import MlSummaryCard from 'views/ml/components/MlSummaryCard';
import { getPerformanceTrendApi, listModelsApi, listValidationJobsApi } from 'model/mlApi';
import { listDatasetsApi } from 'model/adminDatasetsApi';
import { getKnowledgeStatusApi } from 'model/adminKnowledgeApi';

const ACTIVE_STATUS = 'active';

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function statusChip(status) {
  const normalized = normalizeStatus(status);
  if (normalized === ACTIVE_STATUS) return <Chip size="small" label="Active" color="success" variant="outlined" />;
  if (normalized === 'staging') return <Chip size="small" label="Staging" color="warning" variant="outlined" />;
  if (normalized === 'archived') return <Chip size="small" label="Archived" variant="outlined" />;
  return <Chip size="small" label="Draft" variant="outlined" />;
}

export default function MlDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [models, setModels] = useState([]);
  const [counts, setCounts] = useState({ registeredModels: 0, runningJobs: 0 });
  const [activeModel, setActiveModel] = useState(null);
  const [activeDataset, setActiveDataset] = useState(null);
  const [trendRows, setTrendRows] = useState([]);
  const [knowledgeStatus, setKnowledgeStatus] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [modelsRes, datasetsRes, knowledgeRes] = await Promise.all([
        listModelsApi(),
        listDatasetsApi(),
        getKnowledgeStatusApi()
      ]);
      const list = modelsRes?.data?.data?.models || [];
      const datasets = datasetsRes?.data?.datasets || [];
      const knowledgePayload = knowledgeRes?.data || null;

      const normalizedModels = list.map((m) => ({
        ...m,
        validatedAt: m?.validatedAt || m?.createdAt || '-'
      }));
      const active = normalizedModels.find((m) => normalizeStatus(m?.status) === ACTIVE_STATUS) || null;
      const activeDatasetVersion = active?.trainedOnDataset || null;
      const activeDatasetRow = activeDatasetVersion
        ? datasets.find((d) => String(d?.version || '').trim() === String(activeDatasetVersion).trim()) || null
        : null;

      let runningJobs = 0;
      try {
        const jobsRes = await listValidationJobsApi();
        const jobs = jobsRes?.data?.data?.jobs || [];
        runningJobs = jobs.filter((j) => {
          const status = normalizeStatus(j?.status);
          return status === 'queued' || status === 'running';
        }).length;
      } catch {
        runningJobs = 0;
      }

      let trends = [];
      if (activeDatasetVersion) {
        try {
          const trendRes = await getPerformanceTrendApi(activeDatasetVersion);
          trends = trendRes?.data?.data?.models || [];
        } catch {
          trends = [];
        }
      }

      setActiveModel(active);
      setActiveDataset(activeDatasetRow);
      setCounts({ registeredModels: normalizedModels.length, runningJobs });
      setModels(normalizedModels.slice(0, 6));
      setTrendRows(trends.slice(0, 6));
      setKnowledgeStatus(knowledgePayload);
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to load ML dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const activeModelVersion = useMemo(() => activeModel?.version || '-', [activeModel]);

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack spacing={0.75}>
          <Typography variant="h5">ML Dashboard</Typography>
          <Breadcrumbs separator="/" aria-label="breadcrumb">
            <Link component={RouterLink} underline="hover" color="inherit" to="/">
              Home
            </Link>
            <Typography variant="body2" color="text.secondary">
              ML Management
            </Typography>
            <Typography variant="body2" color="text.primary">
              Dashboard
            </Typography>
          </Breadcrumbs>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MlSummaryCard
          title="Active Model"
          value={activeModelVersion}
          subtitle={activeModel?.trainedOnDataset ? `Dataset: ${activeModel.trainedOnDataset}` : 'No active model'}
          loading={loading}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MlSummaryCard
          title="Active Dataset"
          value={activeDataset?.version || activeModel?.trainedOnDataset || '-'}
          subtitle={activeDataset?.datasetName || (activeModel?.trainedOnDataset ? 'Derived from active model' : 'No active dataset')}
          loading={loading}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MlSummaryCard title="Registered Models" value={counts.registeredModels || 0} subtitle="Model registry entries" loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MlSummaryCard title="Running Jobs" value={counts.runningJobs || 0} subtitle="Queued or running validations" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <MainCard content={false}>
          <Stack sx={{ p: 2.5 }} spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} flexWrap="wrap">
              <Typography variant="h6">Knowledge Corpus</Typography>
              {loading ? (
                <Skeleton width={96} />
              ) : (
                <Chip
                  size="small"
                  label={knowledgeStatus?.ready ? 'Ready' : 'Not Ready'}
                  color={knowledgeStatus?.ready ? 'success' : 'warning'}
                  variant="outlined"
                />
              )}
            </Stack>

            {loading ? (
              <>
                <Skeleton width="42%" />
                <Skeleton width="58%" />
                <Skeleton width="65%" />
              </>
            ) : (
              <>
                <Typography variant="body2">
                  {knowledgeStatus?.processed?.documentCount ?? 0} documents and {knowledgeStatus?.processed?.chunkCount ?? 0} chunks are available for grounded answers.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Provider: {knowledgeStatus?.provider?.name || '-'} | Model: {knowledgeStatus?.provider?.model || '-'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Raw source files: {knowledgeStatus?.raw?.fileCount ?? 0} | Corpus version: {knowledgeStatus?.corpusVersion || '-'}
                </Typography>
              </>
            )}
          </Stack>
        </MainCard>
      </Grid>

      {error ? (
        <Grid size={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      ) : null}

      <Grid size={{ xs: 12, lg: 7 }}>
        <MainCard content={false}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Typography variant="h6">Model Registry Snapshot</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Version</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Dataset</TableCell>
                    <TableCell>Validated At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading
                    ? Array.from({ length: 6 }).map((_, idx) => (
                        <TableRow key={`dash-model-sk-${idx}`}>
                          <TableCell><Skeleton width={72} /></TableCell>
                          <TableCell><Skeleton width={88} /></TableCell>
                          <TableCell><Skeleton width={96} /></TableCell>
                          <TableCell><Skeleton width={110} /></TableCell>
                        </TableRow>
                      ))
                    : (models || []).map((model) => (
                    <TableRow key={`dash-model-${model.version}`}>
                      <TableCell>{model.version}</TableCell>
                      <TableCell>{statusChip(model.status)}</TableCell>
                      <TableCell>{model.trainedOnDataset || '-'}</TableCell>
                      <TableCell>{model.validatedAt || '-'}</TableCell>
                    </TableRow>
                      ))}
                  {!loading && (!models || models.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="body2" color="text.secondary">
                          No registered models yet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </MainCard>
      </Grid>

      <Grid size={{ xs: 12, lg: 5 }}>
        <MainCard content={false}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Typography variant="h6">Latest Performance Trend</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Version</TableCell>
                    <TableCell>Mean RMSE</TableCell>
                    <TableCell>Mean R2</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading
                    ? Array.from({ length: 6 }).map((_, idx) => (
                        <TableRow key={`trend-sk-${idx}`}>
                          <TableCell><Skeleton width={72} /></TableCell>
                          <TableCell><Skeleton width={96} /></TableCell>
                          <TableCell><Skeleton width={80} /></TableCell>
                        </TableRow>
                      ))
                    : (trendRows || []).slice(0, 6).map((row) => (
                    <TableRow key={`trend-${row.version}`}>
                      <TableCell>{row.version}</TableCell>
                      <TableCell>{row.meanRMSE ?? '-'}</TableCell>
                      <TableCell>{row.meanR2 ?? '-'}</TableCell>
                    </TableRow>
                      ))}
                  {!loading && trendRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant="body2" color="text.secondary">
                          No performance trend data yet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}
