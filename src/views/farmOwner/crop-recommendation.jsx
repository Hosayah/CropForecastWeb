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
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import MainCard from 'components/MainCard';
import formatRelativeTime from 'utils/helper/formatDateTime';

import { useCropRecommendation } from 'viewModel/useCropRecommendation';
import { useRecommendationChat } from 'viewModel/useRecommendationChat';
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

function getChatPromptSuggestions(focusCrop, dominantCrop) {
  const crop = String(focusCrop || '').trim() || 'this crop';
  const historicalCrop = String(dominantCrop || '').trim() || 'my province';
  const shortCrop = crop.length > 34 ? `${crop.slice(0, 31)}...` : crop;
  const shortHistoricalCrop = historicalCrop.length > 28 ? `${historicalCrop.slice(0, 25)}...` : historicalCrop;
  return [
    `Why is ${shortCrop} top-ranked?`,
    `Best practices for ${shortCrop}?`,
    `Why is ${shortHistoricalCrop} dominant?`
  ];
}

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
  if (normalized === 'LOW') return 'success';
  return 'default';
}

function metricToneForRisk(value) {
  const normalized = normalizeRiskLabel(value);
  if (normalized === 'LOW' || normalized === 'HIGH') return 'success';
  if (normalized === 'RISK-PRONE') return 'warning';
  if (normalized === 'DECLINING') return 'error';
  return 'neutral';
}

function uniqueSources(sources) {
  const seen = new Set();
  return (Array.isArray(sources) ? sources : []).filter((source) => {
    const key = `${source?.document_id || source?.title || 'source'}|${source?.page_start || ''}|${source?.page_end || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

function RecommendationMetricCard({ eyebrow, title, value, supporting, tone = 'primary' }) {
  const toneMap = {
    primary: { bar: 'primary.main', bg: 'primary.lighter' },
    success: { bar: 'success.main', bg: 'success.lighter' },
    warning: { bar: 'warning.main', bg: 'warning.lighter' },
    neutral: { bar: 'secondary.main', bg: 'grey.100' }
  };
  const palette = toneMap[tone] || toneMap.primary;

  return (
    <MainCard contentSX={{ p: 2.25, height: '100%' }}>
      <Stack spacing={1.25} sx={{ height: '100%' }}>
        <Box
          sx={{
            width: 72,
            height: 6,
            borderRadius: 999,
            bgcolor: palette.bar
          }}
        />
        <Typography variant="overline" color="text.secondary">
          {eyebrow}
        </Typography>
        <Typography variant="h4" sx={{ lineHeight: 1.15 }}>
          {value}
        </Typography>
        <Typography variant="subtitle2">{title}</Typography>
        <Box
          sx={{
            mt: 'auto',
            px: 1.25,
            py: 0.875,
            borderRadius: 2,
            bgcolor: palette.bg
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {supporting}
          </Typography>
        </Box>
      </Stack>
    </MainCard>
  );
}

function formatSourceSubtitle(source) {
  const parts = [];
  if (source?.authority) parts.push(source.authority);
  if (source?.category) parts.push(source.category);
  if (Number.isFinite(Number(source?.page_start))) {
    const start = Number(source.page_start);
    const end = Number(source?.page_end || start);
    parts.push(start === end ? `Page ${start}` : `Pages ${start}-${end}`);
  }
  return parts.join(' • ');
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
  const optimalCrops = recommendation?.optimal_crops || [];
  const commonlyPlanted = recommendation?.commonly_planted || [];
  const overview = recommendation?.overview;
  const recSeason = recommendation?.season;
  const province = recommendation?.province;
  const lastGenerated = recommendation?.createdAt;

  const topOptimal = optimalCrops[0];
  const dominantCrop = commonlyPlanted[0];
  const hasMismatch = Boolean(recommendation && recSeason !== season);
  const hasLiveRecommendation = Boolean(recommendation && !hasMismatch && !hasNoFarms);
  const {
    question: chatQuestion,
    setQuestion: setChatQuestion,
    response: chatResponse,
    loading: chatLoading,
    error: chatError,
    askQuestion: askChatQuestion
  } = useRecommendationChat({
    farmId: selectedFarmId,
    season,
    enabled: hasLiveRecommendation
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


  const relativeTime = lastGenerated ? `(${formatRelativeTime(lastGenerated)})` : '';
  const recommendationUpdatedLabel = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString() : null;
  const chatPromptSuggestions = getChatPromptSuggestions(topOptimal?.crop, dominantCrop?.crop);

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
              <Grid size={12}>
                <MainCard contentSX={{ p: 0 }}>
                  <Box
                    sx={{
                      p: { xs: 2.5, md: 3 },
                      borderRadius: 3,
                      background: (theme) =>
                        `linear-gradient(135deg, ${theme.palette.success.lighter} 0%, ${theme.palette.primary.lighter} 55%, ${theme.palette.background.paper} 100%)`
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                        <Box>
                          <Typography variant="overline" color="success.dark">
                            Season-ready recommendation
                          </Typography>
                          <Typography variant="h4" sx={{ mt: 0.5, lineHeight: 1.15, wordBreak: 'break-word', maxWidth: 720 }}>
                            {topOptimal?.crop || 'Recommendation ready for review'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
                            This view blends your farm profile, seasonal fit, and historical crop context so you can review what looks strongest before planting.
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          {topOptimal ? <Chip label={`Top crop: ${topOptimal.crop}`} color="success" /> : null}
                          {topOptimal?.risk ? (
                            <Chip label={`Risk: ${topOptimal.risk}`} variant="outlined" color={riskChipColor(topOptimal.risk)} sx={{ bgcolor: 'background.paper' }} />
                          ) : null}
                          <Chip label={`Season: ${recSeason || season}`} variant="outlined" />
                        </Stack>
                      </Stack>
                    </Stack>
                  </Box>
                </MainCard>
              </Grid>

              {topOptimal && (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <RecommendationMetricCard
                    eyebrow="Top pick"
                    title="Best crop for this season"
                    value={topOptimal.crop}
                    supporting={`Suitability score ${topOptimal.score}`}
                    tone="success"
                  />
                </Grid>
              )}

              {topOptimal && (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <RecommendationMetricCard
                    eyebrow="Risk outlook"
                    title="Expected field confidence"
                    value={topOptimal.risk}
                    supporting="Based on farm conditions"
                    tone={metricToneForRisk(topOptimal.risk)}
                  />
                </Grid>
              )}

              {dominantCrop && (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <RecommendationMetricCard
                    eyebrow="Historical baseline"
                    title="Most established crop locally"
                    value={dominantCrop.crop}
                    supporting={`${Math.round(dominantCrop.historical_share * 100)}% historical share`}
                    tone="primary"
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <RecommendationMetricCard
                  eyebrow="Season window"
                  title="Forecast horizon in view"
                  value={recSeason || season}
                  supporting="Use this for quarter-specific decisions"
                  tone="neutral"
                />
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <RankedCardList title="Optimal Crop Rankings" items={recommendationRankItems} secondaryLabel="Score" />
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <RankedCardList title="Commonly Planted Crops" items={commonRankItems} secondaryLabel="Historical share" />
              </Grid>

              <Grid size={12}>
                <MainCard title="Recommendation Insight" contentSX={{ p: 0 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: 'grey.50',
                      background: (theme) =>
                        `linear-gradient(180deg, ${theme.palette.common.white} 0%, ${theme.palette.grey[50]} 100%)`
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {topOptimal ? <Chip size="small" color="success" label={`${topOptimal.crop} looks strongest`} /> : null}
                        {dominantCrop ? (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`${dominantCrop.crop} remains historically strong`}
                          />
                        ) : null}
                      </Stack>
                      <Typography variant="body2">
                        {overview || `Based on farm conditions in ${province} for ${recSeason}, several crops show strong suitability.`}
                      </Typography>
                    </Stack>
                  </Box>
                </MainCard>
              </Grid>

              <Grid size={12}>
                <MainCard title="Farmer Q&A" contentSX={{ p: 0 }}>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        px: 2.5,
                        pt: 2.5,
                        pb: 1.5,
                        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                        background: (theme) =>
                          `linear-gradient(180deg, ${theme.palette.primary.lighter} 0%, ${theme.palette.background.paper} 100%)`
                      }}
                    >
                      <Stack spacing={1}>
                        <Typography variant="subtitle1">Ask AgriSense to explain the recommendation</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Questions stay tied to your saved recommendation, crop ranking context, and supporting references from the knowledge base.
                        </Typography>
                      </Stack>
                    </Box>

                    <Box sx={{ px: 2.5, pb: 2.5 }}>
                      <Stack spacing={2}>

                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          {chatPromptSuggestions.map((prompt) => (
                            <Chip
                              key={prompt}
                              label={prompt}
                              variant="outlined"
                              onClick={() => setChatQuestion(prompt)}
                              sx={{ borderRadius: 999, bgcolor: 'background.paper' }}
                            />
                          ))}
                        </Stack>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'flex-start' }}>
                          <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            maxRows={6}
                            label="Ask about your farm recommendation"
                            placeholder={chatPromptSuggestions[0]}
                            value={chatQuestion}
                            onChange={(event) => setChatQuestion(event.target.value)}
                          />
                          <Button
                            variant="contained"
                            onClick={askChatQuestion}
                            disabled={chatLoading || !chatQuestion.trim()}
                            sx={{ minWidth: { xs: '100%', sm: 160 }, alignSelf: { xs: 'stretch', sm: 'center' } }}
                          >
                            {chatLoading ? (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <CircularProgress size={18} color="inherit" />
                                <span>Thinking...</span>
                              </Stack>
                            ) : (
                              'Ask'
                            )}
                          </Button>
                        </Stack>

                        {chatError ? (
                          <Alert severity="error">
                            {chatError?.response?.data?.error || 'Unable to generate an answer right now.'}
                          </Alert>
                        ) : null}

                        {chatResponse ? (
                          <Stack spacing={2}>
                            <Box
                              sx={{
                                p: 2.25,
                                borderRadius: 2.5,
                                bgcolor: 'grey.50',
                                border: (theme) => `1px solid ${theme.palette.divider}`
                              }}
                            >
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                AgriSense Answer
                              </Typography>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {chatResponse?.answer || 'No answer was returned.'}
                              </Typography>
                            </Box>

                            <Divider />

                            <Stack spacing={1}>
                              <Typography variant="subtitle2">Grounded Sources</Typography>
                              {uniqueSources(chatResponse?.sources).length > 0 ? (
                                <List disablePadding>
                                  {uniqueSources(chatResponse?.sources).map((source, index) => (
                                    <ListItem
                                      key={`${source?.chunk_id || source?.document_id || 'source'}-${index}`}
                                      disableGutters
                                      sx={{
                                        py: 1.25,
                                        px: 1.5,
                                        mb: 1,
                                        borderRadius: 2.5,
                                        bgcolor: 'grey.50',
                                        border: (theme) => `1px solid ${theme.palette.divider}`,
                                        alignItems: 'flex-start'
                                      }}
                                    >
                                      <ListItemText
                                        primary={source?.title || source?.document_id || `Source ${index + 1}`}
                                        secondary={
                                          <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                              {formatSourceSubtitle(source)}
                                            </Typography>
                                            {source?.excerpt ? (
                                              <Typography variant="body2" color="text.secondary">
                                                {source.excerpt}
                                              </Typography>
                                            ) : null}
                                          </Stack>
                                        }
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No source citations were returned for this answer.
                                </Typography>
                              )}
                            </Stack>

                            <Accordion disableGutters sx={{ borderRadius: 2.5, '&:before': { display: 'none' } }}>
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle2">Technical Details</Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Stack spacing={1}>
                                  {chatResponse?.context?.focusCrop ? (
                                    <Typography variant="body2">
                                      Focus crop: <strong>{chatResponse.context.focusCrop}</strong>
                                    </Typography>
                                  ) : null}
                                  <Typography variant="body2">
                                    Provider: <strong>{chatResponse?.metadata?.provider || 'Unknown'}</strong>
                                  </Typography>
                                  <Typography variant="body2">
                                    Model: <strong>{chatResponse?.metadata?.model || 'Unknown'}</strong>
                                  </Typography>
                                  <Typography variant="body2">
                                    Retrieval: <strong>{chatResponse?.metadata?.retrievalStrategy || 'Unknown'}</strong>
                                  </Typography>
                                  <Typography variant="body2">
                                    Sources used: <strong>{chatResponse?.metadata?.sourceCount ?? 0}</strong>
                                  </Typography>
                                  <Typography variant="body2">
                                    Grounded: <strong>{chatResponse?.metadata?.grounded ? 'Yes' : 'No'}</strong>
                                  </Typography>
                                </Stack>
                              </AccordionDetails>
                            </Accordion>
                          </Stack>
                        ) : null}
                      </Stack>
                    </Box>
                  </Stack>
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




