import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';

import MainCard from 'components/MainCard';
import AnalystPageHeader from './components/AnalystPageHeader';
import AnalystSummaryCard from './components/AnalystSummaryCard';
import { getSystemConfigApi } from 'model/adminSystemConfigApi';

export default function AnalystModelInfo() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadConfig() {
      setLoading(true);
      setError('');
      try {
        const response = await getSystemConfigApi();
        if (!mounted) return;
        const payload = response?.data?.data || response?.data || {};
        setConfig(payload);
      } catch (err) {
        if (!mounted) return;
        setConfig(null);
        setError(err?.response?.data?.error || 'Failed to load model info.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadConfig();
    return () => {
      mounted = false;
    };
  }, []);

  const aiEnabled = Boolean(config?.aiForecastEnabled);
  const horizon = Number(config?.defaultForecastHorizon || 0);

  const statusChip = useMemo(
    () => (
      <Chip
        size="small"
        label={aiEnabled ? 'AI Enabled' : 'AI Disabled'}
        color={aiEnabled ? 'success' : 'default'}
        variant="outlined"
      />
    ),
    [aiEnabled]
  );

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <AnalystPageHeader title="Model Info" current="Model Info" />
      </Grid>

      {error ? (
        <Grid size={12}>
          <Alert severity={error.toLowerCase().includes('forbidden') ? 'warning' : 'error'}>{error}</Alert>
        </Grid>
      ) : null}

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalystSummaryCard title="AI Forecast" value={aiEnabled ? 'Enabled' : 'Disabled'} subtitle="System switch" loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalystSummaryCard title="Default Horizon" value={horizon > 0 ? `${horizon}Q` : '-'} subtitle="Quarter window" loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalystSummaryCard
          title="Default Model Version"
          value={config?.defaultModelVersion || '-'}
          subtitle="Active model from registry"
          loading={loading}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalystSummaryCard
          title="Default Dataset Version"
          value={config?.defaultDatasetVersion || '-'}
          subtitle="Active master dataset"
          loading={loading}
        />
      </Grid>

      <Grid size={12}>
        <MainCard>
          <Stack spacing={1.25}>
            <Typography variant="h6">Read-only Configuration</Typography>
            {loading ? (
              <>
                <Skeleton width="45%" />
                <Skeleton width="70%" />
                <Skeleton width="55%" />
              </>
            ) : (
              <>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">Forecast Engine:</Typography>
                  {statusChip}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Default model version: {config?.defaultModelVersion || '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Default dataset version: {config?.defaultDatasetVersion || '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last updated: {config?.lastUpdatedAt || '-'} by {config?.lastUpdatedBy || '-'}
                </Typography>
              </>
            )}
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}
