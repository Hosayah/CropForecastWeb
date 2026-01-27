import PropTypes from 'prop-types';
import { BarChart } from '@mui/x-charts';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

export default function RiskChart({ data }) {
  const theme = useTheme();

  // X-axis categories
  const riskLevels = ['High', 'Risk-prone', 'Declining'];

  // Extract values per crop group
  const palay = riskLevels.map((r) => data.PALAY?.[r] ?? 0);
  const corn = riskLevels.map((r) => data.CORN?.[r] ?? 0);
  const other = riskLevels.map((r) => data.OTHER?.[r] ?? 0);

  return (
    <Box sx={{ height: 360 }}>
      <BarChart
        xAxis={[
          {
            data: riskLevels,
            scaleType: 'band'
          }
        ]}
        yAxis={[{ label: 'Number of Crops' }]}
        series={[
          {
            label: 'Palay',
            data: palay,
            color: theme.palette.success.main
          },
          {
            label: 'Corn',
            data: corn,
            color: theme.palette.warning.main
          },
          {
            label: 'Other',
            data: other,
            color: theme.palette.error.main
          }
        ]}
        height={360}
        grid={{ horizontal: true }}
        slotProps={{
          legend: {
            position: { vertical: 'top', horizontal: 'middle' }
          }
        }}
      />
    </Box>
  );
}

RiskChart.propTypes = {
  data: PropTypes.object.isRequired
};
