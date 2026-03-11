import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import MainCard from 'components/MainCard';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import { InputLabel } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import { useAdminDatasetsViewModel } from 'viewModel/useAdminDatasetsViewModel';
import { API_BASES } from 'model/apiBase';
import MlSummaryCard from 'views/ml/components/MlSummaryCard';

export default function MlDatasets() {
  const { datasets, loading, fetchDatasets, previewDataset, previewData, previewLoading, clearPreview } =
    useAdminDatasetsViewModel();
  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    fetchDatasets().catch((err) => {
      setToast({
        open: true,
        severity: 'error',
        message: err?.response?.data?.error || 'Failed to load datasets'
      });
    });
  }, []);

  const sortedRows = useMemo(() => datasets || [], [datasets]);
  const categories = useMemo(() => {
    const set = new Set();
    sortedRows.forEach((row) => {
      const value = String(row?.category || '').trim();
      if (value) set.add(value);
    });
    return ['ALL', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [sortedRows]);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortedRows.filter((row) => {
      const status = String(row?.status || '').toLowerCase();
      const category = String(row?.category || '').trim();
      const searchable = `${row?.datasetName || ''} ${row?.version || ''}`.toLowerCase();
      if (statusFilter !== 'ALL' && status !== statusFilter.toLowerCase()) return false;
      if (categoryFilter !== 'ALL' && category !== categoryFilter) return false;
      if (query && !searchable.includes(query)) return false;
      return true;
    });
  }, [sortedRows, search, statusFilter, categoryFilter]);
  const summary = useMemo(
    () => ({
      total: sortedRows.length,
      active: sortedRows.filter((row) => String(row.status || '').toLowerCase() === 'active').length,
      draft: sortedRows.filter((row) => String(row.status || '').toLowerCase() === 'draft').length,
      archived: sortedRows.filter((row) => String(row.status || '').toLowerCase() === 'archived').length
    }),
    [sortedRows]
  );

  const handlePreview = async (datasetId) => {
    try {
      await previewDataset(datasetId);
    } catch (err) {
      setToast({
        open: true,
        severity: 'error',
        message: err?.response?.data?.error || 'Preview failed'
      });
    }
  };

  const handleDownload = (datasetId) => {
    window.location.assign(`${API_BASES.adminDatasets}/${encodeURIComponent(datasetId)}/download`);
  };

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Stack spacing={0.75}>
            <Typography variant="h5">Datasets</Typography>
            <Breadcrumbs separator="/" aria-label="breadcrumb">
              <Link component={RouterLink} underline="hover" color="inherit" to="/">
                Home
              </Link>
              <Typography variant="body2" color="text.secondary">
                ML Management
              </Typography>
              <Typography variant="body2" color="text.primary">
                Datasets
              </Typography>
            </Breadcrumbs>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField size="small" placeholder="Search dataset..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Stack direction="row" spacing={1} alignItems="center">
              <InputLabel>Status:</InputLabel>
              <Select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 140 }}>
                <MenuItem value="ALL">ALL</MenuItem>
                <MenuItem value="active">ACTIVE</MenuItem>
                <MenuItem value="draft">DRAFT</MenuItem>
                <MenuItem value="archived">ARCHIVED</MenuItem>
              </Select>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <InputLabel>Category:</InputLabel>
              <Select size="small" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} sx={{ minWidth: 150 }}>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Stack>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MlSummaryCard title="Total Datasets" value={summary.total} subtitle="Registered versions" loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MlSummaryCard title="Active" value={summary.active} subtitle="In production use" loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MlSummaryCard title="Draft" value={summary.draft} subtitle="Available for activation" loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MlSummaryCard title="Archived" value={summary.archived} subtitle="Retained for rollback" loading={loading} />
      </Grid>

      <Grid size={12}>
        <MainCard content={false}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Dataset Name</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Uploaded At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading &&
                    Array.from({ length: 6 }).map((_, idx) => (
                      <TableRow key={`ml-datasets-skeleton-${idx}`}>
                        <TableCell><Skeleton width="65%" /></TableCell>
                        <TableCell><Skeleton width="45%" /></TableCell>
                        <TableCell><Skeleton width="40%" /></TableCell>
                        <TableCell><Skeleton width="55%" /></TableCell>
                        <TableCell align="right"><Skeleton width={90} /></TableCell>
                      </TableRow>
                    ))}

                  {!loading &&
                    filteredRows.map((dataset) => (
                      <TableRow
                        key={dataset.id}
                        hover
                        sx={String(dataset.status || '').toLowerCase() === 'active' ? { bgcolor: 'success.lighter' } : undefined}
                      >
                        <TableCell>{dataset.datasetName}</TableCell>
                        <TableCell>{dataset.version || '-'}</TableCell>
                        <TableCell>{dataset.status || '-'}</TableCell>
                        <TableCell>{dataset.uploadedAt || '-'}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton size="small" onClick={() => handlePreview(dataset.id)} title="Preview">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDownload(dataset.id)} title="Download">
                              <FileDownloadIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}

                  {!loading && filteredRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary">
                          No datasets available.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </MainCard>
      </Grid>

      <Dialog open={!!previewData} onClose={clearPreview} maxWidth="lg" fullWidth>
        <DialogTitle>CSV Preview</DialogTitle>
        <DialogContent dividers>
          {previewLoading ? (
            <Skeleton variant="rectangular" height={220} />
          ) : previewData?.columns ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  {previewData.columns.map((col) => (
                    <TableCell key={col}>{col}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.rows.map((row, idx) => (
                  <TableRow key={`preview-row-${idx}`}>
                    {previewData.columns.map((col) => (
                      <TableCell key={`${idx}-${col}`}>{row[col]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography>No preview data available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={clearPreview}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={2600} onClose={() => setToast((p) => ({ ...p, open: false }))}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
