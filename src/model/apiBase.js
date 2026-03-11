const resolveDefaultOrigin = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000';
  }

  const host = window.location.hostname || 'localhost';
  return `http://${host}:5000`;
};

export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || resolveDefaultOrigin();

export const API_BASES = {
  auth: `${API_ORIGIN}/auth/v1`,
  farms: `${API_ORIGIN}/farms`,
  recommendation: `${API_ORIGIN}/recommendation`,
  cropTrend: `${API_ORIGIN}/api/crop-trend`,
  adminUsers: `${API_ORIGIN}/admin/v1/users`,
  adminDashboard: `${API_ORIGIN}/admin/v1/dashboard`,
  adminAuditLogs: `${API_ORIGIN}/admin/v1/audit-logs`,
  adminDatasets: `${API_ORIGIN}/admin/v1/datasets`,
  adminBackups: `${API_ORIGIN}/admin/v1/backups`,
  adminSystemConfig: `${API_ORIGIN}/admin/v1/system-config`,
  adminMonitoring: `${API_ORIGIN}/admin/v1/monitoring`,
  ml: `${API_ORIGIN}/ml/v1`
};
