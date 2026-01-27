import PropTypes from 'prop-types';
import {
  Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Typography, Button, Stack
} from '@mui/material';
import { DownloadOutlined } from '@ant-design/icons';

function exportCSV(rows, province) {
  const header = ['Rank', 'Crop', 'Latest Forecast'];
  const csv = [
    header.join(','),
    ...rows.map((r, i) =>
      `${i + 1},${r.crop},${r.value}`
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `top_10_crops_${province}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CropsTable({ rows, province }) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ p: 2 }}>
        <Typography variant="h5">Top 10 Crops</Typography>
        <Button
          size="small"
          startIcon={<DownloadOutlined />}
          onClick={() => exportCSV(rows, province)}
        >
          Export CSV
        </Button>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Crop</TableCell>
              <TableCell align="right">Latest Forecast</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.crop}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Typography fontWeight={600}>
                    {row.crop}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  {row.value.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

CropsTable.propTypes = {
  rows: PropTypes.array.isRequired,
  province: PropTypes.string.isRequired
};
