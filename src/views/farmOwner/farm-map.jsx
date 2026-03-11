import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';

import MainCard from 'components/MainCard';
import { useFarms } from 'viewModel/useFarms';
import { getForecastSnapshotApi, getForecastSnapshotApiFresh } from 'model/cropTrendApi';
import { PH_PROVINCE_GEOJSON } from 'data/phProvinceGeoJson';
import { PSGC_PROVINCE_BY_CODE } from 'data/psgcProvinceByCode';

const ALL_MY_PROVINCES = '__ALL_MY_PROVINCES__';
const HOME_FILTER_STORAGE_KEY = 'agrisense:home_province_filter';
const HOME_ALL_PROVINCES_OPTION = '__ALL_PROVINCES__';
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

function formatTimestamp(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return null;
  const d = new Date(n);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
}

function parseForecastStep(value) {
  const text = String(value || '').trim().toUpperCase();
  if (!text.startsWith('Q+')) return null;
  const step = Number(text.slice(2));
  return Number.isFinite(step) && step > 0 ? step : null;
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
  return (
    p.province ||
    p.PROVINCE ||
    p.prov ||
    p.prov_name ||
    p.PROV_NAME ||
    p.ADM2_EN ||
    p.adm2_en ||
    p.NAME_2 ||
    p.name_2 ||
    p.shapeName ||
    p.name ||
    ''
  );
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

function FarmProvinceMap({
  geoFeatures,
  selectedProvince,
  ownedProvinceSet,
  provinceRows,
  onSelectProvince
}) {
  const features = useMemo(() => geoFeatures || PH_PROVINCE_GEOJSON?.features || [], [geoFeatures]);
  const provinceGroups = useMemo(() => {
    const groups = new Map();
    features.forEach((feature) => {
      const provinceName = extractProvinceName(feature);
      const normalized = normalizeProvince(provinceName);
      if (!normalized) return;
      if (!groups.has(normalized)) {
        groups.set(normalized, { normalized, provinceName, features: [] });
      }
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
        const inScope = ownedProvinceSet.has(normalized);
        const row = provinceRows[normalized] || null;
        const dominant = dominantRisk(row?.riskPercentages || {});
        const fillColor = !inScope
          ? '#e5e7eb'
          : RISK_COLORS[dominant] || '#d9f7be';
        const isSelected = selectedProvince !== ALL_MY_PROVINCES && normalizeProvince(selectedProvince) === normalized;

        const tipContent = (
          <Stack spacing={0.25}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {provinceName}
            </Typography>
            <Typography variant="caption">Total yield: {formatNumber(row?.totalYield || 0)} MT</Typography>
            <Typography variant="caption">Dominant risk: {dominant || '-'}</Typography>
          </Stack>
        );

        const paths = group.features.flatMap((feature) => featureToSvgPaths(feature, bounds, viewportWidth, viewportHeight));
        return (
          <Tooltip key={`${groupIndex}-${normalized}`} title={tipContent} arrow>
            <g
              onClick={() => {
                if (!inScope) return;
                onSelectProvince(provinceName);
              }}
              style={{ cursor: inScope ? 'pointer' : 'not-allowed' }}
            >
              {paths.map((points, idx) => (
                <polygon
                  key={`${normalized}-${idx}`}
                  points={points}
                  fill={fillColor}
                  stroke="none"
                />
              ))}
              {isSelected &&
                paths.map((points, idx) => (
                  <polygon
                    key={`selected-${normalized}-${idx}`}
                    points={points}
                    fill="none"
                    stroke="#166534"
                    strokeWidth={0.9}
                  />
                ))}
            </g>
          </Tooltip>
        );
      })}
    </svg>
  );
}

export default function FarmMapPage() {
  const navigate = useNavigate();
  const { farms, loading: farmsLoading, error: farmsError } = useFarms();

  const [maxForecastHorizon, setMaxForecastHorizon] = useState(4);
  const [horizon, setHorizon] = useState(4);
  const [selectedProvince, setSelectedProvince] = useState(ALL_MY_PROVINCES);
  const [basePeriod, setBasePeriod] = useState(null);
  const [snapshotLoaded, setSnapshotLoaded] = useState(false);
  const [snapshotLastUpdatedAt, setSnapshotLastUpdatedAt] = useState(0);
  const [snapshotRefreshing, setSnapshotRefreshing] = useState(false);

  const [snapshotRows, setSnapshotRows] = useState([]);
  const [provinceRows, setProvinceRows] = useState({});
  const [geoFeatures, setGeoFeatures] = useState(PH_PROVINCE_GEOJSON?.features || []);

  const [mapLoading, setMapLoading] = useState(true);
  const [aiDisabled, setAiDisabled] = useState(false);
  const [error, setError] = useState('');

  const ownedProvinces = useMemo(() => {
    const map = new Map();
    farms.forEach((farm) => {
      const value = normalizeProvince(farm?.province);
      if (!value) return;
      if (!map.has(value)) map.set(value, String(farm?.province || '').trim() || value);
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [farms]);
  const ownedProvinceSet = useMemo(() => new Set(ownedProvinces.map((p) => p.value)), [ownedProvinces]);

  useEffect(() => {
    if (farmsLoading) return;
    if (ownedProvinces.length === 1) {
      setSelectedProvince(ownedProvinces[0].value);
      return;
    }
    if (
      selectedProvince !== ALL_MY_PROVINCES &&
      !ownedProvinces.some((province) => province.value === normalizeProvince(selectedProvince))
    ) {
      setSelectedProvince(ALL_MY_PROVINCES);
    }
  }, [farmsLoading, ownedProvinces, selectedProvince]);

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
        // Final fallback to bundled cartogram if local file is unavailable.
        if (mounted) setGeoFeatures(PH_PROVINCE_GEOJSON?.features || []);
      }
    }
    loadProvinceGeoJson();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadSnapshotMeta() {
      if (!snapshotRows.length) setMapLoading(true);
      setError('');
      setAiDisabled(false);
      try {
        const res = await getForecastSnapshotApi({ compact: 1 });
        const payload = res?.data || {};
        const cacheState = String(res?.headers?.['x-client-cache'] || '').toUpperCase();
        const updatedAt = Number(res?.headers?.['x-client-cache-updated-at'] || 0);
        const provincesMap = payload?.provinces || {};
        const rows = Object.values(provincesMap).flatMap((provinceDoc) => (Array.isArray(provinceDoc?.rows) ? provinceDoc.rows : []));
        if (mounted) {
          setSnapshotRows(rows);
          setBasePeriod(payload?.metadata?.basePeriod || null);
          const horizonFromSnapshot = Number(payload?.metadata?.horizon || 4);
          const safeHorizon = Number.isFinite(horizonFromSnapshot) && horizonFromSnapshot > 0 ? horizonFromSnapshot : 4;
          setMaxForecastHorizon(safeHorizon);
          setHorizon(safeHorizon);
          if (updatedAt > 0) setSnapshotLastUpdatedAt(updatedAt);
        }

        if (cacheState === 'STALE') {
          if (mounted) setSnapshotRefreshing(true);
          try {
            try {
              const freshRes = await getForecastSnapshotApiFresh({ compact: 1 });
              const freshPayload = freshRes?.data || {};
              const freshMap = freshPayload?.provinces || {};
              const freshRows = Object.values(freshMap).flatMap((provinceDoc) => (Array.isArray(provinceDoc?.rows) ? provinceDoc.rows : []));
              if (mounted) {
                setSnapshotRows(freshRows);
                setBasePeriod(freshPayload?.metadata?.basePeriod || null);
                const freshHorizonFromSnapshot = Number(freshPayload?.metadata?.horizon || 4);
                const freshSafeHorizon = Number.isFinite(freshHorizonFromSnapshot) && freshHorizonFromSnapshot > 0 ? freshHorizonFromSnapshot : 4;
                setMaxForecastHorizon(freshSafeHorizon);
                setHorizon((prev) => Math.min(prev, freshSafeHorizon));
                const freshUpdatedAt = Number(freshRes?.headers?.['x-client-cache-updated-at'] || 0);
                if (freshUpdatedAt > 0) setSnapshotLastUpdatedAt(freshUpdatedAt);
              }
            } catch {
              // Keep stale payload rendered if background refresh fails.
            }
          } finally {
            if (mounted) setSnapshotRefreshing(false);
          }
        }
      } catch (err) {
        if (mounted) {
          const status = err?.response?.status;
          if (status === 503) {
            setAiDisabled(true);
            setError('');
          } else {
            setError(err?.response?.data?.error || 'Failed to load forecast snapshot.');
          }
          setMaxForecastHorizon(4);
          setHorizon(4);
        }
      } finally {
        if (mounted) setSnapshotLoaded(true);
      }
    }
    loadSnapshotMeta();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (farmsLoading) return;
    if (ownedProvinces.length === 0) {
      setMapLoading(false);
      setProvinceRows({});
      return;
    }
    if (!snapshotLoaded) {
      setMapLoading(true);
      return;
    }

    const targetHorizon = `Q+${horizon}`;
    const grouped = new Map();

    snapshotRows.forEach((row) => {
      const province = normalizeProvince(row?.province);
      if (!province || !ownedProvinceSet.has(province)) return;
      if (String(row?.forecast_horizon || '') !== targetHorizon) return;
      if (!grouped.has(province)) grouped.set(province, []);
      grouped.get(province).push(row);
    });

    const nextProvinceRows = {};
    grouped.forEach((rows, province) => {
      nextProvinceRows[province] = {
        totalYield: rows.reduce((sum, row) => sum + Number(row?.predicted_production || 0), 0),
        riskPercentages: aggregateRiskPercentages(rows)
      };
    });

    setProvinceRows(nextProvinceRows);
    setMapLoading(false);
  }, [horizon, farmsLoading, ownedProvinces.length, ownedProvinceSet, snapshotLoaded, snapshotRows]);

  const lastUpdatedLabel = useMemo(() => formatTimestamp(snapshotLastUpdatedAt), [snapshotLastUpdatedAt]);

  const selectedProvinceLabel =
    selectedProvince === ALL_MY_PROVINCES
      ? 'All My Provinces'
      : ownedProvinces.find((province) => province.value === normalizeProvince(selectedProvince))?.label || selectedProvince;

  const selectedHorizonLabel = useMemo(() => horizonLabel(basePeriod, horizon), [basePeriod, horizon]);
  const allHorizonScopedRows = useMemo(() => {
    const activeProvince = selectedProvince === ALL_MY_PROVINCES ? null : normalizeProvince(selectedProvince);
    return snapshotRows.filter((row) => {
      const rowProvince = normalizeProvince(row?.province);
      const inScope = selectedProvince === ALL_MY_PROVINCES ? ownedProvinceSet.has(rowProvince) : rowProvince === activeProvince;
      if (!inScope) return false;
      const step = parseForecastStep(row?.forecast_horizon);
      return step != null && step <= horizon;
    });
  }, [snapshotRows, selectedProvince, horizon, ownedProvinceSet]);
  const totalPredictedYield = useMemo(
    () => allHorizonScopedRows.reduce((sum, row) => sum + Number(row?.predicted_production || 0), 0),
    [allHorizonScopedRows]
  );
  const currentYield = useMemo(() => {
    if (!snapshotRows.length) return 0;
    const targetHorizon = `Q+${horizon}`;
    const activeProvince = selectedProvince === ALL_MY_PROVINCES ? null : normalizeProvince(selectedProvince);
    return snapshotRows.reduce((sum, row) => {
      const rowProvince = normalizeProvince(row?.province);
      const inScope = selectedProvince === ALL_MY_PROVINCES ? ownedProvinceSet.has(rowProvince) : rowProvince === activeProvince;
      if (!inScope) return sum;
      if (String(row?.forecast_horizon || '') !== targetHorizon) return sum;
      return sum + Number(row?.predicted_production || 0);
    }, 0);
  }, [snapshotRows, selectedProvince, horizon, ownedProvinceSet]);
  const quarterScopedRows = useMemo(() => {
    const targetHorizon = `Q+${horizon}`;
    const activeProvince = selectedProvince === ALL_MY_PROVINCES ? null : normalizeProvince(selectedProvince);
    return snapshotRows.filter((row) => {
      const rowProvince = normalizeProvince(row?.province);
      const inScope = selectedProvince === ALL_MY_PROVINCES ? ownedProvinceSet.has(rowProvince) : rowProvince === activeProvince;
      if (!inScope) return false;
      return String(row?.forecast_horizon || '') === targetHorizon;
    });
  }, [snapshotRows, selectedProvince, horizon, ownedProvinceSet]);
  const riskPercentages = useMemo(() => aggregateRiskPercentages(quarterScopedRows), [quarterScopedRows]);
  const corn = useMemo(
    () =>
      quarterScopedRows
        .filter((row) => String(row?.crop_group || '').toUpperCase() === 'CORN')
        .reduce((sum, row) => sum + Number(row?.predicted_production || 0), 0),
    [quarterScopedRows]
  );
  const other = useMemo(
    () =>
      quarterScopedRows
        .filter((row) => String(row?.crop_group || '').toUpperCase() === 'OTHER')
        .reduce((sum, row) => sum + Number(row?.predicted_production || 0), 0),
    [quarterScopedRows]
  );
  const palayQuarter = useMemo(
    () =>
      quarterScopedRows
        .filter((row) => String(row?.crop_group || '').toUpperCase() === 'PALAY')
        .reduce((sum, row) => sum + Number(row?.predicted_production || 0), 0),
    [quarterScopedRows]
  );

  const topCrops = useMemo(() => {
    if (!snapshotRows.length) return [];
    const targetHorizon = `Q+${horizon}`;
    const activeProvince = selectedProvince === ALL_MY_PROVINCES ? null : normalizeProvince(selectedProvince);
    const byCrop = new Map();
    snapshotRows.forEach((row) => {
      const rowProvince = normalizeProvince(row?.province);
      const inScope = selectedProvince === ALL_MY_PROVINCES ? ownedProvinceSet.has(rowProvince) : rowProvince === activeProvince;
      if (!inScope) return;
      if (String(row?.forecast_horizon || '') !== targetHorizon) return;
      const crop = String(row?.crop || '').trim();
      if (!crop) return;
      const value = Number(row?.predicted_production || 0);
      byCrop.set(crop, (byCrop.get(crop) || 0) + value);
    });
    return Array.from(byCrop.entries())
      .map(([crop, value]) => ({ crop, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }, [snapshotRows, selectedProvince, horizon, ownedProvinceSet]);
  const detailsLoading = farmsLoading || mapLoading || !snapshotLoaded;

  const horizonOptions = useMemo(
    () => Array.from({ length: maxForecastHorizon }, (_, idx) => idx + 1),
    [maxForecastHorizon]
  );
  const showWarmupSkeleton = ownedProvinces.length > 0 && snapshotLoaded && snapshotRows.length === 0 && !error && !aiDisabled;

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Typography variant="h5">Farm Map</Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="forecast-horizon-label">Forecast Horizon</InputLabel>
              <Select
                labelId="forecast-horizon-label"
                value={horizon}
                label="Forecast Horizon"
                onChange={(e) => setHorizon(Number(e.target.value))}
              >
                {horizonOptions.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}Q
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Chip
              variant="outlined"
              color="primary"
              label={selectedProvince === ALL_MY_PROVINCES ? 'All My Provinces' : selectedProvinceLabel}
              onClick={selectedProvince === ALL_MY_PROVINCES ? undefined : () => setSelectedProvince(ALL_MY_PROVINCES)}
            />
          </Stack>
        </Stack>
        {lastUpdatedLabel && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
            Last updated: {lastUpdatedLabel}
            {snapshotRefreshing ? ' (refreshing...)' : ''}
          </Typography>
        )}
      </Grid>

      {aiDisabled && (
        <Grid size={12}>
          <Alert severity="warning">Forecast temporarily unavailable</Alert>
        </Grid>
      )}

      {farmsError && (
        <Grid size={12}>
          <Alert severity="error">Failed to load farms.</Alert>
        </Grid>
      )}

      {error && (
        <Grid size={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      )}

      {!farmsLoading && ownedProvinces.length === 0 && (
        <Grid size={12}>
          <MainCard>
            <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ minHeight: 240 }}>
              <Typography variant="h6">Add a farm to view your forecast map</Typography>
              <Button variant="contained" onClick={() => navigate('/farmOwner/farm-management')}>
                Add Farm
              </Button>
            </Stack>
          </MainCard>
        </Grid>
      )}

      {(farmsLoading || ownedProvinces.length > 0) && (
        <>
          <Grid size={{ xs: 12, lg: 7 }}>
            <MainCard content={false}>
              <CardContent>
                {mapLoading || showWarmupSkeleton ? (
                  <Skeleton variant="rounded" height={430} />
                ) : (
                  <FarmProvinceMap
                    geoFeatures={geoFeatures}
                    selectedProvince={selectedProvince}
                    ownedProvinceSet={ownedProvinceSet}
                    provinceRows={provinceRows}
                    onSelectProvince={(province) => {
                      setSelectedProvince(normalizeProvince(province));
                    }}
                  />
                )}

                <Divider sx={{ my: 1.5 }} />
                <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
                  <Chip size="small" label="Green = High" sx={{ bgcolor: '#f6ffed', color: '#237804' }} />
                  <Chip size="small" label="Yellow = Risk-prone" sx={{ bgcolor: '#fffbe6', color: '#ad6800' }} />
                  <Chip size="small" label="Red = Declining" sx={{ bgcolor: '#fff1f0', color: '#a8071a' }} />
                  <Chip size="small" label="Grey = Not in scope" sx={{ bgcolor: '#f0f0f0', color: '#595959' }} />
                </Stack>
              </CardContent>
            </MainCard>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <Card sx={{ boxShadow: (theme) => theme.customShadows?.z1 }}>
              <CardContent>
                <Stack spacing={1.25}>
                  <Typography variant="h6">Details</Typography>
                  {detailsLoading || showWarmupSkeleton ? (
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

                      <Button
                        variant="outlined"
                        sx={{ mt: 1 }}
                        onClick={() => {
                          const value = selectedProvince === ALL_MY_PROVINCES ? HOME_ALL_PROVINCES_OPTION : normalizeProvince(selectedProvince);
                          localStorage.setItem(HOME_FILTER_STORAGE_KEY, value);
                          navigate('/farmOwner/dashboard');
                        }}
                      >
                        View Detailed Trends
                      </Button>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  );
}
