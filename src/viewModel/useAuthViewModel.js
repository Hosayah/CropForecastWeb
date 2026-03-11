// features/auth/viewmodel/useAuthViewModel.js
import { useState } from 'react';
import {
  loginApi,
  meApi,
  logoutApi,
  registerApi,
  resendVerificationApi,
  forgotPasswordApi,
  verifyOtpApi,
  resetPasswordApi,
  updateProfileApi,
  changePasswordApi
} from '../model/authApi';

export function useAuthViewModel() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  //const navigate = useNavigate();

  const register = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await registerApi({
        email: data.email,
        password: data.password,
        firstName: data.firstname,
        lastName: data.lastname
      });

      //navigate('/verify-email'); // 🔥 IMPORTANT
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      await loginApi(email, password);

      const meRes = await meApi();
      setUser(meRes.data.user);

      return { success: true, user: meRes.data.user };
    } catch (err) {
      const status = err.response?.status;
      const reason = err.response?.data?.reason;
      const message = err.response?.data?.error;
      const retryAfter = Number(err.response?.data?.retryAfter || 0);
      const attemptsLeft = Number(err.response?.data?.attemptsLeft);

      // ✅ Handle specific 403 reasons
      if (status === 403) {
        if (reason === 'NOT_VERIFIED') {
          setError('Email not verified');
          return { success: false, reason: 'NOT_VERIFIED' };
        }

        if (reason === 'DEACTIVATED') {
          setError('Account has been deactivated. Please contact administrator.');
          return { success: false, reason: 'DEACTIVATED' };
        }
      }

      if (status === 429 || reason === 'RATE_LIMITED') {
        const suffix = retryAfter > 0 ? ` Please wait ${retryAfter} seconds.` : '';
        setError((message || 'Too many requests.') + suffix);
        return { success: false, reason: 'RATE_LIMITED' };
      }

      if (status === 401 && Number.isFinite(attemptsLeft)) {
        setError(`${message || 'Invalid credentials'}. Attempts left: ${Math.max(attemptsLeft, 0)}.`);
        return { success: false, reason: 'INVALID_CREDENTIALS' };
      }

      // Default fallback
      setError(message || 'Login failed');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async () => {
    try {
      const res = await meApi();
      setUser(res.data.user);
    } catch {
      setUser(null);
    }
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
  };

  const updateProfile = async (payload) => {
    try {
      setLoading(true);
      setError(null);
      const res = await updateProfileApi(payload);
      await loadUser();
      return res.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to update profile';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (oldPassword, newPassword, confirmPassword) => {
    try {
      setLoading(true);
      setError(null);
      const res = await changePasswordApi(oldPassword, newPassword, confirmPassword);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to change password';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const res = await resendVerificationApi(email);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to resend verification email';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const res = await forgotPasswordApi(email);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to send OTP';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      setLoading(true);
      setError(null);
      const res = await verifyOtpApi(email, otp);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to verify OTP';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      const res = await resetPasswordApi(email, newPassword);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to reset password';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    register,
    login,
    logout,
    loadUser,
    resendVerification,
    forgotPassword,
    verifyOtp,
    resetPassword,
    updateProfile,
    changePassword,
    loading,
    error
  };
}
