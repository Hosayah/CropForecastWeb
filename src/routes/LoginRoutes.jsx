import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';

// jwt auth
const LoginPage = Loadable(lazy(() => import('views/auth/Login')));
const RegisterPage = Loadable(lazy(() => import('views/auth/Register')));
const VerifyEmail = Loadable(lazy(() => import('views/auth/verifyEmail')));
const ForgotPassword = Loadable(lazy(() => import('views/auth/ForgotPassword')));
const ResetPassword = Loadable(lazy(() => import('views/auth/ResetPassword')));
const LandingPage = Loadable(lazy(() => import('views/public/Landing')));

// ==============================|| AUTH ROUTING ||============================== //

const LoginRoutes = {
  path: '/',
  children: [
    {
      path: '/',
      children: [
        {
          path: '/landing',
          element: <LandingPage />
        },
        {
          path: '/login',
          element: <LoginPage />
        },
        {
          path: '/register',
          element: <RegisterPage />
        },
        {
          path: '/verify-email',
          element: <VerifyEmail />
        },
        {
          path: '/forgot-password',
          element: <ForgotPassword />
        },
        {
          path: '/reset-password',
          element: <ResetPassword />
        }
      ]
    }
  ]
};

export default LoginRoutes;
