import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

export default function ChartSkeleton({ height = 450 }) {
  return (
    <Box sx={{ px: 2, pt: 2 }}>
      <Skeleton variant="rectangular" height={height} />
    </Box>
  );
}
