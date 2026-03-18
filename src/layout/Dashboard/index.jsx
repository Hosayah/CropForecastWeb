import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import useMediaQuery from '@mui/material/useMediaQuery';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';

// project imports
import Drawer from './Drawer';
import Header from './Header';
import Footer from './Footer';
import Loader from 'components/Loader';
import Breadcrumbs from 'components/@extended/Breadcrumbs';

import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// ==============================|| MAIN LAYOUT ||============================== //

export default function DashboardLayout() {
  const { menuMasterLoading } = useGetMenuMaster();
  const downXL = useMediaQuery((theme) => theme.breakpoints.down('xl'));

  // set media wise responsive drawer
  useEffect(() => {
    handlerDrawerOpen(!downXL);
  }, [downXL]);

  if (menuMasterLoading) return <Loader />;

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(82,196,26,0.08), transparent 26%), radial-gradient(circle at top right, rgba(250, 173, 20, 0.06), transparent 24%), linear-gradient(180deg, #f9fbf7 0%, #f5f7fa 44%, #f8fafc 100%)'
      }}
    >
      <Header />
      <Drawer />

      <Box component="main" sx={{ width: 'calc(100% - 260px)', flexGrow: 1, p: { xs: 2, sm: 3 } }}>
        <Toolbar sx={{ mt: 'inherit' }} />
        <Box
          sx={{
            ...{ px: { xs: 0, sm: 2 } },
            position: 'relative',
            minHeight: 'calc(100vh - 110px)',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 1600,
            mx: 'auto',
            width: '100%'
          }}
        >
          <Breadcrumbs />
          <Outlet />
          <Footer />
        </Box>
      </Box>
    </Box>
  );
}
