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
import Chip from '@mui/material/Chip';
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
import TablePagination from '@mui/material/TablePagination';

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
    stats,
    pagination,
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
  const [activating, setActivating] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmActivateOpen, setConfirmActivateOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [datasetName, setDatasetName] = useState('');
  const [version, setVersion] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchDatasets({ page: 1, perPage: pagination.perPage });
  }, []);

  const filteredDatasets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return datasets.filter((item) => {
      const status = String(item?.status || '').toLowerCase();
      const searchable = `${item?.datasetName || ''} ${item?.version || ''}`.toLowerCase();
      if (statusFilter !== 'ALL' && status !== statusFilter.toLowerCase()) return false;
      if (query && !searchable.includes(query)) return false;
      return true;
    });
  }, [datasets, search, statusFilter]);

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

  const openActivateConfirm = (dataset) => {
    setSelectedDataset(dataset);
    setConfirmActivateOpen(true);
  };

  const handleActivate = async () => {
    if (!selectedDataset) return;

    try {
      setActivating(true);
      await activateDataset(selectedDataset);
      setConfirmActivateOpen(false);
      setSelectedDataset(null);
      setToast({
        open: true,
        severity: 'success',
        message: 'Dataset activated successfully.'
      });
    } catch (err) {
      setToast({
        open: true,
        severity: 'error',
        message: err?.response?.data?.error || 'Failed to activate dataset.'
      });
    } finally {
      setActivating(false);
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
              <TextField size="small" value="All" disabled sx={{ minWidth: 150 }} helperText="Server-paged list" />
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
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Dataset Registry</Typography>
              <Typography variant="caption" color="text.secondary">
                Showing {loading ? '...' : filteredDatasets.length} result(s) of {pagination.total}
              </Typography>
            </Stack>
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
                          <TableCell>
                            <Chip
                              size="small"
                              label={String(d.status || 'draft').toUpperCase()}
                              color={String(d.status || '').toLowerCase() === 'active' ? 'success' : 'default'}
                              variant={String(d.status || '').toLowerCase() === 'active' ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell>{d.uploadedAt}</TableCell>

                          <TableCell align="right">
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="flex-end"
                              alignItems="center"
                              flexWrap="wrap"
                              useFlexGap
                            >
                              <IconButton size="small" onClick={() => previewDataset(d.id)}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>

                              <IconButton size="small" onClick={() => handleDownload(d.id)} title="Download dataset">
                                <FileDownloadIcon fontSize="small" />
                              </IconButton>

                              {canWriteDatasets && (
                                <>
                                  {d.status !== 'active' ? (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="success"
                                      startIcon={<CheckCircleOutlineIcon fontSize="small" />}
                                      onClick={() => openActivateConfirm(d)}
                                    >
                                      Activate
                                    </Button>
                                  ) : (
                                    <>
                                      <Chip size="small" color="success" label="Active Dataset" />
                                      <Button
                                        size="small"
                                        variant="text"
                                        color="inherit"
                                        startIcon={<ArchiveIcon fontSize="small" />}
                                        onClick={() => handleArchive(d)}
                                      >
                                        Archive
                                      </Button>
                                    </>
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
              <TablePagination
                component="div"
                count={pagination.total}
                page={Math.max(0, (pagination.page || 1) - 1)}
                onPageChange={(_, nextPage) =>
                  fetchDatasets({
                    page: nextPage + 1,
                    perPage: pagination.perPage
                  })
                }
                rowsPerPage={pagination.perPage}
                onRowsPerPageChange={(event) =>
                  fetchDatasets({
                    page: 1,
                    perPage: parseInt(event.target.value, 10) || 25
                  })
                }
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
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

      <Dialog open={confirmActivateOpen} onClose={() => setConfirmActivateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Activate Dataset</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography variant="body2">
              Set <strong>{selectedDataset?.datasetName || selectedDataset?.version}</strong> as the active dataset?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This will archive the current active dataset and update the system configuration to use version{' '}
              <strong>{selectedDataset?.version}</strong>.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmActivateOpen(false)} disabled={activating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleActivate}
            disabled={activating}
            startIcon={activating ? <CircularProgress size={18} color="inherit" /> : <CheckCircleOutlineIcon />}
          >
            {activating ? 'Activating...' : 'Confirm Activation'}
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
