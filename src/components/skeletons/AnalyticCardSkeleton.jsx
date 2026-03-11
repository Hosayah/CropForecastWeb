import MainCard from 'components/MainCard';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

export default function AnalyticCardSkeleton() {
  return (
    <MainCard content={false} sx={{ height: '100%' }}>
      <Stack sx={{ p: 2.5 }} spacing={0.75}>
        <Skeleton variant="text" width="55%" />
        <Skeleton variant="text" width="38%" height={34} />
        <Skeleton variant="text" width="45%" />
      </Stack>
    </MainCard>
  );
}
