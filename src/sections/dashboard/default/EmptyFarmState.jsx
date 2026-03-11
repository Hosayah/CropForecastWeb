import PropTypes from 'prop-types';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import MainCard from 'components/MainCard';

export default function EmptyFarmState({ onAddFarm }) {
  return (
    <MainCard>
      <Stack spacing={1.5} alignItems="center" sx={{ py: 5, px: 2 }}>
        <Typography variant="h4">No Farms Yet</Typography>
        <Typography variant="body2" color="text.secondary">
          Add your first farm to get forecasts.
        </Typography>
        <Button variant="contained" onClick={onAddFarm}>
          Add Farm
        </Button>
      </Stack>
    </MainCard>
  );
}

EmptyFarmState.propTypes = {
  onAddFarm: PropTypes.func.isRequired
};
