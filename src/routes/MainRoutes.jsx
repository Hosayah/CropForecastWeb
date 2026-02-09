import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';

// render - Dashboard
const FarmOwnerDashboard = Loadable(lazy(() => import('views/farmOwner/dashboard')));
const AdminDashboard = Loadable(lazy(() => import('views/admin/adminDashboard')));

// render - User pages
const CropRecommendationPage = Loadable(lazy(() => import('views/farmOwner/crop-recommendation')));
const FarmManagementPage = Loadable(lazy(() => import('views/farmOwner/farm-management')));
const LoginPage = Loadable(lazy(() => import('views/auth/Login')));
const SamplePage = Loadable(lazy(() => import('views/farmOwner/sample-page')));

// render - Admin pages
const AdminUsers = Loadable(lazy(() => import('views/admin/adminUsers')));
const AdminDatasets = Loadable(lazy(() => import('views/admin/adminDatasets')));
const AdminSystemConfig = Loadable(lazy(() => import('views/admin/adminSystemConfig')));
const AdminAuditLogs = Loadable(lazy(() => import('views/admin/adminAuditLogs')));
const AdminBackupRecovery = Loadable(lazy(() => import('views/admin/adminBackupRecovery')));
const AdminIntegrations = Loadable(lazy(() => import('views/admin/adminIntegrations')));

// ==============================|| ROUTE GUARDS ||============================== //

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  console.log('ProtectedRoute user:', user);

  if (!user) {
    return <LoginPage />;
  }
  return children;
}

function RoleGuard({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: 24 }}>
        <h2>403 - Forbidden</h2>
        <p>You don’t have permission to access this page.</p>
      </div>
    );
  }

  return children;
}

function AdminOnly({ children }) {
  return <RoleGuard allowedRoles={['admin', 'superadmin']}>{children}</RoleGuard>;
}

function FarmOwnerOnly({ children }) {
  return <RoleGuard allowedRoles={['farm_owner']}>{children}</RoleGuard>;
}

// ==============================|| ROLE BASED DEFAULT DASHBOARD ||============================== //

function RoleBasedDashboard() {
  const { user } = useAuth();
  console.log('RoleBasedDashboard user role:', user?.role);

  // ✅ Redirect instead of rendering dashboard at "/"
  if (user?.role === 'admin' || user?.role === 'superadmin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/farmOwner/dashboard" replace />;
}

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      path: '/',
      element: <RoleBasedDashboard />
    },

    // FARM OWNER ROUTES (farm_owner only)
    {
      path: 'farmOwner',
      children: [
        {
          path: 'dashboard',
          element: (
            <FarmOwnerOnly>
              <FarmOwnerDashboard />
            </FarmOwnerOnly>
          )
        },
        {
          path: 'crop-recommendation',
          element: (
            <FarmOwnerOnly>
              <CropRecommendationPage />
            </FarmOwnerOnly>
          )
        },
        {
          path: 'farm-management',
          element: (
            <FarmOwnerOnly>
              <FarmManagementPage />
            </FarmOwnerOnly>
          )
        },
        {
          path: 'sample-page',
          element: (
            <FarmOwnerOnly>
              <SamplePage />
            </FarmOwnerOnly>
          )
        }
      ]
    },

    // ADMIN ROUTES (admin + superadmin)
    {
      path: 'admin',
      children: [
        {
          path: 'dashboard',
          element: (
            <AdminOnly>
              <AdminDashboard />
            </AdminOnly>
          )
        },
        {
          path: 'manage-users',
          element: (
            <AdminOnly>
              <AdminUsers />
            </AdminOnly>
          )
        },
        {
          path: 'datasets',
          element: (
            <AdminOnly>
              <AdminDatasets />
            </AdminOnly>
          )
        },
        {
          path: 'system-config',
          element: (
            <AdminOnly>
              <AdminSystemConfig />
            </AdminOnly>
          )
        },
        {
          path: 'audit-logs',
          element: (
            <AdminOnly>
              <AdminAuditLogs />
            </AdminOnly>
          )
        },
        {
          path: 'backup',
          element: (
            <AdminOnly>
              <AdminBackupRecovery />
            </AdminOnly>
          )
        },
        {
          path: 'integrations',
          element: (
            <AdminOnly>
              <AdminIntegrations />
            </AdminOnly>
          )
        }
      ]
    }
  ]
};

export default MainRoutes;
