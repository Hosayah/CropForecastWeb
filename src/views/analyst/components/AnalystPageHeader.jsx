import { Link as RouterLink } from 'react-router-dom';

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function AnalystPageHeader({ title, current }) {
  return (
    <Stack spacing={0.75}>
      <Typography variant="h5">{title}</Typography>
      <Breadcrumbs separator="/" aria-label="breadcrumb">
        <Link component={RouterLink} underline="hover" color="inherit" to="/">
          Home
        </Link>
        <Typography variant="body2" color="text.secondary">
          Analyst
        </Typography>
        <Typography variant="body2" color="text.primary">
          {current}
        </Typography>
      </Breadcrumbs>
    </Stack>
  );
}
