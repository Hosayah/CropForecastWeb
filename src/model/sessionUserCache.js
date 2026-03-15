import { clearCropTrendCache } from './cropTrendApi';
import { clearFarmsCache } from '../viewModel/useFarms';
import { clearRecommendationCache } from '../viewModel/useCropRecommendation';

const LAST_USER_KEY = 'agrisense:last_user_uid';

export function getLastSignedInUserId() {
  try {
    return sessionStorage.getItem(LAST_USER_KEY) || '';
  } catch {
    return '';
  }
}

export function setLastSignedInUserId(uid) {
  try {
    if (uid) sessionStorage.setItem(LAST_USER_KEY, String(uid));
    else sessionStorage.removeItem(LAST_USER_KEY);
  } catch {
    // Ignore storage write failures.
  }
}

export function clearUserScopedCaches() {
  clearCropTrendCache();
  clearFarmsCache();
  clearRecommendationCache();
}
