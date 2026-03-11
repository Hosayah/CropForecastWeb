import { API_BASES } from './apiBase';
import { createApiClient } from './createApiClient';

const api = createApiClient(API_BASES.auth);

export const registerApi = (payload) => api.post('/register', payload);

export const loginApi = (email, password) => api.post('/login', { email, password });

export const meApi = () => api.get('/me');

export const logoutApi = () => api.post('/logout');

export const resendVerificationApi = (email) => api.post('/resend-verification', { email });

export const forgotPasswordApi = (email) => api.post('/forgot-password', { email });

export const verifyOtpApi = (email, otp) => api.post('/verify-otp', { email, otp });

export const resetPasswordApi = (email, newPassword) => api.post('/reset-password', { email, newPassword });

export const updateProfileApi = (payload) => api.patch('/profile', payload);

export const changePasswordApi = (oldPassword, newPassword, confirmPassword) =>
  api.post('/change-password', { oldPassword, newPassword, confirmPassword });

export default api;
