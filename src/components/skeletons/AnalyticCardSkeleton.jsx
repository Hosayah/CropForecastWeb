import MainCard from 'components/MainCard';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

export default function AnalyticCardSkeleton() {
  return (
    <MainCard contentSX={{ p: 2.25 }}>
      <Stack spacing={1}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" height={32} />
        <Skeleton variant="rectangular" width="50%" height={18} />
      </Stack>
    </MainCard>
  );
}
