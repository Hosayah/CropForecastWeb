import { useState } from 'react';
import { useAuth } from 'contexts/AuthContext';

// material-ui
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { InputLabel } from '@mui/material';
import Select from '@mui/material/Select';

// project imports
import AnalyticCardSkeleton from '../../components/skeletons/AnalyticCardSkeleton';
import ChartSkeleton from '../../components/skeletons/ChartSkeleton';
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import RiskReportCard from 'sections/dashboard/default/RiskReportCard';
import CropsTable from 'sections/dashboard/default/CropsTable';
import CropTrendCard from 'sections/dashboard/default/CropTrendCard';

// viewModel
import { useCropAnalytics } from 'viewModel/useCropAnalytics';

// datas
import { PROVINCES } from 'data/provinces';

function getTopCropsFromTrend(series, topN = 10) {
  if (!Array.isArray(series)) return [];

  return series
    .map((s) => ({
      crop: s.label,
      // latest forecast value (last quarter)
      value: s.data[s.data.length - 1] ?? 0,
      // optional: total forecast
      total: s.data.reduce((a, b) => a + b, 0)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);
}

// ==============================|| DASHBOARD - DEFAULT ||============================== //

export default function FarmOwnerDashboard() {
  const { user } = useAuth();
  const defaultProvince = user?.province || 'ALL';
  console.log('User province:', defaultProvince);
  const PROVINCE_STORAGE_KEY = 'agrisense:selected_province';
  const [province, setProvince] = useState(() => {
    return localStorage.getItem(PROVINCE_STORAGE_KEY) || defaultProvince;
  });

  const handleProvinceChange = (value) => {
    setProvince(value);
    localStorage.setItem(PROVINCE_STORAGE_KEY, value);
  };


  const { summary, trend, risk, loading } = useCropAnalytics({
    horizon: 5,
    province
  });

  const topCrops = trend ? getTopCropsFromTrend(trend.series, 10) : [];
  console.log('Top crops:', trend);
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
          <Typography variant="h5">Dashboard</Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <InputLabel>Province:</InputLabel>
            <Select size="small" value={province} onChange={(e) => handleProvinceChange(e.target.value)} sx={{ minWidth: { xs: '100%', sm: 220 } }}>
              {PROVINCES.map((prov) => (
                <MenuItem key={prov} value={prov}>
                  {prov}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </Stack>
      </Grid>

      {loading
        ? Array.from({ length: 3 }).map((_, idx) => (
            <Grid key={idx} size={{ xs: 12, sm: 6, lg: 4 }}>
              <AnalyticCardSkeleton />
            </Grid>
          ))
        : summary.map((item) => (
            <Grid key={item.metric} size={{ xs: 12, sm: 6, lg: 4 }}>
              <AnalyticEcommerce title={item.label} count={item.value.toLocaleString()} extra={item.unit} />
            </Grid>
          ))}

      <Grid sx={{ display: { sm: 'none', md: 'block', lg: 'none' } }} size={{ md: 8 }} />
      {/* row 2 */}
      <Grid size={{ xs: 12 }}>
        {loading ? (
          <MainCard content={false} sx={{ mt: 1.5 }}>
            <ChartSkeleton />
          </MainCard>
        ) : (
          trend && <CropTrendCard labels={trend.labels} series={trend.series} />
        )}
      </Grid>

      {/* row 3 */}
      <Grid size={{ xs: 12, lg: 8 }}>
        <MainCard sx={{ mt: 2 }} content={false}>
          {loading ? <ChartSkeleton /> : <CropsTable rows={topCrops} province={province} />}
        </MainCard>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Grid sx={{ mt: 2 }}>
            <RiskReportCard riskDistribution={risk} loading={loading} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
