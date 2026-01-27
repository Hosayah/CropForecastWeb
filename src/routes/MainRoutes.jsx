import { lazy } from 'react';
import { useAuth } from 'contexts/AuthContext';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';

// render- Dashboard
const FarmOwnerDashboard = Loadable(lazy(() => import('views/farmOwner/dashboard')));
const AdminDashboard = Loadable(lazy(() => import('views/admin/dashboard')));

// render - sample page
const CropRecommendationPage = Loadable(lazy(() => import('views/farmOwner/crop-recommendation')));
const FarmManagementPage = Loadable(lazy(() => import('views/farmOwner/farm-management')));
const SamplePage1 = Loadable(lazy(() => import('views/admin/sample-page')));
const LoginPage = Loadable(lazy(() => import('views/auth/Login')));
const SamplePage = Loadable(lazy(() => import('views/farmOwner/sample-page')));


// ==============================|| MAIN ROUTING ||============================== //

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  console.log("ProtectedRoute user:", user); // <- check the full user object

  if (!user) {
    return <LoginPage />;
  }
  return children;
}

function RoleBasedDashboard() {
  const { user } = useAuth();
  console.log("RoleBasedDashboard user role:", user?.role); // <- check role

  if (user?.role === "admin") return <AdminDashboard />;
  return <FarmOwnerDashboard />;
}

const MainRoutes = {
  path: '/',
  element: <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>,
  children: [
    {
      path: '/',
      element: <RoleBasedDashboard/>
    },
    {
      path: 'farmOwner',
      children: [
        {
          path: 'dashboard',
          element: <FarmOwnerDashboard/>
        },
        {
          path: 'crop-recommendation',
          element: <CropRecommendationPage />
        },
        {
          path: 'farm-management',
          element: <FarmManagementPage/>
        },
        {
          /*New Page Route */
          path: 'sample-page',
          element: <SamplePage/>
        },
      ]
    },
    {
      path: 'admin',
      children: [
        {
          path: 'dashboard',
          element: <AdminDashboard />
        },
        {
          path: 'sample-page',
          element: <SamplePage1 />
        }
      ]
    },
  ]
};

export default MainRoutes;
