// features/auth/context/AuthContext.jsx
import { createContext, useContext, useEffect } from 'react';
import { useState } from 'react';
import { useAuthViewModel } from '../viewModel/useAuthViewModel';
import { useSession } from '../hooks/useSession';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useAuthViewModel();
  const session = useSession();
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('System is under maintenance.');

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      await session.bootstrapSession();
      if (!mounted) return;
      await auth.loadUser();
    };
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleMaintenanceMode = async (event) => {
      const message = event?.detail?.message || 'System is under maintenance.';
      setMaintenanceMessage(message);
      setMaintenanceOpen(true);
      try {
        await auth.logout();
      } catch {
        // Ignore cleanup failure; maintenance guard still redirects user.
      }
    };

    window.addEventListener('agrisense:maintenance-mode', handleMaintenanceMode);
    return () => window.removeEventListener('agrisense:maintenance-mode', handleMaintenanceMode);
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, session }}>
      {children}
      <Dialog open={maintenanceOpen} disableEscapeKeyDown>
        <DialogTitle>Maintenance Mode Enabled</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            {maintenanceMessage} You have been logged out.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setMaintenanceOpen(false);
              window.location.assign('/AgriSense/login');
            }}
          >
            Go to Login
          </Button>
        </DialogActions>
      </Dialog>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
