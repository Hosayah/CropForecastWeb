import { useEffect, useMemo, useState } from 'react';

// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import { InputLabel } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

// dialog
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// snackbar
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

// icons
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ScienceIcon from '@mui/icons-material/Science';

// project imports
import MainCard from 'components/MainCard';
import AdminPageHeader from './components/AdminPageHeader';

// ==============================|| HELPERS ||============================== //

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

function HealthChip({ ok }) {
  return ok ? (
    <Chip size="small" color="success" variant="outlined" label="Healthy" icon={<CheckCircleOutlineIcon />} />
  ) : (
    <Chip size="small" color="error" variant="outlined" label="Needs Attention" icon={<ErrorOutlineIcon />} />
  );
}

function safeCopy(text) {
  if (!text) return;
  navigator.clipboard?.writeText(text);
}

function maskSecret(secret) {
  if (!secret) return '';
  if (secret.length <= 6) return '••••••';
  return `${secret.slice(0, 3)}••••••••••${secret.slice(-3)}`;
}

// ==============================|| ADMIN INTEGRATIONS ||============================== //

export default function AdminIntegrations() {
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  const [config, setConfig] = useState({
    // toggles
    enableAI: true,
    enableAnalytics: true,
    enableEmail: false,
    enableLocalDatasetStorage: true,

    // secrets (UI only)
    aiApiKey: '',
    analyticsApiKey: '',
    webhookUrl: '',

    // meta
    lastUpdated: '—',
    healthOk: true
  });

  const [showAIKey, setShowAIKey] = useState(false);
  const [showAnalyticsKey, setShowAnalyticsKey] = useState(false);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const [savedSnapshot, setSavedSnapshot] = useState(null);

  useEffect(() => {
    // ✅ Replace later with Firestore:
    // settings/integrations
    const mockFetch = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 700));

      const fetched = {
        enableAI: true,
        enableAnalytics: true,
        enableEmail: false,
        enableLocalDatasetStorage: true,

        aiApiKey: 'sk-demo-ai-1234567890',
        analyticsApiKey: 'ak-demo-analytics-abcdef123',
        webhookUrl: 'http://localhost:5000/api/webhooks/events',

        lastUpdated: '2026-01-31 19:22',
        healthOk: true
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

  const integrationEnabledCount = useMemo(() => {
    const flags = [config.enableAI, config.enableAnalytics, config.enableEmail, config.enableLocalDatasetStorage];
    return flags.filter(Boolean).length;
  }, [config]);

  const keysConfiguredCount = useMemo(() => {
    const keys = [config.aiApiKey, config.analyticsApiKey, config.webhookUrl];
    return keys.filter((x) => String(x || '').trim().length > 0).length;
  }, [config]);

  const handleSaveUIOnly = () => {
    setSavedSnapshot(config);
    setToast({
      open: true,
      severity: 'success',
      message: 'Integrations saved (UI only). Connect backend later.'
    });
  };

  const handleResetChanges = () => {
    if (!savedSnapshot) return;
    setConfig(savedSnapshot);
    setToast({ open: true, severity: 'info', message: 'Changes reverted.' });
  };

  const handleTestWebhookUIOnly = () => {
    setToast({
      open: true,
      severity: 'info',
      message: 'Webhook test will be implemented later.'
    });
  };

  const handleResetKeysUIOnly = () => {
    setConfirmResetOpen(false);

    // UI-only: clear the keys
    setConfig((p) => ({
      ...p,
      aiApiKey: '',
      analyticsApiKey: '',
      lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
    }));

    setToast({
      open: true,
      severity: 'warning',
      message: 'Keys cleared (UI only).'
    });
  };

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
          <AdminPageHeader title="Integrations & API Keys" current="Integrations" />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Button variant="outlined" disabled={loading || !hasChanges} onClick={handleResetChanges}>
              Reset
            </Button>

            <Button variant="outlined" color="warning" onClick={() => setConfirmResetOpen(true)} disabled={loading}>
              Clear Keys
            </Button>

            <Button variant="contained" disabled={loading || !hasChanges} onClick={handleSaveUIOnly}>
              Save Changes
            </Button>
          </Stack>
        </Stack>
      </Grid>

      {/* summary cards */}
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard
          title="Integrations Enabled"
          value={loading ? '—' : integrationEnabledCount}
          subtitle="Active modules"
          loading={loading}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard
          title="Keys Configured"
          value={loading ? '—' : keysConfiguredCount}
          subtitle="Keys & URLs set"
          loading={loading}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard
          title="Last Updated"
          value={loading ? '—' : config.lastUpdated}
          subtitle="Last config update"
          loading={loading}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MainCard content={false} sx={{ height: '100%' }}>
          <Stack sx={{ p: 2.5 }} spacing={1.25}>
            <Typography variant="subtitle2" color="text.secondary">
              Health Status
            </Typography>

            {loading ? (
              <>
                <Skeleton height={34} width="55%" />
                <Skeleton height={18} width="75%" />
              </>
            ) : (
              <>
                <Stack direction="row" spacing={1} alignItems="center">
                  <HealthChip ok={config.healthOk} />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Based on last integration check
                </Typography>
              </>
            )}
          </Stack>
        </MainCard>
      </Grid>

      {/* row 2 - toggles */}
      <Grid size={{ xs: 12, lg: 5 }}>
        <MainCard content={false} sx={{ mt: 1.5 }}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Typography variant="h6">Integration Toggles</Typography>
            <Typography variant="body2" color="text.secondary">
              Enable or disable modules without changing code.
            </Typography>

            <Divider />

            {loading ? (
              <Stack spacing={1}>
                <Skeleton height={34} width="70%" />
                <Skeleton height={34} width="65%" />
                <Skeleton height={34} width="55%" />
                <Skeleton height={34} width="75%" />
              </Stack>
            ) : (
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enableAI}
                      onChange={(e) => setConfig((p) => ({ ...p, enableAI: e.target.checked }))}
                    />
                  }
                  label="Enable AI Module"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enableAnalytics}
                      onChange={(e) => setConfig((p) => ({ ...p, enableAnalytics: e.target.checked }))}
                    />
                  }
                  label="Enable Analytics Module"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enableEmail}
                      onChange={(e) => setConfig((p) => ({ ...p, enableEmail: e.target.checked }))}
                    />
                  }
                  label="Enable Email Notifications"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enableLocalDatasetStorage}
                      onChange={(e) => setConfig((p) => ({ ...p, enableLocalDatasetStorage: e.target.checked }))}
                    />
                  }
                  label="Enable Local Dataset Storage (Flask Folder)"
                />
              </Stack>
            )}
          </Stack>
        </MainCard>
      </Grid>

      {/* row 2 - keys */}
      <Grid size={{ xs: 12, lg: 7 }}>
        <MainCard content={false} sx={{ mt: 1.5 }}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Typography variant="h6">API Keys & Endpoints</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage keys used by backend services (stored securely server-side later).
            </Typography>

            <Divider />

            {loading ? (
              <Stack spacing={2}>
                <Skeleton height={54} />
                <Skeleton height={54} />
                <Skeleton height={54} />
              </Stack>
            ) : (
              <Stack spacing={2}>
                {/* AI Key */}
                <Stack spacing={1}>
                  <InputLabel>AI API Key</InputLabel>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      value={showAIKey ? config.aiApiKey : maskSecret(config.aiApiKey)}
                      onChange={(e) => setConfig((p) => ({ ...p, aiApiKey: e.target.value }))}
                      placeholder="Enter AI key..."
                      fullWidth
                    />

                    <Tooltip title={showAIKey ? 'Hide' : 'Show'}>
                      <IconButton size="small" onClick={() => setShowAIKey((v) => !v)}>
                        {showAIKey ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Copy">
                      <IconButton
                        size="small"
                        onClick={() => {
                          safeCopy(config.aiApiKey);
                          setToast({ open: true, severity: 'success', message: 'AI key copied!' });
                        }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                {/* Analytics Key */}
                <Stack spacing={1}>
                  <InputLabel>Analytics API Key</InputLabel>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      value={showAnalyticsKey ? config.analyticsApiKey : maskSecret(config.analyticsApiKey)}
                      onChange={(e) => setConfig((p) => ({ ...p, analyticsApiKey: e.target.value }))}
                      placeholder="Enter analytics key..."
                      fullWidth
                    />

                    <Tooltip title={showAnalyticsKey ? 'Hide' : 'Show'}>
                      <IconButton size="small" onClick={() => setShowAnalyticsKey((v) => !v)}>
                        {showAnalyticsKey ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Copy">
                      <IconButton
                        size="small"
                        onClick={() => {
                          safeCopy(config.analyticsApiKey);
                          setToast({ open: true, severity: 'success', message: 'Analytics key copied!' });
                        }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                {/* Webhook */}
                <Stack spacing={1}>
                  <InputLabel>Webhook URL (optional)</InputLabel>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                    <TextField
                      value={config.webhookUrl}
                      onChange={(e) => setConfig((p) => ({ ...p, webhookUrl: e.target.value }))}
                      placeholder="http://localhost:5000/api/webhooks/events"
                      fullWidth
                    />

                    <Button
                      variant="outlined"
                      startIcon={<ScienceIcon />}
                      onClick={handleTestWebhookUIOnly}
                      sx={{ minWidth: { xs: '100%', sm: 150 } }}
                    >
                      Test
                    </Button>
                  </Stack>
                </Stack>

                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Tip: Keys should be stored server-side (Flask env vars) for security.
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<RestartAltIcon />}
                      onClick={() => setToast({ open: true, severity: 'info', message: 'Regenerate will be added later.' })}
                    >
                      Regenerate
                    </Button>
                  </Stack>
                </Paper>
              </Stack>
            )}
          </Stack>
        </MainCard>
      </Grid>

      {/* Clear Keys Confirm Dialog */}
      <Dialog open={confirmResetOpen} onClose={() => setConfirmResetOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Clear Keys</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning">
            This will remove stored API keys from the UI configuration. (UI only for now)
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            You can re-enter keys anytime.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmResetOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleResetKeysUIOnly}>
            Clear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar open={toast.open} autoHideDuration={2200} onClose={() => setToast((p) => ({ ...p, open: false }))}>
        <Alert onClose={() => setToast((p) => ({ ...p, open: false }))} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
