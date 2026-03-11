import PropTypes from 'prop-types';
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Stack,
  Typography,
  Link,
  TextField,
  Select,
  MenuItem,
  Button,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  FormControl
} from '@mui/material';

import { Formik } from 'formik';
import * as Yup from 'yup';

import { PROVINCES } from 'data/provinces';

const SOIL_TYPES = ['Clay', 'Loam', 'Sandy', 'Silt'];
const DRAINAGE = ['Fast', 'Moderate', 'Slow'];
const FERTILITY = ['Low', 'Medium', 'High'];

const SOIL_HELP_TOPICS = {
  soil_type: {
    title: 'Soil Type',
    lines: [
      'Clay: holds water well',
      'Loam: balanced and ideal for many crops',
      'Sandy: drains quickly',
      'Silt: smooth and moisture-retaining'
    ]
  },
  ph: {
    title: 'pH Level',
    lines: [
      'Soil pH measures acidity or alkalinity.',
      'Typical crop-friendly range is 5.5 to 7.5.',
      'Can be measured using a soil test kit or through a local agriculture office.'
    ]
  },
  fertility: {
    title: 'Fertility',
    lines: ['Low: poor nutrients', 'Medium: moderate nutrients', 'High: nutrient-rich soil']
  },
  drainage: {
    title: 'Drainage',
    lines: ['Fast: water drains quickly', 'Moderate: balanced drainage', 'Slow: water remains longer in the soil']
  }
};

function normalizeSelectValue(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase();
}

function FieldLabel({ title, helpKey, onLearnMore }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
      <Typography variant="subtitle2">{title}</Typography>
      {helpKey ? (
        <Link component="button" type="button" underline="hover" variant="caption" onClick={() => onLearnMore(helpKey)}>
          Learn More
        </Link>
      ) : (
        <span />
      )}
    </Stack>
  );
}

FieldLabel.propTypes = {
  title: PropTypes.string.isRequired,
  helpKey: PropTypes.string,
  onLearnMore: PropTypes.func.isRequired
};

export default function FarmFormModal({ open, onClose, onSubmit, initialData = {} }) {
  const [helpTopic, setHelpTopic] = React.useState(null);
  const farm = initialData || {};
  const initialSoil = farm.soil?.soil_type ?? farm.soil_type ?? farm.soil ?? '';
  const initialPh = farm.soil?.ph ?? farm.ph ?? '';
  const initialDrainage = farm.soil?.drainage ?? farm.drainage ?? '';
  const initialFertility = farm.soil?.fertility ?? farm.fertility ?? '';

  const initialValues = {
    name: farm.name ?? '',
    province: farm.province ?? '',
    soil_type: normalizeSelectValue(initialSoil),
    ph: initialPh,
    drainage: normalizeSelectValue(initialDrainage),
    fertility: normalizeSelectValue(initialFertility),
    skipSoilDetails: false
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Farm Name is required'),
    province: Yup.string().required('Province is required'),
    skipSoilDetails: Yup.boolean(),
    soil_type: Yup.string().when('skipSoilDetails', {
      is: false,
      then: (schema) => schema.required('Soil Type is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    ph: Yup.mixed().when('skipSoilDetails', {
      is: false,
      then: () =>
        Yup.number()
          .typeError('Soil pH must be a number')
          .required('Soil pH is required')
          .min(3, 'pH must be at least 3.0')
          .max(9, 'pH must be at most 9.0'),
      otherwise: () => Yup.mixed().notRequired()
    }),
    drainage: Yup.string().when('skipSoilDetails', {
      is: false,
      then: (schema) => schema.required('Drainage is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    fertility: Yup.string().when('skipSoilDetails', {
      is: false,
      then: (schema) => schema.required('Fertility is required'),
      otherwise: (schema) => schema.notRequired()
    })
  });

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{initialData?.id ? 'Edit Farm' : 'Add Farm'}</DialogTitle>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={(values) => {
            const useDefaults = Boolean(values.skipSoilDetails);
            const payload = {
              ...values,
              soil_type: useDefaults ? 'loam' : values.soil_type,
              ph: useDefaults ? 6.5 : Number(values.ph),
              drainage: useDefaults ? 'moderate' : values.drainage,
              fertility: useDefaults ? 'medium' : values.fertility
            };
            delete payload.soil;
            onSubmit(payload);
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, isValid }) => (
            <form onSubmit={handleSubmit}>
              <DialogContent>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      label="Farm Name"
                      name="name"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.name && errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>

                  <Grid size={12}>
                    <FieldLabel title="Province" onLearnMore={() => {}} />
                    <FormControl fullWidth error={Boolean(touched.province && errors.province)}>
                      <Select name="province" value={values.province} onChange={handleChange} onBlur={handleBlur} displayEmpty>
                        <MenuItem value="" disabled>
                          Select Province
                        </MenuItem>
                        {PROVINCES.map((prov) => (
                          <MenuItem key={prov} value={prov}>
                            {prov}
                          </MenuItem>
                        ))}
                      </Select>
                      {touched.province && errors.province ? <FormHelperText>{errors.province}</FormHelperText> : null}
                    </FormControl>
                  </Grid>

                  <Grid size={12}>
                    <FormControlLabel
                      control={
                        <Checkbox name="skipSoilDetails" checked={Boolean(values.skipSoilDetails)} onChange={handleChange} />
                      }
                      label="I don't know my soil details yet"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      If checked, AgriSense will use balanced defaults (Loam, pH 6.5, Medium fertility, Moderate drainage).
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FieldLabel title="Soil Type" helpKey="soil_type" onLearnMore={setHelpTopic} />
                    <FormControl fullWidth error={Boolean(touched.soil_type && errors.soil_type)}>
                      <Select
                        name="soil_type"
                        value={values.soil_type}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={Boolean(values.skipSoilDetails)}
                        displayEmpty
                      >
                        <MenuItem value="" disabled>
                          Select Soil Type
                        </MenuItem>
                        {SOIL_TYPES.map((item) => (
                          <MenuItem key={item} value={item.toLowerCase()}>
                            {item}
                          </MenuItem>
                        ))}
                      </Select>
                      {touched.soil_type && errors.soil_type ? <FormHelperText>{errors.soil_type}</FormHelperText> : null}
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FieldLabel title="pH Level" helpKey="ph" onLearnMore={setHelpTopic} />
                    <TextField
                      fullWidth
                      name="ph"
                      type="number"
                      placeholder="6.5"
                      inputProps={{ step: 0.1, min: 3, max: 9 }}
                      value={values.ph}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={Boolean(values.skipSoilDetails)}
                      error={Boolean(touched.ph && errors.ph)}
                      helperText={(touched.ph && errors.ph) || 'Typical range: 5.5 - 7.5'}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FieldLabel title="Fertility" helpKey="fertility" onLearnMore={setHelpTopic} />
                    <FormControl fullWidth error={Boolean(touched.fertility && errors.fertility)}>
                      <Select
                        name="fertility"
                        value={values.fertility}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={Boolean(values.skipSoilDetails)}
                        displayEmpty
                      >
                        <MenuItem value="" disabled>
                          Select Fertility
                        </MenuItem>
                        {FERTILITY.map((item) => (
                          <MenuItem key={item} value={item.toLowerCase()}>
                            {item}
                          </MenuItem>
                        ))}
                      </Select>
                      {touched.fertility && errors.fertility ? <FormHelperText>{errors.fertility}</FormHelperText> : null}
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FieldLabel title="Drainage" helpKey="drainage" onLearnMore={setHelpTopic} />
                    <FormControl fullWidth error={Boolean(touched.drainage && errors.drainage)}>
                      <Select
                        name="drainage"
                        value={values.drainage}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={Boolean(values.skipSoilDetails)}
                        displayEmpty
                      >
                        <MenuItem value="" disabled>
                          Select Drainage
                        </MenuItem>
                        {DRAINAGE.map((item) => (
                          <MenuItem key={item} value={item.toLowerCase()}>
                            {item}
                          </MenuItem>
                        ))}
                      </Select>
                      {touched.drainage && errors.drainage ? <FormHelperText>{errors.drainage}</FormHelperText> : null}
                    </FormControl>
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} color="secondary">
                  Cancel
                </Button>
                <Button variant="contained" type="submit" disabled={isSubmitting || !isValid}>
                  Save Farm
                </Button>
              </DialogActions>
            </form>
          )}
        </Formik>
      </Dialog>

      <Dialog open={Boolean(helpTopic)} onClose={() => setHelpTopic(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{helpTopic ? SOIL_HELP_TOPICS[helpTopic]?.title : ''}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            {(helpTopic ? SOIL_HELP_TOPICS[helpTopic]?.lines : []).map((line) => (
              <Typography key={line} variant="body2">
                {line}
              </Typography>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpTopic(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

FarmFormModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  initialData: PropTypes.any
};
