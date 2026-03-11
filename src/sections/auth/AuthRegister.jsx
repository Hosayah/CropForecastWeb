import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate  } from 'react-router-dom';

// material-ui
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// third-party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project imports
import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';
import { strengthColor, strengthIndicator } from 'utils/password-strength';

// assets
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';

// icons
import { LoadingOutlined } from '@ant-design/icons';

import { useAuth } from 'contexts/AuthContext';



// ============================|| JWT - REGISTER ||============================ //

export default function AuthRegister() {
  const { register, loading, error } = useAuth();
  const [level, setLevel] = useState();
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const changePassword = (value) => {
    const temp = strengthIndicator(value);
    setLevel(strengthColor(temp));
  };

  useEffect(() => {
    changePassword('');
  }, []);

  return (
    <>
      <Formik
        initialValues={{
          firstname: '',
          lastname: '',
          email: '',
          password: '',
          confirmPassword: '',
        }}
        onSubmit={async (values, { setSubmitting, setErrors }) => {
          try {
            console.log('Submitting registration with values:', values);
            const res = await register(values);
            console.log('Message:', res.message); // This should be a Firebase User object
            navigate('/verify-email', { state: { email: values.email } });
            
          } catch (error) {
            setErrors({ submit: error.message });
          } finally {
            setSubmitting(false);
          }
        }}
        validationSchema={Yup.object().shape({
          firstname: Yup.string().max(255).required('First Name is required'),
          lastname: Yup.string().max(255).required('Last Name is required'),
          email: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
          password: Yup.string()
            .required('Password is required')
            .min(8, 'Password must be 8 to 128 characters long')
            .max(128, 'Password must be 8 to 128 characters long')
            .matches(/^\S+$/, 'Password cannot contain whitespace')
            .matches(/[A-Z]/, 'Password must include at least one uppercase letter')
            .matches(/[a-z]/, 'Password must include at least one lowercase letter')
            .matches(/[0-9]/, 'Password must include at least one number')
            .matches(/[^A-Za-z0-9]/, 'Password must include at least one special character'),
          confirmPassword: Yup.string()
            .required('Confirm Password is required')
            .oneOf([Yup.ref('password')], 'Passwords must match')
        })}
      >
        {({ errors, handleBlur, handleChange, handleSubmit, touched, values }) => (
          <form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* First Name */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="firstname-signup">First Name*</InputLabel>
                  <OutlinedInput
                    id="firstname-signup"
                    type="text"
                    value={values.firstname}
                    name="firstname"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="John"
                    fullWidth
                    error={Boolean(touched.firstname && errors.firstname)}
                  />
                </Stack>
                {touched.firstname && errors.firstname && (
                  <FormHelperText error>{errors.firstname}</FormHelperText>
                )}
              </Grid>

              {/* Last Name */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="lastname-signup">Last Name*</InputLabel>
                  <OutlinedInput
                    id="lastname-signup"
                    type="text"
                    value={values.lastname}
                    name="lastname"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Doe"
                    fullWidth
                    error={Boolean(touched.lastname && errors.lastname)}
                  />
                </Stack>
                {touched.lastname && errors.lastname && (
                  <FormHelperText error>{errors.lastname}</FormHelperText>
                )}
              </Grid>

              {/* Email */}
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="email-signup">Email Address*</InputLabel>
                  <OutlinedInput
                    id="email-signup"
                    type="email"
                    value={values.email}
                    name="email"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="demo@company.com"
                    fullWidth
                    error={Boolean(touched.email && errors.email)}
                  />
                </Stack>
                {touched.email && errors.email && (
                  <FormHelperText error>{errors.email}</FormHelperText>
                )}
              </Grid>

              {/* Password */}
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="password-signup">Password</InputLabel>
                  <OutlinedInput
                    id="password-signup"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    name="password"
                    onBlur={handleBlur}
                    onChange={(e) => {
                      handleChange(e);
                      changePassword(e.target.value);
                    }}
                    fullWidth
                    error={Boolean(touched.password && errors.password)}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          color="secondary"
                        >
                          {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        </IconButton>
                      </InputAdornment>
                    }
                    placeholder="******"
                  />
                </Stack>

                {touched.password && errors.password && (
                  <FormHelperText error>{errors.password}</FormHelperText>
                )}

                <FormControl fullWidth sx={{ mt: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid>
                      <Box sx={{ bgcolor: level?.color, width: 85, height: 8, borderRadius: '7px' }} />
                    </Grid>
                    <Grid>
                      <Typography variant="subtitle1" fontSize="0.75rem">
                        {level?.label}
                      </Typography>
                    </Grid>
                  </Grid>
                </FormControl>
              </Grid>

              {/* Confirm Password */}
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="confirm-password-signup">Confirm Password</InputLabel>
                  <OutlinedInput
                    id="confirm-password-signup"
                    type={showPassword ? 'text' : 'password'}
                    value={values.confirmPassword}
                    name="confirmPassword"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    fullWidth
                    error={Boolean(touched.confirmPassword && errors.confirmPassword)}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          color="secondary"
                        >
                          {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        </IconButton>
                      </InputAdornment>
                    }
                    placeholder="******"
                  />
                </Stack>
                {touched.confirmPassword && errors.confirmPassword && (
                  <FormHelperText error>{errors.confirmPassword}</FormHelperText>
                )}
              </Grid>

              {/* Terms */}
              <Grid size={12}>
                <Typography variant="body2">
                  By Signing up, you agree to our&nbsp;
                  <Link component={RouterLink} to="#" variant="subtitle2">
                    Terms of Service
                  </Link>
                  &nbsp;and&nbsp;
                  <Link component={RouterLink} to="#" variant="subtitle2">
                    Privacy Policy
                  </Link>
                </Typography>
              </Grid>

              {/* Submit */}
              <Grid size={12}>
                <AnimateButton>
                  <Button type="submit" fullWidth size="large" variant="contained" color="primary">
                    {loading ? <LoadingOutlined/> : 'Create'}
                  </Button>
                </AnimateButton>
              </Grid>
              {error && (
              <Grid sx={{ mt: -1 }} size={12}>
                <FormHelperText error sx={{ textAlign: 'center' }}>
                  {error}
                </FormHelperText>
              </Grid>)}
            </Grid>
          </form>
        )}
      </Formik>
    </>
  );
}
