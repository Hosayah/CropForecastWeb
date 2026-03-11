import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { InputLabel } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import VisibilityIcon from '@mui/icons-material/Visibility';

import MainCard from 'components/MainCard';
import AnalystPageHeader from './components/AnalystPageHeader';
import { listDatasetsApi, previewDatasetApi } from 'model/adminDatasetsApi';

function normalizeDatasetList(response) {
  const payload = response?.data?.data || response?.data || {};
  if (Array.isArray(payload?.datasets)) return payload.datasets;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
}

function statusChip(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active') return <Chip size="small" label="Active" color="success" variant="outlined" />;
  if (normalized === 'archived') return <Chip size="small" label="Archived" variant="outlined" />;
  return <Chip size="small" label={status || 'Draft'} color="default" variant="outlined" />;
}

export default function AnalystDatasets() {
  const [datasets, setDatasets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadDatasets() {
      setLoading(true);
      setError('');
      try {
        const response = await listDatasetsApi();
        if (!mounted) return;
        setDatasets(normalizeDatasetList(response));
      } catch (err) {
        if (!mounted) return;
        setDatasets([]);
        setError(err?.response?.data?.error || 'Failed to load datasets.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDatasets();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const values = new Set();
    datasets.forEach((item) => {
      const value = String(item?.category || '').trim();
      if (value) values.add(value);
    });
    return ['ALL', ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [datasets]);

  const filteredRows = useMemo(() => {
    return datasets.filter((item) => {
      const status = String(item?.status || '').toLowerCase();
      const category = String(item?.category || '').trim();
      if (statusFilter !== 'ALL' && status !== statusFilter.toLowerCase()) return false;
      if (categoryFilter !== 'ALL' && category !== categoryFilter) return false;
      return true;
    });
  }, [datasets, statusFilter, categoryFilter]);

  const openPreview = async (datasetId) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const response = await previewDatasetApi(datasetId, 50);
      setPreviewData(response?.data || null);
    } catch (err) {
      setPreviewData({ error: err?.response?.data?.error || 'Failed to preview dataset.' });
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
          <AnalystPageHeader title="Datasets" current="Datasets" />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <InputLabel>Status:</InputLabel>
              <Select size="small" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} sx={{ minWidth: 160 }}>
                <MenuItem value="ALL">ALL</MenuItem>
                <MenuItem value="active">ACTIVE</MenuItem>
                <MenuItem value="draft">DRAFT</MenuItem>
                <MenuItem value="archived">ARCHIVED</MenuItem>
              </Select>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <InputLabel>Category:</InputLabel>
              <Select size="small" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} sx={{ minWidth: 180 }}>
                {categories.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Stack>
        </Stack>
      </Grid>

      {error ? (
        <Grid size={12}>
          <Alert severity={error.toLowerCase().includes('forbidden') ? 'warning' : 'error'}>{error}</Alert>
        </Grid>
      ) : null}

      <Grid size={12}>
        <MainCard content={false}>
          <Stack sx={{ p: 2.5 }} spacing={1.5}>
            <Typography variant="h6">Dataset Registry (Read-only)</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Uploaded At</TableCell>
                    <TableCell>Uploaded By</TableCell>
                    <TableCell align="right">Preview</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading
                    ? Array.from({ length: 8 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell><Skeleton width={130} /></TableCell>
                          <TableCell><Skeleton width={70} /></TableCell>
                          <TableCell><Skeleton width={70} /></TableCell>
                          <TableCell><Skeleton width={90} /></TableCell>
                          <TableCell><Skeleton width={110} /></TableCell>
                          <TableCell><Skeleton width={130} /></TableCell>
                          <TableCell align="right"><Skeleton width={40} /></TableCell>
                        </TableRow>
                      ))
                    : filteredRows.map((item) => (
                        <TableRow key={item.id || item.datasetId || item.version} hover>
                          <TableCell>{item.datasetName || '-'}</TableCell>
                          <TableCell>{item.category || '-'}</TableCell>
                          <TableCell>{item.version || item.datasetId || '-'}</TableCell>
                          <TableCell>{statusChip(item.status)}</TableCell>
                          <TableCell>{item.uploadedAt || '-'}</TableCell>
                          <TableCell>{item.uploadedBy || '-'}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => openPreview(item.id || item.datasetId || item.version)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </MainCard>
      </Grid>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>Dataset Preview</DialogTitle>
        <DialogContent dividers>
          {previewLoading ? (
            <Skeleton variant="rounded" height={220} />
          ) : previewData?.error ? (
            <Alert severity="error">{previewData.error}</Alert>
          ) : previewData?.columns ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  {previewData.columns.map((column) => (
                    <TableCell key={column}>{column}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(previewData.rows || []).map((row, rowIndex) => (
                  <TableRow key={`preview-row-${rowIndex}`}>
                    {previewData.columns.map((column) => (
                      <TableCell key={`${column}-${rowIndex}`}>{String(row?.[column] ?? '')}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No preview rows available.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
