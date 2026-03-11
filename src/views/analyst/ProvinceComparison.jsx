import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import TableSortLabel from '@mui/material/TableSortLabel';

import MainCard from 'components/MainCard';
import AnalystPageHeader from './components/AnalystPageHeader';
import { getForecastSnapshotApi } from 'model/cropTrendApi';
import { downloadCsv, formatNumber } from './utils';

function aggregateByProvince(rows) {
  const map = new Map();

  rows.forEach((item) => {
    const province = String(item?.province || '').trim().toUpperCase();
    const crop = String(item?.crop || '').trim();
    const value = Number(item?.predicted_production || 0);
    if (!province || !Number.isFinite(value)) return;

    if (!map.has(province)) {
      map.set(province, { province, totalYield: 0, crops: new Map() });
    }

    const current = map.get(province);
    current.totalYield += value;
    if (crop) {
      current.crops.set(crop, (current.crops.get(crop) || 0) + value);
    }
  });

  return Array.from(map.values()).map((item) => ({
    province: item.province,
    totalYield: Number(item.totalYield.toFixed(2)),
    topCrops: Array.from(item.crops.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([crop]) => crop)
      .join(', ')
  }));
}

export default function AnalystProvinceComparison() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderBy, setOrderBy] = useState('totalYield');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    let mounted = true;

    async function loadComparison() {
      setLoading(true);
      setError('');
      try {
        const response = await getForecastSnapshotApi({ compact: 1 });
        if (!mounted) return;
        const payload = response?.data || {};
        const provincesMap = payload?.provinces || {};
        const data = Object.values(provincesMap).flatMap((provinceDoc) =>
          Array.isArray(provinceDoc?.rows) ? provinceDoc.rows : []
        );
        setRows(aggregateByProvince(data));
      } catch (err) {
        if (!mounted) return;
        setRows([]);
        setError(err?.response?.data?.error || 'Failed to load province comparison.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadComparison();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = rows;
    if (query) {
      result = result.filter((row) => row.province.toLowerCase().includes(query));
    }

    const sorted = [...result].sort((a, b) => {
      if (orderBy === 'province') {
        return order === 'asc' ? a.province.localeCompare(b.province) : b.province.localeCompare(a.province);
      }
      return order === 'asc' ? a.totalYield - b.totalYield : b.totalYield - a.totalYield;
    });

    return sorted;
  }, [rows, search, orderBy, order]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const handleExport = () => {
    downloadCsv('province_comparison.csv', [
      ['Rank', 'Province', 'Total Predicted Yield', 'Top Crops'],
      ...filteredRows.map((row, index) => [index + 1, row.province, row.totalYield, row.topCrops])
    ]);
  };

  const handleSort = (column) => {
    if (orderBy === column) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setOrderBy(column);
    setOrder(column === 'province' ? 'asc' : 'desc');
  };

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
          <AnalystPageHeader title="Province Comparison" current="Province Comparison" />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField size="small" placeholder="Search province..." value={search} onChange={(event) => setSearch(event.target.value)} />
            <Button variant="outlined" onClick={handleExport}>
              Export CSV
            </Button>
          </Stack>
        </Stack>
      </Grid>

      {error ? (
        <Grid size={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      ) : null}

      <Grid size={12}>
        <MainCard content={false}>
          <Stack sx={{ p: 2.5 }} spacing={1.5}>
            <Typography variant="h6">Province Ranking</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>
                      <TableSortLabel active={orderBy === 'province'} direction={orderBy === 'province' ? order : 'asc'} onClick={() => handleSort('province')}>
                        Province
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'totalYield'}
                        direction={orderBy === 'totalYield' ? order : 'desc'}
                        onClick={() => handleSort('totalYield')}
                      >
                        Total Predicted Yield
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Top Crops</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading
                    ? Array.from({ length: 8 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell><Skeleton width={20} /></TableCell>
                          <TableCell><Skeleton width={120} /></TableCell>
                          <TableCell align="right"><Skeleton width={100} /></TableCell>
                          <TableCell><Skeleton width={220} /></TableCell>
                        </TableRow>
                      ))
                    : paginatedRows.map((row, index) => (
                        <TableRow key={`province-${row.province}`} hover>
                          <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                          <TableCell>{row.province}</TableCell>
                          <TableCell align="right">{formatNumber(row.totalYield)}</TableCell>
                          <TableCell>{row.topCrops || '-'}</TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredRows.length}
              page={page}
              onPageChange={(_, value) => setPage(value)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}
