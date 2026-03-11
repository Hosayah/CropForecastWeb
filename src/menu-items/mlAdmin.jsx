import HubOutlinedIcon from '@mui/icons-material/HubOutlined';

const mlAdmin = {
  id: 'group-ml-admin',
  title: 'ML Activation',
  type: 'group',
  children: [
    {
      id: 'ml-admin-model-registry',
      title: 'Model Registry',
      type: 'item',
      url: '/ml/models',
      icon: HubOutlinedIcon,
      breadcrumbs: false
    }
  ]
};

export default mlAdmin;
