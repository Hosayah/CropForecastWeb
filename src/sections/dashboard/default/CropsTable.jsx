import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  Chip
} from '@mui/material';
import { DownloadOutlined } from '@ant-design/icons';

function exportCSV(rows, province, periodLabel) {
  const header = ['Rank', 'Crop', `${periodLabel} Forecast`];
  const csv = [
    header.join(','),
    ...rows.map((r, i) =>
      `${i + 1},${r.crop},${r.value}`
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `top_10_crops_${province}_${String(periodLabel || 'latest').replace(/\s+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CropsTable({ rows, province, periodLabel = 'Latest' }) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ p: 2 }}>
        <Typography variant="h5">Top 10 Crops</Typography>
        <Button
          size="small"
          startIcon={<DownloadOutlined />}
          onClick={() => exportCSV(rows, province, periodLabel)}
        >
          Export CSV
        </Button>
      </Stack>
      <Stack spacing={1.25} sx={{ px: 2, pb: 2 }}>
        {rows.map((row, index) => (
          <Card key={row.crop} variant="outlined" sx={{ p: 1.25 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                <Chip size="small" label={index + 1} color="primary" variant="outlined" />
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap title={row.crop}>
                    {row.crop}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {periodLabel} forecast
                  </Typography>
                </Stack>
              </Stack>
              <Typography variant="subtitle2" noWrap sx={{ flexShrink: 0 }}>
                {Number(row.value || 0).toLocaleString()}
              </Typography>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}

CropsTable.propTypes = {
  rows: PropTypes.array.isRequired,
  province: PropTypes.string.isRequired,
  periodLabel: PropTypes.string
};
