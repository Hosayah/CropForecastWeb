import PropTypes from 'prop-types';
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
  InputLabel,
  FormHelperText,
  FormControl
} from '@mui/material';

import { Formik } from 'formik';
import * as Yup from 'yup';

import { PROVINCES } from 'data/provinces';

const SOIL_TYPES = ['Clay', 'Loam', 'Sandy'];
const DRAINAGE = ['Poor', 'Moderate', 'Good'];
const FERTILITY = ['Low', 'Medium', 'High'];

export default function FarmFormModal({ open, onClose, onSubmit, initialData = {} }) {
  const initialValues = {
    name: '',
    province: '',
    soil_type: '',
    ph: '',
    drainage: '',
    fertility: '',
    ...initialData
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Farm Name is required'),
    province: Yup.string().required('Province is required'),
    soil_type: Yup.string().required('Soil Type is required'),
    ph: Yup.number()
      .typeError('Soil pH must be a number')
      .required('Soil pH is required')
      .min(3, 'pH must be at least 3.0')
      .max(9, 'pH must be at most 9.0'),
    drainage: Yup.string().required('Drainage is required'),
    fertility: Yup.string().required('Fertility is required')
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData?.id ? 'Edit Farm' : 'Add Farm'}</DialogTitle>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={(values) => {
          // optional: make sure ph is a number
          const payload = {
            ...values,
            ph: Number(values.ph)
          };

          onSubmit(payload);
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, isValid }) => (
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {/* Farm Name */}
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Farm Name"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                  />
                </Grid>

                {/* Province */}
                <Grid size={12}>
                  <FormControl fullWidth error={touched.province && Boolean(errors.province)}>
                    <InputLabel>Province</InputLabel>
                    <Select
                      name="province"
                      value={values.province}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      label="Province"
                    >
                      {PROVINCES.map((prov) => (
                        <MenuItem key={prov} value={prov}>
                          {prov}
                        </MenuItem>
                      ))}
                    </Select>
                    {touched.province && errors.province && (
                      <FormHelperText>{errors.province}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                {/* Soil Type */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={touched.soil_type && Boolean(errors.soil_type)}>
                    <InputLabel>Soil Type</InputLabel>
                    <Select
                      name="soil_type"
                      value={values.soil_type}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      label="Soil Type"
                    >
                      {SOIL_TYPES.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                    {touched.soil_type && errors.soil_type && (
                      <FormHelperText>{errors.soil_type}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                {/* pH */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Soil pH Level"
                    name="ph"
                    type="number"
                    placeholder="6.2"
                    inputProps={{ step: 0.1, min: 3, max: 9 }}
                    value={values.ph}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.ph && Boolean(errors.ph)}
                    helperText={(touched.ph && errors.ph) || 'Typical range: 5.5 – 7.5'}
                  />
                </Grid>

                {/* Drainage */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={touched.drainage && Boolean(errors.drainage)}>
                    <InputLabel>Drainage</InputLabel>
                    <Select
                      name="drainage"
                      value={values.drainage}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      label="Drainage"
                    >
                      {DRAINAGE.map((d) => (
                        <MenuItem key={d} value={d}>
                          {d}
                        </MenuItem>
                      ))}
                    </Select>
                    {touched.drainage && errors.drainage && (
                      <FormHelperText>{errors.drainage}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                {/* Fertility */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={touched.fertility && Boolean(errors.fertility)}>
                    <InputLabel>Fertility</InputLabel>
                    <Select
                      name="fertility"
                      value={values.fertility}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      label="Fertility"
                    >
                      {FERTILITY.map((f) => (
                        <MenuItem key={f} value={f}>
                          {f}
                        </MenuItem>
                      ))}
                    </Select>
                    {touched.fertility && errors.fertility && (
                      <FormHelperText>{errors.fertility}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={onClose} color="secondary">
                Cancel
              </Button>

              <Button
                variant="contained"
                type="submit"
                disabled={isSubmitting || !isValid}
              >
                Save Farm
              </Button>
            </DialogActions>
          </form>
        )}
      </Formik>
    </Dialog>
  );
}

FarmFormModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  initialData: PropTypes.any
};
