import { useState } from 'react';

// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';

// icons
import AgricultureIcon from '@mui/icons-material/Agriculture';

// project imports
import MainCard from 'components/MainCard';
import FarmFormModal from 'components/modal/FarmFormModal';
import AnalyticCardSkeleton from '../../components/skeletons/AnalyticCardSkeleton';

// data
import { useFarms } from 'viewModel/useFarms';
import { createFarmApi, updateFarmApi } from 'model/farmApi';

// ----------------------------------------------------------------------

export default function FarmManagementPage() {
  const { farms, loading, error, refresh } = useFarms();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);

  console.log(farms)

  // ------------------------------------------------------------------
  // Save handler (Create or Update)
  // ------------------------------------------------------------------
  async function handleSaveFarm(formData) {
    try {
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
      refresh();
    } catch (err) {
      console.error('Failed to save farm', err);
    }
  }

  // ------------------------------------------------------------------
  // Loading / Error states
  // ------------------------------------------------------------------
  if (loading) {
    return (
        
      Array.from({ length: 3 }).map((_, idx) => (
            <Grid key={idx} size={{ xs: 12, sm: 6, lg: 4 }}>
              <AnalyticCardSkeleton />
            </Grid>
        ))
    );
  }

  if (error) {
    return (
      <MainCard>
        <Typography color="error">Failed to load farms.</Typography>
      </MainCard>
    );
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* ================= Header ================= */}
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

      {/* ================= Empty State ================= */}
      {farms.length === 0 && (
        <Grid size={12}>
          <MainCard>
            <Typography variant="body2" color="text.secondary">
              You have not added any farms yet. Add a farm to start receiving crop recommendations.
            </Typography>
          </MainCard>
        </Grid>
      )}

      {/* ================= Farm Cards ================= */}
      {farms.map((farm) => (
        <Grid key={farm.id} size={{ xs: 12, sm: 6, lg: 4 }}>
          <MainCard
            sx={{
              height: '100%',
              transition: 'box-shadow 0.2s ease',
              '&:hover': {
                boxShadow: 3
              }
            }}
          >
            <Stack spacing={1.2}>
              {/* Header */}
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AgricultureIcon fontSize="small" color="action" />
                  <Typography variant="h6">{farm.name}</Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Province: {farm.province}
                </Typography>
              </Stack>

              {/* Soil Tags */}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={`Soil: ${farm.soil?.soil_type}`} />
                <Chip size="small" label={`pH: ${farm.soil?.ph}`} />
                <Chip size="small" label={`Drainage: ${farm.soil?.drainage}`} />
                <Chip size="small" label={`Fertility: ${farm.soil?.fertility}`} />
              </Stack>

              {/* Actions */}
              <Stack direction="row" justifyContent="flex-end">
                <Button
                  size="small"
                  onClick={() => {
                    setEditingFarm(farm);
                    setModalOpen(true);
                  }}
                >
                  Edit
                </Button>
              </Stack>
            </Stack>
          </MainCard>
        </Grid>
      ))}

      {/* ================= Modal ================= */}
      <FarmFormModal
        open={modalOpen}
        initialData={editingFarm}
        onClose={() => {
          setModalOpen(false);
          setEditingFarm(null);
        }}
        onSubmit={handleSaveFarm}
      />
    </Grid>
  );
}
