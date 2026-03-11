import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
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
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { InputLabel } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';

import MainCard from 'components/MainCard';
import AnalystPageHeader from './components/AnalystPageHeader';
import { getForecastSnapshotApi, getForecastSnapshotApiFresh } from 'model/cropTrendApi';
import { ALL_PROVINCES, extractProvinceOptions, formatPercent, getPayload } from './utils';

const RISK_KEYS = ['High', 'Risk-prone', 'Declining'];
const GROUP_ORDER = ['PALAY', 'CORN', 'OTHER'];

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

function getRiskPercentages(rows) {
  const total = rows.length;
  if (total <= 0) return { High: 0, 'Risk-prone': 0, Declining: 0 };
  const counts = {
    High: rows.filter((row) => String(row?.future_risk_label || '') === 'High').length,
    'Risk-prone': rows.filter((row) => String(row?.future_risk_label || '') === 'Risk-prone').length,
    Declining: rows.filter((row) => String(row?.future_risk_label || '') === 'Declining').length
  };
  return {
    High: (counts.High * 100) / total,
    'Risk-prone': (counts['Risk-prone'] * 100) / total,
    Declining: (counts.Declining * 100) / total
  };
}

function dominantRiskFromPercentages(percentages) {
  const ordered = RISK_KEYS.map((key) => ({ key, value: Number(percentages?.[key] || 0) })).sort((a, b) => b.value - a.value);
  return ordered[0]?.key || 'High';
}

export default function AnalystRiskAnalysis() {
  const [snapshot, setSnapshot] = useState(null);
  const [province, setProvince] = useState(ALL_PROVINCES);
  const [maxForecastHorizon, setMaxForecastHorizon] = useState(4);
  const [horizon, setHorizon] = useState(4);
  const [riskSearch, setRiskSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [riskGroupFilter, setRiskGroupFilter] = useState('ALL');
  const [riskPage, setRiskPage] = useState(0);
  const [riskRowsPerPage, setRiskRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [snapshotLastUpdatedAt, setSnapshotLastUpdatedAt] = useState(0);
  const [error, setError] = useState('');

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

        const maxH = Number(payload?.metadata?.horizon || 4);
        const safeMax = Number.isFinite(maxH) && maxH > 0 ? maxH : 4;
        setMaxForecastHorizon(safeMax);
        setHorizon((prev) => (prev >= 1 && prev <= safeMax ? prev : safeMax));

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
              const nextMax = Number(freshPayload?.metadata?.horizon || safeMax);
              const nextSafeMax = Number.isFinite(nextMax) && nextMax > 0 ? nextMax : safeMax;
              setMaxForecastHorizon(nextSafeMax);
              setHorizon((prev) => (prev >= 1 && prev <= nextSafeMax ? prev : nextSafeMax));
            }
            const freshUpdatedAt = Number(freshRes?.headers?.['x-client-cache-updated-at'] || 0);
            if (freshUpdatedAt > 0) setSnapshotLastUpdatedAt(freshUpdatedAt);
          } catch {
            // Keep stale snapshot rendered.
          } finally {
            if (mounted) setIsBackgroundRefreshing(false);
          }
        } else {
          setIsBackgroundRefreshing(false);
        }
      } catch (err) {
        if (!mounted) return;
        setSnapshot(null);
        setError(err?.response?.data?.error || 'Failed to load risk distribution.');
        setIsBackgroundRefreshing(false);
        setLoading(false);
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
    const maxStep = Number(horizon || 0);
    return Object.values(provincesMap).flatMap((provinceDoc) => {
      const rows = Array.isArray(provinceDoc?.rows) ? provinceDoc.rows : [];
      return rows.filter((row) => {
        const rowProvince = normalizeProvince(row?.province);
        if (province !== ALL_PROVINCES && rowProvince !== normalizeProvince(province)) return false;
        const step = parseStep(row?.forecast_horizon);
        return step != null && step <= maxStep;
      });
    });
  }, [snapshot, province, horizon]);

  const rows = useMemo(() => {
    const byGroup = new Map();
    scopedRows.forEach((row) => {
      const group = String(row?.crop_group || '').trim().toUpperCase();
      if (!group) return;
      if (!byGroup.has(group)) byGroup.set(group, []);
      byGroup.get(group).push(row);
    });

    const orderedGroups = [
      ...GROUP_ORDER.filter((group) => byGroup.has(group)),
      ...Array.from(byGroup.keys()).filter((group) => !GROUP_ORDER.includes(group)).sort((a, b) => a.localeCompare(b))
    ];

    return orderedGroups.map((group) => {
      const percentages = getRiskPercentages(byGroup.get(group) || []);
      return {
        group,
        highPct: Number(percentages.High || 0),
        riskPronePct: Number(percentages['Risk-prone'] || 0),
        decliningPct: Number(percentages.Declining || 0)
      };
    });
  }, [scopedRows]);

  const riskByCropRows = useMemo(() => {
    const byCrop = new Map();
    scopedRows.forEach((row) => {
      const crop = String(row?.crop || '').trim();
      if (!crop) return;
      if (!byCrop.has(crop)) byCrop.set(crop, []);
      byCrop.get(crop).push(row);
    });

    return Array.from(byCrop.entries())
      .map(([crop, cropRows]) => {
        const percentages = getRiskPercentages(cropRows);
        const dominant = dominantRiskFromPercentages(percentages);
        const groupCounts = new Map();
        cropRows.forEach((row) => {
          const group = String(row?.crop_group || '').trim().toUpperCase();
          if (!group) return;
          groupCounts.set(group, Number(groupCounts.get(group) || 0) + 1);
        });
        const cropGroup = Array.from(groupCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

        return {
          crop,
          crop_group: cropGroup,
          risk_percentages: {
            High: Number(percentages.High || 0),
            'Risk-prone': Number(percentages['Risk-prone'] || 0),
            Declining: Number(percentages.Declining || 0)
          },
          dominant_risk: dominant
        };
      })
      .sort((a, b) => a.crop.localeCompare(b.crop));
  }, [scopedRows]);

  const xLabels = useMemo(() => rows.map((row) => row.group), [rows]);
  const series = useMemo(
    () => [
      { data: rows.map((row) => row.highPct), label: 'High', color: '#52c41a' },
      { data: rows.map((row) => row.riskPronePct), label: 'Risk-prone', color: '#faad14' },
      { data: rows.map((row) => row.decliningPct), label: 'Declining', color: '#ff4d4f' }
    ],
    [rows]
  );

  const summary = useMemo(() => {
    if (rows.length === 0) {
      return { highestGroup: '-', highestRisk: '-', avgHigh: 0, avgRiskProne: 0, avgDeclining: 0 };
    }

    const byExposure = [...rows]
      .map((row) => ({
        ...row,
        exposureScore: row.decliningPct * 2 + row.riskPronePct * 1.5 + row.highPct
      }))
      .sort((a, b) => b.exposureScore - a.exposureScore)[0];

    const average = (selector) => rows.reduce((acc, row) => acc + selector(row), 0) / rows.length;

    const highestRiskType = [
      { label: 'High', value: byExposure.highPct },
      { label: 'Risk-prone', value: byExposure.riskPronePct },
      { label: 'Declining', value: byExposure.decliningPct }
    ].sort((a, b) => b.value - a.value)[0];

    return {
      highestGroup: byExposure.group,
      highestRisk: highestRiskType.label,
      avgHigh: average((row) => row.highPct),
      avgRiskProne: average((row) => row.riskPronePct),
      avgDeclining: average((row) => row.decliningPct)
    };
  }, [rows]);

  const horizonOptions = useMemo(() => Array.from({ length: maxForecastHorizon }, (_, idx) => idx + 1), [maxForecastHorizon]);

  const filteredRiskRows = useMemo(() => {
    const q = riskSearch.trim().toLowerCase();
    return riskByCropRows.filter((item) => {
      const matchesSearch = !q || String(item?.crop || '').toLowerCase().includes(q);
      const matchesFilter = riskFilter === 'ALL' || String(item?.dominant_risk || '') === riskFilter;
      const matchesGroup = riskGroupFilter === 'ALL' || String(item?.crop_group || '') === riskGroupFilter;
      return matchesSearch && matchesFilter && matchesGroup;
    });
  }, [riskByCropRows, riskSearch, riskFilter, riskGroupFilter]);

  const pagedRiskRows = useMemo(() => {
    const start = riskPage * riskRowsPerPage;
    return filteredRiskRows.slice(start, start + riskRowsPerPage);
  }, [filteredRiskRows, riskPage, riskRowsPerPage]);

  useEffect(() => {
    setRiskPage(0);
  }, [riskSearch, riskFilter, riskGroupFilter, province, horizon]);

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
          <AnalystPageHeader title="Risk Analysis" current="Risk Analysis" />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <InputLabel>Horizon:</InputLabel>
            <Select size="small" value={horizon} onChange={(event) => setHorizon(Number(event.target.value))} sx={{ minWidth: 120 }}>
              {horizonOptions.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}Q
                </MenuItem>
              ))}
            </Select>
            <InputLabel>Province:</InputLabel>
            <Select size="small" value={province} onChange={(event) => setProvince(event.target.value)} sx={{ minWidth: 220 }}>
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

      <Grid size={12}>
        <MainCard>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
            <Typography variant="subtitle1">Risk Summary</Typography>
            {loading ? (
              <Skeleton width={240} />
            ) : (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Chip size="small" variant="outlined" color="warning" label={`Most Exposed Group: ${summary.highestGroup}`} />
                <Chip size="small" variant="outlined" color="error" label={`Dominant Risk: ${summary.highestRisk}`} />
                <Chip size="small" variant="outlined" label={`Avg High: ${formatPercent(summary.avgHigh)}`} />
                <Chip size="small" variant="outlined" label={`Avg Risk-prone: ${formatPercent(summary.avgRiskProne)}`} />
                <Chip size="small" variant="outlined" label={`Avg Declining: ${formatPercent(summary.avgDeclining)}`} />
              </Stack>
            )}
          </Stack>
        </MainCard>
      </Grid>

      <Grid size={12}>
        <MainCard content={false}>
          <Stack sx={{ p: 2.5 }} spacing={1.5}>
            <Typography variant="h6">Risk Distribution by Crop Group (Percent)</Typography>
            <Typography variant="caption" color="text.secondary">
              Scope: {province} | Horizon: {horizon}Q
            </Typography>
            {loading ? (
              <Skeleton variant="rounded" height={360} />
            ) : rows.length === 0 ? (
              <Alert severity="info">No risk data available.</Alert>
            ) : (
              <BarChart
                height={360}
                xAxis={[{ scaleType: 'band', data: xLabels }]}
                yAxis={[{ valueFormatter: (value) => `${Number(value).toFixed(0)}%` }]}
                series={series}
                margin={{ top: 20, right: 20, bottom: 48, left: 64 }}
              />
            )}
            <Typography variant="caption" color="text.secondary">
              Risk-prone identifies crops with unstable yield behavior and elevated downside risk in the selected forecast window.
            </Typography>
          </Stack>
        </MainCard>
      </Grid>

      <Grid size={12}>
        <MainCard content={false}>
          <Stack sx={{ p: 2.5 }} spacing={1.25}>
            <Typography variant="h6">Per-Crop Risk Breakdown</Typography>
            <Typography variant="caption" color="text.secondary">
              Exact crop-level risk status for the selected scope.
            </Typography>
            {loading ? (
              <Skeleton variant="rounded" height={300} />
            ) : riskByCropRows.length === 0 ? (
              <Alert severity="info">No crop-level risk data available.</Alert>
            ) : (
              <>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} justifyContent="space-between">
                  <TextField
                    size="small"
                    label="Search Crop"
                    placeholder="Type crop name"
                    value={riskSearch}
                    onChange={(event) => setRiskSearch(event.target.value)}
                    sx={{ minWidth: { xs: '100%', md: 260 } }}
                  />
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
                    <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 220 } }}>
                      <InputLabel id="risk-group-filter-label">Crop Group</InputLabel>
                      <Select
                        labelId="risk-group-filter-label"
                        value={riskGroupFilter}
                        label="Crop Group"
                        onChange={(event) => setRiskGroupFilter(event.target.value)}
                      >
                        <MenuItem value="ALL">All</MenuItem>
                        <MenuItem value="PALAY">PALAY</MenuItem>
                        <MenuItem value="CORN">CORN</MenuItem>
                        <MenuItem value="OTHER">OTHER</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 220 } }}>
                      <InputLabel id="risk-dominant-filter-label">Dominant Risk</InputLabel>
                      <Select
                        labelId="risk-dominant-filter-label"
                        value={riskFilter}
                        label="Dominant Risk"
                        onChange={(event) => setRiskFilter(event.target.value)}
                      >
                        <MenuItem value="ALL">All</MenuItem>
                        <MenuItem value="High">High</MenuItem>
                        <MenuItem value="Risk-prone">Risk-prone</MenuItem>
                        <MenuItem value="Declining">Declining</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Stack>

                {filteredRiskRows.length === 0 ? (
                  <Alert severity="info">No rows match your search/filter.</Alert>
                ) : (
                  <>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Crop</TableCell>
                            <TableCell>Group</TableCell>
                            <TableCell align="right">High</TableCell>
                            <TableCell align="right">Risk-prone</TableCell>
                            <TableCell align="right">Declining</TableCell>
                            <TableCell>Dominant</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pagedRiskRows.map((item) => (
                            <TableRow key={item.crop}>
                              <TableCell>{item.crop}</TableCell>
                              <TableCell>{item?.crop_group || '-'}</TableCell>
                              <TableCell align="right">{formatPercent(item?.risk_percentages?.High || 0)}</TableCell>
                              <TableCell align="right">{formatPercent(item?.risk_percentages?.['Risk-prone'] || 0)}</TableCell>
                              <TableCell align="right">{formatPercent(item?.risk_percentages?.Declining || 0)}</TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={item?.dominant_risk || '-'}
                                  color={item?.dominant_risk === 'High' ? 'success' : item?.dominant_risk === 'Risk-prone' ? 'warning' : 'error'}
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <TablePagination
                      component="div"
                      count={filteredRiskRows.length}
                      page={riskPage}
                      onPageChange={(_, nextPage) => setRiskPage(nextPage)}
                      rowsPerPage={riskRowsPerPage}
                      onRowsPerPageChange={(event) => {
                        setRiskRowsPerPage(Number(event.target.value));
                        setRiskPage(0);
                      }}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                    />
                  </>
                )}
              </>
            )}
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}
