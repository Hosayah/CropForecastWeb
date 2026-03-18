// assets
import { DashboardOutlined } from '@ant-design/icons';
import { RobotOutlined } from '@ant-design/icons';
import AgricultureOutlinedIcon from '@mui/icons-material/AgricultureOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import DateRangeOutlinedIcon from '@mui/icons-material/DateRangeOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import CompostOutlinedIcon from '@mui/icons-material/CompostOutlined';
import {LineChartOutlined} from '@ant-design/icons'

// icons
const icons = {
  DashboardOutlined,
  HomeOutlinedIcon,
  RobotOutlined,
  AgricultureOutlinedIcon,
  LineChartOutlined,
  DateRangeOutlinedIcon,
  MapOutlinedIcon,
  CompostOutlinedIcon
};

// ==============================|| MENU ITEMS - DASHBOARD ||============================== //

const farmOwner = {
  id: 'group-dashboard',
  title: 'Navigation',
  type: 'group',
  children: [
    {
      id: 'farmOwner-dashboard',
      title: 'Home',
      type: 'item',
      url: '/farmOwner/dashboard',
      icon: icons.HomeOutlinedIcon,
      breadcrumbs: false
    },
    {
      id: 'farm-management',
      title: 'Farms',
      type: 'item',
      url: '/farmOwner/farm-management',
      icon: icons.AgricultureOutlinedIcon,
      breadcrumbs: false
    },
    {
      id: 'crop-recommendation',
      title: 'Crop',
      type: 'item',
      url: '/farmOwner/crop-recommendation',
      icon: icons.CompostOutlinedIcon,
      breadcrumbs: false
    },
    {
      id: 'farm-map',
      title: 'Map',
      type: 'item',
      url: '/farmOwner/farm-map',
      icon: icons.MapOutlinedIcon,
      breadcrumbs: false
    }
  ]
};

export default farmOwner;
