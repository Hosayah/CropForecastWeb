import { useEffect, useState } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';

import MainCard from 'components/MainCard';
import CropSummary from 'components/cards/statistics/CropSummary';
import formatRelativeTime from 'utils/helper/formatDateTime';

import { useCropRecommendation } from 'viewModel/useCropRecommendation';
import { useFarms } from 'viewModel/useFarms';
import { usePreferences } from 'hooks/usePreferences';
import {
  analyticsAvailableCropsApi,
  analyticsAvailableCropsApiFresh,
  forecastSnapshotCropOutlookApi,
  forecastSnapshotCropOutlookApiFresh,
  getForecastSnapshotMetadataApi
} from 'model/cropTrendApi';

const RECOMMENDATION_FARM_STORAGE_KEY = 'agrisense:recommendation_farm_id';
const OUTLOOK_PAGE_SIZE = 10;

function normalizeRiskLabel(value) {
  return String(value || '')
    .trim()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .toUpperCase();
}

function riskChipColor(value) {
  const normalized = normalizeRiskLabel(value);
  if (normalized === 'HIGH') return 'success';
  if (normalized === 'RISK-PRONE') return 'warning';
  if (normalized === 'DECLINING') return 'error';
  return 'default';
}

function CropRecommendationPageSkeleton() {
  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Skeleton variant="text" width={220} height={40} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Skeleton variant="rounded" width={220} height={40} />
            <Skeleton variant="rounded" width={140} height={40} />
            <Skeleton variant="rounded" width={120} height={40} />
          </Stack>
        </Stack>
      </Grid>
      {Array.from({ length: 4 }).map((_, idx) => (
        <Grid key={idx} size={{ xs: 12, sm: 6, lg: 3 }}>
          <MainCard>
            <Skeleton variant="text" width="55%" height={24} />
            <Skeleton variant="text" width="70%" height={36} />
            <Skeleton variant="text" width="50%" height={20} />
          </MainCard>
        </Grid>
      ))}
    </Grid>
  );
}

function OutlookRankingSkeleton() {
  return (
    <Grid container rowSpacing={2}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <Grid key={idx} size={12}>
          <Card variant="outlined" sx={{ p: 1.25 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Skeleton variant="rounded" width={28} height={24} />
                <Stack spacing={0.5}>
                  <Skeleton variant="text" width={180} height={22} />
                  <Skeleton variant="text" width={120} height={18} />
                </Stack>
              </Stack>
              <Stack alignItems="flex-end" spacing={0.5}>
                <Skeleton variant="text" width={100} height={22} />
                <Skeleton variant="rounded" width={72} height={24} />
              </Stack>
            </Stack>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function RankedCardList({ title, items, secondaryLabel = 'Latest forecast', highlightProvince }) {
  return (
    <MainCard title={title}>
      <Stack spacing={1.25}>
        {items.map((item, idx) => {
          const highlighted = highlightProvince && String(item.province || '').toUpperCase() === String(highlightProvince).toUpperCase();
          return (
            <Card
              key={`${item.crop || item.province}-${idx}`}
              variant="outlined"
              sx={{
                p: 1.25,
                borderColor: highlighted ? 'success.main' : undefined,
                bgcolor: 'grey.50'
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                  <Chip size="small" label={idx + 1} color="primary" variant="outlined" />
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap title={item.crop || item.province}>
                      {item.crop || item.province}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.detail || secondaryLabel}
                    </Typography>
                  </Stack>
                </Stack>
                <Stack alignItems="flex-end" spacing={0.25} sx={{ flexShrink: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {item.valueText}
                  </Typography>
                  {item.risk ? <Chip size="small" label={item.risk} color={riskChipColor(item.risk)} variant="outlined" /> : null}
                </Stack>
              </Stack>
            </Card>
          );
        })}
      </Stack>
    </MainCard>
  );
}

export default function CropRecommendationPage() {
  const [tab, setTab] = useState('recommendation');
  const [season, setSeason] = useState('2026Q1');
  const prefs = usePreferences();
  const { farms = [], loading: farmsLoading, defaultFarmId } = useFarms();
  const [selectedFarmId, setSelectedFarmId] = useState(() => prefs.getString(RECOMMENDATION_FARM_STORAGE_KEY, '') || '');

  const [outlookCropOptions, setOutlookCropOptions] = useState([]);
  const [outlookCrop, setOutlookCrop] = useState('');
  const [outlookHorizon, setOutlookHorizon] = useState(1);
  const [outlookMaxHorizon, setOutlookMaxHorizon] = useState(4);
  const [outlookRows, setOutlookRows] = useState([]);
  const [outlookTotal, setOutlookTotal] = useState(0);
  const [outlookPage, setOutlookPage] = useState(1);
  const [outlookHasMore, setOutlookHasMore] = useState(false);
  const [outlookLoading, setOutlookLoading] = useState(false);
  const [outlookRefreshing, setOutlookRefreshing] = useState(false);
  const [outlookError, setOutlookError] = useState('');

  const hasNoFarms = farms.length === 0;
  const selectedFarm = farms.find((farm) => String(farm.id) === String(selectedFarmId));
  const selectedFarmProvince = selectedFarm?.province || '';
  const isFarmSelectionPending = !farmsLoading && farms.length > 0 && !selectedFarmId;

  useEffect(() => {
    if (farmsLoading) return;
    if (farms.length === 0) {
      setSelectedFarmId('');
      prefs.remove(RECOMMENDATION_FARM_STORAGE_KEY);
      return;
    }

    const exists = farms.some((farm) => String(farm.id) === String(selectedFarmId));
    if (!exists) {
      const fallback = defaultFarmId || String(farms[0].id);
      setSelectedFarmId(fallback);
      prefs.setString(RECOMMENDATION_FARM_STORAGE_KEY, fallback);
    }
  }, [farmsLoading, farms, selectedFarmId, defaultFarmId, prefs]);

  const { recommendation, loading, generating, isBackgroundRefreshing, lastUpdatedAt, error, generate } = useCropRecommendation({
    farmId: selectedFarmId,
    season
  });

  useEffect(() => {
    let cancelled = false;
    async function bootstrapOutlook() {
      if (tab !== 'outlook' || hasNoFarms || !selectedFarmId) return;
      try {
        if (outlookCropOptions.length === 0 && outlookRows.length === 0) {
          setOutlookLoading(true);
        }
        setOutlookError('');
        const [snapshotRes, cropsRes] = await Promise.all([
          getForecastSnapshotMetadataApi({ province: selectedFarmProvince || undefined }),
          analyticsAvailableCropsApi({ province: selectedFarmProvince || undefined, horizon: outlookHorizon })
        ]);
        if (cancelled) return;
        const maxH = Number(snapshotRes?.data?.metadata?.horizon || 4);
        const safeMax = Number.isFinite(maxH) && maxH > 0 ? maxH : 4;
        setOutlookMaxHorizon(safeMax);
        if (outlookHorizon > safeMax) setOutlookHorizon(safeMax);
        const safeHorizon = Math.min(outlookHorizon, safeMax);

        const crops = Array.isArray(cropsRes?.data?.crops) ? cropsRes.data.crops : [];
        setOutlookCropOptions(crops);
        if (!outlookCrop && crops.length > 0) {
          setOutlookCrop(crops[0]);
        } else if (outlookCrop && !crops.includes(outlookCrop)) {
          setOutlookCrop(crops[0] || '');
        }
        const cropCacheState = String(cropsRes?.headers?.['x-client-cache'] || '').toUpperCase();
        if (cropCacheState === 'STALE') {
          setOutlookRefreshing(true);
          analyticsAvailableCropsApiFresh({ province: selectedFarmProvince || undefined, horizon: safeHorizon })
            .then((freshRes) => {
              if (cancelled) return;
              const freshCrops = Array.isArray(freshRes?.data?.crops) ? freshRes.data.crops : [];
              setOutlookCropOptions(freshCrops);
              if (!outlookCrop && freshCrops.length > 0) {
                setOutlookCrop(freshCrops[0]);
              } else if (outlookCrop && !freshCrops.includes(outlookCrop)) {
                setOutlookCrop(freshCrops[0] || '');
              }
            })
            .finally(() => {
              if (!cancelled) setOutlookRefreshing(false);
            });
        } else {
          setOutlookRefreshing(false);
        }
      } catch (e) {
        if (!cancelled) {
          setOutlookError(e?.response?.data?.error || 'Failed to load crop outlook filters.');
          setOutlookRefreshing(false);
        }
      } finally {
        if (!cancelled && outlookRows.length === 0) {
          setOutlookLoading(false);
        }
      }
    }
    bootstrapOutlook();
    return () => {
      cancelled = true;
    };
  }, [tab, hasNoFarms, selectedFarmId, selectedFarmProvince, outlookCrop, outlookHorizon]);

  useEffect(() => {
    let cancelled = false;
    async function loadFirstPage() {
      if (tab !== 'outlook' || !outlookCrop) return;
      setOutlookLoading(true);
      setOutlookError('');
      try {
        const res = await forecastSnapshotCropOutlookApi({
          crop: outlookCrop,
          horizon: outlookHorizon,
          page: 1,
          per_page: OUTLOOK_PAGE_SIZE
        });
        if (cancelled) return;
        const data = Array.isArray(res?.data?.data) ? res.data.data : [];
        const total = Number(res?.data?.total || 0);
        setOutlookRows(data);
        setOutlookTotal(total);
        setOutlookPage(1);
        setOutlookHasMore(Boolean(res?.data?.has_more));
        const pageCacheState = String(res?.headers?.['x-client-cache'] || '').toUpperCase();
        if (pageCacheState === 'STALE') {
          setOutlookRefreshing(true);
          forecastSnapshotCropOutlookApiFresh({
            crop: outlookCrop,
            horizon: outlookHorizon,
            page: 1,
            per_page: OUTLOOK_PAGE_SIZE
          })
            .then((freshRes) => {
              if (cancelled) return;
              const freshData = Array.isArray(freshRes?.data?.data) ? freshRes.data.data : [];
              setOutlookRows(freshData);
              setOutlookTotal(Number(freshRes?.data?.total || 0));
              setOutlookPage(1);
              setOutlookHasMore(Boolean(freshRes?.data?.has_more));
            })
            .finally(() => {
              if (!cancelled) setOutlookRefreshing(false);
            });
        } else {
          setOutlookRefreshing(false);
        }
      } catch (e) {
        if (!cancelled) {
          setOutlookError(e?.response?.data?.error || 'Failed to load crop outlook.');
          setOutlookRefreshing(false);
          if (outlookRows.length === 0) {
            setOutlookRows([]);
            setOutlookHasMore(false);
            setOutlookTotal(0);
          }
        }
      } finally {
        if (!cancelled) setOutlookLoading(false);
      }
    }
    loadFirstPage();
    return () => {
      cancelled = true;
    };
  }, [tab, outlookCrop, outlookHorizon]);

  const handleShowMore = async () => {
    if (!outlookHasMore || outlookLoading || !outlookCrop) return;
    const nextPage = outlookPage + 1;
    setOutlookLoading(true);
    try {
      const res = await forecastSnapshotCropOutlookApi({
        crop: outlookCrop,
        horizon: outlookHorizon,
        page: nextPage,
        per_page: OUTLOOK_PAGE_SIZE
      });
      const data = Array.isArray(res?.data?.data) ? res.data.data : [];
      setOutlookRows((prev) => [...prev, ...data]);
      setOutlookPage(nextPage);
      setOutlookHasMore(Boolean(res?.data?.has_more));
      setOutlookTotal(Number(res?.data?.total || 0));
    } catch (e) {
      setOutlookError(e?.response?.data?.error || 'Failed to load more rows.');
    } finally {
      setOutlookLoading(false);
    }
  };

  const optimalCrops = recommendation?.optimal_crops || [];
  const commonlyPlanted = recommendation?.commonly_planted || [];
  const overview = recommendation?.overview;
  const recSeason = recommendation?.season;
  const province = recommendation?.province;
  const lastGenerated = recommendation?.createdAt;

  const topOptimal = optimalCrops[0];
  const dominantCrop = commonlyPlanted[0];
  const hasMismatch = recommendation && recSeason !== season;
  const relativeTime = lastGenerated ? `(${formatRelativeTime(lastGenerated)})` : '';
  const recommendationUpdatedLabel = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString() : null;

  const recommendationRankItems = optimalCrops.map((item) => ({
    crop: item.crop,
    detail: `Score: ${item.score}`,
    valueText: item.score,
    risk: item.risk
  }));

  const commonRankItems = commonlyPlanted.map((item) => ({
    crop: item.crop,
    detail: item.note || 'Historical share',
    valueText: `${Math.round(item.historical_share * 100)}%`
  }));

  const outlookRankItems = outlookRows.map((row) => ({
    province: row.province,
    valueText: `${Number(row.predicted_production || 0).toLocaleString()} MT`,
    risk: row.future_risk_label
  }));

  if (farmsLoading) {
    return <CropRecommendationPageSkeleton />;
  }

  if (isFarmSelectionPending) {
    return <CropRecommendationPageSkeleton />;
  }

  if (selectedFarmId && loading && tab === 'recommendation') {
    return <CropRecommendationPageSkeleton />;
  }

  if (error && tab === 'recommendation') {
    return (
      <MainCard>
        <Typography color="error">Failed to load recommendation.</Typography>
      </MainCard>
    );
  }

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab value="recommendation" label="Crop Recommendation" />
          <Tab value="outlook" label="Crop Outlook" />
        </Tabs>
      </Grid>

      {tab === 'recommendation' && (
        <>
          <Grid size={12}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Typography variant="h5">Crop Recommendation</Typography>
              {recommendationUpdatedLabel ? (
                <Typography variant="caption" color="text.secondary">
                  Last updated: {recommendationUpdatedLabel}
                  {isBackgroundRefreshing ? ' (refreshing...)' : ''}
                </Typography>
              ) : null}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <InputLabel>Farm</InputLabel>
                <Select
                  size="small"
                  value={selectedFarmId}
                  onChange={(e) => {
                    const farmId = e.target.value;
                    setSelectedFarmId(farmId);
                    if (farmId) {
                      prefs.setString(RECOMMENDATION_FARM_STORAGE_KEY, farmId);
                    } else {
                      prefs.remove(RECOMMENDATION_FARM_STORAGE_KEY);
                    }
                  }}
                  sx={{ minWidth: { xs: '100%', sm: 260 } }}
                >
                  {farms.map((farm) => (
                    <MenuItem key={farm.id} value={String(farm.id)}>
                      {farm.name || farm.label || `Farm ${farm.id}`}{farm.province ? ` (${farm.province})` : ''}
                    </MenuItem>
                  ))}
                </Select>

                <InputLabel>Season</InputLabel>
                <Select size="small" value={season} onChange={(e) => setSeason(e.target.value)} sx={{ minWidth: { xs: '100%', sm: 140 } }}>
                  <MenuItem value="2026Q1">2026 Q1 {recSeason === '2026Q1' ? relativeTime : ''}</MenuItem>
                  <MenuItem value="2026Q2">2026 Q2 {recSeason === '2026Q2' ? relativeTime : ''}</MenuItem>
                  <MenuItem value="2026Q3">2026 Q3 {recSeason === '2026Q3' ? relativeTime : ''}</MenuItem>
                  <MenuItem value="2026Q4">2026 Q4 {recSeason === '2026Q4' ? relativeTime : ''}</MenuItem>
                </Select>

                <Button variant="contained" disabled={generating || hasNoFarms || !selectedFarmId} onClick={generate} sx={{ minWidth: { xs: '100%', sm: 'auto' } }}>
                  {generating ? 'Generating...' : 'Generate'}
                </Button>
              </Stack>
            </Stack>
          </Grid>

          {hasNoFarms && (
            <Grid size={12}>
              <MainCard>
                <Typography>
                  You do not have any farm profiles yet. Please create one in <strong>Farm Management</strong> to generate crop recommendations.
                </Typography>
              </MainCard>
            </Grid>
          )}

          {!hasNoFarms && (!recommendation || hasMismatch) && (
            <Grid size={12}>
              <MainCard>
                <Typography>
                  {hasMismatch ? (
                    <>
                      You selected <strong>{season}</strong>, but the current recommendation is for <strong>{recSeason}</strong>. Click <strong>Generate</strong> to update.
                    </>
                  ) : (
                    <>
                      No recommendation found for this farm and season. Click <strong>Generate</strong> to create one.
                    </>
                  )}
                </Typography>
              </MainCard>
            </Grid>
          )}

          {recommendation && !hasMismatch && !hasNoFarms && (
            <>
              {topOptimal && (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <CropSummary title="Top Optimal Crop" count={topOptimal.crop} extra={`Score: ${topOptimal.score}`} />
                </Grid>
              )}

              {topOptimal && (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <CropSummary title="Risk Outlook" count={topOptimal.risk} extra="Based on farm conditions" />
                </Grid>
              )}

              {dominantCrop && (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <CropSummary title="Dominant Crop" count={dominantCrop.crop} extra={`${Math.round(dominantCrop.historical_share * 100)}% historical share`} />
                </Grid>
              )}

              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <CropSummary title="Season" count={recSeason || season} extra="Forecast horizon" />
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <RankedCardList title="Optimal Crop Rankings" items={recommendationRankItems} secondaryLabel="Score" />
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <RankedCardList title="Commonly Planted Crops" items={commonRankItems} secondaryLabel="Historical share" />
              </Grid>

              <Grid size={12}>
                <MainCard title="Recommendation Insight">
                  <Typography variant="body2">
                    {overview || `Based on farm conditions in ${province} for ${recSeason}, several crops show strong suitability.`}
                  </Typography>
                </MainCard>
              </Grid>
            </>
          )}
        </>
      )}

      {tab === 'outlook' && (
        <>
          <Grid size={12}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Typography variant="h5">Crop Outlook</Typography>
              {outlookRefreshing ? (
                <Typography variant="caption" color="text.secondary">
                  Refreshing...
                </Typography>
              ) : null}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <InputLabel>Crop</InputLabel>
                <Select
                  size="small"
                  value={outlookCrop}
                  onChange={(e) => setOutlookCrop(e.target.value)}
                  sx={{ minWidth: { xs: '100%', sm: 220 } }}
                >
                  {outlookCropOptions.map((crop) => (
                    <MenuItem key={crop} value={crop}>
                      {crop}
                    </MenuItem>
                  ))}
                </Select>

                <InputLabel>Horizon</InputLabel>
                <Select
                  size="small"
                  value={outlookHorizon}
                  onChange={(e) => setOutlookHorizon(Number(e.target.value))}
                  sx={{ minWidth: { xs: '100%', sm: 140 } }}
                >
                  {Array.from({ length: outlookMaxHorizon }, (_, idx) => idx + 1).map((h) => (
                    <MenuItem key={h} value={h}>
                      {h}Q
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            </Stack>
          </Grid>

          <Grid size={12}>
            <MainCard>
              <Typography variant="caption" color="text.secondary">
                Active Farm Province
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {selectedFarmProvince || 'No farm province available'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                This view shows province-level outlook and does not replace farm-specific recommendations.
              </Typography>
            </MainCard>
          </Grid>

          {(outlookLoading && outlookRows.length === 0) ? (
            <Grid size={12}>
              <MainCard title="Province Outlook">
                <OutlookRankingSkeleton />
              </MainCard>
            </Grid>
          ) : null}

          {outlookError ? (
            <Grid size={12}>
              <Alert severity="error">{outlookError}</Alert>
            </Grid>
          ) : null}

          {!outlookLoading || outlookRows.length > 0 ? (
            <Grid size={12}>
              <RankedCardList
                title={`Province Outlook${outlookTotal ? ` (${outlookTotal})` : ''}`}
                items={outlookRankItems}
                secondaryLabel="Predicted production"
                highlightProvince={selectedFarmProvince}
              />
            </Grid>
          ) : null}

          <Grid size={12}>
            <Stack direction="row" justifyContent="center">
              <Button variant="outlined" disabled={!outlookHasMore || outlookLoading} onClick={handleShowMore}>
                {outlookLoading ? 'Loading...' : outlookHasMore ? 'Show 10 More' : 'No More Results'}
              </Button>
            </Stack>
          </Grid>
        </>
      )}
    </Grid>
  );
}
