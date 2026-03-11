import { useCallback, useEffect, useState } from 'react';
import { logoutApi } from '../model/authApi';
import { API_BASES } from '../model/apiBase';

const REMEMBER_ME_KEY = 'agrisense:remember_me';
const SESSION_ACTIVE_KEY = 'agrisense:session_active';

export function useSession() {
  const [rememberMe, setRememberMeState] = useState(() => localStorage.getItem(REMEMBER_ME_KEY) === '1');

  const setRememberMe = useCallback((value) => {
    const next = Boolean(value);
    setRememberMeState(next);
    localStorage.setItem(REMEMBER_ME_KEY, next ? '1' : '0');
  }, []);

  const bootstrapSession = useCallback(async () => {
    const hadActiveSession = sessionStorage.getItem(SESSION_ACTIVE_KEY) === '1';
    sessionStorage.setItem(SESSION_ACTIVE_KEY, '1');

    if (!rememberMe && !hadActiveSession) {
      try {
        await logoutApi();
      } catch {
        // Ignore cleanup failures during bootstrap.
      }
    }
  }, [rememberMe]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!rememberMe) {
        fetch(`${API_BASES.auth}/logout`, {
          method: 'POST',
          credentials: 'include',
          keepalive: true
        }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [rememberMe]);

  return {
    rememberMe,
    setRememberMe,
    bootstrapSession
  };
}
