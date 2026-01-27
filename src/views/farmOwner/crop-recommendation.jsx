import { useEffect, useState } from 'react';

// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';

// project imports
import MainCard from 'components/MainCard';
import CropSummary from 'components/cards/statistics/CropSummary';
import ChartSkeleton from 'components/skeletons/ChartSkeleton';
import formatRelativeTime from 'utils/helper/formatDateTime';

// view model
import { useCropRecommendation } from 'viewModel/useCropRecommendation';
import { useFarms } from 'viewModel/useFarms';

// -------------------------------------------------------------

export default function CropRecommendationPage() {
  const [season, setSeason] = useState('2026Q1');
  const [activeFarmId, setActiveFarmId] = useState(null);

  // 🔹 Fetch farms for current user
  const { farms = [], loading: farmsLoading } = useFarms();

  const hasNoFarms = farms.length === 0;

  // 🔹 Auto-select first farm when farms load
  useEffect(() => {
    if (!activeFarmId && farms.length > 0) {
      setActiveFarmId(farms[0].id);
    }
  }, [farms, activeFarmId]);

  // 🔹 Crop recommendation hook
  const {
    recommendation,
    loading,
    generating,
    error,
    generate
  } = useCropRecommendation({
    farmId: activeFarmId,
    season
  });

  // -------------------------------------------------------------
  // Loading & Error States
  // -------------------------------------------------------------

  
  if (farmsLoading) {
    return <ChartSkeleton />;
  }

  if (activeFarmId && loading) {
    return <ChartSkeleton />;
  }


  if (error) {
    return (
      <MainCard>
        <Typography color="error">
          Failed to load recommendation.
        </Typography>
      </MainCard>
    );
  }

  // -------------------------------------------------------------
  // Safe extraction
  // -------------------------------------------------------------
  const optimal_crops = recommendation?.optimal_crops || [];
  const commonly_planted = recommendation?.commonly_planted || [];
  const overview = recommendation?.overview;
  const recSeason = recommendation?.season;
  const province = recommendation?.province;
  const lastGenerated = recommendation?.createdAt;

  const topOptimal = optimal_crops[0];
  const dominantCrop = commonly_planted[0];
  const hasMismatch = recommendation && recSeason !== season;

  const relativeTime =
    lastGenerated ? `(${formatRelativeTime(lastGenerated)})` : '';

  // -------------------------------------------------------------
  // UI
  // -------------------------------------------------------------
  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* ================= Header ================= */}
      <Grid size={12}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Typography variant="h5">Crop Recommendation</Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <InputLabel>Farm</InputLabel>
            <Select
              size="small"
              value={activeFarmId || ''}
              disabled={hasNoFarms}
              onChange={(e) => setActiveFarmId(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 220 } }}
            >
              {farms.map((farm) => (
                <MenuItem key={farm.id} value={farm.id}>
                  {farm.name} — {farm.province}
                </MenuItem>
              ))}
            </Select>

            <InputLabel>Season</InputLabel>
            <Select
              size="small"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 140 } }}
            >
              <MenuItem value="2026Q1">
                2026 Q1 {recSeason === '2026Q1' ? relativeTime : ''}
              </MenuItem>
              <MenuItem value="2026Q2">
                2026 Q2 {recSeason === '2026Q2' ? relativeTime : ''}
              </MenuItem>
              <MenuItem value="2026Q3">
                2026 Q3 {recSeason === '2026Q3' ? relativeTime : ''}
              </MenuItem>
              <MenuItem value="2026Q4">
                2026 Q4 {recSeason === '2026Q4' ? relativeTime : ''}
              </MenuItem>
            </Select>

            <Button
              variant="contained"
              disabled={generating || hasNoFarms || !activeFarmId}
              onClick={generate}
              sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
            >
              {generating ? 'Generating…' : 'Generate'}
            </Button>
          </Stack>
        </Stack>
      </Grid>

      {/* ================= No Farms State ================= */}
      {hasNoFarms && (
        <Grid size={12}>
          <MainCard>
            <Typography>
              You don’t have any farm profiles yet.
              Please create one in <strong>Farm Management</strong> to generate
              crop recommendations.
            </Typography>
          </MainCard>
        </Grid>
      )}

      {/* ================= No Recommendation / Mismatch ================= */}
      {!hasNoFarms && (!recommendation || hasMismatch) && (
        <Grid size={12}>
          <MainCard>
            <Typography>
              {hasMismatch ? (
                <>
                  You selected <strong>{season}</strong>, but the current
                  recommendation is for <strong>{recSeason}</strong>.
                  Click <strong>Generate</strong> to update.
                </>
              ) : (
                <>
                  No recommendation found for this farm and season.
                  Click <strong>Generate</strong> to create one.
                </>
              )}
            </Typography>
          </MainCard>
        </Grid>
      )}

      {/* ================= Recommendation Content ================= */}
      {recommendation && !hasMismatch && !hasNoFarms && (
        <>
          {/* Summary cards */}
          {topOptimal && (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <CropSummary
                title="Top Optimal Crop"
                count={topOptimal.crop}
                extra={`Score: ${topOptimal.score}`}
              />
            </Grid>
          )}

          {topOptimal && (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <CropSummary
                title="Risk Outlook"
                count={topOptimal.risk}
                extra="Based on farm conditions"
              />
            </Grid>
          )}

          {dominantCrop && (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <CropSummary
                title="Dominant Crop"
                count={dominantCrop.crop}
                extra={`${Math.round(
                  dominantCrop.historical_share * 100
                )}% historical share`}
              />
            </Grid>
          )}

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <CropSummary
              title="Season"
              count={recSeason || season}
              extra="Forecast horizon"
            />
          </Grid>

          {/* Rankings */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <MainCard title="Optimal Crop Rankings">
              <Grid container spacing={2}>
                {optimal_crops.map((item, idx) => (
                  <Grid key={item.crop} size={12}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body1">
                        {idx + 1}. {item.crop}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Score: {item.score} • Risk: {item.risk}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </MainCard>
          </Grid>

          {/* Common crops */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <MainCard title="Commonly Planted Crops">
              <Grid container spacing={2}>
                {commonly_planted.map((item, idx) => (
                  <Grid key={item.crop} size={12}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body1">
                        {idx + 1}. {item.crop}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(item.historical_share * 100)}% • {item.note}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </MainCard>
          </Grid>

          {/* Insight */}
          <Grid size={12}>
            <MainCard title="Recommendation Insight">
              <Typography variant="body2">
                {overview ||
                  `Based on farm conditions in ${province} for ${recSeason},
                  several crops show strong suitability.`}
              </Typography>
            </MainCard>
          </Grid>
        </>
      )}
    </Grid>
  );
}
