// MUI icons
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import BackupOutlinedIcon from '@mui/icons-material/BackupOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';

// icons
const icons = {
  DashboardOutlinedIcon,
  PeopleOutlineIcon,
  StorageOutlinedIcon,
  SettingsOutlinedIcon,
  SecurityOutlinedIcon,
  BackupOutlinedIcon,
  HubOutlinedIcon
};

// ==============================|| MENU ITEMS - ADMIN ||============================== //

const admin = {
  id: 'group-dashboard',
  title: 'Navigation',
  type: 'group',
  children: [
    {
      id: 'admin-dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/admin/dashboard',
      icon: icons.DashboardOutlinedIcon,
      breadcrumbs: false
    },
    {
      id: 'admin-manage-users',
      title: 'User Management',
      type: 'item',
      url: '/admin/manage-users',
      icon: icons.PeopleOutlineIcon,
      breadcrumbs: false
    },
    {
      id: 'admin-datasets',
      title: 'Datasets',
      type: 'item',
      url: '/admin/datasets',
      icon: icons.StorageOutlinedIcon,
      breadcrumbs: false
    }
  ]
};

export const superadminGovernance = {
  id: 'group-superadmin-governance',
  title: 'Superadmin',
  type: 'group',
  children: [
    {
      id: 'admin-system-config',
      title: 'System Configuration',
      type: 'item',
      url: '/admin/system-config',
      icon: icons.SettingsOutlinedIcon,
      breadcrumbs: false
    },
    {
      id: 'admin-audit-logs',
      title: 'Audit Logs',
      type: 'item',
      url: '/admin/audit-logs',
      icon: icons.SecurityOutlinedIcon,
      breadcrumbs: false
    },
    {
      id: 'admin-backend-recovery',
      title: 'Backup & Recovery',
      type: 'item',
      url: '/admin/backup',
      icon: icons.BackupOutlinedIcon,
      breadcrumbs: false
    },
  ]
};

export default admin;
