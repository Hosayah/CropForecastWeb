import {
  API_TARGETS,
  getApiTargetForRole,
  getPreferredApiTarget,
  resolveApiBase,
  setPreferredApiTarget
} from './apiBase';
import { createApiClient } from './createApiClient';

const localApi = createApiClient('auth', { forcedTarget: API_TARGETS.LOCALHOST });
const renderApi = createApiClient('auth', { forcedTarget: API_TARGETS.RENDER });

function getPreferredAuthClient() {
  return getPreferredApiTarget() === API_TARGETS.RENDER ? renderApi : localApi;
}

function isAuthResponseError(error) {
  const status = Number(error?.response?.status || 0);
  return status >= 400 && status < 500;
}

async function loginAndLoadProfile(client, email, password) {
  await client.post('/login', { email, password });
  const meResponse = await client.get('/me');
  return meResponse?.data?.user || null;
}

export const registerApi = (payload) => renderApi.post('/register', payload);

export const loginApi = async (email, password) => {
  const preferredTarget = getPreferredApiTarget();
  const primaryClient = preferredTarget === API_TARGETS.RENDER ? renderApi : localApi;
  const secondaryClient = preferredTarget === API_TARGETS.RENDER ? localApi : renderApi;
  const primaryTarget = preferredTarget;
  const secondaryTarget = preferredTarget === API_TARGETS.RENDER ? API_TARGETS.LOCALHOST : API_TARGETS.RENDER;

  const tryLogin = async (client, target) => {
    const user = await loginAndLoadProfile(client, email, password);
    const resolvedTarget = getApiTargetForRole(user?.role);
    if (resolvedTarget === target) {
      setPreferredApiTarget(resolvedTarget);
      return { user, target: resolvedTarget };
    }

    await client.post('/logout').catch(() => {});
    return null;
  };

  try {
    const primaryResult = await tryLogin(primaryClient, primaryTarget);
    if (primaryResult) return primaryResult;
  } catch (error) {
    if (isAuthResponseError(error)) throw error;
  }

  const secondaryResult = await tryLogin(secondaryClient, secondaryTarget);
  if (secondaryResult) return secondaryResult;

  throw new Error('Login failed');
};

export const meApi = () => getPreferredAuthClient().get('/me');

export const logoutApi = async () => {
  await Promise.allSettled([localApi.post('/logout'), renderApi.post('/logout')]);
};

export const resendVerificationApi = (email) => renderApi.post('/resend-verification', { email });

export const forgotPasswordApi = (email) => renderApi.post('/forgot-password', { email });

export const verifyOtpApi = (email, otp) => renderApi.post('/verify-otp', { email, otp });

export const resetPasswordApi = (email, newPassword) => renderApi.post('/reset-password', { email, newPassword });

export const updateProfileApi = (payload) => getPreferredAuthClient().patch('/profile', payload);

export const changePasswordApi = (oldPassword, newPassword, confirmPassword) =>
  getPreferredAuthClient().post('/change-password', { oldPassword, newPassword, confirmPassword });

export const authBaseUrlForTarget = (target) => resolveApiBase('auth', target);

export default getPreferredAuthClient;
