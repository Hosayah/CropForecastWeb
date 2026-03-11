import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import ModelTrainingOutlinedIcon from '@mui/icons-material/ModelTrainingOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';

const icons = {
  HubOutlinedIcon,
  ModelTrainingOutlinedIcon,
  StorageOutlinedIcon,
  DashboardOutlinedIcon
};

const mlManagement = {
  id: 'group-ml-management',
  title: 'ML Management',
  type: 'group',
  children: [
    {
      id: 'ml-dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/ml/dashboard',
      icon: icons.DashboardOutlinedIcon,
      breadcrumbs: false
    },
    {
      id: 'ml-model-registry',
      title: 'Model Registry',
      type: 'item',
      url: '/ml/models',
      icon: icons.HubOutlinedIcon,
      breadcrumbs: false
    },
    {
      id: 'ml-datasets',
      title: 'Datasets',
      type: 'item',
      url: '/ml/datasets',
      icon: icons.StorageOutlinedIcon,
      breadcrumbs: false
    },
    {
      id: 'ml-training-jobs',
      title: 'Validation Jobs',
      type: 'item',
      url: '/ml/validation-jobs',
      icon: icons.ModelTrainingOutlinedIcon,
      breadcrumbs: false
    }
  ]
};

export default mlManagement;
