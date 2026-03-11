import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import MainCard from 'components/MainCard';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import StarIcon from '@mui/icons-material/Star';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useMlModelsViewModel } from 'viewModel/useMlModelsViewModel';
import {
  compareModelsApi,
  evaluateModelApi,
  getModelPerformanceHistoryApi,
  getPerformanceTrendApi,
  uploadModelApi
} from 'model/mlApi';
import { useAuth } from 'contexts/AuthContext';
import MlSummaryCard from 'views/ml/components/MlSummaryCard';

const VERSION_REGEX = /^v\d+\.\d+$/;

function getStatusChip(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active') {
    return <Chip size="small" label="Active" color="success" variant="outlined" />;
  }
  if (normalized === 'staging') {
    return <Chip size="small" label="Staging" color="warning" variant="outlined" />;
  }
  if (normalized === 'archived') {
    return (
      <Chip
        size="small"
        label="Archived"
        variant="filled"
        sx={{ bgcolor: 'grey.700', color: 'grey.100' }}
      />
    );
  }
  return <Chip size="small" label="Draft" variant="outlined" />;
}

function formatMetric(metrics, key) {
  const value = metrics?.[key]?.rmse;
  if (typeof value !== 'number') return '-';
  return value.toFixed(2);
}

function formatMetricValue(value, digits = 4) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function MetricTile({ label, value, helper, preference = 'lower' }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        height: '100%',
        bgcolor: 'background.default'
      }}
    >
      <Stack spacing={0.75}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Tooltip title={helper} arrow>
            <InfoOutlinedIcon fontSize="inherit" sx={{ fontSize: 14, color: 'text.disabled' }} />
          </Tooltip>
        </Stack>
        <Typography variant="h6">{formatMetricValue(value)}</Typography>
        <Chip
          size="small"
          variant="outlined"
          color={preference === 'higher' ? 'success' : 'warning'}
          label={preference === 'higher' ? 'Higher is better' : 'Lower is better'}
          sx={{ width: 'fit-content' }}
        />
      </Stack>
    </Paper>
  );
}

export default function ModelRegistry() {
  const { user } = useAuth();
  const { models, loading, error, updating, fetchModels, changeStatus, approveModel } = useMlModelsViewModel();
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [evaluateTarget, setEvaluateTarget] = useState(null);
  const [evaluateLoading, setEvaluateLoading] = useState(false);
  const [evaluateResult, setEvaluateResult] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareDatasetVersion, setCompareDatasetVersion] = useState('');
  const [compareResult, setCompareResult] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyResult, setHistoryResult] = useState(null);
  const [trendOpen, setTrendOpen] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendDatasetVersion, setTrendDatasetVersion] = useState('');
  const [trendResult, setTrendResult] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState('idle');
  const [form, setForm] = useState({
    modelVersion: '',
    datasetVersion: '',
    notes: '',
    palayModel: null,
    cornModel: null,
    otherModel: null,
    featureColumnsJson: null
  });
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState({
    open: false,
    severity: 'success',
    message: ''
  });

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    if (error) {
      setToast({
        open: true,
        severity: 'error',
        message: error.includes('Forbidden') || error.includes('permission') ? 'Permission denied' : error
      });
    }
  }, [error]);

  const rows = useMemo(() => models || [], [models]);
  const summary = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((row) => String(row.status || '').toLowerCase() === 'active').length,
      staging: rows.filter((row) => String(row.status || '').toLowerCase() === 'staging').length,
      draft: rows.filter((row) => String(row.status || '').toLowerCase() === 'draft').length
    }),
    [rows]
  );
  const normalizedRole = String(user?.role || '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]/g, '_');

  const isMlEngineer = normalizedRole === 'ml_engineer' || normalizedRole === 'mlengineer';
  const isAdmin = normalizedRole === 'admin';
  const isSuperadmin = normalizedRole === 'superadmin' || normalizedRole === 'super_admin';

  const canApprove = isAdmin || isSuperadmin;
  const canPromote = isMlEngineer || isAdmin || isSuperadmin;
  const canRegisterModel = isMlEngineer;
  const canEvaluate = isMlEngineer || isAdmin || isSuperadmin;

  const toggleSelectedVersion = (version) => {
    setSelectedVersions((prev) =>
      prev.includes(version) ? prev.filter((v) => v !== version) : [...prev, version]
    );
  };

  const handlePromote = async (model) => {
    const result = await changeStatus(model.version, 'staging');
    if (!result.success) {
      setToast({
        open: true,
        severity: result.code === 403 ? 'warning' : 'error',
        message: result.code === 403 ? 'Permission denied' : result.error || 'Failed to promote model'
      });
      return;
    }

    const wasArchived = String(model?.status || '').toLowerCase() === 'archived';
    await fetchModels();
    setToast({
      open: true,
      severity: 'success',
      message: wasArchived
        ? `Model ${model.version} restored to staging`
        : `Model ${model.version} moved to staging`
    });
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    const result = await changeStatus(archiveTarget.version, 'archived');
    if (!result.success) {
      setToast({
        open: true,
        severity: result.code === 403 ? 'warning' : 'error',
        message: result.code === 403 ? 'Permission denied' : result.error || 'Failed to archive model'
      });
      return;
    }
    setArchiveTarget(null);
    await fetchModels();
    setToast({
      open: true,
      severity: 'success',
      message: `Model ${archiveTarget.version} archived`
    });
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    const result = await approveModel(approveTarget.version);
    if (!result.success) {
      setToast({
        open: true,
        severity: result.code === 403 ? 'warning' : 'error',
        message: result.code === 403 ? 'Permission denied' : result.error || 'Failed to activate model'
      });
      return;
    }

    setApproveTarget(null);
    await fetchModels();
    setToast({
      open: true,
      severity: 'success',
      message: `Model ${approveTarget.version} is now active`
    });
  };

  const onFileChange = (key, files) => {
    const nextFile = files?.[0] || null;
    setForm((prev) => ({ ...prev, [key]: nextFile }));
    setFormErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleEvaluate = async (model) => {
    if (!canEvaluate) return;
    setEvaluateTarget(model);
    setEvaluateResult(null);
    setEvaluateLoading(true);
    try {
      const res = await evaluateModelApi(model.version, { storeResult: true });
      setEvaluateResult(res?.data?.data || null);
    } catch (err) {
      setToast({
        open: true,
        severity: err?.response?.status === 403 ? 'warning' : 'error',
        message: err?.response?.data?.message || err?.response?.data?.error || 'Failed to evaluate model'
      });
      setEvaluateTarget(null);
    } finally {
      setEvaluateLoading(false);
    }
  };

  const handleCompare = async () => {
    if (selectedVersions.length < 2) return;
    setCompareLoading(true);
    setCompareResult(null);
    try {
      const res = await compareModelsApi(selectedVersions, compareDatasetVersion.trim() || undefined);
      setCompareResult(res?.data?.data || null);
    } catch (err) {
      setToast({
        open: true,
        severity: err?.response?.status === 403 ? 'warning' : 'error',
        message: err?.response?.data?.message || err?.response?.data?.error || 'Failed to compare models'
      });
    } finally {
      setCompareLoading(false);
    }
  };

  const handleViewHistory = async (model) => {
    setHistoryTarget(model);
    setHistoryResult(null);
    setHistoryLoading(true);
    try {
      const res = await getModelPerformanceHistoryApi(model.version);
      setHistoryResult(res?.data?.data || null);
    } catch (err) {
      setToast({
        open: true,
        severity: err?.response?.status === 403 ? 'warning' : 'error',
        message: err?.response?.data?.message || err?.response?.data?.error || 'Failed to load performance history'
      });
      setHistoryTarget(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLoadTrend = async () => {
    if (!trendDatasetVersion.trim()) {
      setToast({ open: true, severity: 'warning', message: 'Dataset version is required for trend view.' });
      return;
    }
    setTrendLoading(true);
    setTrendResult(null);
    try {
      const res = await getPerformanceTrendApi(trendDatasetVersion.trim());
      setTrendResult(res?.data?.data || null);
    } catch (err) {
      setToast({
        open: true,
        severity: err?.response?.status === 403 ? 'warning' : 'error',
        message: err?.response?.data?.message || err?.response?.data?.error || 'Failed to load performance trend'
      });
    } finally {
      setTrendLoading(false);
    }
  };

  const validateUploadForm = () => {
    const nextErrors = {};
    const version = form.modelVersion.trim();
    const datasetVersion = form.datasetVersion.trim();
    if (!version) nextErrors.modelVersion = 'Model version is required';
    else if (!VERSION_REGEX.test(version)) nextErrors.modelVersion = 'Version must follow format vX.Y';
    if (!datasetVersion) nextErrors.datasetVersion = 'Dataset version is required';
    if (!form.palayModel) nextErrors.palayModel = 'PALAY model file is required';
    if (!form.cornModel) nextErrors.cornModel = 'CORN model file is required';
    if (!form.otherModel) nextErrors.otherModel = 'OTHER model file is required';
    if (!form.featureColumnsJson) nextErrors.featureColumnsJson = 'Feature columns JSON file is required';

    const ensureExt = (file, ext, key, label) => {
      if (file && !file.name.toLowerCase().endsWith(ext)) nextErrors[key] = `${label} must be ${ext}`;
    };
    ensureExt(form.palayModel, '.joblib', 'palayModel', 'PALAY model');
    ensureExt(form.cornModel, '.joblib', 'cornModel', 'CORN model');
    ensureExt(form.otherModel, '.joblib', 'otherModel', 'OTHER model');
    ensureExt(form.featureColumnsJson, '.json', 'featureColumnsJson', 'Feature columns file');

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegisterModel = async () => {
    if (!validateUploadForm() || uploading) return;

    const formData = new FormData();
    formData.append('version', form.modelVersion.trim());
    formData.append('datasetVersion', form.datasetVersion.trim());
    formData.append('notes', form.notes.trim());
    formData.append('palay_model', form.palayModel);
    formData.append('corn_model', form.cornModel);
    formData.append('other_model', form.otherModel);
    formData.append('feature_columns', form.featureColumnsJson);

    setUploading(true);
    setUploadProgress(0);
    setUploadPhase('uploading');

    try {
      await uploadModelApi(formData, (evt) => {
        if (!evt?.total) return;
        const pct = Math.round((evt.loaded * 100) / evt.total);
        setUploadProgress(pct);
        if (pct >= 100) {
          setUploadPhase('validating');
        }
      });
      setUploadOpen(false);
      setForm({
        modelVersion: '',
        datasetVersion: '',
        notes: '',
        palayModel: null,
        cornModel: null,
        otherModel: null,
        featureColumnsJson: null
      });
      setFormErrors({});
      await fetchModels();
      setToast({ open: true, severity: 'success', message: 'Model uploaded and registered successfully.' });
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'Model upload failed';
      setToast({
        open: true,
        severity: err?.response?.status === 403 ? 'warning' : 'error',
        message
      });
    } finally {
      setUploading(false);
      setUploadPhase('idle');
    }
  };

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack spacing={0.75}>
            <Typography variant="h5">Model Registry</Typography>
            <Breadcrumbs separator="/" aria-label="breadcrumb">
              <Link component={RouterLink} underline="hover" color="inherit" to="/">
                Home
              </Link>
              <Typography variant="body2" color="text.secondary">
                ML Management
              </Typography>
              <Typography variant="body2" color="text.primary">
                Model Registry
              </Typography>
            </Breadcrumbs>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => {
                setTrendOpen(true);
                setTrendResult(null);
                if (!trendDatasetVersion && rows.length === 1) {
                  setTrendDatasetVersion(rows[0]?.datasetVersion || '');
                }
              }}
            >
              Performance Trend
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setCompareResult(null);
                setCompareOpen(true);
              }}
              disabled={selectedVersions.length < 2}
            >
              Compare ({selectedVersions.length})
            </Button>
            {canRegisterModel && (
              <Button variant="contained" onClick={() => setUploadOpen(true)}>
                Register Model
              </Button>
            )}
          </Stack>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MlSummaryCard title="Total Models" value={summary.total} subtitle="All registry entries" loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MlSummaryCard title="Active" value={summary.active} subtitle="Currently serving model" loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MlSummaryCard title="Staging" value={summary.staging} subtitle="Waiting for approval" loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MlSummaryCard title="Draft" value={summary.draft} subtitle="Needs promotion" loading={loading} />
      </Grid>

      <Grid size={12}>
        <MainCard content={false}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Version</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Dataset Version</TableCell>
                    <TableCell>PALAY RMSE</TableCell>
                    <TableCell>CORN RMSE</TableCell>
                    <TableCell>OTHER RMSE</TableCell>
                    <TableCell>Validated At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading &&
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={`skeleton-${idx}`}>
                        <TableCell><Skeleton width={24} /></TableCell>
                        <TableCell><Skeleton width={90} /></TableCell>
                        <TableCell><Skeleton width={90} /></TableCell>
                        <TableCell><Skeleton width={120} /></TableCell>
                        <TableCell><Skeleton width={80} /></TableCell>
                        <TableCell><Skeleton width={80} /></TableCell>
                        <TableCell><Skeleton width={80} /></TableCell>
                        <TableCell><Skeleton width={130} /></TableCell>
                        <TableCell align="right"><Skeleton width={220} /></TableCell>
                      </TableRow>
                    ))}

                  {!loading &&
                    rows.map((row) => {
                      const status = String(row.status || '').toLowerCase();
                      const canUnarchive = (isAdmin || isSuperadmin) && status === 'archived';
                      const canMoveToStaging = canPromote && (status === 'draft' || canUnarchive);
                      const promoteDisabled = !canMoveToStaging || updating || status === 'active' || status === 'staging';
                      const archiveDisabled = updating || status === 'archived' || status === 'active';
                      const approveDisabled = updating || status !== 'staging';

                      return (
                        <TableRow
                          key={row.version}
                          hover
                          sx={status === 'active' ? { bgcolor: 'success.lighter' } : undefined}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              size="small"
                              checked={selectedVersions.includes(row.version)}
                              onChange={() => toggleSelectedVersion(row.version)}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              {status === 'active' && <StarIcon color="success" fontSize="small" />}
                              <span>{row.version}</span>
                            </Stack>
                          </TableCell>
                          <TableCell>{getStatusChip(status)}</TableCell>
                          <TableCell>{row.datasetVersion || '-'}</TableCell>
                          <TableCell>{formatMetric(row.metrics, 'PALAY')}</TableCell>
                          <TableCell>{formatMetric(row.metrics, 'CORN')}</TableCell>
                          <TableCell>{formatMetric(row.metrics, 'OTHER')}</TableCell>
                          <TableCell>{row.validatedAt || row.createdAt || '-'}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => setViewTarget(row)}
                              >
                                View
                              </Button>
                              {canEvaluate && (
                                <Button
                                  size="small"
                                  variant="text"
                                  color="info"
                                  onClick={() => handleEvaluate(row)}
                                >
                                  Evaluate
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="text"
                                color="secondary"
                                onClick={() => handleViewHistory(row)}
                              >
                                History
                              </Button>
                              <Button
                                size="small"
                                variant="text"
                                color="warning"
                                disabled={promoteDisabled}
                                onClick={() => handlePromote(row)}
                              >
                                {canUnarchive ? 'Unarchive' : 'Promote'}
                              </Button>
                              {canApprove && (
                                <Button
                                  size="small"
                                  variant="text"
                                  color="success"
                                  disabled={approveDisabled}
                                  onClick={() => setApproveTarget(row)}
                                >
                                  Approve & Activate
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="text"
                                color="error"
                                disabled={archiveDisabled}
                                onClick={() => setArchiveTarget(row)}
                              >
                                Archive
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                  {!loading && rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Typography variant="body2" color="text.secondary">
                          No models registered yet.
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

      <Dialog open={Boolean(archiveTarget)} onClose={() => setArchiveTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Archive Model</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Archive <strong>{archiveTarget?.version}</strong>? This action will remove it from active lifecycle usage.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmArchive} disabled={updating}>
            Archive
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(viewTarget)} onClose={() => setViewTarget(null)} maxWidth="md" fullWidth>
        <DialogTitle>Model Details: {viewTarget?.version}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Grid container spacing={1.25}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Stack direction="row" sx={{ mt: 0.75 }}>
                    {getStatusChip(viewTarget?.status)}
                  </Stack>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Dataset Version</Typography>
                  <Typography variant="subtitle1" sx={{ mt: 0.5 }}>{viewTarget?.datasetVersion || '-'}</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Validated At</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{viewTarget?.validatedAt || viewTarget?.createdAt || '-'}</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Trained On Dataset</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{viewTarget?.trainedOnDataset || viewTarget?.datasetVersion || '-'}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Validation Metrics</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Crop Group</TableCell>
                      <TableCell>RMSE</TableCell>
                      <TableCell>MAE</TableCell>
                      <TableCell>R²</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {['PALAY', 'CORN', 'OTHER'].map((group) => (
                      <TableRow key={`details-metric-${group}`}>
                        <TableCell>{group}</TableCell>
                        <TableCell>{formatMetricValue(viewTarget?.metrics?.[group]?.rmse, 4)}</TableCell>
                        <TableCell>{formatMetricValue(viewTarget?.metrics?.[group]?.mae, 4)}</TableCell>
                        <TableCell>{formatMetricValue(viewTarget?.metrics?.[group]?.r2, 4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">Notes</Typography>
              <Typography variant="body2" sx={{ mt: 0.75 }}>
                {viewTarget?.notes || 'No notes provided.'}
              </Typography>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewTarget(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(approveTarget)} onClose={() => setApproveTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Approve and Activate Model</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Activate <strong>{approveTarget?.version}</strong>? This will archive the current active model.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveTarget(null)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleConfirmApprove} disabled={updating}>
            Approve & Activate
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={uploadOpen} onClose={() => !uploading && setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Register Model</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            {uploading && (
              <Stack spacing={0.75}>
                {uploadPhase === 'uploading' ? (
                  <LinearProgress variant="determinate" value={uploadProgress} />
                ) : (
                  <LinearProgress variant="indeterminate" />
                )}
                <Typography variant="caption" color="text.secondary">
                  {uploadPhase === 'uploading'
                    ? `Uploading files... ${uploadProgress}%`
                    : 'Validating model and registering...'}
                </Typography>
              </Stack>
            )}

            <TextField
              label="Model Version"
              value={form.modelVersion}
              onChange={(e) => setForm((p) => ({ ...p, modelVersion: e.target.value }))}
              error={Boolean(formErrors.modelVersion)}
              helperText={formErrors.modelVersion || 'Format: vX.Y (example: v2.0)'}
              fullWidth
            />
            <TextField
              label="Dataset Version"
              value={form.datasetVersion}
              onChange={(e) => setForm((p) => ({ ...p, datasetVersion: e.target.value }))}
              error={Boolean(formErrors.datasetVersion)}
              helperText={formErrors.datasetVersion}
              fullWidth
            />
            <TextField
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              multiline
              rows={3}
              fullWidth
            />

            <Button variant="outlined" component="label" disabled={uploading}>
              Upload PALAY Model (.joblib)
              <input hidden type="file" accept=".joblib" onChange={(e) => onFileChange('palayModel', e.target.files)} />
            </Button>
            <Typography variant="caption" color={formErrors.palayModel ? 'error' : 'text.secondary'}>
              {formErrors.palayModel || form.palayModel?.name || 'No file selected'}
            </Typography>

            <Button variant="outlined" component="label" disabled={uploading}>
              Upload CORN Model (.joblib)
              <input hidden type="file" accept=".joblib" onChange={(e) => onFileChange('cornModel', e.target.files)} />
            </Button>
            <Typography variant="caption" color={formErrors.cornModel ? 'error' : 'text.secondary'}>
              {formErrors.cornModel || form.cornModel?.name || 'No file selected'}
            </Typography>

            <Button variant="outlined" component="label" disabled={uploading}>
              Upload OTHER Model (.joblib)
              <input hidden type="file" accept=".joblib" onChange={(e) => onFileChange('otherModel', e.target.files)} />
            </Button>
            <Typography variant="caption" color={formErrors.otherModel ? 'error' : 'text.secondary'}>
              {formErrors.otherModel || form.otherModel?.name || 'No file selected'}
            </Typography>

            <Button variant="outlined" component="label" disabled={uploading}>
              Upload Feature Columns JSON
              <input
                hidden
                type="file"
                accept=".json,application/json"
                onChange={(e) => onFileChange('featureColumnsJson', e.target.files)}
              />
            </Button>
            <Typography variant="caption" color={formErrors.featureColumnsJson ? 'error' : 'text.secondary'}>
              {formErrors.featureColumnsJson || form.featureColumnsJson?.name || 'No file selected'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleRegisterModel} disabled={uploading}>
            {uploading ? 'Registering...' : 'Register Model'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(evaluateTarget)} onClose={() => setEvaluateTarget(null)} maxWidth="md" fullWidth>
        <DialogTitle>Evaluation: {evaluateTarget?.version}</DialogTitle>
        <DialogContent dividers>
          {evaluateLoading && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2">Evaluating model...</Typography>
            </Stack>
          )}
          {!evaluateLoading && evaluateResult && (
            <Stack spacing={2}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'background.default'
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
                  <Stack spacing={0.25}>
                    <Typography variant="caption" color="text.secondary">
                      Dataset Version
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {evaluateResult.datasetVersion || '-'}
                    </Typography>
                  </Stack>
                  <Stack spacing={0.25}>
                    <Typography variant="caption" color="text.secondary">
                      Evaluated At
                    </Typography>
                    <Typography variant="body2">{evaluateResult.evaluatedAt || '-'}</Typography>
                  </Stack>
                </Stack>
              </Paper>

              <Stack spacing={1}>
                <Typography variant="subtitle1">Overall Metrics</Typography>
                <Grid container spacing={1.25}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricTile
                      label="RMSE"
                      value={evaluateResult.metrics?.overall?.rmse}
                      helper="Root Mean Squared Error. Penalizes large prediction errors more strongly."
                      preference="lower"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricTile
                      label="MAE"
                      value={evaluateResult.metrics?.overall?.mae}
                      helper="Mean Absolute Error. Average absolute difference between predicted and actual yield."
                      preference="lower"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricTile
                      label="R²"
                      value={evaluateResult.metrics?.overall?.r2}
                      helper="Coefficient of determination. Near 1.0 means predictions explain more variance."
                      preference="higher"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricTile
                      label="MAPE"
                      value={evaluateResult.metrics?.overall?.mape}
                      helper="Mean Absolute Percentage Error. Percentage-based error; can spike when actual values are small."
                      preference="lower"
                    />
                  </Grid>
                </Grid>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography variant="subtitle1">Per Crop Group Breakdown</Typography>
                  <Tooltip title="Use this to inspect where the model performs better or worse by crop group." arrow>
                    <InfoOutlinedIcon fontSize="inherit" sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </Tooltip>
                </Stack>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Crop Group</TableCell>
                        <TableCell>RMSE</TableCell>
                        <TableCell>MAE</TableCell>
                        <TableCell>R²</TableCell>
                        <TableCell>MAPE</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(evaluateResult.metrics?.byCropGroup || {}).map(([group, vals]) => (
                        <TableRow key={`eval-group-${group}`}>
                          <TableCell>
                            <Chip size="small" variant="outlined" label={group} />
                          </TableCell>
                          <TableCell>{formatMetricValue(vals?.rmse)}</TableCell>
                          <TableCell>{formatMetricValue(vals?.mae)}</TableCell>
                          <TableCell>{formatMetricValue(vals?.r2)}</TableCell>
                          <TableCell>{formatMetricValue(vals?.mape)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ px: 0.25 }}>
                  <Typography variant="caption" color="text.secondary">
                    Guidance: compare groups by RMSE/MAE for absolute error, and R² for consistency of fit.
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEvaluateTarget(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(historyTarget)} onClose={() => setHistoryTarget(null)} maxWidth="md" fullWidth>
        <DialogTitle>Performance History: {historyTarget?.version}</DialogTitle>
        <DialogContent dividers>
          {historyLoading && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2">Loading history...</Typography>
            </Stack>
          )}
          {!historyLoading && historyResult && (
            <Stack spacing={1.25}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Dataset</TableCell>
                      <TableCell>Mode</TableCell>
                      <TableCell>Mean RMSE</TableCell>
                      <TableCell>Mean MAE</TableCell>
                      <TableCell>Mean R2</TableCell>
                      <TableCell>Evaluated At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(historyResult.evaluations || []).map((ev, idx) => (
                      <TableRow key={`hist-${idx}`}>
                        <TableCell>{ev.datasetVersion || '-'}</TableCell>
                        <TableCell>{ev.evaluationMode || '-'}</TableCell>
                        <TableCell>{ev.meanRMSE ?? '-'}</TableCell>
                        <TableCell>{ev.meanMAE ?? '-'}</TableCell>
                        <TableCell>{ev.meanR2 ?? '-'}</TableCell>
                        <TableCell>{ev.evaluatedAt || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {(!historyResult.evaluations || historyResult.evaluations.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Typography variant="body2" color="text.secondary">
                            No saved evaluations yet. Run Evaluate first.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryTarget(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={compareOpen} onClose={() => setCompareOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Model Comparison</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <TextField
              label="Dataset Version (optional)"
              value={compareDatasetVersion}
              onChange={(e) => setCompareDatasetVersion(e.target.value)}
              size="small"
            />
            <Button variant="contained" onClick={handleCompare} disabled={compareLoading}>
              {compareLoading ? 'Comparing...' : 'Run Comparison'}
            </Button>
            {compareResult && (
              <Stack spacing={1}>
                <Typography variant="body2">Dataset: {compareResult.datasetVersion}</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Version</TableCell>
                        <TableCell>RMSE</TableCell>
                        <TableCell>MAE</TableCell>
                        <TableCell>R2</TableCell>
                        <TableCell>MAPE</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(compareResult.models || []).map((m) => (
                        <TableRow key={`cmp-${m.version}`}>
                          <TableCell>{m.version}</TableCell>
                          <TableCell
                            sx={m.version === compareResult.bestModelByRMSE ? { bgcolor: 'success.lighter', fontWeight: 700 } : undefined}
                          >
                            {m.rmse}
                          </TableCell>
                          <TableCell>{m.mae}</TableCell>
                          <TableCell
                            sx={m.version === compareResult.bestModelByR2 ? { bgcolor: 'success.lighter', fontWeight: 700 } : undefined}
                          >
                            {m.r2}
                          </TableCell>
                          <TableCell>{m.mape}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="caption">Best RMSE: {compareResult.bestModelByRMSE}</Typography>
                <Typography variant="caption">Best R2: {compareResult.bestModelByR2}</Typography>
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={trendOpen} onClose={() => setTrendOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Performance Trend</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <TextField
              label="Dataset Version"
              value={trendDatasetVersion}
              onChange={(e) => setTrendDatasetVersion(e.target.value)}
              size="small"
            />
            <Button variant="contained" onClick={handleLoadTrend} disabled={trendLoading}>
              {trendLoading ? 'Loading...' : 'Load Trend'}
            </Button>
            {trendResult && (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Model</TableCell>
                      <TableCell>Mean RMSE</TableCell>
                      <TableCell>Mean R2</TableCell>
                      <TableCell>Evaluated At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(trendResult.models || []).map((m) => (
                      <TableRow key={`trend-${m.version}`}>
                        <TableCell>{m.version}</TableCell>
                        <TableCell>{m.meanRMSE ?? '-'}</TableCell>
                        <TableCell>{m.meanR2 ?? '-'}</TableCell>
                        <TableCell>{m.evaluatedAt || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {(!trendResult.models || trendResult.models.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Typography variant="body2" color="text.secondary">
                            No saved evaluations for this dataset yet.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrendOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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
