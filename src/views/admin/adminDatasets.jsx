import { useEffect, useMemo, useState } from 'react';

// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { InputLabel } from '@mui/material';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

import MainCard from 'components/MainCard';

// table
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

// dialog
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// snackbar
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

// icons
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';

// ==============================|| SMALL HELPERS ||============================== //

function AdminSummaryCard({ title, value, subtitle, loading }) {
  return (
    <MainCard content={false} sx={{ height: '100%' }}>
      <Stack sx={{ p: 2.5 }} spacing={1.25}>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>

        {loading ? (
          <>
            <Skeleton height={34} width="55%" />
            <Skeleton height={18} width="75%" />
          </>
        ) : (
          <>
            <Typography variant="h4">{typeof value === 'number' ? value.toLocaleString() : value}</Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </>
        )}
      </Stack>
    </MainCard>
  );
}

function CategoryChip({ category }) {
  const cfg = useMemo(() => {
    switch (category) {
      case 'yield':
        return { label: 'Yield', color: 'success' };
      case 'climate':
        return { label: 'Climate', color: 'primary' };
      case 'price':
        return { label: 'Price', color: 'warning' };
      case 'other':
      default:
        return { label: 'Other', color: 'default' };
    }
  }, [category]);

  return <Chip size="small" label={cfg.label} color={cfg.color} variant="outlined" />;
}

function StatusChip({ status }) {
  const cfg = useMemo(() => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: 'success' };
      case 'archived':
        return { label: 'Archived', color: 'warning' };
      default:
        return { label: status || 'Unknown', color: 'default' };
    }
  }, [status]);

  return <Chip size="small" label={cfg.label} color={cfg.color} variant="outlined" />;
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function isCsvFile(file) {
  if (!file) return false;
  const nameOk = file.name?.toLowerCase().endsWith('.csv');
  const typeOk = file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.type === '';
  return nameOk || typeOk;
}

// ==============================|| ADMIN DATASETS PAGE ||============================== //

export default function AdminDatasets() {
  const [loading, setLoading] = useState(true);

  const CATEGORIES = useMemo(() => ['ALL', 'yield', 'climate', 'price', 'other'], []);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [search, setSearch] = useState('');

  const [uploadOpen, setUploadOpen] = useState(false);

  // file state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');

  // dataset form (metadata)
  const [form, setForm] = useState({
    datasetName: '',
    category: 'yield',
    version: 'v1',
    year: new Date().getFullYear(),
    quarter: 'Q1',
    description: '',
    status: 'active'
  });

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const [datasets, setDatasets] = useState([]);

  const [stats, setStats] = useState({
    totalDatasets: 0,
    activeDatasets: 0,
    archivedDatasets: 0
  });

  useEffect(() => {
    // ✅ Replace later with backend list endpoint:
    // GET /api/datasets
    const mockFetch = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 700));

      const mock = [
        {
          id: 'd1',
          datasetName: 'Provincial Yield 2015–2024',
          category: 'yield',
          version: 'v3',
          year: 2026,
          quarter: 'Q1',
          fileName: 'provincial_yield_2015_2024.csv',
          fileSize: 2243120,
          storedPath: '/storage/datasets/yield/provincial_yield_2015_2024.csv',
          status: 'active',
          uploadedBy: 'Admin',
          uploadedAt: '2026-01-22'
        },
        {
          id: 'd2',
          datasetName: 'Climate Summary (Monthly)',
          category: 'climate',
          version: 'v1',
          year: 2025,
          quarter: 'Q4',
          fileName: 'climate_monthly.csv',
          fileSize: 612004,
          storedPath: '/storage/datasets/climate/climate_monthly.csv',
          status: 'active',
          uploadedBy: 'Admin',
          uploadedAt: '2026-01-10'
        },
        {
          id: 'd3',
          datasetName: 'Old Yield Backup',
          category: 'yield',
          version: 'v1',
          year: 2024,
          quarter: 'Q2',
          fileName: 'yield_old_backup.csv',
          fileSize: 3980021,
          storedPath: '/storage/datasets/yield/yield_old_backup.csv',
          status: 'archived',
          uploadedBy: 'Admin',
          uploadedAt: '2025-09-01'
        }
      ];

      setDatasets(mock);

      const totalDatasets = mock.length;
      const activeDatasets = mock.filter((d) => d.status === 'active').length;
      const archivedDatasets = mock.filter((d) => d.status === 'archived').length;

      setStats({ totalDatasets, activeDatasets, archivedDatasets });
      setLoading(false);
    };

    mockFetch();
  }, []);

  const filteredDatasets = useMemo(() => {
    let list = [...datasets];

    if (categoryFilter !== 'ALL') list = list.filter((d) => d.category === categoryFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.datasetName.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.version.toLowerCase().includes(q) ||
          `${d.year}${d.quarter}`.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));
    return list;
  }, [datasets, categoryFilter, search]);

  const handleOpenUpload = () => {
    setForm({
      datasetName: '',
      category: 'yield',
      version: 'v1',
      year: new Date().getFullYear(),
      quarter: 'Q1',
      description: '',
      status: 'active'
    });
    setSelectedFile(null);
    setFileError('');
    setUploadOpen(true);
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    if (!isCsvFile(file)) {
      setSelectedFile(null);
      setFileError('Only .csv files are allowed.');
      return;
    }

    setSelectedFile(file);
    setFileError('');
  };

  const canSave =
    form.datasetName.trim() && form.version.trim() && String(form.year).trim() && form.quarter.trim() && !!selectedFile && !fileError;

  const handleSaveUIOnly = () => {
    // ✅ UI-only simulation (later: send multipart/form-data to Flask)
    const newDoc = {
      id: `d_${Date.now()}`,
      datasetName: form.datasetName.trim(),
      category: form.category,
      version: form.version.trim(),
      year: Number(form.year),
      quarter: form.quarter,
      description: form.description.trim(),
      status: form.status,

      fileName: selectedFile?.name || 'dataset.csv',
      fileSize: selectedFile?.size || 0,

      // placeholder for what backend would return
      storedPath: `/storage/datasets/${form.category}/${selectedFile?.name || 'dataset.csv'}`,

      uploadedBy: 'Admin',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };

    setDatasets((prev) => [newDoc, ...prev]);
    setUploadOpen(false);

    setToast({
      open: true,
      severity: 'success',
      message: 'Dataset added (UI only). Backend upload comes later.'
    });
  };

  const handleArchiveToggle = (datasetId) => {
    setDatasets((prev) => prev.map((d) => (d.id === datasetId ? { ...d, status: d.status === 'active' ? 'archived' : 'active' } : d)));
  };

  const handleDeleteUIOnly = (datasetId) => {
    setDatasets((prev) => prev.filter((d) => d.id !== datasetId));
    setToast({ open: true, severity: 'info', message: 'Dataset removed (UI only).' });
  };

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* row 1 */}
      <Grid size={12}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Typography variant="h5">Data Source Management</Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dataset..."
              sx={{ minWidth: { xs: '100%', sm: 260 } }}
            />

            <Stack direction="row" spacing={1} alignItems="center">
              <InputLabel>Category:</InputLabel>
              <Select
                size="small"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                sx={{ minWidth: { xs: '100%', sm: 170 } }}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c === 'ALL' ? 'ALL' : c.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenUpload}>
              Upload Dataset
            </Button>
          </Stack>
        </Stack>
      </Grid>

      {/* stats */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <AdminSummaryCard title="Total Datasets" value={stats.totalDatasets} subtitle="All dataset entries" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <AdminSummaryCard title="Active Datasets" value={stats.activeDatasets} subtitle="Available for system use" loading={loading} />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <AdminSummaryCard title="Archived Datasets" value={stats.archivedDatasets} subtitle="Saved for backup/history" loading={loading} />
      </Grid>

      {/* datasets table */}
      <Grid size={{ xs: 12 }}>
        <MainCard content={false} sx={{ mt: 1.5 }}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Datasets</Typography>
              <Typography variant="caption" color="text.secondary">
                Showing {loading ? '...' : filteredDatasets.length} result(s)
              </Typography>
            </Stack>

            <Divider />

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Dataset</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>File</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Uploaded</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading
                    ? Array.from({ length: 8 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Skeleton width="70%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={90} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={60} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={70} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width="80%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={80} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={110} />
                          </TableCell>
                          <TableCell align="right">
                            <Skeleton width={140} />
                          </TableCell>
                        </TableRow>
                      ))
                    : filteredDatasets.map((d) => (
                        <TableRow key={d.id} hover>
                          <TableCell>
                            <Stack spacing={0.2}>
                              <Typography variant="body2">{d.datasetName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {d.storedPath}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <CategoryChip category={d.category} />
                          </TableCell>

                          <TableCell>{d.version}</TableCell>

                          <TableCell>
                            {d.year}
                            {d.quarter}
                          </TableCell>

                          <TableCell>
                            <Stack spacing={0.2}>
                              <Typography variant="body2">{d.fileName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatBytes(d.fileSize)}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <StatusChip status={d.status} />
                          </TableCell>

                          <TableCell>
                            <Stack spacing={0.2}>
                              <Typography variant="body2">{d.uploadedAt}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                by {d.uploadedBy}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="Preview/Download (later)">
                                <IconButton size="small">
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title={d.status === 'active' ? 'Archive dataset' : 'Restore dataset'}>
                                <IconButton size="small" onClick={() => handleArchiveToggle(d.id)}>
                                  {d.status === 'active' ? <ArchiveIcon fontSize="small" /> : <UnarchiveIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Delete (UI only)">
                                <IconButton size="small" onClick={() => handleDeleteUIOnly(d.id)}>
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}

                  {!loading && filteredDatasets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Typography variant="body2" color="text.secondary">
                          No datasets found.
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

      {/* Upload Dataset Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Upload Dataset (CSV)</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              This will upload the dataset to your Flask server storage folder (local machine). Backend integration comes next.
            </Typography>

            <Stack spacing={1}>
              <InputLabel>Dataset Name</InputLabel>
              <TextField
                placeholder="Enter dataset name"
                value={form.datasetName}
                onChange={(e) => setForm((p) => ({ ...p, datasetName: e.target.value }))}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Stack spacing={1} sx={{ flex: 1 }}>
                <InputLabel>Category</InputLabel>
                <Select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                  <MenuItem value="yield">Yield</MenuItem>
                  <MenuItem value="climate">Climate</MenuItem>
                  <MenuItem value="price">Price</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </Stack>

              <Stack spacing={1} sx={{ flex: 1 }}>
                <InputLabel>Version (e.g. v1, v2)</InputLabel>
                <TextField value={form.version} onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))} sx={{ flex: 1 }} />
              </Stack>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Stack spacing={1} sx={{ flex: 1 }}>
                <InputLabel>Year</InputLabel>
                <TextField
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
                  sx={{ flex: 1 }}
                />
              </Stack>

              <Stack spacing={1} sx={{ flex: 1 }}>
                <InputLabel>Quarter</InputLabel>
                <Select value={form.quarter} onChange={(e) => setForm((p) => ({ ...p, quarter: e.target.value }))}>
                  <MenuItem value="Q1">Q1</MenuItem>
                  <MenuItem value="Q2">Q2</MenuItem>
                  <MenuItem value="Q3">Q3</MenuItem>
                  <MenuItem value="Q4">Q4</MenuItem>
                </Select>
              </Stack>
            </Stack>

            {/* File Picker */}
            <Stack spacing={1}>
              <InputLabel>CSV File</InputLabel>

              <Button variant="outlined" startIcon={<UploadFileIcon />} component="label">
                Choose File
                <input hidden type="file" accept=".csv,text/csv" onChange={(e) => handleFileSelect(e.target.files?.[0])} />
              </Button>

              {selectedFile ? (
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Stack spacing={0.4}>
                    <Typography variant="body2">{selectedFile.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatBytes(selectedFile.size)}
                    </Typography>
                  </Stack>
                </Paper>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  No file selected.
                </Typography>
              )}

              {fileError && (
                <Typography variant="caption" color="error">
                  {fileError}
                </Typography>
              )}
            </Stack>

            <TextField
              label="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              fullWidth
              multiline
              minRows={3}
            />

            <Stack spacing={1}>
              <InputLabel>Status</InputLabel>
              <Select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveUIOnly} disabled={!canSave}>
            Save Dataset
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar open={toast.open} autoHideDuration={2200} onClose={() => setToast((p) => ({ ...p, open: false }))}>
        <Alert onClose={() => setToast((p) => ({ ...p, open: false }))} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
