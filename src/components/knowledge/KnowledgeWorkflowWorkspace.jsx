import { useEffect, useMemo, useRef, useState } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';

import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';

import MainCard from 'components/MainCard';
import { useKnowledgeWorkflowViewModel } from 'viewModel/useKnowledgeWorkflowViewModel';

const ACRONYM_MAP = {
  ati: 'ATI',
  hvcdp: 'HVCDP',
  pcarrd: 'PCARRD',
  da: 'DA',
  dabafs: 'DA BAFS',
  bafs: 'BAFS',
  philrice: 'PhilRice',
  pdf: 'PDF',
  roadmap: 'Roadmap',
  palaycheck: 'PalayCheck',
  mungbean: 'Mungbean',
  snapbean: 'Snap Bean'
};

const TITLE_TOKEN_MAP = {
  black: 'Black',
  pepper: 'Pepper',
  cassava: 'Cassava',
  corn: 'Corn',
  cucumber: 'Cucumber',
  dabafs: 'DA BAFS',
  da: 'DA',
  eggplant: 'Eggplant',
  fruits: 'Fruits',
  gap: 'GAP',
  ginger: 'Ginger',
  guide: 'Guide',
  hvcdp: 'HVCDP',
  industry: 'Industry',
  lettuce: 'Lettuce',
  manual: 'Manual',
  mungbean: 'Mungbean',
  onion: 'Onion',
  palay: 'Palay',
  palaycheck: 'PalayCheck',
  pcarrd: 'PCARRD',
  pdf: 'PDF',
  philrice: 'PhilRice',
  production: 'Production',
  rice: 'Rice',
  roadmap: 'Roadmap',
  shallot: 'Shallot',
  snapbean: 'Snap Bean',
  coffee: 'Coffee',
  standards: 'Standards',
  sweet: 'Sweet',
  taro: 'Taro',
  technoguide: 'TechnoGuide',
  vegetables: 'Vegetables'
};

const TAG_SKIP_TOKENS = new Set([
  'and',
  'ati',
  'bafs',
  'da',
  'dabafs',
  'guide',
  'hvcdp',
  'manual',
  'of',
  'pcarrd',
  'pdf',
  'philrice',
  'the'
]);

const FILENAME_CATEGORY_RULES = [
  { match: ['gap', 'fruits', 'vegetables'], category: 'STANDARDS', authority: 'DA BAFS', tags: ['gap', 'fruits', 'vegetables', 'standards'] },
  { match: ['gap', 'rice'], category: 'PALAY', authority: 'DA BAFS', tags: ['palay', 'rice', 'gap', 'standards'] },
  { match: ['roadmap', 'rice'], category: 'PALAY', authority: 'Philippine Government', tags: ['palay', 'rice', 'roadmap', 'policy'] },
  { match: ['philrice'], category: 'PALAY', authority: 'PhilRice', tags: ['palay', 'rice'] },
  { match: ['palay'], category: 'PALAY', authority: 'PhilRice', tags: ['palay', 'rice'] },
  { match: ['rice'], category: 'PALAY', authority: 'PhilRice', tags: ['palay', 'rice'] },
  { match: ['corn'], category: 'CORN', authority: 'Department of Agriculture', tags: ['corn', 'maize', 'production'] },
  { match: ['mungbean'], category: 'LEGUMES', authority: 'HVCDP', tags: ['mungbean', 'mongo', 'legumes', 'production'] },
  { match: ['mongo'], category: 'LEGUMES', authority: 'HVCDP', tags: ['mungbean', 'mongo', 'legumes', 'production'] },
  { match: ['banana'], category: 'FRUIT_CROPS', authority: 'HVCDP', tags: ['banana', 'fruit', 'production'] },
  { match: ['cacao'], category: 'INDUSTRIAL', authority: 'HVCDP', tags: ['cacao', 'cocoa', 'production'] },
  { match: ['coffee'], category: 'INDUSTRIAL', authority: 'HVCDP', tags: ['coffee', 'industrial', 'production'] },
  { match: ['carrot'], category: 'ROOT_CROPS', authority: 'Department of Agriculture', tags: ['carrot', 'root crops', 'production'] },
  { match: ['taro'], category: 'ROOT_CROPS', authority: 'HVCDP', tags: ['taro', 'gabi', 'root crops', 'production'] },
  { match: ['gabi'], category: 'ROOT_CROPS', authority: 'HVCDP', tags: ['taro', 'gabi', 'root crops', 'production'] },
  { match: ['cassava'], category: 'INDUSTRIAL', authority: 'Department of Agriculture', tags: ['cassava', 'industrial', 'root crops', 'production'] },
  { match: ['eggplant'], category: 'VEGETABLES', authority: 'PCARRD', tags: ['eggplant', 'talong', 'vegetables', 'production'] },
  { match: ['talong'], category: 'VEGETABLES', authority: 'PCARRD', tags: ['eggplant', 'talong', 'vegetables', 'production'] },
  { match: ['cucumber'], category: 'VEGETABLES', authority: 'PCARRD', tags: ['cucumber', 'pipino', 'vegetables', 'production'] },
  { match: ['pipino'], category: 'VEGETABLES', authority: 'PCARRD', tags: ['cucumber', 'pipino', 'vegetables', 'production'] },
  { match: ['snapbean'], category: 'VEGETABLES', authority: 'PCARRD', tags: ['snapbean', 'beans', 'vegetables', 'production'] },
  { match: ['snap', 'bean'], category: 'VEGETABLES', authority: 'PCARRD', tags: ['snap bean', 'beans', 'vegetables', 'production'] },
  { match: ['sweet', 'pepper'], category: 'VEGETABLES', authority: 'PCARRD', tags: ['sweet pepper', 'pepper', 'vegetables', 'production'] },
  { match: ['lettuce'], category: 'LEAFY_VEGETABLES', authority: 'PCARRD', tags: ['lettuce', 'leafy vegetables', 'production'] },
  { match: ['ginger'], category: 'SPICES', authority: 'PCARRD', tags: ['ginger', 'luya', 'spices', 'production'] },
  { match: ['luya'], category: 'SPICES', authority: 'PCARRD', tags: ['ginger', 'luya', 'spices', 'production'] },
  { match: ['black', 'pepper'], category: 'SPICES', authority: 'PCARRD', tags: ['black pepper', 'paminta', 'spices', 'production'] },
  { match: ['paminta'], category: 'SPICES', authority: 'PCARRD', tags: ['black pepper', 'paminta', 'spices', 'production'] },
  { match: ['onion', 'shallot'], category: 'VEGETABLES', authority: 'PCARRD', tags: ['onion', 'shallot', 'sibuyas', 'vegetables', 'production'] },
  { match: ['sibuyas'], category: 'VEGETABLES', authority: 'PCARRD', tags: ['onion', 'shallot', 'sibuyas', 'vegetables', 'production'] }
];

const AUTHORITY_RULES = [
  { match: ['philrice'], authority: 'PhilRice' },
  { match: ['pcarrd'], authority: 'PCARRD' },
  { match: ['hvcdp'], authority: 'HVCDP' },
  { match: ['ati'], authority: 'ATI' },
  { match: ['dabafs'], authority: 'DA BAFS' },
  { match: ['bafs'], authority: 'DA BAFS' },
  { match: ['department', 'agriculture'], authority: 'Department of Agriculture' },
  { match: ['roadmap'], authority: 'Philippine Government' },
  { match: ['da'], authority: 'Department of Agriculture' }
];

function extractErrorText(err, fallback) {
  return err?.error || fallback;
}

function formatDate(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function phaseChip(phase) {
  const normalized = String(phase || '').toLowerCase();
  if (normalized === 'draft_validated') return <Chip size="small" label="Draft Validated" color="success" variant="outlined" />;
  if (normalized === 'draft_built') return <Chip size="small" label="Draft Built" color="info" variant="outlined" />;
  if (normalized === 'draft_detected') return <Chip size="small" label="Draft Detected" color="warning" variant="outlined" />;
  if (normalized === 'published') return <Chip size="small" label="No Draft Changes" color="default" variant="outlined" />;
  return <Chip size="small" label="Not Ready" color="warning" variant="outlined" />;
}

function publishChip(state) {
  const normalized = String(state || '').toLowerCase();
  if (normalized === 'ready_to_commit') return <Chip size="small" label="Ready to Commit" color="success" variant="outlined" />;
  if (normalized === 'up_to_date') return <Chip size="small" label="No Pending Commit" color="default" variant="outlined" />;
  if (normalized === 'awaiting_validation') return <Chip size="small" label="Awaiting Validation" color="warning" variant="outlined" />;
  return <Chip size="small" label="Blocked" color="error" variant="outlined" />;
}

function humanizeStem(stem) {
  return String(stem || '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((token) => {
      const lowered = token.toLowerCase();
      if (TITLE_TOKEN_MAP[lowered]) return TITLE_TOKEN_MAP[lowered];
      if (ACRONYM_MAP[lowered]) return ACRONYM_MAP[lowered];
      return lowered.charAt(0).toUpperCase() + lowered.slice(1);
    })
    .join(' ');
}

function tokenizeStem(stem) {
  return Array.from(new Set(String(stem || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)));
}

function stemHasPart(tokenSet, normalizedStem, part) {
  const normalizedPart = String(part || '').toLowerCase().replace(/[_-]+/g, ' ').trim();
  if (!normalizedPart) return false;
  return normalizedPart.includes(' ') ? normalizedStem.includes(normalizedPart) : tokenSet.has(normalizedPart);
}

function inferMetadataFromFilename(filename, categories = []) {
  const safeFilename = String(filename || '').trim();
  const stem = safeFilename.replace(/\.pdf$/i, '');
  const tokens = tokenizeStem(stem);
  const tokenSet = new Set(tokens);
  const normalizedStem = tokens.join(' ');
  const slug = stem.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  const matchedRule = FILENAME_CATEGORY_RULES.find((rule) => rule.match.every((part) => stemHasPart(tokenSet, normalizedStem, part)));
  const matchedAuthorityRule = AUTHORITY_RULES.find((rule) => rule.match.every((part) => stemHasPart(tokenSet, normalizedStem, part)));
  const category = matchedRule?.category && categories.includes(matchedRule.category) ? matchedRule.category : '';
  const authority =
    matchedRule?.authority ||
    matchedAuthorityRule?.authority ||
    '';
  const baseTags = matchedRule?.tags || [];
  const inferredTags = Array.from(
    new Set(
      [
        ...baseTags,
        ...(tokenSet.has('guide') ? ['guide'] : []),
        ...(tokenSet.has('manual') ? ['manual'] : []),
        ...(tokenSet.has('roadmap') ? ['roadmap'] : []),
        ...(tokenSet.has('technoguide') ? ['technoguide'] : []),
        ...tokens
          .map((token) => token.toLowerCase().trim())
          .filter((token) => token && !TAG_SKIP_TOKENS.has(token))
      ].filter(Boolean)
    )
  );

  return {
    filename: safeFilename,
    documentId: slug,
    title: humanizeStem(stem),
    category,
    authority,
    tags: inferredTags.join(', ')
  };
}

function MetricCard({ title, value, subtitle, loading = false }) {
  return (
    <MainCard content={false} sx={{ height: '100%' }}>
      <Stack sx={{ p: 2.5 }} spacing={0.75}>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        {loading ? (
          <Skeleton width="45%" />
        ) : typeof value === 'string' || typeof value === 'number' ? (
          <Typography variant="h4">{value}</Typography>
        ) : (
          value
        )}
        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
    </MainCard>
  );
}

function DocumentDialog({ open, title, form, categories, onChange, onAutoFill, onClose, onSubmit, saving }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary">
              Suggested values are generated from the raw filename. Review before saving.
            </Typography>
            <Button size="small" variant="text" onClick={onAutoFill}>
              Auto-fill from filename
            </Button>
          </Stack>
          <TextField
            label="Raw PDF Filename"
            value={form.filename}
            onChange={(e) => onChange('filename', e.target.value)}
            fullWidth
            helperText="The file must already exist in backend/knowledge/raw."
          />
          <TextField
            label="Document ID"
            value={form.documentId}
            onChange={(e) => onChange('documentId', e.target.value)}
            fullWidth
            helperText="Lowercase slug used for processed artifact names."
          />
          <TextField label="Title" value={form.title} onChange={(e) => onChange('title', e.target.value)} fullWidth />
          <TextField
            select
            label="Category"
            value={form.category}
            onChange={(e) => onChange('category', e.target.value)}
            fullWidth
          >
            {(categories || []).map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Authority" value={form.authority} onChange={(e) => onChange('authority', e.target.value)} fullWidth />
          <TextField
            label="Tags"
            value={form.tags}
            onChange={(e) => onChange('tags', e.target.value)}
            fullWidth
            helperText="Comma-separated tags used for retrieval focus."
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function KnowledgeWorkflowWorkspace({ header = null, audienceLabel, introTitle, introBody, mode = 'ml' }) {
  const {
    workflow,
    loading,
    scanning,
    uploadingRawFiles,
    deletingRawFile,
    building,
    validating,
    savingDocument,
    deletingDocument,
    fetchWorkflow,
    scanWorkflow,
    uploadRawFiles,
    deleteRawFile,
    buildWorkflow,
    validateWorkflow,
    registerDocument,
    updateDocument,
    deleteDocument
  } = useKnowledgeWorkflowViewModel();

  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteRawTarget, setDeleteRawTarget] = useState(null);
  const uploadInputRef = useRef(null);
  const [form, setForm] = useState({
    filename: '',
    documentId: '',
    title: '',
    category: '',
    authority: '',
    tags: ''
  });
  const showIntroCard = Boolean(audienceLabel || introTitle || introBody);

  useEffect(() => {
    fetchWorkflow();
  }, []);

  const categories = workflow?.allowedCategories || [];
  const registeredDocuments = workflow?.registryDocuments || [];
  const rawFiles = workflow?.scan?.rawFiles || [];
  const unregisteredRawFiles = workflow?.scan?.unregisteredRawFiles || [];
  const missingRegistryDocuments = workflow?.scan?.missingRegistryDocuments || [];
  const changedRegistryDocuments = workflow?.scan?.changedRegistryDocuments || [];
  const manifestOnlyDocuments = workflow?.scan?.manifestOnlyDocuments || [];
  const queryResults = workflow?.validation?.queries || [];
  const isAdminView = mode === 'admin';

  const registryIssueLookup = useMemo(() => {
    const map = new Map();
    changedRegistryDocuments.forEach((item) => map.set(item.documentId, 'Changed'));
    missingRegistryDocuments.forEach((item) => map.set(item.documentId, 'Missing Raw'));
    return map;
  }, [changedRegistryDocuments, missingRegistryDocuments]);

  const openRegisterDialog = (rawFile) => {
    setEditingDocument(null);
    setForm(inferMetadataFromFilename(rawFile?.filename || '', categories));
    setDialogOpen(true);
  };

  const openEditDialog = (document) => {
    setEditingDocument(document);
    setForm({
      filename: document?.filename || '',
      documentId: document?.document_id || '',
      title: document?.title || '',
      category: document?.category || categories[0] || '',
      authority: document?.authority || '',
      tags: Array.isArray(document?.tags) ? document.tags.join(', ') : ''
    });
    setDialogOpen(true);
  };

  const handleDialogChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleAutoFill = () => {
    setForm((current) => ({
      ...current,
      ...inferMetadataFromFilename(current.filename, categories)
    }));
  };

  const handleDialogSubmit = async () => {
    const payload = {
      filename: form.filename.trim(),
      documentId: form.documentId.trim(),
      title: form.title.trim(),
      category: form.category,
      authority: form.authority.trim(),
      tags: form.tags.split(',').map((item) => item.trim()).filter(Boolean)
    };
    const result = editingDocument
      ? await updateDocument(editingDocument.document_id, payload)
      : await registerDocument(payload);

    if (!result.success) {
      setToast({ open: true, severity: 'error', message: extractErrorText(result, 'Failed to save document.') });
      return;
    }

    setDialogOpen(false);
    setEditingDocument(null);
    setToast({
      open: true,
      severity: 'success',
      message: editingDocument ? 'Knowledge document updated.' : 'Knowledge document registered.'
    });
  };

  const handleDeleteDocument = async () => {
    if (!deleteTarget?.document_id) return;
    const result = await deleteDocument(deleteTarget.document_id);
    if (!result.success) {
      setToast({ open: true, severity: 'error', message: extractErrorText(result, 'Failed to remove document.') });
      return;
    }
    setDeleteTarget(null);
    setToast({ open: true, severity: 'warning', message: 'Knowledge document removed from registry.' });
  };

  const handleDeleteRawFile = async () => {
    if (!deleteRawTarget?.filename) return;
    const result = await deleteRawFile(deleteRawTarget.filename);
    if (!result.success) {
      setToast({ open: true, severity: 'error', message: extractErrorText(result, 'Failed to remove raw PDF.') });
      return;
    }
    setDeleteRawTarget(null);
    setToast({ open: true, severity: 'warning', message: 'Unregistered raw PDF removed.' });
  };

  const handleScan = async () => {
    const result = await scanWorkflow();
    setToast({
      open: true,
      severity: result.success ? 'success' : 'error',
      message: result.success ? 'Raw knowledge folder scanned.' : extractErrorText(result, 'Scan failed.')
    });
  };

  const handleBuild = async () => {
    const result = await buildWorkflow();
    setToast({
      open: true,
      severity: result.success ? 'success' : 'error',
      message: result.success ? 'Local knowledge corpus rebuilt.' : extractErrorText(result, 'Build failed.')
    });
  };

  const handleUploadSelection = async (event) => {
    const files = event?.target?.files;
    if (!files?.length) return;
    const result = await uploadRawFiles(files);
    if (!result.success) {
      setToast({ open: true, severity: 'error', message: extractErrorText(result, 'Upload failed.') });
    } else {
      const uploadedCount = result?.data?.uploadedFiles?.length || files.length;
      setToast({
        open: true,
        severity: 'success',
        message: `${uploadedCount} raw PDF file${uploadedCount === 1 ? '' : 's'} uploaded to backend/knowledge/raw.`
      });
    }
    if (event?.target) {
      event.target.value = '';
    }
  };

  const handleValidate = async () => {
    const result = await validateWorkflow();
    setToast({
      open: true,
      severity: result.success ? 'success' : 'error',
      message: result.success ? 'Knowledge validation completed.' : extractErrorText(result, 'Validation failed.')
    });
  };

  const overviewCard = (
    <Grid size={12}>
      <MainCard content={false}>
        <Stack sx={{ p: 2.5 }} spacing={1.5}>
          <Typography variant="overline" color={isAdminView ? 'warning.main' : 'success.main'}>
            {isAdminView ? 'Admin Focus' : 'ML Focus'}
          </Typography>
          <Typography variant="h5">
            {isAdminView ? 'Release oversight and publish readiness' : 'Operational build and validation workflow'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdminView
              ? 'This page is intentionally limited to release oversight. Use it to review blockers, confirm validation status, and coordinate the final commit/push that updates the Render-served assistant knowledge.'
              : 'This page is primarily for hands-on corpus work. Use it to scan local PDFs, register metadata, rebuild the draft corpus, and validate retrieval quality before release.'}
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} flexWrap="wrap">
            <Chip
              size="small"
              variant="outlined"
              color={isAdminView ? 'warning' : 'success'}
              label={isAdminView ? 'Primary: review readiness, blockers, publish handoff' : 'Primary: scan, register, build, validate'}
            />
            <Chip
              size="small"
              variant="outlined"
              label={isAdminView ? 'Local build and registry tools are hidden here for simplicity' : 'Release checklist is handled from the Admin view'}
            />
          </Stack>
        </Stack>
      </MainCard>
    </Grid>
  );

  const workflowActionsCard = (
    <Grid size={12}>
      <MainCard content={false}>
        <Stack sx={{ p: 2.5 }} spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
            <Stack spacing={0.5}>
              <Typography variant="h6">{isAdminView ? 'Local Draft Controls' : 'Local Knowledge Workflow'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {isAdminView
                  ? 'These tools are still available for Admin when needed, but they are secondary to the release review sections above.'
                  : 'Scan the raw folder, register metadata, rebuild the corpus, and validate it before you commit the generated artifacts.'}
              </Typography>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchWorkflow} disabled={loading}>
                Refresh
              </Button>
              <Button variant="outlined" startIcon={<SyncIcon />} onClick={handleScan} disabled={scanning}>
                {scanning ? <CircularProgress size={18} color="inherit" /> : 'Scan Raw Folder'}
              </Button>
              <Button variant="contained" startIcon={<ConstructionOutlinedIcon />} onClick={handleBuild} disabled={building}>
                {building ? <CircularProgress size={18} color="inherit" /> : isAdminView ? 'Rebuild Draft' : 'Build Local Corpus'}
              </Button>
              <Button variant="contained" color="secondary" startIcon={<FactCheckOutlinedIcon />} onClick={handleValidate} disabled={validating}>
                {validating ? <CircularProgress size={18} color="inherit" /> : isAdminView ? 'Re-run Validation' : 'Validate'}
              </Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} flexWrap="wrap">
            {phaseChip(workflow?.phase)}
            <Chip size="small" label={`Corpus: ${workflow?.corpusVersion || '-'}`} variant="outlined" />
            <Chip size="small" label={`Registry: ${workflow?.registryPath || 'backend/knowledge/manifest/registry.json'}`} variant="outlined" />
            <Chip size="small" label={`Raw folder: ${workflow?.rawDirectory || 'backend/knowledge/raw'}`} variant="outlined" />
          </Stack>

          {workflow?.build?.error ? <Alert severity="error">Last build failed: {workflow.build.error}</Alert> : null}
          {workflow?.validation?.failedChecks?.length ? (
            <Alert severity="error">Validation failed: {workflow.validation.failedChecks.join(' ')}</Alert>
          ) : null}
        </Stack>
      </MainCard>
    </Grid>
  );

  const rawSourceCard = (
    <Grid size={12}>
      <MainCard content={false}>
        <Stack sx={{ p: 2.5 }} spacing={2}>
          <Typography variant="h6">{isAdminView ? 'Raw Source Intake' : 'Raw Source Scan'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdminView
              ? 'Use this as a release checkpoint for newly added local PDFs. Admin can still open the registration form, but this section mainly helps confirm nothing is waiting unnoticed.'
              : 'Upload new PDFs here or place them directly in the raw folder, then scan to detect and register them.'}
          </Typography>
          {!isAdminView ? (
            <>
              <input
                ref={uploadInputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                hidden
                onChange={handleUploadSelection}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<UploadFileOutlinedIcon />}
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={uploadingRawFiles}
                >
                  {uploadingRawFiles ? <CircularProgress size={18} color="inherit" /> : 'Upload Raw PDFs'}
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                  Allowed for ML engineer, admin, and superadmin on the local deployment only.
                </Typography>
              </Stack>
            </>
          ) : null}
          {loading ? (
            <Skeleton variant="rectangular" height={200} />
          ) : (
            <>
              {unregisteredRawFiles.length === 0 ? (
                <Alert severity="success">No unregistered raw PDFs detected.</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Filename</TableCell>
                        <TableCell>Modified</TableCell>
                        <TableCell align="right">{isAdminView ? 'Review' : 'Action'}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {unregisteredRawFiles.map((file) => (
                        <TableRow key={file.filename}>
                          <TableCell>{file.filename}</TableCell>
                          <TableCell>{formatDate(file.modifiedAt)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => openRegisterDialog(file)}>
                                {isAdminView ? 'Open form' : 'Register'}
                              </Button>
                              {!isAdminView ? (
                                <IconButton size="small" color="error" onClick={() => setDeleteRawTarget(file)}>
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              ) : null}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {missingRegistryDocuments.length > 0 ? (
                <Alert severity="warning">
                  {missingRegistryDocuments.length} registered document(s) have no matching raw PDF in the folder.
                </Alert>
              ) : null}
              {manifestOnlyDocuments.length > 0 ? (
                <Alert severity="info">
                  {manifestOnlyDocuments.length} built document(s) are no longer present in the registry and will disappear on the next rebuild.
                </Alert>
              ) : null}
            </>
          )}
        </Stack>
      </MainCard>
    </Grid>
  );

  const registryCard = (
    <Grid size={12}>
      <MainCard content={false}>
        <Stack sx={{ p: 2.5 }} spacing={2}>
          <Typography variant="h6">{isAdminView ? 'Registry Review' : 'Knowledge Registry'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdminView
              ? 'Treat this as the release contract for the corpus. Review coverage, metadata quality, and issue status before approving a publish handoff.'
              : 'Registered documents drive extraction, chunking, and retrieval. Edit metadata here after adding a raw PDF locally.'}
          </Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={260} />
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Document</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Authority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registeredDocuments.map((document) => {
                    const issueLabel = registryIssueLookup.get(document.document_id) || 'Ready';
                    const issueColor = issueLabel === 'Ready' ? 'success' : issueLabel === 'Changed' ? 'warning' : 'error';
                    return (
                      <TableRow key={document.document_id}>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="subtitle2">{document.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {document.document_id} · {document.filename}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{document.category}</TableCell>
                        <TableCell>{document.authority}</TableCell>
                        <TableCell>
                          <Chip size="small" label={issueLabel} color={issueColor} variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton size="small" onClick={() => openEditDialog(document)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(document)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </MainCard>
    </Grid>
  );

  const validationCard = (
    <Grid size={12}>
      <MainCard content={false}>
        <Stack sx={{ p: 2.5 }} spacing={1.5}>
          <Typography variant="h6">{isAdminView ? 'Validation Summary' : 'Validation Results'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdminView
              ? 'Admin uses this to confirm the current draft passed its retrieval checks before the manual publish handoff.'
              : 'Validation runs deterministic retrieval smoke checks without needing Gemini to generate a full answer.'}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Chip size="small" label={`Last build: ${formatDate(workflow?.build?.at)}`} variant="outlined" />
            <Chip size="small" label={`Last validation: ${formatDate(workflow?.validation?.at)}`} variant="outlined" />
          </Stack>
          {workflow?.validation?.warnings?.length ? (
            <Alert severity="warning">{workflow.validation.warnings.join(' ')}</Alert>
          ) : (
            <Alert severity={workflow?.validation?.passedCurrent ? 'success' : 'info'}>
              {workflow?.validation?.passedCurrent
                ? 'The latest local build passed the current retrieval smoke checks.'
                : 'Run validation after rebuilding the local corpus.'}
            </Alert>
          )}
          {queryResults.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Query</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>Top Sources</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queryResults.map((query) => (
                    <TableRow key={query.label}>
                      <TableCell>{query.label}</TableCell>
                      <TableCell>
                        <Chip size="small" label={query.passed ? 'Pass' : 'Warning'} color={query.passed ? 'success' : 'warning'} variant="outlined" />
                      </TableCell>
                      <TableCell>{(query.topSources || []).join(', ') || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </Stack>
      </MainCard>
    </Grid>
  );

  const publishReadinessCard = (
    <Grid size={12}>
      <MainCard content={false}>
        <Stack sx={{ p: 2.5 }} spacing={1.5}>
          <Typography variant="h6">{isAdminView ? 'Release Readiness' : 'Publish Readiness'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdminView
              ? 'This is the Admin checkpoint. Production changes happen only after the processed knowledge files are committed, pushed, and deployed on Render.'
              : 'Manual publish is still required. Production only changes after the processed knowledge files are committed and pushed to the repository.'}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {publishChip(workflow?.publish?.state)}
            <Chip size="small" label={`Pending knowledge changes: ${workflow?.publish?.git?.count ?? 0}`} variant="outlined" />
          </Stack>

          {workflow?.publish?.blockers?.length ? (
            <Alert severity="error">
              <Stack spacing={0.5}>
                {workflow.publish.blockers.map((blocker) => (
                  <Typography key={blocker} variant="body2">
                    {blocker}
                  </Typography>
                ))}
              </Stack>
            </Alert>
          ) : (
            <Alert severity="success">
              {isAdminView
                ? 'No current blockers detected. Admin can now review the checklist before the final commit and push.'
                : 'No current blockers detected. The local draft is ready for commit/push review.'}
            </Alert>
          )}

          <Divider />
          <Typography variant="subtitle2">{isAdminView ? 'Release checklist' : 'Manual publish steps'}</Typography>
          <Stack spacing={0.5}>
            {(workflow?.publish?.manualSteps || []).map((step, index) => (
              <Typography key={step} variant="body2" color="text.secondary">
                {index + 1}. {step}
              </Typography>
            ))}
          </Stack>

          {workflow?.publish?.git?.paths?.length ? (
            <>
              <Divider />
              <Typography variant="subtitle2">Pending knowledge changes</Typography>
              <Stack spacing={0.25}>
                {workflow.publish.git.paths.slice(0, 12).map((path) => (
                  <Typography key={path} variant="caption" color="text.secondary">
                    {path}
                  </Typography>
                ))}
              </Stack>
            </>
          ) : null}
        </Stack>
      </MainCard>
    </Grid>
  );

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {header ? <Grid size={12}>{header}</Grid> : null}

      {showIntroCard ? (
        <Grid size={12}>
          <MainCard content={false}>
            <Stack sx={{ p: 2.5 }} spacing={1.5}>
              {audienceLabel ? (
                <Typography variant="overline" color="success.main">
                  {audienceLabel}
                </Typography>
              ) : null}
              {introTitle ? <Typography variant="h4">{introTitle}</Typography> : null}
              {introBody ? (
                <Typography variant="body2" color="text.secondary">
                  {introBody}
                </Typography>
              ) : null}
              <Alert severity="info">
                Raw PDFs stay local in <strong>backend/knowledge/raw</strong>. Production changes only take effect after the updated processed
                knowledge is committed and pushed to the repository, then redeployed on Render.
              </Alert>
            </Stack>
          </MainCard>
        </Grid>
      ) : null}

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MetricCard
          title="Workflow Phase"
          value={loading ? '...' : phaseChip(workflow?.phase)}
          subtitle={loading ? '' : `Provider: ${workflow?.provider?.name || '-'} · ${workflow?.provider?.model || '-'}`}
          loading={false}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MetricCard
          title="Raw PDFs"
          value={workflow?.scan?.rawFileCount ?? 0}
          subtitle={`${workflow?.scan?.unregisteredRawFiles?.length ?? 0} waiting for registration`}
          loading={loading}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MetricCard
          title="Registered Docs"
          value={workflow?.scan?.registryDocumentCount ?? 0}
          subtitle={`${workflow?.processed?.documentCount ?? 0} currently built`}
          loading={loading}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MetricCard
          title="Publish State"
          value={loading ? '...' : publishChip(workflow?.publish?.state)}
          subtitle={loading ? '' : `${workflow?.processed?.chunkCount ?? 0} chunks in the local corpus`}
          loading={false}
        />
      </Grid>

      {overviewCard}

      {isAdminView ? (
        <>
          {publishReadinessCard}
          {validationCard}
        </>
      ) : (
        <>
          {workflowActionsCard}
          {rawSourceCard}
          {registryCard}
          {validationCard}
        </>
      )}

      <DocumentDialog
        open={dialogOpen}
      title={editingDocument ? 'Edit Knowledge Document' : 'Register Raw PDF'}
      form={form}
      categories={categories}
      onChange={handleDialogChange}
      onAutoFill={handleAutoFill}
      onClose={() => {
        setDialogOpen(false);
        setEditingDocument(null);
      }}
        onSubmit={handleDialogSubmit}
        saving={savingDocument}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove Registry Entry</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Remove <strong>{deleteTarget?.title || deleteTarget?.document_id}</strong> from the local knowledge registry? This does not delete the raw PDF
            file. The document will disappear from future builds unless it is registered again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteDocument} disabled={deletingDocument}>
            {deletingDocument ? <CircularProgress size={18} color="inherit" /> : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteRawTarget} onClose={() => setDeleteRawTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Unregistered Raw PDF</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Delete <strong>{deleteRawTarget?.filename}</strong> from <strong>backend/knowledge/raw</strong>? This only works for unregistered PDFs and
            cannot be undone from the workflow.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRawTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteRawFile} disabled={deletingRawFile}>
            {deletingRawFile ? <CircularProgress size={18} color="inherit" /> : 'Delete PDF'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={2600} onClose={() => setToast((current) => ({ ...current, open: false }))}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
