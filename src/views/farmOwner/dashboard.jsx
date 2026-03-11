import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { InputLabel } from '@mui/material';
import Select from '@mui/material/Select';
import Alert from '@mui/material/Alert';

import AnalyticCardSkeleton from '../../components/skeletons/AnalyticCardSkeleton';
import ChartSkeleton from '../../components/skeletons/ChartSkeleton';
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import CropsTable from 'sections/dashboard/default/CropsTable';
import CropTrendCard from 'sections/dashboard/default/CropTrendCard';
import EmptyFarmState from 'sections/dashboard/default/EmptyFarmState';
import NoSnapshotState from 'sections/dashboard/default/NoSnapshotState';
import { usePreferences } from 'hooks/usePreferences';

import { useCropAnalytics } from 'viewModel/useCropAnalytics';
import { useFarms } from 'viewModel/useFarms';

const ALL_PROVINCES_OPTION = '__ALL_PROVINCES__';
const HOME_FILTER_STORAGE_KEY = 'agrisense:home_province_filter';
const HOME_SELECTED_CROPS_STORAGE_KEY = 'agrisense:home_selected_crops';

function getTopCropsFromTrend(series, topN = 10) {
  if (!Array.isArray(series)) return [];
  return series
    .map((item) => ({
      crop: item.label,
      value: item.data[item.data.length - 1] ?? 0,
      total: item.data.reduce((a, b) => a + b, 0)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);
}

function getTopCropsFromTrendPeriod(series, periodIndex = -1, topN = 10) {
  if (!Array.isArray(series) || series.length === 0) return [];
  const safeIndex = Number.isInteger(periodIndex) && periodIndex >= 0 ? periodIndex : null;
  return series
    .map((item) => {
      const values = Array.isArray(item?.data) ? item.data : [];
      const idx = safeIndex !== null ? Math.min(safeIndex, Math.max(values.length - 1, 0)) : Math.max(values.length - 1, 0);
      return {
        crop: item.label,
        value: values[idx] ?? 0,
        total: values.reduce((a, b) => a + b, 0)
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);
}

function formatTimestamp(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return null;
  const d = new Date(n);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
}

export default function FarmOwnerDashboard() {
  const navigate = useNavigate();
  const prefs = usePreferences();
  const { farms, loading: farmsLoading, error: farmsError } = useFarms();
  const [homeProvinceFilter, setHomeProvinceFilter] = useState(
    () => prefs.getString(HOME_FILTER_STORAGE_KEY, ALL_PROVINCES_OPTION) || ALL_PROVINCES_OPTION
  );
  const [selectedCrops, setSelectedCrops] = useState(() => prefs.getJson(HOME_SELECTED_CROPS_STORAGE_KEY, []));
  const [horizon, setHorizon] = useState(4);
  const [selectedTop10Period, setSelectedTop10Period] = useState('');

  const provinceOptions = useMemo(() => {
    const labels = new Map();
    farms.forEach((farm) => {
      const normalized = String(farm?.province || '').trim().toUpperCase();
      if (!normalized) return;
      if (!labels.has(normalized)) {
        labels.set(normalized, String(farm?.province || '').trim());
      }
    });
    return Array.from(labels.entries()).map(([value, label]) => ({ value, label: label || value }));
  }, [farms]);

  useEffect(() => {
    prefs.setString(HOME_FILTER_STORAGE_KEY, homeProvinceFilter);
  }, [homeProvinceFilter, prefs]);

  useEffect(() => {
    prefs.setJson(HOME_SELECTED_CROPS_STORAGE_KEY, selectedCrops);
  }, [selectedCrops, prefs]);

  useEffect(() => {
    if (farmsLoading) return;
    if (farms.length === 0) {
      setHomeProvinceFilter(ALL_PROVINCES_OPTION);
      prefs.setString(HOME_FILTER_STORAGE_KEY, ALL_PROVINCES_OPTION);
      return;
    }

    if (homeProvinceFilter !== ALL_PROVINCES_OPTION && !provinceOptions.some((option) => option.value === homeProvinceFilter)) {
      setHomeProvinceFilter(ALL_PROVINCES_OPTION);
      prefs.setString(HOME_FILTER_STORAGE_KEY, ALL_PROVINCES_OPTION);
    }
  }, [farmsLoading, farms, homeProvinceFilter, provinceOptions, prefs]);

  const scope = homeProvinceFilter === ALL_PROVINCES_OPTION ? 'ALL_MY_FARMS' : 'THIS_PROVINCE';
  const selectedProvince = homeProvinceFilter === ALL_PROVINCES_OPTION ? null : homeProvinceFilter;

  const { summary, trend, loading, error, snapshotStatus, snapshotMetadata, snapshotLastUpdatedAt, isBackgroundRefreshing } = useCropAnalytics({
    horizon,
    farms,
    farmsLoading,
    scope,
    selectedProvince
  });

  useEffect(() => {
    const metaHorizon = Number(snapshotMetadata?.horizon || 0);
    if (!Number.isFinite(metaHorizon) || metaHorizon <= 0) return;
    if (metaHorizon !== horizon) setHorizon(metaHorizon);
  }, [snapshotMetadata, horizon]);

  useEffect(() => {
    const labels = Array.isArray(trend?.labels) ? trend.labels : [];
    if (labels.length === 0) {
      if (selectedTop10Period) setSelectedTop10Period('');
      return;
    }

    if (!labels.includes(selectedTop10Period)) {
      setSelectedTop10Period(labels[labels.length - 1]);
    }
  }, [trend, selectedTop10Period]);

  const hasRenderableData = summary.length > 0 || (trend?.series || []).length > 0;
  const showDashboardSkeleton = (farmsLoading || loading) && !hasRenderableData;
  const isWarmupState =
    !showDashboardSkeleton &&
    farms.length > 0 &&
    snapshotStatus !== 'ready' &&
    snapshotStatus !== 'no_snapshot' &&
    snapshotStatus !== 'no_farms' &&
    !error;
  const lastUpdatedLabel = formatTimestamp(snapshotLastUpdatedAt);

  const top10Periods = Array.isArray(trend?.labels) ? trend.labels : [];
  const top10PeriodIndex = top10Periods.indexOf(selectedTop10Period);
  const topCrops = trend ? getTopCropsFromTrendPeriod(trend.series, top10PeriodIndex, 10) : getTopCropsFromTrend([], 10);
  const selectedProvinceLabel = provinceOptions.find((option) => option.value === selectedProvince)?.label || selectedProvince;
  const provinceLabel = scope === 'THIS_PROVINCE' ? selectedProvinceLabel || 'unknown' : 'all_my_farms';

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Typography variant="h5">Home</Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <InputLabel>Province:</InputLabel>
            <Select
              size="small"
              value={homeProvinceFilter}
              onChange={(e) => {
                const next = e.target.value;
                setHomeProvinceFilter(next);
              }}
              sx={{ minWidth: { xs: '100%', sm: 260 } }}
              disabled={farmsLoading || provinceOptions.length === 0}
            >
              <MenuItem value={ALL_PROVINCES_OPTION}>ALL</MenuItem>
              {provinceOptions.map((province) => (
                <MenuItem key={province.value} value={province.value}>
                  {province.label}
                </MenuItem>
              ))}
            </Select>
            <InputLabel>Quarter:</InputLabel>
            <Select
              size="small"
              value={selectedTop10Period}
              onChange={(e) => setSelectedTop10Period(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 160 } }}
              disabled={top10Periods.length === 0 || showDashboardSkeleton || isWarmupState}
            >
              {top10Periods.map((period) => (
                <MenuItem key={period} value={period}>
                  {period}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </Stack>
        {!farmsLoading && provinceOptions.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
            Showing only provinces where you currently have farms.
          </Typography>
        )}
        {lastUpdatedLabel && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
            Last updated: {lastUpdatedLabel}
            {isBackgroundRefreshing ? ' (refreshing...)' : ''}
          </Typography>
        )}
      </Grid>

      {farmsError && (
        <Grid size={12}>
          <Alert severity="error">Failed to load farms.</Alert>
        </Grid>
      )}

      {error && (
        <Grid size={12}>
          <Alert severity="error">Failed to load forecast snapshot.</Alert>
        </Grid>
      )}

      {!farmsLoading && farms.length === 0 && (
        <Grid size={12}>
          <EmptyFarmState onAddFarm={() => navigate('/farmOwner/farm-management')} />
        </Grid>
      )}

      {!farmsLoading && farms.length > 0 && snapshotStatus === 'no_snapshot' && (
        <Grid size={12}>
          <NoSnapshotState />
        </Grid>
      )}

      {(showDashboardSkeleton || isWarmupState) && snapshotStatus !== 'no_farms' && (
        <>
          {Array.from({ length: 3 }).map((_, idx) => (
            <Grid key={idx} size={{ xs: 12, sm: 6, lg: 4 }}>
              <AnalyticCardSkeleton />
            </Grid>
          ))}

          <Grid sx={{ display: { sm: 'none', md: 'block', lg: 'none' } }} size={{ md: 8 }} />

          <Grid size={{ xs: 12 }}>
            <MainCard content={false} sx={{ mt: 1.5 }}>
              <ChartSkeleton />
            </MainCard>
          </Grid>

          <Grid size={{ xs: 12, lg: 8 }}>
            <MainCard sx={{ mt: 2 }} content={false}>
              <ChartSkeleton />
            </MainCard>
          </Grid>
        </>
      )}

      {!showDashboardSkeleton && farms.length > 0 && snapshotStatus === 'ready' && (
        <>
          {summary.map((item) => (
            <Grid key={item.metric} size={{ xs: 12, sm: 6, lg: 4 }}>
              <AnalyticEcommerce title={item.label} count={item.value.toLocaleString()} extra={item.unit} />
            </Grid>
          ))}

          <Grid sx={{ display: { sm: 'none', md: 'block', lg: 'none' } }} size={{ md: 8 }} />

          <Grid size={{ xs: 12 }}>
            {trend && (
              <CropTrendCard
                labels={trend.labels}
                series={trend.series}
                selectedCrops={selectedCrops}
                onSelectedCropsChange={setSelectedCrops}
              />
            )}
          </Grid>

          <Grid size={{ xs: 12 }}>
            <MainCard sx={{ mt: 2 }} content={false}>
              <CropsTable rows={topCrops} province={provinceLabel} periodLabel={selectedTop10Period || 'Latest'} />
            </MainCard>
          </Grid>
        </>
      )}
    </Grid>
  );
}
