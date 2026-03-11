import PropTypes from 'prop-types';
import { useEffect, useMemo } from 'react';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { InputLabel } from '@mui/material';

import MainCard from 'components/MainCard';
import CropTrendChart from './CropTrendChart';

export default function CropTrendCard({
  labels,
  series,
  selectedCrops,
  onSelectedCropsChange,
  maxSelectable = 2,
  valueSuffix = '',
  showCropSelector = true
}) {
  const cropOptions = useMemo(() => series.map((s) => s.label), [series]);

  const topCrops = useMemo(() => {
    return [...series]
      .map((s) => ({
        label: s.label,
        total: s.data.reduce((a, b) => a + b, 0)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, maxSelectable)
      .map((s) => s.label);
  }, [series, maxSelectable]);

  const effectiveSelected = useMemo(() => {
    const scoped = (selectedCrops || []).filter((crop) => cropOptions.includes(crop)).slice(0, maxSelectable);
    return scoped.length > 0 ? scoped : topCrops;
  }, [selectedCrops, cropOptions, topCrops, maxSelectable]);

  useEffect(() => {
    const current = JSON.stringify(selectedCrops || []);
    const next = JSON.stringify(effectiveSelected);
    if (current !== next) {
      onSelectedCropsChange(effectiveSelected);
    }
  }, [effectiveSelected, selectedCrops, onSelectedCropsChange]);

  const filteredSeries = series.filter((s) => effectiveSelected.includes(s.label));

  return (
    <>
      <Grid size={12}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Typography variant="h5">Crop Yield Prediction</Typography>
          {showCropSelector ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <InputLabel>Compare Crops:</InputLabel>

              <Select
                size="small"
                multiple
                value={effectiveSelected}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= maxSelectable) {
                    onSelectedCropsChange(value);
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
          ) : null}
        </Stack>
      </Grid>

      <MainCard content={false} sx={{ mt: 1.5 }}>
        <Box sx={{ pt: 1, pr: 2 }}>
          <CropTrendChart labels={labels} series={filteredSeries} valueSuffix={valueSuffix} />
        </Box>
      </MainCard>
    </>
  );
}

CropTrendCard.propTypes = {
  labels: PropTypes.array.isRequired,
  series: PropTypes.array.isRequired,
  selectedCrops: PropTypes.array.isRequired,
  onSelectedCropsChange: PropTypes.func.isRequired,
  maxSelectable: PropTypes.number,
  valueSuffix: PropTypes.string,
  showCropSelector: PropTypes.bool
};
