import { useEffect, useMemo, useState } from 'react';
import { useAdminSystemConfigViewModel } from 'viewModel/useAdminSystemConfigViewModel';

// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';

import MainCard from 'components/MainCard';
import AdminPageHeader from './components/AdminPageHeader';

function ConfigSummaryCard({ title, children, loading = false, skeletonWidths = ['60%', '70%'] }) {
  return (
    <MainCard content={false} sx={{ height: '100%' }}>
      <Stack sx={{ p: 2.5, minHeight: 150 }} spacing={1.75}>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        {loading ? (
          <Stack spacing={1.25}>
            {skeletonWidths.map((width, index) => (
              <Skeleton key={`${title}-skeleton-${index}`} width={width} height={24} />
            ))}
          </Stack>
        ) : (
          <Stack spacing={1.25} sx={{ flex: 1, alignItems: 'flex-start' }}>
            {children}
          </Stack>
        )}
      </Stack>
    </MainCard>
  );
}

export default function AdminSystemConfig() {
  const {
    config,
    loading,
    saving,
    fetchConfig,
    updateConfig,
    snapshotLoading,
    generatingSnapshot,
    latestSnapshot,
    snapshotStatus,
    fetchLatestSnapshot,
    generateSnapshot,
    knowledgeStatus,
    knowledgeLoading,
    fetchKnowledgeStatus
  } = useAdminSystemConfigViewModel();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState(null);

  const [forecastHorizon, setForecastHorizon] = useState(4);
  const [lowMinScore, setLowMinScore] = useState(0.75);
  const [moderateMinScore, setModerateMinScore] = useState(0.5);
  const [climateWeight, setClimateWeight] = useState(0.6);
  const [soilWeight, setSoilWeight] = useState(0.4);
  const [soilTypeWeight, setSoilTypeWeight] = useState(0.35);
  const [phWeight, setPhWeight] = useState(0.25);
  const [drainageWeight, setDrainageWeight] = useState(0.25);
  const [fertilityWeight, setFertilityWeight] = useState(0.15);

  const [toast, setToast] = useState({
    open: false,
    severity: 'success',
    message: ''
  });

  const scoringTotals = useMemo(() => {
    const overall = Number(climateWeight) + Number(soilWeight);
    const soil =
      Number(soilTypeWeight) +
      Number(phWeight) +
      Number(drainageWeight) +
      Number(fertilityWeight);

    return {
      overall,
      soil,
      overallValid: Number.isFinite(overall) && overall <= 1,
      soilValid: Number.isFinite(soil) && soil <= 1
    };
  }, [climateWeight, soilWeight, soilTypeWeight, phWeight, drainageWeight, fertilityWeight]);

  useEffect(() => {
    fetchConfig();
    fetchLatestSnapshot();
    fetchKnowledgeStatus();
  }, []);

  useEffect(() => {
    if (config) {
      setForecastHorizon(config.defaultForecastHorizon);
      const thresholds = config.recommendationThresholds || {};
      setLowMinScore(Number(thresholds.lowMinScore ?? 0.75));
      setModerateMinScore(Number(thresholds.moderateMinScore ?? 0.5));
      const scoring = config.recommendationScoring || {};
      const weights = scoring.weights || {};
      const soilWeights = scoring.soilWeights || {};
      setClimateWeight(Number(weights.climate ?? 0.6));
      setSoilWeight(Number(weights.soil ?? 0.4));
      setSoilTypeWeight(Number(soilWeights.soilType ?? 0.35));
      setPhWeight(Number(soilWeights.ph ?? 0.25));
      setDrainageWeight(Number(soilWeights.drainage ?? 0.25));
      setFertilityWeight(Number(soilWeights.fertility ?? 0.15));
    }
  }, [config]);

  /* ================= CONFIRM HANDLER ================= */

  const handleConfirm = async () => {
    try {
      if (confirmType === 'maintenance') {
        const result = await updateConfig({
          maintenanceMode: !config.maintenanceMode
        });
        if (!result.success) {
          setToast({
            open: true,
            severity: 'error',
            message: result.error || 'Update failed.'
          });
          return;
        }

        setToast({
          open: true,
          severity: 'warning',
          message: 'Maintenance mode updated.'
        });
      }

      if (confirmType === 'ai') {
        const result = await updateConfig({
          aiForecastEnabled: !config.aiForecastEnabled
        });
        if (!result.success) {
          setToast({
            open: true,
            severity: 'error',
            message: result.error || 'Update failed.'
          });
          return;
        }

        setToast({
          open: true,
          severity: 'info',
          message: 'AI Forecast engine updated.'
        });
      }

      setConfirmOpen(false);
      setConfirmType(null);

    } catch {
      setToast({
        open: true,
        severity: 'error',
        message: 'Update failed.'
      });
    }
  };

  /* ================= SAVE HORIZON ================= */

  const handleSaveForecastSettings = async () => {
    try {
      const result = await updateConfig({
        defaultForecastHorizon: Number(forecastHorizon)
      });
      if (!result.success) {
        setToast({
          open: true,
          severity: 'error',
          message: result.error || 'Failed to update forecast settings.'
        });
        return;
      }

      setToast({
        open: true,
        severity: 'success',
        message: 'Forecast settings updated.'
      });
    } catch {
      setToast({
        open: true,
        severity: 'error',
        message: 'Failed to update forecast settings.'
      });
    }
  };

  const handleRefreshSnapshot = async () => {
    const result = await fetchLatestSnapshot();
    if (!result.success) {
      setToast({
        open: true,
        severity: 'error',
        message: result.error || 'Failed to refresh snapshot status.'
      });
    }
  };

  const handleSaveRecommendationThresholds = async () => {
    const low = Number(lowMinScore);
    const moderate = Number(moderateMinScore);

    if (Number.isNaN(low) || Number.isNaN(moderate)) {
      setToast({ open: true, severity: 'error', message: 'Thresholds must be valid numbers.' });
      return;
    }
    if (low < 0 || low > 1 || moderate < 0 || moderate > 1) {
      setToast({ open: true, severity: 'error', message: 'Thresholds must be between 0 and 1.' });
      return;
    }
    if (moderate >= low) {
      setToast({ open: true, severity: 'error', message: 'Moderate threshold must be lower than low threshold.' });
      return;
    }

    const result = await updateConfig({
      recommendationThresholds: {
        lowMinScore: low,
        moderateMinScore: moderate
      }
    });
    if (result.success) {
      setToast({ open: true, severity: 'success', message: 'Recommendation thresholds updated.' });
    } else {
      setToast({ open: true, severity: 'error', message: result.error || 'Failed to update thresholds.' });
    }
  };

  const handleSaveRecommendationScoring = async () => {
    const values = [climateWeight, soilWeight, soilTypeWeight, phWeight, drainageWeight, fertilityWeight].map(Number);
    if (values.some((v) => Number.isNaN(v) || v <= 0 || v > 1)) {
      setToast({ open: true, severity: 'error', message: 'All scoring weights must be greater than 0 and not exceed 1.0.' });
      return;
    }
    if (!scoringTotals.overallValid) {
      setToast({ open: true, severity: 'error', message: 'Climate and soil weights combined must not exceed 1.0.' });
      return;
    }
    if (!scoringTotals.soilValid) {
      setToast({ open: true, severity: 'error', message: 'Soil sub-factor weights combined must not exceed 1.0.' });
      return;
    }

    const result = await updateConfig({
      recommendationScoring: {
        weights: {
          climate: Number(climateWeight),
          soil: Number(soilWeight)
        },
        soilWeights: {
          soilType: Number(soilTypeWeight),
          ph: Number(phWeight),
          drainage: Number(drainageWeight),
          fertility: Number(fertilityWeight)
        }
      }
    });

    if (result.success) {
      setToast({ open: true, severity: 'success', message: 'Recommendation scoring weights updated.' });
    } else {
      setToast({ open: true, severity: 'error', message: result.error || 'Failed to update scoring weights.' });
    }
  };

  const handleResetRecommendationScoringDefaults = async () => {
    const defaults = {
      weights: { climate: 0.6, soil: 0.4 },
      soilWeights: { soilType: 0.35, ph: 0.25, drainage: 0.25, fertility: 0.15 }
    };

    const result = await updateConfig({ recommendationScoring: defaults });
    if (!result.success) {
      setToast({ open: true, severity: 'error', message: result.error || 'Failed to reset scoring weights.' });
      return;
    }

    setClimateWeight(defaults.weights.climate);
    setSoilWeight(defaults.weights.soil);
    setSoilTypeWeight(defaults.soilWeights.soilType);
    setPhWeight(defaults.soilWeights.ph);
    setDrainageWeight(defaults.soilWeights.drainage);
    setFertilityWeight(defaults.soilWeights.fertility);
    setToast({ open: true, severity: 'success', message: 'Scoring weights reset to defaults.' });
  };

  const handleGenerateSnapshot = async () => {
    if (!config?.aiForecastEnabled) {
      setToast({
        open: true,
        severity: 'warning',
        message: 'AI Forecast is disabled. Enable it first to generate snapshot.'
      });
      return;
    }

    const result = await generateSnapshot();
    if (result.success) {
      setToast({
        open: true,
        severity: 'success',
        message: 'Forecast snapshot generated successfully.'
      });
    } else {
      setToast({
        open: true,
        severity: 'error',
        message: result.error || 'Failed to generate forecast snapshot.'
      });
    }
  };

  /* ================= UI ================= */

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>

      {/* HEADER */}
      <Grid size={12}>
        <AdminPageHeader title="System Configuration (Power Admin Mode)" current="System Configuration" />
      </Grid>

      <Grid size={{ xs: 12, md: 3 }}>
        <ConfigSummaryCard title="System Status">
          <Stack spacing={1.25} alignItems="flex-start">
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 98 }}>
                Maintenance
              </Typography>
              <Chip
                label={config?.maintenanceMode ? 'ON' : 'OFF'}
                color={config?.maintenanceMode ? 'warning' : 'success'}
                variant="outlined"
              />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 98 }}>
                AI Forecast
              </Typography>
              <Chip
                label={config?.aiForecastEnabled ? 'ENABLED' : 'DISABLED'}
                color={config?.aiForecastEnabled ? 'success' : 'default'}
                variant="outlined"
              />
            </Stack>
          </Stack>
        </ConfigSummaryCard>
      </Grid>

      <Grid size={{ xs: 12, md: 3 }}>
        <ConfigSummaryCard title="Current Versions" loading={loading}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Model
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {config?.defaultModelVersion || '-'}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Dataset
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {config?.defaultDatasetVersion || '-'}
              </Typography>
            </Stack>
          </Stack>
        </ConfigSummaryCard>
      </Grid>

      <Grid size={{ xs: 12, md: 3 }}>
        <ConfigSummaryCard title="Snapshot Status">
          <Chip
            label={
              snapshotStatus === 'ready'
                ? 'READY'
                : snapshotStatus === 'no_snapshot'
                  ? 'NO SNAPSHOT'
                  : snapshotStatus === 'error'
                    ? 'ERROR'
                    : 'IDLE'
            }
            color={snapshotStatus === 'ready' ? 'success' : snapshotStatus === 'error' ? 'error' : 'default'}
            variant="outlined"
            sx={{ alignSelf: 'flex-start', minWidth: 120 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ pt: 0.25 }}>
            {latestSnapshot?.snapshotId ? `ID: ${latestSnapshot.snapshotId}` : 'No generated snapshot yet'}
          </Typography>
        </ConfigSummaryCard>
      </Grid>

      <Grid size={{ xs: 12, md: 3 }}>
        <ConfigSummaryCard title="Knowledge Corpus" loading={knowledgeLoading} skeletonWidths={['42%', '72%']}>
          <Chip
            label={knowledgeStatus?.ready ? 'READY' : 'NOT READY'}
            color={knowledgeStatus?.ready ? 'success' : 'warning'}
            variant="outlined"
            sx={{ alignSelf: 'flex-start', minWidth: 120 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ pt: 0.25 }}>
            Documents: {knowledgeStatus?.processed?.documentCount ?? 0} | Chunks: {knowledgeStatus?.processed?.chunkCount ?? 0}
          </Typography>
        </ConfigSummaryCard>
      </Grid>

      {/* MAIN CARD */}
      <Grid size={{ xs: 12, md: 8 }}>
        <MainCard content={false}>
          <Stack sx={{ p: 2.5 }} spacing={3}>

            {loading ? (
              <>
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={80} />
              </>
            ) : (
              <>
                {/* Maintenance Mode */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography>Maintenance Mode</Typography>
                  <Switch
                    checked={config?.maintenanceMode || false}
                    onChange={() => {
                      setConfirmType('maintenance');
                      setConfirmOpen(true);
                    }}
                  />
                </Stack>

                {/* AI Forecast Toggle */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography>AI Forecast Enabled</Typography>
                  <Switch
                    checked={config?.aiForecastEnabled || false}
                    onChange={() => {
                      setConfirmType('ai');
                      setConfirmOpen(true);
                    }}
                  />
                </Stack>

                {/* Forecast Settings */}
                <Stack spacing={2}>
                  <Typography variant="subtitle2">
                    Forecast Settings
                  </Typography>

                  <TextField
                    label="Default Forecast Horizon (Quarters)"
                    type="number"
                    size="small"
                    value={forecastHorizon}
                    onChange={(e) => setForecastHorizon(e.target.value)}
                  />

                  <TextField
                    label="Default Model Version"
                    size="small"
                    value={config?.defaultModelVersion || '-'}
                    InputProps={{ readOnly: true }}
                    helperText="Derived from the currently active model in Model Registry."
                  />

                  <TextField
                    label="Default Dataset Version"
                    size="small"
                    value={config?.defaultDatasetVersion || '-'}
                    InputProps={{ readOnly: true }}
                    helperText="Derived from the currently active dataset in Data Source Management."
                  />

                  <Button
                    variant="contained"
                    onClick={handleSaveForecastSettings}
                    disabled={saving}
                  >
                    {saving
                      ? <CircularProgress size={18} color="inherit" />
                      : 'Save Forecast Settings'}
                  </Button>
                </Stack>

                {/* Metadata */}
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated At: {config?.lastUpdatedAt}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated By: {config?.lastUpdatedBy}
                  </Typography>
                </Stack>

                {/* Forecast Snapshot */}
                <Stack spacing={1.25}>
                  <Typography variant="subtitle2">Forecast Snapshot</Typography>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button
                      variant="contained"
                      onClick={handleGenerateSnapshot}
                      disabled={generatingSnapshot || snapshotLoading || !config?.aiForecastEnabled}
                    >
                      {generatingSnapshot
                        ? <CircularProgress size={18} color="inherit" />
                        : 'Generate Snapshot'}
                    </Button>
                    <Button variant="outlined" onClick={handleRefreshSnapshot} disabled={generatingSnapshot || snapshotLoading}>
                      {snapshotLoading
                        ? <CircularProgress size={18} color="inherit" />
                        : 'Refresh Snapshot'}
                    </Button>
                  </Stack>

                  {snapshotStatus === 'no_snapshot' && (
                    <Alert severity="info">No snapshot available yet.</Alert>
                  )}
                  {!config?.aiForecastEnabled && (
                    <Alert severity="warning">AI Forecast is disabled. Snapshot generation is blocked.</Alert>
                  )}

                  {snapshotStatus === 'error' && (
                    <Alert severity="error">Failed to fetch latest snapshot.</Alert>
                  )}

                  {snapshotStatus === 'ready' && (
                    <Stack spacing={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Snapshot ID: {latestSnapshot?.snapshotId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Model Version: {latestSnapshot?.metadata?.modelVersion || '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Horizon: {latestSnapshot?.metadata?.horizon ?? '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Base Period: {latestSnapshot?.metadata?.basePeriod || '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Generated At: {latestSnapshot?.metadata?.generatedAt || '-'}
                      </Typography>
                    </Stack>
                  )}
                </Stack>

              </>
            )}

          </Stack>
        </MainCard>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <MainCard content={false}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Typography variant="subtitle2">Recommendation Score Thresholds</Typography>
            <Typography variant="caption" color="text.secondary">
              Used to classify recommendation risk labels. Defaults are applied when no custom config exists.
            </Typography>

            <TextField
              label="Low Risk Min Score"
              size="small"
              type="number"
              inputProps={{ step: 0.01, min: 0, max: 1 }}
              value={lowMinScore}
              onChange={(e) => setLowMinScore(e.target.value)}
            />
            <TextField
              label="Moderate Risk Min Score"
              size="small"
              type="number"
              inputProps={{ step: 0.01, min: 0, max: 1 }}
              value={moderateMinScore}
              onChange={(e) => setModerateMinScore(e.target.value)}
            />
            <Alert severity="info" variant="outlined">
              High risk is derived automatically: score {'<'} {Number(moderateMinScore || 0).toFixed(2)}
            </Alert>

            <Button
              variant="contained"
              onClick={handleSaveRecommendationThresholds}
              disabled={saving}
            >
              {saving ? <CircularProgress size={18} color="inherit" /> : 'Save Thresholds'}
            </Button>

            <Typography variant="subtitle2" sx={{ pt: 1 }}>Recommendation Scoring Weights</Typography>
            <Typography variant="caption" color="text.secondary">
              Controls overall climate vs soil influence and soil sub-factor influence. Defaults apply when config is absent.
            </Typography>

            <TextField
              label="Climate Weight"
              size="small"
              type="number"
              inputProps={{ step: 0.01, min: 0.0001, max: 1 }}
              error={!scoringTotals.overallValid}
              value={climateWeight}
              onChange={(e) => setClimateWeight(e.target.value)}
            />
            <TextField
              label="Soil Weight"
              size="small"
              type="number"
              inputProps={{ step: 0.01, min: 0.0001, max: 1 }}
              error={!scoringTotals.overallValid}
              value={soilWeight}
              onChange={(e) => setSoilWeight(e.target.value)}
            />
            <Alert severity={scoringTotals.overallValid ? 'info' : 'error'} variant="outlined">
              Climate + Soil total: {Number.isFinite(scoringTotals.overall) ? scoringTotals.overall.toFixed(2) : '-'} / 1.00
            </Alert>
            <TextField
              label="Soil Type Weight"
              size="small"
              type="number"
              inputProps={{ step: 0.01, min: 0.0001, max: 1 }}
              error={!scoringTotals.soilValid}
              value={soilTypeWeight}
              onChange={(e) => setSoilTypeWeight(e.target.value)}
            />
            <TextField
              label="pH Weight"
              size="small"
              type="number"
              inputProps={{ step: 0.01, min: 0.0001, max: 1 }}
              error={!scoringTotals.soilValid}
              value={phWeight}
              onChange={(e) => setPhWeight(e.target.value)}
            />
            <TextField
              label="Drainage Weight"
              size="small"
              type="number"
              inputProps={{ step: 0.01, min: 0.0001, max: 1 }}
              error={!scoringTotals.soilValid}
              value={drainageWeight}
              onChange={(e) => setDrainageWeight(e.target.value)}
            />
            <TextField
              label="Fertility Weight"
              size="small"
              type="number"
              inputProps={{ step: 0.01, min: 0.0001, max: 1 }}
              error={!scoringTotals.soilValid}
              value={fertilityWeight}
              onChange={(e) => setFertilityWeight(e.target.value)}
            />
            <Alert severity={scoringTotals.soilValid ? 'info' : 'error'} variant="outlined">
              Soil sub-factor total: {Number.isFinite(scoringTotals.soil) ? scoringTotals.soil.toFixed(2) : '-'} / 1.00
            </Alert>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="contained"
                onClick={handleSaveRecommendationScoring}
                disabled={saving || !scoringTotals.overallValid || !scoringTotals.soilValid}
              >
                {saving ? <CircularProgress size={18} color="inherit" /> : 'Save Scoring Weights'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleResetRecommendationScoringDefaults}
                disabled={saving}
              >
                Reset to Defaults
              </Button>
            </Stack>
          </Stack>
        </MainCard>
      </Grid>

      {/* CONFIRM DIALOG */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Are you sure you want to change this setting?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={saving}
          >
            {saving
              ? <CircularProgress size={18} color="inherit" />
              : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* TOAST */}
      <Snackbar
        open={toast.open}
        autoHideDuration={2200}
        onClose={() => setToast(p => ({ ...p, open: false }))}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>

    </Grid>
  );
}
