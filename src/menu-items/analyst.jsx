import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';

const icons = {
  AnalyticsOutlinedIcon,
  WarningAmberOutlinedIcon,
  CompareArrowsOutlinedIcon,
  MapOutlinedIcon,
  StorageOutlinedIcon,
  SmartToyOutlinedIcon,
  FactCheckOutlinedIcon
};

const analyst = {
  id: 'group-analyst',
  title: 'Analyst',
  type: 'group',
  children: [
    {
      id: 'analyst-overview',
      title: 'Overview',
      type: 'item',
      url: '/analyst/overview',
      icon: icons.AnalyticsOutlinedIcon,
      breadcrumbs: false
    },
    {
      id: 'analyst-risk-analysis',
      title: 'Risk Analysis',
      type: 'item',
      url: '/analyst/risk-analysis',
      icon: icons.WarningAmberOutlinedIcon,
      breadcrumbs: false
    },
    {
      id: 'analyst-province-comparison',
      title: 'Province Comparison',
      type: 'item',
      url: '/analyst/province-comparison',
      icon: icons.CompareArrowsOutlinedIcon,
      breadcrumbs: false
    },
    {
      id: 'analyst-map',
      title: 'Map',
      type: 'item',
      url: '/analyst/map',
      icon: icons.MapOutlinedIcon,
      breadcrumbs: false
    },
    {
      id: 'analyst-datasets',
      title: 'Datasets',
      type: 'item',
      url: '/analyst/datasets',
      icon: icons.StorageOutlinedIcon,
      breadcrumbs: false
    },
    {
      id: 'analyst-model-info',
      title: 'Model Info',
      type: 'item',
      url: '/analyst/model-info',
      icon: icons.SmartToyOutlinedIcon,
      breadcrumbs: false
    },
    {
      id: 'analyst-audit-logs',
      title: 'Audit Logs',
      type: 'item',
      url: '/analyst/audit-logs',
      icon: icons.FactCheckOutlinedIcon,
      breadcrumbs: false
    }
  ]
};

export default analyst;
