import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import AuthWrapper from 'sections/auth/AuthWrapper';
import { useAuth } from 'contexts/AuthContext';

export default function ResetPassword() {
  const { verifyOtp, resetPassword, forgotPassword, loading, error } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [lastResentAt, setLastResentAt] = useState(0);

  const cooldown = useMemo(() => {
    const elapsed = Math.floor((Date.now() - lastResentAt) / 1000);
    return Math.max(0, 300 - elapsed);
  }, [lastResentAt, loading]);

  const passwordError = useMemo(() => {
    if (!password) return '';
    if (password.length < 8 || password.length > 128) return 'Password must be 8 to 128 characters long';
    if (/\s/.test(password)) return 'Password cannot contain whitespace';
    if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must include at least one number';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include at least one special character';
    return '';
  }, [password]);

  const confirmError = confirmPassword && confirmPassword !== password ? 'Passwords must match' : '';

  const handleReset = async () => {
    if (passwordError || confirmError) return;
    try {
      await verifyOtp(email.trim(), otp.trim());
      const res = await resetPassword(email.trim(), password);
      setMessage(res.message || 'Password reset successful');
      navigate('/login');
    } catch {
      setMessage('');
    }
  };

  const handleResend = async () => {
    try {
      const res = await forgotPassword(email.trim());
      setMessage(res.message || 'OTP sent');
      setLastResentAt(Date.now());
    } catch {
      setMessage('');
    }
  };

  return (
    <AuthWrapper>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Typography variant="h3" color="primary" sx={{ textAlign: 'center' }}>
            Reset Password
          </Typography>
        </Grid>
        <Grid size={12}>
          <Stack sx={{ gap: 1 }}>
            <InputLabel>Email Address</InputLabel>
            <OutlinedInput value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <InputLabel>OTP</InputLabel>
            <OutlinedInput value={otp} onChange={(e) => setOtp(e.target.value)} fullWidth placeholder="6-digit code" />
            <InputLabel>New Password</InputLabel>
            <OutlinedInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
            {passwordError && <FormHelperText error>{passwordError}</FormHelperText>}
            <InputLabel>Confirm New Password</InputLabel>
            <OutlinedInput type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} fullWidth />
            {confirmError && <FormHelperText error>{confirmError}</FormHelperText>}
          </Stack>
          {message && <FormHelperText sx={{ color: 'success.main' }}>{message}</FormHelperText>}
          {error && <FormHelperText error>{error}</FormHelperText>}
          {cooldown > 0 && <FormHelperText>Resend available in {cooldown}s</FormHelperText>}

          <Stack sx={{ mt: 2, gap: 1 }}>
            <Button
              fullWidth
              size="large"
              variant="contained"
              onClick={handleReset}
              disabled={loading || !email.trim() || !otp.trim() || !password || !confirmPassword || Boolean(passwordError || confirmError)}
            >
              {loading ? 'Processing...' : 'Change Password'}
            </Button>
            <Button
              fullWidth
              size="large"
              variant="outlined"
              onClick={handleResend}
              disabled={loading || !email.trim() || cooldown > 0}
            >
              Resend OTP
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
