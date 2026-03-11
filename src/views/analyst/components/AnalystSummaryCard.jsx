import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import MainCard from 'components/MainCard';

function formatValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return value ?? '-';
}

export default function AnalystSummaryCard({ title, value, subtitle, loading = false }) {
  return (
    <MainCard content={false} sx={{ height: '100%' }}>
      <Stack sx={{ p: 2.5 }} spacing={0.75}>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        {loading ? <Skeleton width="50%" /> : <Typography variant="h4">{formatValue(value)}</Typography>}
        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
    </MainCard>
  );
}
