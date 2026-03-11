// project import
import admin, { superadminGovernance } from './admin';
import mlManagement from './mlManagement';
import mlAdmin from './mlAdmin';
import farmOwner from './farmOwner';
import analyst from './analyst';

// ==============================|| MENU ITEMS ||============================== //

// Default export (used by Breadcrumbs, route helpers, etc.)
const menuItems = {
  items: [farmOwner, admin, superadminGovernance, mlAdmin, mlManagement, analyst] // full tree, role-agnostic
};

export default menuItems;

function withoutDatasets(group) {
  if (!group?.children) return group;
  return {
    ...group,
    children: group.children.filter((item) => String(item?.title || '').toLowerCase() !== 'datasets')
  };
}

// Role-based export (used by Navigation sidebar)
export function getMenuItems(role) {
  let selectedMenus = [farmOwner];
  const analystNoDatasets = withoutDatasets(analyst);
  const mlManagementNoDatasets = withoutDatasets(mlManagement);

  if (role === 'superadmin') {
    selectedMenus = [admin, superadminGovernance, mlManagementNoDatasets, analystNoDatasets];
  } else if (role === 'admin') {
    selectedMenus = [admin, mlAdmin, analystNoDatasets];
  } else if (role === 'analyst') {
    selectedMenus = [analyst];
  } else if (role === 'ml_engineer') {
    selectedMenus = [mlManagement];
  }

  return {
    items: selectedMenus
  };
}
