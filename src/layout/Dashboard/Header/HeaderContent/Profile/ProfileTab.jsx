import PropTypes from 'prop-types';
import List from '@mui/material/List';
import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import EditOutlined from '@ant-design/icons/EditOutlined';
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import LockOutlined from '@ant-design/icons/LockOutlined';

export default function ProfileTab({ onViewProfile, onEditProfile, onChangePassword, onLogout }) {
  const actions = [
    {
      key: 'edit',
      label: 'Edit Profile',
      description: 'Update your name and keep your account details current.',
      icon: <EditOutlined />,
      onClick: onEditProfile
    },
    {
      key: 'view',
      label: 'View Profile',
      description: 'Review your account identity and role details.',
      icon: <UserOutlined />,
      onClick: onViewProfile
    },
    {
      key: 'password',
      label: 'Change Password',
      description: 'Refresh your password for better account protection.',
      icon: <LockOutlined />,
      onClick: onChangePassword
    },
    {
      key: 'logout',
      label: 'Logout',
      description: 'Sign out of the current session on this device.',
      icon: <LogoutOutlined />,
      onClick: onLogout,
      tone: 'error'
    }
  ];

  return (
    <List component="nav" sx={{ p: 2, pt: 1.5, display: 'grid', gap: 1 }}>
      {actions.map((action) => {
        const isError = action.tone === 'error';
        return (
          <ListItemButton
            key={action.key}
            onClick={action.onClick}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: isError ? 'error.light' : 'divider',
              px: 1.25,
              py: 1.1,
              alignItems: 'flex-start',
              '&:hover': {
                bgcolor: isError ? 'error.lighter' : 'secondary.lighter',
                borderColor: isError ? 'error.main' : 'secondary.light'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: 1.25, mt: 0.25 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 2.5,
                  bgcolor: isError ? 'error.lighter' : 'secondary.lighter',
                  color: isError ? 'error.main' : 'secondary.main'
                }}
              >
                {action.icon}
              </Box>
            </ListItemIcon>
            <ListItemText
              primary={action.label}
              secondary={action.description}
              primaryTypographyProps={{ fontWeight: 600, color: isError ? 'error.dark' : 'text.primary' }}
              secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
}

ProfileTab.propTypes = {
  onViewProfile: PropTypes.func,
  onEditProfile: PropTypes.func,
  onChangePassword: PropTypes.func,
  onLogout: PropTypes.func
};
