import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';

import MainCard from 'components/MainCard';

export default function MlSummaryCard({ title, value, subtitle, loading = false }) {
  return (
    <MainCard content={false} sx={{ height: '100%' }}>
      <Stack sx={{ p: 2.5 }} spacing={0.75}>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        {loading ? <Skeleton width="50%" /> : <Typography variant="h4">{value}</Typography>}
        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
    </MainCard>
  );
}
