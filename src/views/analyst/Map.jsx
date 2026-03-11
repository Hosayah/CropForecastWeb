import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import MainCard from 'components/MainCard';
import AnalystPageHeader from './components/AnalystPageHeader';
import { analyticsRiskApi, analyticsSummaryApi, getForecastSnapshotApi } from 'model/cropTrendApi';
import { PH_PROVINCE_GEOJSON } from 'data/phProvinceGeoJson';
import { PSGC_PROVINCE_BY_CODE } from 'data/psgcProvinceByCode';
import { getPayload } from './utils';

const ALL_PROVINCES = 'ALL';
const PH_PROVINCES_GEOJSON_LOCAL_URL = '/philippines-provinces.geojson';

const RISK_COLORS = {
  High: '#52c41a',
  'Risk-prone': '#faad14',
  Declining: '#ff4d4f'
};

const PROVINCE_ALIASES = {
  COTABATO: 'NORTH COTABATO',
  'COTABATO (NORTH COTABATO)': 'NORTH COTABATO',
  'COMPOSTELA VALLEY': 'DAVAO DE ORO',
  'DAVAO DE ORO (COMPOSTELA VALLEY)': 'DAVAO DE ORO',
  'WESTERN SAMAR': 'SAMAR',
  'DAVAO OCC.': 'DAVAO OCCIDENTAL',
  'DAVAO OR.': 'DAVAO ORIENTAL'
};

function normalizeProvince(value) {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
  return PROVINCE_ALIASES[normalized] || normalized;
}

function formatNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0';
}

function horizonLabel(basePeriod, horizon) {
  if (!basePeriod || !String(basePeriod).includes('Q')) return `Q+${horizon}`;
  const [yearPart, quarterPart] = String(basePeriod).split('Q');
  const baseYear = Number(yearPart);
  const baseQuarter = Number(quarterPart);
  if (!Number.isFinite(baseYear) || !Number.isFinite(baseQuarter)) return `Q+${horizon}`;
  const q = baseQuarter + horizon;
  const year = baseYear + Math.floor((q - 1) / 4);
  const quarter = ((q - 1) % 4) + 1;
  return `${year}Q${quarter}`;
}

function aggregateRiskPercentages(rows) {
  const total = { High: 0, 'Risk-prone': 0, Declining: 0 };
  rows.forEach((row) => {
    const risk = String(row?.future_risk_label || '');
    if (Object.prototype.hasOwnProperty.call(total, risk)) total[risk] += 1;
  });
  const sum = total.High + total['Risk-prone'] + total.Declining;
  if (sum <= 0) return { High: 0, 'Risk-prone': 0, Declining: 0 };
  return {
    High: Number(((total.High / sum) * 100).toFixed(2)),
    'Risk-prone': Number(((total['Risk-prone'] / sum) * 100).toFixed(2)),
    Declining: Number(((total.Declining / sum) * 100).toFixed(2))
  };
}

function aggregateRiskTotals(riskPayload) {
  const counts = riskPayload?.risk_counts || {};
  const totals = { High: 0, 'Risk-prone': 0, Declining: 0 };
  Object.values(counts).forEach((group) => {
    totals.High += Number(group?.High || 0);
    totals['Risk-prone'] += Number(group?.['Risk-prone'] || 0);
    totals.Declining += Number(group?.Declining || 0);
  });

  const grandTotal = totals.High + totals['Risk-prone'] + totals.Declining;
  if (grandTotal <= 0) return { High: 0, 'Risk-prone': 0, Declining: 0 };
  return {
    High: Number(((totals.High / grandTotal) * 100).toFixed(2)),
    'Risk-prone': Number(((totals['Risk-prone'] / grandTotal) * 100).toFixed(2)),
    Declining: Number(((totals.Declining / grandTotal) * 100).toFixed(2))
  };
}

function dominantRisk(riskPercentages) {
  const entries = Object.entries(riskPercentages || {});
  if (!entries.length) return null;
  entries.sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
  return entries[0][0];
}

function extractProvinceName(feature) {
  const p = feature?.properties || {};
  const adm2CodeRaw = p.adm2_psgc ?? p.ADM2_PSGC ?? p.adm2Psgc;
  const adm2Code = String(adm2CodeRaw ?? '').replace(/\.0+$/, '').trim();
  const adm2Code10 = adm2Code.padStart(10, '0');
  const adm2Code9 = adm2Code.padStart(9, '0');
  const byCode = PSGC_PROVINCE_BY_CODE[adm2Code10] || PSGC_PROVINCE_BY_CODE[adm2Code9];
  if (byCode) return byCode;
  return p.province || p.PROVINCE || p.prov || p.prov_name || p.PROV_NAME || p.ADM2_EN || p.adm2_en || p.NAME_2 || p.name_2 || p.shapeName || p.name || '';
}

function computeLonLatBounds(features) {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  const collect = (coordinates) => {
    (coordinates || []).forEach((point) => {
      if (!Array.isArray(point) || point.length < 2) return;
      const lon = Number(point[0]);
      const lat = Number(point[1]);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });
  };

  features.forEach((feature) => {
    const geometry = feature?.geometry || {};
    if (geometry.type === 'Polygon') {
      (geometry.coordinates || []).forEach((ring) => collect(ring));
    }
    if (geometry.type === 'MultiPolygon') {
      (geometry.coordinates || []).forEach((polygon) => {
        (polygon || []).forEach((ring) => collect(ring));
      });
    }
  });

  if (!Number.isFinite(minLon) || !Number.isFinite(maxLon) || !Number.isFinite(minLat) || !Number.isFinite(maxLat)) {
    return { minLon: 0, maxLon: 1, minLat: 0, maxLat: 1 };
  }
  return { minLon, maxLon, minLat, maxLat };
}

function projectPoint(lon, lat, bounds, width, height, padding = 14) {
  const spanLon = Math.max(0.0001, bounds.maxLon - bounds.minLon);
  const spanLat = Math.max(0.0001, bounds.maxLat - bounds.minLat);
  const drawableW = width - padding * 2;
  const drawableH = height - padding * 2;

  const x = padding + ((lon - bounds.minLon) / spanLon) * drawableW;
  const y = padding + ((bounds.maxLat - lat) / spanLat) * drawableH;
  return [x, y];
}

function polygonPoints(coords, bounds, width, height) {
  return (coords || [])
    .map((pair) => {
      const lon = Number(pair?.[0]);
      const lat = Number(pair?.[1]);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
      const [x, y] = projectPoint(lon, lat, bounds, width, height);
      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(' ');
}

function featureToSvgPaths(feature, bounds, width, height) {
  const geometry = feature?.geometry || {};
  if (geometry.type === 'Polygon') {
    return (geometry.coordinates || []).map((ring) => polygonPoints(ring, bounds, width, height)).filter(Boolean);
  }
  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates || [])
      .flatMap((polygon) => (polygon || []).map((ring) => polygonPoints(ring, bounds, width, height)))
      .filter(Boolean);
  }
  return [];
}

function ProvinceMap({ geoFeatures, selectedProvince, provinceRows, onSelectProvince }) {
  const features = useMemo(() => geoFeatures || PH_PROVINCE_GEOJSON?.features || [], [geoFeatures]);
  const provinceGroups = useMemo(() => {
    const groups = new Map();
    features.forEach((feature) => {
      const provinceName = extractProvinceName(feature);
      const normalized = normalizeProvince(provinceName);
      if (!normalized) return;
      if (!groups.has(normalized)) groups.set(normalized, { normalized, provinceName, features: [] });
      groups.get(normalized).features.push(feature);
    });
    return Array.from(groups.values());
  }, [features]);

  const viewportWidth = 380;
  const viewportHeight = 445;
  const bounds = useMemo(() => computeLonLatBounds(features), [features]);

  return (
    <svg viewBox={`0 0 ${viewportWidth} ${viewportHeight}`} width="100%" role="img" aria-label="Philippines province forecast map">
      {provinceGroups.map((group, groupIndex) => {
        const provinceName = group.provinceName;
        const normalized = group.normalized;
        const row = provinceRows[normalized] || null;
        const dominant = dominantRisk(row?.riskPercentages || {});
        const fillColor = row ? RISK_COLORS[dominant] || '#d9f7be' : '#e5e7eb';
        const isSelected = selectedProvince !== ALL_PROVINCES && normalizeProvince(selectedProvince) === normalized;

        const tipContent = (
          <Stack spacing={0.25}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>{provinceName}</Typography>
            <Typography variant="caption">Total yield: {formatNumber(row?.totalYield || 0)} MT</Typography>
            <Typography variant="caption">Dominant risk: {dominant || '-'}</Typography>
          </Stack>
        );

        const paths = group.features.flatMap((feature) => featureToSvgPaths(feature, bounds, viewportWidth, viewportHeight));

        return (
          <Tooltip key={`${groupIndex}-${normalized}`} title={tipContent} arrow>
            <g onClick={() => row && onSelectProvince(normalized)} style={{ cursor: row ? 'pointer' : 'default' }}>
              {paths.map((points, idx) => (
                <polygon key={`${normalized}-${idx}`} points={points} fill={fillColor} stroke="none" />
              ))}
              {isSelected &&
                paths.map((points, idx) => (
                  <polygon key={`selected-${normalized}-${idx}`} points={points} fill="none" stroke="#166534" strokeWidth={0.9} />
                ))}
            </g>
          </Tooltip>
        );
      })}
    </svg>
  );
}

export default function AnalystMap() {
  const navigate = useNavigate();
  const [maxForecastHorizon, setMaxForecastHorizon] = useState(4);
  const [horizon, setHorizon] = useState(4);
  const [selectedProvince, setSelectedProvince] = useState(ALL_PROVINCES);
  const [basePeriod, setBasePeriod] = useState(null);
  const [snapshotRows, setSnapshotRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [risk, setRisk] = useState(null);
  const [geoFeatures, setGeoFeatures] = useState(PH_PROVINCE_GEOJSON?.features || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadSnapshot() {
      setLoading(true);
      setError('');
      try {
        const response = await getForecastSnapshotApi({ compact: 1 });
        const payload = getPayload(response);
        const rows = Object.values(payload?.provinces || {}).flatMap((provinceDoc) => (Array.isArray(provinceDoc?.rows) ? provinceDoc.rows : []));
        if (!mounted) return;
        setSnapshotRows(rows);
        setBasePeriod(payload?.metadata?.basePeriod || null);
        const maxH = Number(payload?.metadata?.horizon || 4);
        const safeMax = Number.isFinite(maxH) && maxH > 0 ? maxH : 4;
        setMaxForecastHorizon(safeMax);
        setHorizon(safeMax);
      } catch (err) {
        if (!mounted) return;
        setSnapshotRows([]);
        setError(err?.response?.data?.error || 'Failed to load map analytics.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSnapshot();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadSelectedAnalytics() {
      setLoading(true);
      setError('');
      try {
        const [summaryRes, riskRes] = await Promise.all([
          analyticsSummaryApi({ horizon, province: selectedProvince }),
          analyticsRiskApi({ horizon, province: selectedProvince })
        ]);
        if (!mounted) return;
        setSummary(summaryRes?.data || null);
        setRisk(riskRes?.data || null);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error || 'Failed to load map analytics.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSelectedAnalytics();
    return () => {
      mounted = false;
    };
  }, [horizon, selectedProvince]);

  useEffect(() => {
    let mounted = true;
    async function loadProvinceGeoJson() {
      try {
        const localRes = await fetch(PH_PROVINCES_GEOJSON_LOCAL_URL);
        if (!localRes.ok) throw new Error('Local GeoJSON fetch failed');
        const localPayload = await localRes.json();
        if (!mounted) return;
        const localFeatures = Array.isArray(localPayload?.features) ? localPayload.features : [];
        if (localFeatures.length > 0) {
          setGeoFeatures(localFeatures);
          return;
        }
        throw new Error('Local GeoJSON payload empty');
      } catch {
        if (mounted) setGeoFeatures(PH_PROVINCE_GEOJSON?.features || []);
      }
    }
    loadProvinceGeoJson();
    return () => {
      mounted = false;
    };
  }, []);

  const horizonOptions = useMemo(() => Array.from({ length: maxForecastHorizon }, (_, idx) => idx + 1), [maxForecastHorizon]);

  const quarterRows = useMemo(() => {
    const target = `Q+${horizon}`;
    return snapshotRows.filter((row) => String(row?.forecast_horizon || '') === target);
  }, [snapshotRows, horizon]);

  const provinceRows = useMemo(() => {
    const grouped = new Map();
    quarterRows.forEach((row) => {
      const province = normalizeProvince(row?.province);
      if (!province) return;
      if (!grouped.has(province)) grouped.set(province, []);
      grouped.get(province).push(row);
    });

    const out = {};
    grouped.forEach((rows, province) => {
      out[province] = {
        totalYield: rows.reduce((sum, row) => sum + Number(row?.predicted_production || 0), 0),
        riskPercentages: aggregateRiskPercentages(rows)
      };
    });

    return out;
  }, [quarterRows]);

  const provinceOptions = useMemo(() => [ALL_PROVINCES, ...Object.keys(provinceRows).sort((a, b) => a.localeCompare(b))], [provinceRows]);

  const selectedRows = useMemo(() => {
    if (selectedProvince === ALL_PROVINCES) return quarterRows;
    const target = normalizeProvince(selectedProvince);
    return quarterRows.filter((row) => normalizeProvince(row?.province) === target);
  }, [quarterRows, selectedProvince]);

  const selectedHorizonLabel = useMemo(() => horizonLabel(basePeriod, horizon), [basePeriod, horizon]);
  const selectedProvinceLabel = selectedProvince === ALL_PROVINCES ? 'All Provinces' : selectedProvince;
  const totalPredictedYield = Number(summary?.total_predicted_yield || 0);
  const currentYield = useMemo(
    () => selectedRows.reduce((sum, row) => sum + Number(row?.predicted_production || 0), 0),
    [selectedRows]
  );
  const riskPercentages = useMemo(() => aggregateRiskTotals(risk), [risk]);
  const palayQuarter = useMemo(
    () =>
      selectedRows
        .filter((row) => String(row?.crop_group || '').toUpperCase() === 'PALAY')
        .reduce((sum, row) => sum + Number(row?.predicted_production || 0), 0),
    [selectedRows]
  );
  const corn = useMemo(
    () =>
      selectedRows
        .filter((row) => String(row?.crop_group || '').toUpperCase() === 'CORN')
        .reduce((sum, row) => sum + Number(row?.predicted_production || 0), 0),
    [selectedRows]
  );
  const other = useMemo(
    () =>
      selectedRows
        .filter((row) => String(row?.crop_group || '').toUpperCase() === 'OTHER')
        .reduce((sum, row) => sum + Number(row?.predicted_production || 0), 0),
    [selectedRows]
  );
  const topCrops = useMemo(() => {
    const byCrop = new Map();
    selectedRows.forEach((row) => {
      const crop = String(row?.crop || '').trim();
      if (!crop) return;
      const value = Number(row?.predicted_production || 0);
      byCrop.set(crop, (byCrop.get(crop) || 0) + value);
    });
    return Array.from(byCrop.entries())
      .map(([crop, value]) => ({ crop, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }, [selectedRows]);

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
          <AnalystPageHeader title="Farm Map" current="Map" />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel id="analyst-map-horizon-label">Horizon</InputLabel>
              <Select
                labelId="analyst-map-horizon-label"
                value={horizon}
                label="Horizon"
                onChange={(event) => setHorizon(Number(event.target.value))}
              >
                {horizonOptions.map((value) => (
                  <MenuItem key={value} value={value}>{value}Q</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="analyst-map-province-label">Province</InputLabel>
              <Select
                labelId="analyst-map-province-label"
                value={selectedProvince}
                label="Province"
                onChange={(event) => setSelectedProvince(event.target.value)}
              >
                {provinceOptions.map((province) => (
                  <MenuItem key={province} value={province}>{province}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Grid>

      {error ? (
        <Grid size={12}><Alert severity="error">{error}</Alert></Grid>
      ) : null}

      <Grid size={{ xs: 12, lg: 7 }}>
        <MainCard content={false}>
          <CardContent>
            {loading ? (
              <Skeleton variant="rounded" height={430} />
            ) : (
              <ProvinceMap
                geoFeatures={geoFeatures}
                selectedProvince={selectedProvince}
                provinceRows={provinceRows}
                onSelectProvince={setSelectedProvince}
              />
            )}
            <Divider sx={{ my: 1.5 }} />
            <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
              <Chip size="small" label="Green = High" sx={{ bgcolor: '#f6ffed', color: '#237804' }} />
              <Chip size="small" label="Yellow = Risk-prone" sx={{ bgcolor: '#fffbe6', color: '#ad6800' }} />
              <Chip size="small" label="Red = Declining" sx={{ bgcolor: '#fff1f0', color: '#a8071a' }} />
              <Chip size="small" label="Grey = No data" sx={{ bgcolor: '#f0f0f0', color: '#595959' }} />
            </Stack>
          </CardContent>
        </MainCard>
      </Grid>

      <Grid size={{ xs: 12, lg: 5 }}>
        <Card sx={{ boxShadow: (theme) => theme.customShadows?.z1 }}>
          <CardContent>
            <Stack spacing={1.25}>
              <Typography variant="h6">Details</Typography>
              {loading ? (
                <>
                  <Skeleton />
                  <Skeleton />
                  <Skeleton />
                </>
              ) : (
                <>
                  <Typography variant="body2">
                    <strong>Province:</strong> {selectedProvinceLabel}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Forecast Horizon:</strong> {selectedHorizonLabel}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total Predicted Yield:</strong> {formatNumber(totalPredictedYield)} metric tons
                  </Typography>
                  <Typography variant="body2">
                    <strong>Current Yield ({selectedHorizonLabel}):</strong> {formatNumber(currentYield)} metric tons
                  </Typography>
                  <Typography variant="body2">Palay: {formatNumber(palayQuarter)}</Typography>
                  <Typography variant="body2">Corn: {formatNumber(corn)}</Typography>
                  <Typography variant="body2">Other: {formatNumber(other)}</Typography>

                  <Divider />
                  <Typography variant="subtitle2">Risk Breakdown (%)</Typography>
                  <Typography variant="body2">High: {formatNumber(riskPercentages.High)}%</Typography>
                  <Typography variant="body2">Risk-prone: {formatNumber(riskPercentages['Risk-prone'])}%</Typography>
                  <Typography variant="body2">Declining: {formatNumber(riskPercentages.Declining)}%</Typography>

                  <Divider />
                  <Typography variant="subtitle2">Top Crops ({selectedHorizonLabel})</Typography>
                  {topCrops.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No crop trend data for this selection.
                    </Typography>
                  )}
                  {topCrops.map((crop) => (
                    <Typography key={crop.crop} variant="body2">
                      {crop.crop} - {formatNumber(crop.value)} MT
                    </Typography>
                  ))}

                  <Button variant="outlined" sx={{ mt: 1 }} onClick={() => navigate('/analyst/overview')}>
                    View Detailed Trends
                  </Button>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
