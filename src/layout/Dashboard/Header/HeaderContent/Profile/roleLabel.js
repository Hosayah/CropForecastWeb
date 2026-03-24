const ROLE_LABELS = {
  farm_owner: 'Farm Owner',
  ml_engineer: 'ML Engineer',
  superadmin: 'Super Admin',
  admin: 'Admin',
  analyst: 'Analyst'
};

export function formatRoleLabel(role) {
  const normalized = String(role || '').trim().toLowerCase();
  if (!normalized) return '-';
  if (ROLE_LABELS[normalized]) return ROLE_LABELS[normalized];
  return normalized
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default formatRoleLabel;
