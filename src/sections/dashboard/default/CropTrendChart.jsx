import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { LineChart } from '@mui/x-charts/LineChart';
import { withAlpha } from 'utils/colorUtils';

function Legend({ items, onToggle }) {
  return (
    <Stack direction="row" sx={{ gap: 2, justifyContent: 'center', mt: 2 }}>
      {items.map((item) => (
        <Stack
          key={item.label}
          direction="row"
          sx={{ gap: 1, cursor: 'pointer', alignItems: 'center' }}
          onClick={() => onToggle(item.label)}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              bgcolor: item.visible ? item.color : 'text.secondary',
              borderRadius: '50%'
            }}
          />
          <Typography variant="body2">{item.label}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}

export default function CropTrendChart({ labels, series, valueSuffix = '' }) {
  const theme = useTheme();

  const [visibility, setVisibility] = useState(Object.fromEntries(series.map((s) => [s.label, true])));

  useEffect(() => {
    setVisibility(Object.fromEntries(series.map((s) => [s.label, true])));
  }, [series]);

  const toggleVisibility = (label) => {
    setVisibility((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const formatValue = (value) => {
    const formatted = Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
    return valueSuffix ? `${formatted} ${valueSuffix}` : formatted;
  };

  const chartSeries = series.map((s, idx) => {
    const color = idx === 0 ? theme.vars.palette.primary.main : theme.vars.palette.primary.light;

    return {
      type: 'line',
      data: s.data,
      label: s.label,
      valueFormatter: (value) => formatValue(value),
      showMark: false,
      area: true,
      id: s.id,
      color,
      stroke: color,
      strokeWidth: idx === 0 ? 3 : 2,
      areaStyle: {
        opacity: idx === 0 ? 0.35 : 0.2
      }
    };
  });
  const visibleChartSeries = chartSeries.filter((s) => visibility[s.label] !== false);

  return (
    <>
      <LineChart
        hideLegend
        grid={{ horizontal: true, vertical: false }}
        xAxis={[{ scaleType: 'point', data: labels }]}
        yAxis={[
          {
            disableLine: true,
            valueFormatter: (value) => formatValue(value)
          }
        ]}
        height={450}
        margin={{ top: 40, bottom: 0, right: 20, left: 5 }}
        series={visibleChartSeries}
      />

      <Legend
        items={chartSeries.map((s) => ({ label: s.label, color: s.color, visible: visibility[s.label] !== false }))}
        onToggle={toggleVisibility}
      />
    </>
  );
}

CropTrendChart.propTypes = {
  labels: PropTypes.array.isRequired,
  series: PropTypes.array.isRequired,
  valueSuffix: PropTypes.string
};
