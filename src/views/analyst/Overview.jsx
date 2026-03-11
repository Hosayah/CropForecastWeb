import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import { InputLabel } from '@mui/material';
import Paper from '@mui/material/Paper';

import AnalystPageHeader from './components/AnalystPageHeader';
import AnalystSummaryCard from './components/AnalystSummaryCard';
import MainCard from 'components/MainCard';
import { getForecastSnapshotApi, getForecastSnapshotApiFresh } from 'model/cropTrendApi';
import { ALL_PROVINCES, extractProvinceOptions, getPayload, formatNumber } from './utils';
import CropTrendCard from 'sections/dashboard/default/CropTrendCard';

function normalizeProvince(value) {
  return String(value || '')
    .trim()
    .toUpperCase();
}

function parseStep(value) {
  const str = String(value || '').trim().toUpperCase();
  if (!str.startsWith('Q+')) return null;
  const n = Number(str.slice(2));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function buildTrendLabels(basePeriod, horizon) {
  const maxHorizon = Number(horizon || 0);
  if (!Number.isFinite(maxHorizon) || maxHorizon <= 0) return [];
  if (!basePeriod || !String(basePeriod).includes('Q')) {
    return Array.from({ length: maxHorizon }, (_, idx) => `Q+${idx + 1}`);
  }

  const [yearPart, quarterPart] = String(basePeriod).split('Q');
  const baseYear = Number(yearPart);
  const baseQuarter = Number(quarterPart);
  if (!Number.isFinite(baseYear) || !Number.isFinite(baseQuarter)) {
    return Array.from({ length: maxHorizon }, (_, idx) => `Q+${idx + 1}`);
  }

  return Array.from({ length: maxHorizon }, (_, idx) => {
    const q = baseQuarter + (idx + 1);
    const year = baseYear + Math.floor((q - 1) / 4);
    const quarter = ((q - 1) % 4) + 1;
    return `${year}Q${quarter}`;
  });
}

function sumByCropGroup(rows, group) {
  const target = String(group || '').toUpperCase();
  return rows
    .filter((row) => String(row?.crop_group || '').toUpperCase() === target)
    .reduce((sum, row) => sum + Number(row?.predicted_production || 0), 0);
}

export default function AnalystOverview() {
  const [province, setProvince] = useState(ALL_PROVINCES);
  const [snapshot, setSnapshot] = useState(null);
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [snapshotLastUpdatedAt, setSnapshotLastUpdatedAt] = useState(0);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSnapshot() {
      setLoading(true);
      setError('');
      try {
        const response = await getForecastSnapshotApi({ compact: 1 });
        if (!mounted) return;

        const payload = getPayload(response);
        setSnapshot(payload?.status === 'no_snapshot' ? null : payload);

        const cacheState = String(response?.headers?.['x-client-cache'] || '').toUpperCase();
        const updatedAt = Number(response?.headers?.['x-client-cache-updated-at'] || 0);
        if (updatedAt > 0) setSnapshotLastUpdatedAt(updatedAt);

        setLoading(false);

        if (cacheState === 'STALE') {
          setIsBackgroundRefreshing(true);
          try {
            const freshRes = await getForecastSnapshotApiFresh({ compact: 1 });
            if (!mounted) return;
            const freshPayload = getPayload(freshRes);
            if (freshPayload?.status !== 'no_snapshot') {
              setSnapshot(freshPayload);
            }
            const freshUpdatedAt = Number(freshRes?.headers?.['x-client-cache-updated-at'] || 0);
            if (freshUpdatedAt > 0) setSnapshotLastUpdatedAt(freshUpdatedAt);
          } catch {
            // Keep stale response rendered.
          } finally {
            if (mounted) setIsBackgroundRefreshing(false);
          }
        } else {
          setIsBackgroundRefreshing(false);
        }
      } catch (err) {
        if (!mounted) return;
        setSnapshot(null);
        setLoading(false);
        setIsBackgroundRefreshing(false);
        setError(err?.response?.data?.error || 'Failed to load overview analytics.');
      }
    }

    loadSnapshot();
    return () => {
      mounted = false;
    };
  }, []);

  const provinceOptions = useMemo(() => extractProvinceOptions({ data: snapshot || {} }), [snapshot]);

  useEffect(() => {
    if (!provinceOptions.includes(province)) {
      setProvince(ALL_PROVINCES);
    }
  }, [province, provinceOptions]);

  const scopedRows = useMemo(() => {
    const provincesMap = snapshot?.provinces || {};
    const maxHorizon = Number(snapshot?.metadata?.horizon || 0);

    return Object.values(provincesMap).flatMap((provinceDoc) => {
      const rows = Array.isArray(provinceDoc?.rows) ? provinceDoc.rows : [];
      return rows.filter((row) => {
        const rowProvince = normalizeProvince(row?.province);
        if (province !== ALL_PROVINCES && rowProvince !== normalizeProvince(province)) return false;
        const step = parseStep(row?.forecast_horizon);
        return step != null && (maxHorizon <= 0 || step <= maxHorizon);
      });
    });
  }, [snapshot, province]);

  const trend = useMemo(() => {
    const horizon = Number(snapshot?.metadata?.horizon || 0);
    const labels = buildTrendLabels(snapshot?.metadata?.basePeriod, horizon);
    const steps = Array.from({ length: Math.max(0, horizon) }, (_, idx) => idx + 1);

    const byCrop = new Map();
    scopedRows.forEach((row) => {
      const crop = String(row?.crop || '').trim();
      if (!crop) return;

      const step = parseStep(row?.forecast_horizon);
      if (step == null || step > horizon) return;

      if (!byCrop.has(crop)) byCrop.set(crop, new Map());
      const cropMap = byCrop.get(crop);
      cropMap.set(step, Number(cropMap.get(step) || 0) + Number(row?.predicted_production || 0));
    });

    const series = Array.from(byCrop.entries())
      .map(([crop, valuesByStep], index) => ({
        id: `${crop}-${index}`,
        label: crop,
        data: steps.map((step) => Number(valuesByStep.get(step) || 0))
      }))
      .sort((a, b) => (b.data[b.data.length - 1] || 0) - (a.data[a.data.length - 1] || 0));

    return { labels, series };
  }, [snapshot, scopedRows]);

  useEffect(() => {
    setSelectedCrops((prev) => {
      const available = trend.series.map((item) => item.label);
      const retained = prev.filter((item) => available.includes(item)).slice(0, 3);
      if (retained.length > 0) return retained;
      return available.slice(0, 3);
    });
  }, [trend.series]);

  const filteredTrend = useMemo(() => {
    if (!selectedCrops.length) return trend;
    const selectedSet = new Set(selectedCrops);
    return {
      labels: trend.labels,
      series: trend.series.filter((item) => selectedSet.has(item.label))
    };
  }, [trend, selectedCrops]);

  useEffect(() => {
    setPage(0);
  }, [province, rowsPerPage, trend.series.length]);

  const cards = useMemo(
    () => [
      {
        key: 'palay',
        title: 'Total Palay Predicted Yield',
        value: sumByCropGroup(scopedRows, 'PALAY'),
        subtitle: 'Metric tons'
      },
      {
        key: 'corn',
        title: 'Total Corn Predicted Yield',
        value: sumByCropGroup(scopedRows, 'CORN'),
        subtitle: 'Metric tons'
      },
      {
        key: 'other',
        title: 'Other Crops Predicted Yield',
        value: sumByCropGroup(scopedRows, 'OTHER'),
        subtitle: 'Metric tons'
      },
      {
        key: 'total',
        title: 'Total Predicted Yield',
        value: scopedRows.reduce((sum, row) => sum + Number(row?.predicted_production || 0), 0),
        subtitle: 'Metric tons'
      }
    ],
    [scopedRows]
  );

  const pagedSeriesRows = useMemo(() => {
    const start = page * rowsPerPage;
    return trend.series.slice(start, start + rowsPerPage);
  }, [trend.series, page, rowsPerPage]);

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
          <AnalystPageHeader title="Analyst Overview" current="Overview" />

          <Stack direction="row" spacing={1} alignItems="center">
            <InputLabel>Province:</InputLabel>
            <Select size="small" value={province} onChange={(event) => setProvince(event.target.value)} sx={{ minWidth: 180 }}>
              {provinceOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </Stack>
        {snapshotLastUpdatedAt > 0 ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Last updated: {new Date(snapshotLastUpdatedAt).toLocaleString()}
            {isBackgroundRefreshing ? ' (refreshing...)' : ''}
          </Typography>
        ) : null}
      </Grid>

      {error ? (
        <Grid size={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      ) : null}

      {cards.map((card) => (
        <Grid key={card.key} size={{ xs: 12, sm: 6, lg: 3 }}>
          <AnalystSummaryCard title={card.title} value={card.value} subtitle={card.subtitle} loading={loading} />
        </Grid>
      ))}

      <Grid size={12}>
        {!loading && trend.series.length > 0 ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1.5 }}>
            <InputLabel>Compare Crops:</InputLabel>
            <Select
              size="small"
              multiple
              value={selectedCrops}
              onChange={(event) => {
                const next = Array.isArray(event.target.value) ? event.target.value : [];
                setSelectedCrops(next.slice(0, 3));
              }}
              renderValue={(selected) => selected.join(' vs ')}
              sx={{ minWidth: { xs: '100%', sm: 260 } }}
            >
              {trend.series.map((item) => (
                <MenuItem key={`select-${item.id}`} value={item.label}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        ) : null}

        {loading ? (
          <MainCard content={false}>
            <Stack sx={{ p: 2.5 }} spacing={1.5}>
              <Typography variant="h6">Crop Trend</Typography>
              <Skeleton variant="rounded" height={360} />
            </Stack>
          </MainCard>
        ) : filteredTrend.series.length === 0 ? (
          <Alert severity="info">No trend data available for this selection.</Alert>
        ) : (
          <CropTrendCard
            labels={filteredTrend.labels}
            series={filteredTrend.series}
            selectedCrops={selectedCrops}
            onSelectedCropsChange={setSelectedCrops}
            maxSelectable={3}
            valueSuffix="MT"
            showCropSelector={false}
          />
        )}
      </Grid>

      <Grid size={12}>
        <MainCard content={false}>
          <Stack sx={{ p: 2.5 }} spacing={1.5}>
            <Typography variant="h6">Series Values</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Crop</TableCell>
                    {trend.labels.map((label) => (
                      <TableCell key={`quarter-${label}`} align="right">
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedSeriesRows.map((seriesRow) => (
                    <TableRow key={`series-${seriesRow.id}`}>
                      <TableCell>{seriesRow.label}</TableCell>
                      {(seriesRow.data || []).map((value, index) => (
                        <TableCell key={`${seriesRow.id}-${index}`} align="right">
                          {formatNumber(value)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {!loading && trend.series.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={Math.max(2, trend.labels.length + 1)}>
                        <Typography variant="body2" color="text.secondary">
                          No data found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={trend.series.length}
              page={page}
              onPageChange={(_, value) => setPage(value)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 20]}
            />
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}
