import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { InputLabel } from '@mui/material';

import MainCard from 'components/MainCard';
import CropTrendChart from './CropTrendChart';

export default function CropTrendCard({ labels, series }) {
  // 🔹 all available crop names
  const cropOptions = useMemo(() => {
    return series.map((s) => s.label);
  }, [series]);

  const topTwoCrops = useMemo(() => {
    return [...series]
      .map((s) => ({
        label: s.label,
        total: s.data.reduce((a, b) => a + b, 0)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 2)
      .map((s) => s.label);
  }, [series]);

  // 🔹 only 2 crops selected
  const [selectedCrops, setSelectedCrops] = useState(topTwoCrops);

  // 🔹 filter series
  const filteredSeries = series.filter((s) => selectedCrops.includes(s.label));

  return (
    <>
      <Grid size={12}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Typography variant="h5">Crop Yield Prediction</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <InputLabel>Compare Crops:</InputLabel>

            <Select
              size="small"
              multiple
              value={selectedCrops}
              onChange={(e) => {
                const value = e.target.value;
                // 🔒 enforce max of 2
                if (value.length <= 2) {
                  setSelectedCrops(value);
                }
              }}
              renderValue={(selected) => selected.join(' vs ')}
              sx={{ minWidth: { xs: '100%', sm: 220 } }}
            >
              {cropOptions.map((crop) => (
                <MenuItem key={crop} value={crop}>
                  {crop}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </Stack>
      </Grid>

      <MainCard content={false} sx={{ mt: 1.5 }}>
        <Box sx={{ pt: 1, pr: 2 }}>
          <CropTrendChart labels={labels} series={filteredSeries} />
        </Box>
      </MainCard>
    </>
  );
}

CropTrendCard.propTypes = {
  labels: PropTypes.array.isRequired,
  series: PropTypes.array.isRequired
};
