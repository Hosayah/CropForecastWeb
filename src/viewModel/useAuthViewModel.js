// features/auth/viewmodel/useAuthViewModel.js
import { useState } from 'react';
import { loginApi, meApi, logoutApi, registerApi } from '../model/authApi';

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
        lastName: data.lastname,
        region: data.region,
        province: data.province
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

      const res = await loginApi(email, password);

      // Mobile token handling
      if (res.data.access_token) {
        setAuthToken(res.data.access_token);
      }

      const meRes = await meApi();
      setUser(meRes.data.user);

      return { success: true };
    } catch (err) {
      const status = err.response?.status;
      const reason = err.response?.data?.reason;
      const message = err.response?.data?.error;

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

  return { user, register, login, logout, loadUser, loading, error };
}
