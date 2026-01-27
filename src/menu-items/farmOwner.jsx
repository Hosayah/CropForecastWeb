// assets
import { DashboardOutlined } from '@ant-design/icons';
import { RobotOutlined } from '@ant-design/icons';
import AgricultureOutlinedIcon from '@mui/icons-material/AgricultureOutlined';
import {LineChartOutlined} from '@ant-design/icons'

// icons
const icons = {
  DashboardOutlined,
  RobotOutlined,
  AgricultureOutlinedIcon,
  LineChartOutlined
};

// ==============================|| MENU ITEMS - DASHBOARD ||============================== //

const farmOwner = {
  id: 'group-dashboard',
  title: 'Navigation',
  type: 'group',
  children: [
    {
      id: 'farmOwner-dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/farmOwner/dashboard',
      icon: icons.LineChartOutlined,
      breadcrumbs: false
    },
    {
      id: 'crop-recommendation',
      title: 'Crop Recommendation',
      type: 'item',
      url: '/farmOwner/crop-recommendation',
      icon: icons.RobotOutlined,
      breadcrumbs: false
    },
    {
      id: 'farm-management',
      title: 'Farm Management',
      type: 'item',
      url: '/farmOwner/farm-management',
      icon: icons.AgricultureOutlinedIcon,
      breadcrumbs: false
    },
  ]
};

export default farmOwner;
