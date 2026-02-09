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
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Skeleton from '@mui/material/Skeleton';

// snackbar
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

// project imports
import MainCard from 'components/MainCard';

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
            <Typography variant="h4">{value}</Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </>
        )}
      </Stack>
    </MainCard>
  );
}

function LabeledField({ label, children }) {
  return (
    <Stack spacing={1} sx={{ width: '100%' }}>
      <InputLabel>{label}</InputLabel>
      {children}
    </Stack>
  );
}

// ==============================|| ADMIN SYSTEM CONFIG ||============================== //

export default function AdminSystemConfig() {
  const [loading, setLoading] = useState(true);

  const HORIZONS = useMemo(() => ['Q+1', 'Q+2', 'Q+3', 'Q+4', 'Q+5', 'Q+6', 'Q+7', 'Q+8'], []);

  const [config, setConfig] = useState({
    // Forecast horizons
    defaultHorizon: 'Q+4',
    maxHorizon: 'Q+8',

    // Thresholds
    minConfidence: 0.75,
    minRecordsPerProvince: 30,

    // Feature toggles
    enableForecasting: true,
    enableRecommendations: true,
    enableInteractiveMap: true,
    enableAuditLogs: true,

    // Maintenance
    maintenanceMode: false
  });

  const [savedSnapshot, setSavedSnapshot] = useState(null);

  const [toast, setToast] = useState({
    open: false,
    severity: 'success',
    message: ''
  });

  useEffect(() => {
    // ✅ Replace later with Firestore:
    // GET settings/system
    const mockFetch = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 700));

      const fetched = {
        defaultHorizon: 'Q+4',
        maxHorizon: 'Q+8',
        minConfidence: 0.75,
        minRecordsPerProvince: 30,
        enableForecasting: true,
        enableRecommendations: true,
        enableInteractiveMap: true,
        enableAuditLogs: true,
        maintenanceMode: false
      };

      setConfig(fetched);
      setSavedSnapshot(fetched);
      setLoading(false);
    };

    mockFetch();
  }, []);

  const hasChanges = useMemo(() => {
    if (!savedSnapshot) return false;
    return JSON.stringify(config) !== JSON.stringify(savedSnapshot);
  }, [config, savedSnapshot]);

  const handleSaveUIOnly = () => {
    // ✅ UI-only simulation
    setSavedSnapshot(config);
    setToast({
      open: true,
      severity: 'success',
      message: 'Settings saved (UI only). Connect backend later.'
    });
  };

  const handleReset = () => {
    if (!savedSnapshot) return;
    setConfig(savedSnapshot);
    setToast({
      open: true,
      severity: 'info',
      message: 'Changes reverted.'
    });
  };

  const isHorizonValid = useMemo(() => {
    const d = Number(config.defaultHorizon.replace('Q+', ''));
    const m = Number(config.maxHorizon.replace('Q+', ''));
    return d <= m;
  }, [config.defaultHorizon, config.maxHorizon]);

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* row 1 */}
      <Grid size={12}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Typography variant="h5">System Configuration</Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Button variant="outlined" disabled={loading || !hasChanges} onClick={handleReset}>
              Reset
            </Button>

            <Button
              variant="contained"
              disabled={loading || !hasChanges || !isHorizonValid}
              onClick={handleSaveUIOnly}
            >
              Save Changes
            </Button>
          </Stack>
        </Stack>
      </Grid>

      {/* summary */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <AdminSummaryCard
          title="Default Horizon"
          value={loading ? '—' : config.defaultHorizon}
          subtitle="Used when generating analytics"
          loading={loading}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <AdminSummaryCard
          title="Max Horizon"
          value={loading ? '—' : config.maxHorizon}
          subtitle="Maximum forecast range allowed"
          loading={loading}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <AdminSummaryCard
          title="Maintenance Mode"
          value={loading ? '—' : config.maintenanceMode ? 'ON' : 'OFF'}
          subtitle="Restrict access for updates"
          loading={loading}
        />
      </Grid>

      {/* row 2 - forecast config */}
      <Grid size={{ xs: 12, lg: 7 }}>
        <MainCard content={false} sx={{ mt: 1.5 }}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Typography variant="h6">Forecast Settings</Typography>
            <Typography variant="body2" color="text.secondary">
              Configure forecasting horizon defaults and system limits.
            </Typography>

            <Divider />

            {loading ? (
              <Stack spacing={2}>
                <Skeleton height={50} />
                <Skeleton height={50} />
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <LabeledField label="Default Horizon">
                      <Select
                        value={config.defaultHorizon}
                        onChange={(e) => setConfig((p) => ({ ...p, defaultHorizon: e.target.value }))}
                      >
                        {HORIZONS.map((h) => (
                          <MenuItem key={h} value={h}>
                            {h}
                          </MenuItem>
                        ))}
                      </Select>
                    </LabeledField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <LabeledField label="Max Horizon">
                      <Select
                        value={config.maxHorizon}
                        onChange={(e) => setConfig((p) => ({ ...p, maxHorizon: e.target.value }))}
                      >
                        {HORIZONS.map((h) => (
                          <MenuItem key={h} value={h}>
                            {h}
                          </MenuItem>
                        ))}
                      </Select>
                    </LabeledField>
                  </Grid>
                </Grid>

                {!isHorizonValid && (
                  <Alert severity="error">
                    Default horizon must be less than or equal to Max horizon.
                  </Alert>
                )}
              </Stack>
            )}
          </Stack>
        </MainCard>
      </Grid>

      {/* row 2 right - thresholds */}
      <Grid size={{ xs: 12, lg: 5 }}>
        <MainCard content={false} sx={{ mt: 1.5 }}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Typography variant="h6">Thresholds</Typography>
            <Typography variant="body2" color="text.secondary">
              Controls for recommendation quality and required data volume.
            </Typography>

            <Divider />

            {loading ? (
              <Stack spacing={2}>
                <Skeleton height={52} />
                <Skeleton height={52} />
              </Stack>
            ) : (
              <Stack spacing={2}>
                <LabeledField label="Minimum Confidence (0.00 to 1.00)">
                  <TextField
                    type="number"
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                    value={config.minConfidence}
                    onChange={(e) => setConfig((p) => ({ ...p, minConfidence: Number(e.target.value) }))}
                    fullWidth
                  />
                </LabeledField>

                <LabeledField label="Minimum Records per Province">
                  <TextField
                    type="number"
                    inputProps={{ step: 1, min: 1 }}
                    value={config.minRecordsPerProvince}
                    onChange={(e) => setConfig((p) => ({ ...p, minRecordsPerProvince: Number(e.target.value) }))}
                    fullWidth
                  />
                </LabeledField>
              </Stack>
            )}
          </Stack>
        </MainCard>
      </Grid>

      {/* row 3 - feature toggles */}
      <Grid size={{ xs: 12 }}>
        <MainCard content={false} sx={{ mt: 2 }}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Typography variant="h6">Feature Toggles</Typography>
            <Typography variant="body2" color="text.secondary">
              Enable or disable modules without changing code (useful for testing and demo control).
            </Typography>

            <Divider />

            {loading ? (
              <Stack spacing={1}>
                <Skeleton height={32} width="55%" />
                <Skeleton height={32} width="60%" />
                <Skeleton height={32} width="50%" />
                <Skeleton height={32} width="58%" />
              </Stack>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enableForecasting}
                        onChange={(e) => setConfig((p) => ({ ...p, enableForecasting: e.target.checked }))}
                      />
                    }
                    label="Enable Forecasting"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enableRecommendations}
                        onChange={(e) => setConfig((p) => ({ ...p, enableRecommendations: e.target.checked }))}
                      />
                    }
                    label="Enable Recommendations"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enableInteractiveMap}
                        onChange={(e) => setConfig((p) => ({ ...p, enableInteractiveMap: e.target.checked }))}
                      />
                    }
                    label="Enable Interactive Map"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enableAuditLogs}
                        onChange={(e) => setConfig((p) => ({ ...p, enableAuditLogs: e.target.checked }))}
                      />
                    }
                    label="Enable Audit Logs"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.maintenanceMode}
                        onChange={(e) => setConfig((p) => ({ ...p, maintenanceMode: e.target.checked }))}
                      />
                    }
                    label="Maintenance Mode"
                  />
                </Grid>
              </Grid>
            )}
          </Stack>
        </MainCard>
      </Grid>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={2200}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
      >
        <Alert
          onClose={() => setToast((p) => ({ ...p, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
