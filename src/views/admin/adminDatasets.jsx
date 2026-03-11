import { useEffect, useMemo, useState } from 'react';
import { useAdminDatasetsViewModel } from 'viewModel/useAdminDatasetsViewModel';

// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { InputLabel } from '@mui/material';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

// table
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

// icons
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArchiveIcon from '@mui/icons-material/Archive';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// project
import MainCard from 'components/MainCard';
import { useAuth } from 'contexts/AuthContext';
import { API_BASES } from 'model/apiBase';
import AdminPageHeader from './components/AdminPageHeader';

/* ================= SUMMARY CARD (Skeleton Ready) ================= */

function AdminSummaryCard({ title, value, subtitle, loading }) {
  return (
    <MainCard content={false} sx={{ height: '100%' }}>
      <Stack sx={{ p: 2.5 }} spacing={1.25}>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>

        {loading ? (
          <>
            <Skeleton height={34} width="50%" />
            <Skeleton height={18} width="70%" />
          </>
        ) : (
          <>
            <Typography variant="h4">{value}</Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </>
        )}
      </Stack>
    </MainCard>
  );
}

export default function AdminDatasets() {
  const { user } = useAuth();
  const {
    datasets,
    loading,
    fetchDatasets,
    uploadDataset,
    archiveDataset,
    activateDataset,
    deleteDataset,
    previewDataset,
    previewData,
    previewLoading,
    clearPreview
  } = useAdminDatasetsViewModel();

  const canReadDatasets = ['admin', 'superadmin', 'ml_engineer'].includes(user?.role || '');
  const canWriteDatasets = ['admin', 'superadmin'].includes(user?.role || '');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [datasetName, setDatasetName] = useState('');
  const [version, setVersion] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchDatasets();
  }, []);

  /* ================= STATS ================= */

  const stats = useMemo(
    () => ({
      total: datasets.length,
      active: datasets.filter((d) => d.status === 'active').length,
      archived: datasets.filter((d) => d.status === 'archived').length
    }),
    [datasets]
  );

  const categoryOptions = useMemo(() => {
    const values = new Set();
    datasets.forEach((item) => {
      const category = String(item?.category || '').trim();
      if (category) values.add(category);
    });
    return ['ALL', ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [datasets]);

  const filteredDatasets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return datasets.filter((item) => {
      const status = String(item?.status || '').toLowerCase();
      const category = String(item?.category || '').trim();
      const searchable = `${item?.datasetName || ''} ${item?.version || ''}`.toLowerCase();
      if (statusFilter !== 'ALL' && status !== statusFilter.toLowerCase()) return false;
      if (categoryFilter !== 'ALL' && category !== categoryFilter) return false;
      if (query && !searchable.includes(query)) return false;
      return true;
    });
  }, [datasets, search, statusFilter, categoryFilter]);

  /* ================= ACTION HANDLERS ================= */

  const handleUpload = async () => {
    if (!selectedFile || !datasetName.trim() || !version.trim()) {
      setToast({ open: true, severity: 'error', message: 'All fields required.' });
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('datasetName', datasetName.trim());
      formData.append('version', version.trim());

      await uploadDataset(formData);

      setUploadOpen(false);
      setSelectedFile(null);
      setDatasetName('');
      setVersion('');

      setToast({ open: true, severity: 'success', message: 'Dataset uploaded successfully.' });
    } catch (err) {
      setToast({ open: true, severity: 'error', message: err?.response?.data?.error || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleArchive = async (dataset) => {
    try {
      await archiveDataset(dataset);
      setToast({
        open: true,
        severity: 'info',
        message: 'Dataset archived.'
      });
    } catch (err) {
      setToast({
        open: true,
        severity: 'error',
        message: err?.response?.data?.error || 'Failed to archive dataset.'
      });
    }
  };

  const handleActivate = async (dataset) => {
    try {
      await activateDataset(dataset);
      setToast({
        open: true,
        severity: 'success',
        message: 'Dataset activated.'
      });
    } catch (err) {
      setToast({
        open: true,
        severity: 'error',
        message: err?.response?.data?.error || 'Failed to activate dataset.'
      });
    }
  };

  const handleDeleteConfirm = (dataset) => {
    setSelectedDataset(dataset);
    setConfirmDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedDataset) return;

    try {
      setDeleting(true);

      await deleteDataset(selectedDataset.id);

      setConfirmDeleteOpen(false);
      setSelectedDataset(null);

      setToast({
        open: true,
        severity: 'warning',
        message: 'Dataset deleted.'
      });
    } catch (err) {
      setToast({
        open: true,
        severity: 'error',
        message: err?.response?.data?.error || 'Delete failed.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = (datasetId) => {
    if (!canReadDatasets || !datasetId) return;
    window.location.assign(`${API_BASES.adminDatasets}/${encodeURIComponent(datasetId)}/download`);
  };

  /* ================= UI ================= */

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* HEADER */}
      <Grid size={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <AdminPageHeader title="Data Source Management" current="Datasets" />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dataset..."
              sx={{ minWidth: { xs: '100%', sm: 200 } }}
            />
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
                {categoryOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
            {canWriteDatasets && (
              <Button variant="contained" startIcon={<UploadFileIcon />} onClick={() => setUploadOpen(true)}>
                Upload Dataset
              </Button>
            )}
          </Stack>
        </Stack>
      </Grid>

      {/* SUMMARY CARDS */}
      <Grid size={{ xs: 12, sm: 4 }}>
        <AdminSummaryCard title="Total Datasets" value={stats.total} subtitle="All dataset entries" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <AdminSummaryCard title="Active Datasets" value={stats.active} subtitle="Currently usable" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <AdminSummaryCard title="Archived Datasets" value={stats.archived} subtitle="Stored for history" loading={loading} />
      </Grid>

      {/* TABLE */}
      <Grid size={{ xs: 12 }}>
        <MainCard content={false} sx={{ mt: 1.5 }}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Divider />

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Dataset Name</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Upload Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading
                    ? Array.from({ length: 6 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Skeleton width="70%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton width="40%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton width="40%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton width="60%" />
                          </TableCell>
                          <TableCell align="right">
                            <Skeleton width={100} />
                          </TableCell>
                        </TableRow>
                      ))
                    : filteredDatasets.map((d) => (
                        <TableRow
                          key={d.id}
                          hover
                          sx={String(d.status || '').toLowerCase() === 'active' ? { bgcolor: 'success.lighter' } : undefined}
                        >
                          <TableCell>{d.datasetName}</TableCell>
                          <TableCell>{d.version || '-'}</TableCell>
                          <TableCell>{d.status}</TableCell>
                          <TableCell>{d.uploadedAt}</TableCell>

                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <IconButton size="small" onClick={() => previewDataset(d.id)}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>

                              <IconButton size="small" onClick={() => handleDownload(d.id)} title="Download dataset">
                                <FileDownloadIcon fontSize="small" />
                              </IconButton>

                              {canWriteDatasets && (
                                <>
                                  {d.status !== 'active' ? (
                                    <IconButton size="small" onClick={() => handleActivate(d)} title="Activate dataset">
                                      <CheckCircleOutlineIcon fontSize="small" />
                                    </IconButton>
                                  ) : (
                                    <IconButton size="small" onClick={() => handleArchive(d)} title="Archive dataset">
                                      <ArchiveIcon fontSize="small" />
                                    </IconButton>
                                  )}

                                  <IconButton size="small" onClick={() => handleDeleteConfirm(d)}>
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                </>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </MainCard>
      </Grid>
      {/* UPLOAD DIALOG */}
      <Dialog open={uploadOpen && canWriteDatasets} onClose={() => setUploadOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Upload Dataset</DialogTitle>

        <DialogContent dividers>
          {uploading && <LinearProgress />}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Dataset Name" value={datasetName} onChange={(e) => setDatasetName(e.target.value)} fullWidth />
            <TextField
              label="Version"
              placeholder="e.g. v3"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              fullWidth
            />

            <Button variant="outlined" component="label">
              Choose CSV File
              <input hidden type="file" accept=".csv" onChange={(e) => setSelectedFile(e.target.files[0])} />
            </Button>

            {selectedFile && <Typography variant="caption">Selected: {selectedFile.name}</Typography>}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || !datasetName.trim() || !version.trim() || uploading}
            startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* DELETE CONFIRMATION */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Dataset</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Are you sure you want to delete <strong>{selectedDataset?.datasetName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PREVIEW DIALOG (unchanged) */}
      <Dialog open={!!previewData} onClose={clearPreview} maxWidth="lg" fullWidth>
        <DialogTitle>CSV Preview</DialogTitle>
        <DialogContent dividers>
          {previewLoading ? (
            <Skeleton variant="rectangular" height={200} />
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
                  <TableRow key={idx}>
                    {previewData.columns.map((col) => (
                      <TableCell key={col}>{row[col]}</TableCell>
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

      {/* TOAST */}
      <Snackbar open={toast.open} autoHideDuration={2200} onClose={() => setToast((p) => ({ ...p, open: false }))}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
