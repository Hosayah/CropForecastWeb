import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import AuthWrapper from 'sections/auth/AuthWrapper';
import { useAuth } from 'contexts/AuthContext';

export default function VerifyEmail() {
  const { resendVerification, loading, error } = useAuth();
  const location = useLocation();
  const initialEmail = location.state?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState('');
  const [lastSentAt, setLastSentAt] = useState(0);

  const cooldown = useMemo(() => {
    const elapsed = Math.floor((Date.now() - lastSentAt) / 1000);
    return Math.max(0, 300 - elapsed);
  }, [lastSentAt, loading]);

  const canResend = cooldown === 0 && email.trim().length > 0 && !loading;

  const handleResend = async () => {
    try {
      const res = await resendVerification(email.trim());
      setMessage(res.message || 'Verification email sent.');
      setLastSentAt(Date.now());
    } catch {
      setMessage('');
    }
  };

  return (
    <AuthWrapper>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'center' }}>
            <Typography variant="h3" color="primary">Verify Email</Typography>
          </Stack>
        </Grid>

        <Grid size={12}>
          <Typography variant="body1" color="text.primary" sx={{ textAlign: 'center', mb: 2 }}>
            An email was sent to your registered address. Verify your email to continue.
          </Typography>

          <Stack sx={{ gap: 1 }}>
            <InputLabel htmlFor="verify-email-input">Email Address</InputLabel>
            <OutlinedInput
              id="verify-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              fullWidth
            />
          </Stack>

          {message && <FormHelperText sx={{ color: 'success.main' }}>{message}</FormHelperText>}
          {error && <FormHelperText error>{error}</FormHelperText>}
          {cooldown > 0 && (
            <FormHelperText>Resend available in {cooldown}s</FormHelperText>
          )}

          <Stack direction="column" sx={{ mt: 2, gap: 1 }}>
            <Button
              onClick={handleResend}
              fullWidth
              size="large"
              variant="outlined"
              disabled={!canResend}
            >
              {loading ? 'Sending...' : 'Resend Verification Email'}
            </Button>
            <Button component={Link} to="/login" fullWidth size="large" variant="contained" color="primary">
              Proceed to Login
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </AuthWrapper>
  );
}
