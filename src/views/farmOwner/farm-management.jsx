import { useState } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import AgricultureIcon from '@mui/icons-material/Agriculture';

import MainCard from 'components/MainCard';
import FarmFormModal from 'components/modal/FarmFormModal';
import AnalyticCardSkeleton from '../../components/skeletons/AnalyticCardSkeleton';

import { useFarms } from 'viewModel/useFarms';
import { createFarmApi, updateFarmApi, deleteFarmApi } from 'model/farmApi';
import { clearCropTrendCache } from 'model/cropTrendApi';

export default function FarmManagementPage() {
  const { farms, loading, error, refresh, defaultFarmId, setDefaultFarmId } = useFarms();
  const FIRST_FARM_HELPER_KEY = 'agrisense:first_farm_helper_dismissed';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [farmToDelete, setFarmToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    severity: 'success',
    message: ''
  });
  const [showFirstFarmHelper, setShowFirstFarmHelper] = useState(() => localStorage.getItem(FIRST_FARM_HELPER_KEY) !== '1');

  async function handleSaveFarm(formData) {
    try {
      setSaving(true);

      const payload = {
        name: formData.name,
        province: formData.province,
        soil: {
          soil_type: formData.soil_type,
          ph: Number(formData.ph),
          drainage: formData.drainage,
          fertility: formData.fertility
        }
      };

      if (editingFarm) {
        await updateFarmApi(editingFarm.id, payload);
      } else {
        await createFarmApi(payload);
      }

      setModalOpen(false);
      setEditingFarm(null);
      clearCropTrendCache();
      window.dispatchEvent(new CustomEvent('agrisense:farms-mutated'));
      await refresh();

      setToast({
        open: true,
        severity: 'success',
        message: editingFarm ? 'Farm updated successfully.' : 'Farm created successfully.'
      });
    } catch (err) {
      setToast({
        open: true,
        severity: 'error',
        message: err?.response?.data?.error || 'Failed to save farm.'
      });
    } finally {
      setSaving(false);
    }
  }

  const openDeleteConfirm = (farm) => {
    setFarmToDelete(farm);
    setDeleteOpen(true);
  };

  const handleDeleteFarm = async () => {
    if (!farmToDelete) return;
    try {
      setDeleting(true);
      const deletingDefault = String(farmToDelete.id) === String(defaultFarmId);

      await deleteFarmApi(farmToDelete.id);
      if (deletingDefault) setDefaultFarmId('');

      clearCropTrendCache();
      window.dispatchEvent(new CustomEvent('agrisense:farms-mutated'));
      await refresh();
      setDeleteOpen(false);
      setFarmToDelete(null);

      setToast({
        open: true,
        severity: 'warning',
        message: 'Farm deleted.'
      });
    } catch (err) {
      setToast({
        open: true,
        severity: 'error',
        message: err?.response?.data?.error || 'Failed to delete farm.'
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Grid container rowSpacing={4.5} columnSpacing={2.75}>
        {Array.from({ length: 3 }).map((_, idx) => (
          <Grid key={idx} size={{ xs: 12, sm: 6, lg: 4 }}>
            <AnalyticCardSkeleton />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <MainCard>
        <Typography color="error">Failed to load farms.</Typography>
      </MainCard>
    );
  }

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Dialog
        open={farms.length === 0 && showFirstFarmHelper}
        onClose={() => {
          setShowFirstFarmHelper(false);
          localStorage.setItem(FIRST_FARM_HELPER_KEY, '1');
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Set Up Your First Farm</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Let&apos;s set up your first farm. This information helps AgriSense generate crop recommendations.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowFirstFarmHelper(false);
              localStorage.setItem(FIRST_FARM_HELPER_KEY, '1');
            }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      <Grid size={12} container alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Farm Management</Typography>

        <Button
          variant="contained"
          size="small"
          onClick={() => {
            setEditingFarm(null);
            setModalOpen(true);
          }}
        >
          Add Farm
        </Button>
      </Grid>

      {farms.length === 0 && (
        <Grid size={12}>
          <MainCard>
            <Typography variant="body2" color="text.secondary">
              You have not added any farms yet. Add a farm to start receiving crop recommendations.
            </Typography>
          </MainCard>
        </Grid>
      )}

      {farms.map((farm) => {
        const isDefault = String(farm.id) === String(defaultFarmId);
        return (
          <Grid key={farm.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <MainCard
              sx={{
                height: '100%',
                transition: 'box-shadow 0.2s ease',
                '&:hover': { boxShadow: 3 }
              }}
            >
              <Stack spacing={1.2}>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AgricultureIcon fontSize="small" color="action" />
                    <Typography variant="h6">{farm.name}</Typography>
                    {isDefault && <Chip size="small" color="success" label="Default" />}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Province: {farm.province}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip size="small" label={`Soil: ${farm.soil?.soil || farm.soil?.soil_type}`} />
                  <Chip size="small" label={`pH: ${farm.soil?.ph}`} />
                  <Chip size="small" label={`Drainage: ${farm.soil?.drainage}`} />
                  <Chip size="small" label={`Fertility: ${farm.soil?.fertility}`} />
                </Stack>

                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Button
                    size="small"
                    variant={isDefault ? 'contained' : 'outlined'}
                    disabled={isDefault}
                    onClick={() => {
                      setDefaultFarmId(farm.id);
                      setToast({
                        open: true,
                        severity: 'info',
                        message: `${farm.name} set as default farm.`
                      });
                    }}
                  >
                    {isDefault ? 'Default Farm' : 'Set Default'}
                  </Button>

                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      onClick={() => {
                        setEditingFarm(farm);
                        setModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button size="small" color="error" onClick={() => openDeleteConfirm(farm)}>
                      Delete
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </MainCard>
          </Grid>
        );
      })}

      <FarmFormModal
        open={modalOpen}
        initialData={editingFarm}
        onClose={() => {
          if (saving) return;
          setModalOpen(false);
          setEditingFarm(null);
        }}
        onSubmit={handleSaveFarm}
      />

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Farm</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Are you sure you want to delete <strong>{farmToDelete?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteFarm}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={2200} onClose={() => setToast((p) => ({ ...p, open: false }))}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
