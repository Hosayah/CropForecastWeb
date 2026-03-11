import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import AuthWrapper from 'sections/auth/AuthWrapper';
import { useAuth } from 'contexts/AuthContext';

export default function ForgotPassword() {
  const { forgotPassword, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSend = async () => {
    try {
      const res = await forgotPassword(email.trim());
      setMessage(res.message || 'OTP sent');
      navigate('/reset-password', { state: { email: email.trim() } });
    } catch {
      setMessage('');
    }
  };

  return (
    <AuthWrapper>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Typography variant="h3" color="primary" sx={{ textAlign: 'center' }}>
            Forgot Password
          </Typography>
        </Grid>
        <Grid size={12}>
          <Stack sx={{ gap: 1 }}>
            <InputLabel htmlFor="forgot-email">Email Address</InputLabel>
            <OutlinedInput
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              fullWidth
            />
          </Stack>
          {message && <FormHelperText sx={{ color: 'success.main' }}>{message}</FormHelperText>}
          {error && <FormHelperText error>{error}</FormHelperText>}
          <Stack sx={{ mt: 2, gap: 1 }}>
            <Button fullWidth size="large" variant="contained" onClick={handleSend} disabled={loading || !email.trim()}>
              {loading ? 'Sending...' : 'Send OTP'}
            </Button>
            <Button component={Link} to="/login" fullWidth size="large" variant="text">
              Back to Login
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </AuthWrapper>
  );
}
