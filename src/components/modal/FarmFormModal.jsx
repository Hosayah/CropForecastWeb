import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Select,
  MenuItem,
  Button,
  Stack,
  InputLabel
} from '@mui/material';

import { PROVINCES } from 'data/provinces';

const SOIL_TYPES = ['Clay', 'Loam', 'Sandy'];
const DRAINAGE = ['Poor', 'Moderate', 'Good'];
const FERTILITY = ['Low', 'Medium', 'High'];

export default function FarmFormModal({
  open,
  onClose,
  onSubmit,
  initialData = {}
}) {
  const [form, setForm] = useState({
    name: '',
    province: '',
    soil_type: '',
    ph: '',
    drainage: '',
    fertility: '',
    ...initialData
  });

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = () => {
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData?.id ? 'Edit Farm' : 'Add Farm'}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={12}>
            <TextField
              fullWidth
              label="Farm Name"
              value={form.name}
              onChange={handleChange('name')}
            />
          </Grid>

          <Grid size={12}>
            <InputLabel>Province</InputLabel>
            <Select
              fullWidth
              value={form.province}
              onChange={handleChange('province')}
            >
              {PROVINCES.map((prov) => (
                <MenuItem key={prov} value={prov}>
                  {prov}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <InputLabel>Soil Type</InputLabel>
            <Select
              fullWidth
              value={form.soil_type}
              onChange={handleChange('soil_type')}
            >
              {SOIL_TYPES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <InputLabel>Soil pH Level</InputLabel>
            <TextField
              fullWidth
              type="number"
              placeholder='6.2'
              inputProps={{ step: 0.1, min: 3, max: 9 }}
              helperText="Typical range: 5.5 – 7.5"
              value={form.ph}
              onChange={handleChange('ph')}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <InputLabel>Drainage</InputLabel>
            <Select
              fullWidth
              value={form.drainage}
              onChange={handleChange('drainage')}
            >
              {DRAINAGE.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <InputLabel>Fertility</InputLabel>
            <Select
              fullWidth
              value={form.fertility}
              onChange={handleChange('fertility')}
            >
              {FERTILITY.map((f) => (
                <MenuItem key={f} value={f}>
                  {f}
                </MenuItem>
              ))}
            </Select>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save Farm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
