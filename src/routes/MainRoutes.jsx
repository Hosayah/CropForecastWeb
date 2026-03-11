import { lazy } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
const FarmMapPage = Loadable(lazy(() => import('views/farmOwner/farm-map')));
const LoginPage = Loadable(lazy(() => import('views/auth/Login')));
const SamplePage = Loadable(lazy(() => import('views/farmOwner/sample-page')));

// render - Admin pages
const AdminUsers = Loadable(lazy(() => import('views/admin/adminUsers')));
const AdminDatasets = Loadable(lazy(() => import('views/admin/adminDatasets')));
const AdminSystemConfig = Loadable(lazy(() => import('views/admin/adminSystemConfig')));
const AdminAuditLogs = Loadable(lazy(() => import('views/admin/adminAuditLogs')));
const AdminBackupRecovery = Loadable(lazy(() => import('views/admin/adminBackupRecovery')));
const AdminIntegrations = Loadable(lazy(() => import('views/admin/adminIntegrations')));
const ModelRegistry = Loadable(lazy(() => import('views/ml/ModelRegistry')));
const MlDatasets = Loadable(lazy(() => import('views/ml/Datasets')));
const TrainingJobs = Loadable(lazy(() => import('views/ml/TrainingJobs')));
const TrainingJobDetails = Loadable(lazy(() => import('views/ml/TrainingJobDetails')));
const MlDashboard = Loadable(lazy(() => import('views/ml/Dashboard')));
const AnalystOverview = Loadable(lazy(() => import('views/analyst/Overview')));
const AnalystRiskAnalysis = Loadable(lazy(() => import('views/analyst/RiskAnalysis')));
const AnalystProvinceComparison = Loadable(lazy(() => import('views/analyst/ProvinceComparison')));
const AnalystMap = Loadable(lazy(() => import('views/analyst/Map')));
const AnalystDatasets = Loadable(lazy(() => import('views/analyst/Datasets')));
const AnalystModelInfo = Loadable(lazy(() => import('views/analyst/ModelInfo')));
const AnalystAuditLogs = Loadable(lazy(() => import('views/analyst/AuditLogs')));

// ==============================|| ROUTE GUARDS ||============================== //

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/landing" replace state={{ from: location }} />;
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

function SuperAdminOnly({ children }) {
  return <RoleGuard allowedRoles={['superadmin']}>{children}</RoleGuard>;
}

function FarmOwnerOnly({ children }) {
  return <RoleGuard allowedRoles={['farm_owner']}>{children}</RoleGuard>;
}

function MlModuleAccessOnly({ children }) {
  return <RoleGuard allowedRoles={['ml_engineer', 'admin', 'superadmin']}>{children}</RoleGuard>;
}

function MlAdvancedOnly({ children }) {
  return <RoleGuard allowedRoles={['ml_engineer', 'superadmin']}>{children}</RoleGuard>;
}

function AnalystAccessOnly({ children }) {
  return <RoleGuard allowedRoles={['analyst', 'admin', 'superadmin']}>{children}</RoleGuard>;
}

// ==============================|| ROLE BASED DEFAULT DASHBOARD ||============================== //

function RoleBasedDashboard() {
  const { user } = useAuth();

  // ✅ Redirect instead of rendering dashboard at "/"
  if (user?.role === 'admin' || user?.role === 'superadmin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (user?.role === 'ml_engineer') {
    return <Navigate to="/ml/dashboard" replace />;
  }
  if (user?.role === 'analyst') {
    return <Navigate to="/analyst/overview" replace />;
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
          path: 'create-farm',
          element: (
            <FarmOwnerOnly>
              <FarmManagementPage />
            </FarmOwnerOnly>
          )
        },
        {
          path: 'farm-map',
          element: (
            <FarmOwnerOnly>
              <FarmMapPage />
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
          element: <RoleGuard allowedRoles={['admin', 'superadmin', 'ml_engineer']}><AdminDatasets /></RoleGuard>
        },
        {
          path: 'system-config',
          element: (
            <SuperAdminOnly>
              <AdminSystemConfig />
            </SuperAdminOnly>
          )
        },
        {
          path: 'audit-logs',
          element: (
            <SuperAdminOnly>
              <AdminAuditLogs />
            </SuperAdminOnly>
          )
        },
        {
          path: 'backup',
          element: (
            <SuperAdminOnly>
              <AdminBackupRecovery />
            </SuperAdminOnly>
          )
        },
        {
          path: 'integrations',
          element: (
            <SuperAdminOnly>
              <AdminIntegrations />
            </SuperAdminOnly>
          )
        }
      ]
    }
    ,
    // ML ENGINEER ROUTES (ml_engineer only)
    {
      path: 'ml',
      children: [
        {
          path: 'dashboard',
          element: (
            <MlAdvancedOnly>
              <MlDashboard />
            </MlAdvancedOnly>
          )
        },
        {
          path: 'models',
          element: (
            <MlModuleAccessOnly>
              <ModelRegistry />
            </MlModuleAccessOnly>
          )
        },
        {
          path: 'datasets',
          element: (
            <MlAdvancedOnly>
              <MlDatasets />
            </MlAdvancedOnly>
          )
        },
        {
          path: 'models/upload',
          element: <Navigate to="/ml/models" replace />
        },
        {
          path: 'validation-jobs',
          element: (
            <MlAdvancedOnly>
              <TrainingJobs />
            </MlAdvancedOnly>
          )
        },
        {
          path: 'validation-jobs/:jobId',
          element: (
            <MlAdvancedOnly>
              <TrainingJobDetails />
            </MlAdvancedOnly>
          )
        },
        {
          path: 'training',
          element: <Navigate to="/ml/validation-jobs" replace />
        },
        {
          path: 'training/:jobId',
          element: (
            <MlAdvancedOnly>
              <TrainingJobDetails />
            </MlAdvancedOnly>
          )
        },
        {
          path: 'monitoring',
          element: <Navigate to="/ml/dashboard" replace />
        }
      ]
    },
    {
      path: 'analyst',
      children: [
        {
          path: 'overview',
          element: (
            <AnalystAccessOnly>
              <AnalystOverview />
            </AnalystAccessOnly>
          )
        },
        {
          path: 'risk-analysis',
          element: (
            <AnalystAccessOnly>
              <AnalystRiskAnalysis />
            </AnalystAccessOnly>
          )
        },
        {
          path: 'province-comparison',
          element: (
            <AnalystAccessOnly>
              <AnalystProvinceComparison />
            </AnalystAccessOnly>
          )
        },
        {
          path: 'map',
          element: (
            <AnalystAccessOnly>
              <AnalystMap />
            </AnalystAccessOnly>
          )
        },
        {
          path: 'datasets',
          element: (
            <AnalystAccessOnly>
              <AnalystDatasets />
            </AnalystAccessOnly>
          )
        },
        {
          path: 'model-info',
          element: (
            <AnalystAccessOnly>
              <AnalystModelInfo />
            </AnalystAccessOnly>
          )
        },
        {
          path: 'audit-logs',
          element: (
            <AnalystAccessOnly>
              <AnalystAuditLogs />
            </AnalystAccessOnly>
          )
        }
      ]
    }
  ]
};

export default MainRoutes;
