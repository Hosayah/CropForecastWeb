const resolveDefaultOrigin = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000';
  }

  const host = window.location.hostname || 'localhost';
  return `http://${host}:5000`;
};

export const API_TARGETS = {
  LOCALHOST: 'localhost',
  RENDER: 'render'
};

const API_TARGET_KEY = 'agrisense:web_api_target';

export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || resolveDefaultOrigin();
export const RENDER_API_ORIGIN = import.meta.env.VITE_RENDER_API_ORIGIN || 'https://agrisenseapi.onrender.com';

const API_PATHS = {
  auth: '/auth/v1',
  farms: '/farms',
  recommendation: '/recommendation',
  cropTrend: '/api/crop-trend',
  adminUsers: '/admin/v1/users',
  adminDashboard: '/admin/v1/dashboard',
  adminAuditLogs: '/admin/v1/audit-logs',
  adminDatasets: '/admin/v1/datasets',
  adminBackups: '/admin/v1/backups',
  adminSystemConfig: '/admin/v1/system-config',
  adminKnowledge: '/admin/v1/knowledge',
  adminMonitoring: '/admin/v1/monitoring',
  ml: '/ml/v1'
};

const TARGET_ORIGINS = {
  [API_TARGETS.LOCALHOST]: API_ORIGIN,
  [API_TARGETS.RENDER]: RENDER_API_ORIGIN
};

const renderEligibleNamespaces = new Set([
  'auth',
  'farms',
  'recommendation',
  'cropTrend',
  'adminDatasets',
  'adminSystemConfig',
  'adminAuditLogs'
]);
const renderEligibleRoles = new Set(['farm_owner', 'analyst']);

export function getPreferredApiTarget() {
  if (typeof window === 'undefined') return API_TARGETS.LOCALHOST;
  const value = window.localStorage.getItem(API_TARGET_KEY);
  return value === API_TARGETS.RENDER ? API_TARGETS.RENDER : API_TARGETS.LOCALHOST;
}

export function setPreferredApiTarget(target) {
  if (typeof window === 'undefined') return;
  const normalized = target === API_TARGETS.RENDER ? API_TARGETS.RENDER : API_TARGETS.LOCALHOST;
  window.localStorage.setItem(API_TARGET_KEY, normalized);
}

export function getApiTargetForRole(role) {
  return renderEligibleRoles.has(String(role || '').toLowerCase()) ? API_TARGETS.RENDER : API_TARGETS.LOCALHOST;
}

export function getNamespaceTarget(namespace, forcedTarget = null) {
  if (forcedTarget) return forcedTarget;
  if (!renderEligibleNamespaces.has(namespace)) return API_TARGETS.LOCALHOST;
  return getPreferredApiTarget();
}

export function resolveApiBase(namespace, forcedTarget = null) {
  const target = getNamespaceTarget(namespace, forcedTarget);
  const origin = TARGET_ORIGINS[target] || API_ORIGIN;
  const path = API_PATHS[namespace] || '';
  return `${origin}${path}`;
}

export const API_BASES = {
  auth: resolveApiBase('auth', API_TARGETS.LOCALHOST),
  farms: resolveApiBase('farms', API_TARGETS.LOCALHOST),
  recommendation: resolveApiBase('recommendation', API_TARGETS.LOCALHOST),
  cropTrend: resolveApiBase('cropTrend', API_TARGETS.LOCALHOST),
  adminUsers: resolveApiBase('adminUsers', API_TARGETS.LOCALHOST),
  adminDashboard: resolveApiBase('adminDashboard', API_TARGETS.LOCALHOST),
  adminAuditLogs: resolveApiBase('adminAuditLogs', API_TARGETS.LOCALHOST),
  adminDatasets: resolveApiBase('adminDatasets', API_TARGETS.LOCALHOST),
  adminBackups: resolveApiBase('adminBackups', API_TARGETS.LOCALHOST),
  adminSystemConfig: resolveApiBase('adminSystemConfig', API_TARGETS.LOCALHOST),
  adminKnowledge: resolveApiBase('adminKnowledge', API_TARGETS.LOCALHOST),
  adminMonitoring: resolveApiBase('adminMonitoring', API_TARGETS.LOCALHOST),
  adminMonitoringRender: resolveApiBase('adminMonitoring', API_TARGETS.RENDER),
  ml: resolveApiBase('ml', API_TARGETS.LOCALHOST)
};
