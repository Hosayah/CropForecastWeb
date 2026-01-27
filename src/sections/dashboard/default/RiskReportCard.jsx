import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import MainCard from 'components/MainCard';
import ChartSkeleton from 'components/skeletons/ChartSkeleton';
import RiskChart from '../RiskChart';

export default function RiskReportCard({ riskDistribution, loading }) {
  return (
    <MainCard>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h5">
            Demand and Risk Distribution by Crop Group
          </Typography>
        </Grid>

        <Grid item xs={12}>
          {loading || !riskDistribution ? (
            <ChartSkeleton />
          ) : (
            <RiskChart data={riskDistribution.risk_counts} />
          )}
        </Grid>
      </Grid>
    </MainCard>
  );
}

RiskReportCard.propTypes = {
  riskDistribution: PropTypes.object,
  loading: PropTypes.bool
};