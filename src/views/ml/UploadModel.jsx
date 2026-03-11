import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MainCard from 'components/MainCard';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import { uploadModelApi } from 'model/mlApi';

const VERSION_REGEX = /^v\d+\.\d+$/;

export default function UploadModel() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    modelVersion: '',
    datasetVersion: '',
    notes: '',
    palayModel: null,
    cornModel: null,
    otherModel: null,
    featureColumnsJson: null
  });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState({
    open: false,
    severity: 'success',
    message: ''
  });

  const onFileChange = (key, files) => {
    const nextFile = files?.[0] || null;
    setForm((prev) => ({ ...prev, [key]: nextFile }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const version = form.modelVersion.trim();
    const datasetVersion = form.datasetVersion.trim();
    if (!version) nextErrors.modelVersion = 'Model version is required';
    else if (!VERSION_REGEX.test(version)) nextErrors.modelVersion = 'Version must follow format vX.Y';
    if (!datasetVersion) nextErrors.datasetVersion = 'Dataset version is required';
    if (!form.palayModel) nextErrors.palayModel = 'PALAY model file is required';
    if (!form.cornModel) nextErrors.cornModel = 'CORN model file is required';
    if (!form.otherModel) nextErrors.otherModel = 'OTHER model file is required';
    if (!form.featureColumnsJson) nextErrors.featureColumnsJson = 'Feature columns JSON file is required';

    const ensureExt = (file, ext, key, label) => {
      if (file && !file.name.toLowerCase().endsWith(ext)) {
        nextErrors[key] = `${label} must be ${ext}`;
      }
    };
    ensureExt(form.palayModel, '.joblib', 'palayModel', 'PALAY model');
    ensureExt(form.cornModel, '.joblib', 'cornModel', 'CORN model');
    ensureExt(form.otherModel, '.joblib', 'otherModel', 'OTHER model');
    ensureExt(form.featureColumnsJson, '.json', 'featureColumnsJson', 'Feature columns file');

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const canSubmit = useMemo(() => !uploading, [uploading]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm() || uploading) {
      return;
    }

    const formData = new FormData();
    formData.append('version', form.modelVersion.trim());
    formData.append('datasetVersion', form.datasetVersion.trim());
    formData.append('notes', form.notes.trim());
    formData.append('palay_model', form.palayModel);
    formData.append('corn_model', form.cornModel);
    formData.append('other_model', form.otherModel);
    formData.append('feature_columns', form.featureColumnsJson);

    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadModelApi(formData, (evt) => {
        if (!evt?.total) return;
        const pct = Math.round((evt.loaded * 100) / evt.total);
        setUploadProgress(pct);
      });
      setToast({
        open: true,
        severity: 'success',
        message: 'Model uploaded and registered successfully.'
      });
      setTimeout(() => navigate('/ml/models'), 500);
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'Model upload failed';
      setToast({
        open: true,
        severity: err?.response?.status === 403 ? 'warning' : 'error',
        message
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack spacing={0.75}>
          <Typography variant="h5">Upload Model Version</Typography>
          <Breadcrumbs separator="/" aria-label="breadcrumb">
            <Link component={RouterLink} underline="hover" color="inherit" to="/">
              Home
            </Link>
            <Typography variant="body2" color="text.secondary">
              ML Management
            </Typography>
            <Typography variant="body2" color="text.primary">
              Upload Model
            </Typography>
          </Breadcrumbs>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <MainCard content={false}>
          <Stack component="form" onSubmit={handleSubmit} sx={{ p: 2.5 }} spacing={2}>
            {uploading && (
              <Stack spacing={0.75}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="caption" color="text.secondary">
                  Uploading... {uploadProgress}%
                </Typography>
              </Stack>
            )}

            <TextField
              label="Model Version"
              value={form.modelVersion}
              onChange={(e) => setForm((p) => ({ ...p, modelVersion: e.target.value }))}
              fullWidth
              error={Boolean(errors.modelVersion)}
              helperText={errors.modelVersion || 'Format: vX.Y (example: v2.0)'}
            />
            <TextField
              label="Dataset Version"
              value={form.datasetVersion}
              onChange={(e) => setForm((p) => ({ ...p, datasetVersion: e.target.value }))}
              fullWidth
              error={Boolean(errors.datasetVersion)}
              helperText={errors.datasetVersion}
            />
            <TextField
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              multiline
              rows={4}
              fullWidth
            />

            <Button variant="outlined" component="label" disabled={uploading}>
              Upload PALAY Model (.joblib)
              <input hidden type="file" accept=".joblib" onChange={(e) => onFileChange('palayModel', e.target.files)} />
            </Button>
            <Typography variant="caption" color={errors.palayModel ? 'error' : 'text.secondary'}>
              {errors.palayModel || form.palayModel?.name || 'No file selected'}
            </Typography>

            <Button variant="outlined" component="label" disabled={uploading}>
              Upload CORN Model (.joblib)
              <input hidden type="file" accept=".joblib" onChange={(e) => onFileChange('cornModel', e.target.files)} />
            </Button>
            <Typography variant="caption" color={errors.cornModel ? 'error' : 'text.secondary'}>
              {errors.cornModel || form.cornModel?.name || 'No file selected'}
            </Typography>

            <Button variant="outlined" component="label" disabled={uploading}>
              Upload OTHER Model (.joblib)
              <input hidden type="file" accept=".joblib" onChange={(e) => onFileChange('otherModel', e.target.files)} />
            </Button>
            <Typography variant="caption" color={errors.otherModel ? 'error' : 'text.secondary'}>
              {errors.otherModel || form.otherModel?.name || 'No file selected'}
            </Typography>

            <Button variant="outlined" component="label" disabled={uploading}>
              Upload Feature Columns JSON
              <input hidden type="file" accept=".json,application/json" onChange={(e) => onFileChange('featureColumnsJson', e.target.files)} />
            </Button>
            <Typography variant="caption" color={errors.featureColumnsJson ? 'error' : 'text.secondary'}>
              {errors.featureColumnsJson || form.featureColumnsJson?.name || 'No file selected'}
            </Typography>

            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button variant="outlined" onClick={() => navigate('/ml/models')} disabled={uploading}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={!canSubmit}>
                {uploading ? 'Registering...' : 'Register Model'}
              </Button>
            </Stack>
          </Stack>
        </MainCard>
      </Grid>

      <Snackbar
        open={toast.open}
        autoHideDuration={2600}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}

