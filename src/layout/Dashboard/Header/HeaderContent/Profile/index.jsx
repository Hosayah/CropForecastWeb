import { useRef, useState } from 'react';

import ButtonBase from '@mui/material/ButtonBase';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';

import ProfileTab from './ProfileTab';
import { formatRoleLabel } from './roleLabel';
import Avatar from 'components/@extended/Avatar';
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';

import { useAuth } from 'contexts/AuthContext';

function getDisplayName(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
}

function getInitials(user) {
  const initials = [user?.firstName, user?.lastName]
    .map((value) => String(value || '').trim().charAt(0))
    .filter(Boolean)
    .join('')
    .slice(0, 2);
  return initials ? initials.toUpperCase() : null;
}

function ProfileIdentityPanel({ user, compact = false }) {
  const displayName = getDisplayName(user);
  const roleLabel = formatRoleLabel(user?.role);
  const initials = getInitials(user);

  return (
    <Box
      sx={(theme) => ({
        p: compact ? 2 : 2.5,
        borderRadius: compact ? 3 : 4,
        border: '1px solid',
        borderColor: alpha(theme.palette.secondary.main, 0.12),
        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.18)} 0%, ${alpha(theme.palette.success.light, 0.16)} 100%)`
      })}
    >
      <Stack direction="row" spacing={compact ? 1.5 : 2} alignItems="center">
        <Avatar
          sx={(theme) => ({
            width: compact ? 52 : 64,
            height: compact ? 52 : 64,
            fontSize: compact ? '1rem' : '1.2rem',
            bgcolor: theme.palette.common.white,
            color: 'secondary.main',
            border: '1px solid',
            borderColor: alpha(theme.palette.secondary.main, 0.12),
            boxShadow: `0 10px 24px ${alpha(theme.palette.common.black, 0.08)}`
          })}
        >
          {initials || <PersonOutlinedIcon fontSize="small" />}
        </Avatar>
        <Stack spacing={0.6} sx={{ minWidth: 0 }}>
          <Typography variant={compact ? 'h5' : 'h4'} sx={{ lineHeight: 1.1 }}>
            {displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
            {user?.email || '-'}
          </Typography>
          <Chip
            size="small"
            label={roleLabel}
            color="secondary"
            variant="outlined"
            sx={{ width: 'fit-content', bgcolor: 'background.paper' }}
          />
        </Stack>
      </Stack>
    </Box>
  );
}

function ProfileInfoRow({ label, value }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      sx={{
        px: 1.5,
        py: 1.25,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default'
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle2" sx={{ textAlign: 'right' }}>
        {value || '-'}
      </Typography>
    </Stack>
  );
}

export default function Profile() {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { user, logout, updateProfile, changePassword, loading } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');

  const handleToggle = () => setOpen((prevOpen) => !prevOpen);

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const openEdit = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setEditOpen(true);
    setOpen(false);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ firstName, lastName });
      setEditOpen(false);
    } catch (err) {
      console.error('Update profile failed', err);
    }
  };

  const handleChangePassword = async () => {
    try {
      await changePassword(oldPassword, newPassword, confirmPassword);
      setPasswordOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Change password failed', err);
    }
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 'auto' }}>
      <Tooltip title="Profile" disableInteractive>
        <ButtonBase
          sx={(theme) => ({
            p: 0.25,
            borderRadius: 1,
            '&:focus-visible': { outline: `2px solid ${theme.vars.palette.secondary.dark}`, outlineOffset: 2 }
          })}
          aria-label="open profile"
          ref={anchorRef}
          aria-controls={open ? 'profile-grow' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
        >
          <Avatar size="sm" color="secondary" sx={{ '&:hover': { outline: '1px solid', outlineColor: 'primary.black' } }}>
            <PersonOutlinedIcon fontSize="small" />
          </Avatar>
        </ButtonBase>
      </Tooltip>

      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: { offset: [0, 9] }
            }
          ]
        }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position="top-right" in={open} {...TransitionProps}>
            <Paper
              sx={(theme) => ({
                boxShadow: theme.vars.customShadows.z1,
                width: 340,
                minWidth: 270,
                maxWidth: { xs: 310, md: 340 },
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden'
              })}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard elevation={0} border={false} content={false}>
                  <CardContent sx={{ px: 2.25, pt: 2.25, pb: 1.5 }}>
                    <Stack spacing={1.5}>
                      <ProfileIdentityPanel user={user} compact />
                      <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
                        Manage your account details, password, and session from here.
                      </Typography>
                    </Stack>
                  </CardContent>
                  <Divider />
                  <ProfileTab
                    onViewProfile={() => {
                      setViewOpen(true);
                      setOpen(false);
                    }}
                    onEditProfile={openEdit}
                    onChangePassword={() => {
                      setPasswordOpen(true);
                      setOpen(false);
                    }}
                    onLogout={handleLogout}
                  />
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ pb: 0 }}>Your Profile</DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          <Stack spacing={2.25}>
            <ProfileIdentityPanel user={user} />
            <Stack spacing={1.15}>
              <ProfileInfoRow label="First Name" value={user?.firstName || '-'} />
              <ProfileInfoRow label="Last Name" value={user?.lastName || '-'} />
              <ProfileInfoRow label="Email" value={user?.email || '-'} />
              <ProfileInfoRow label="Role" value={formatRoleLabel(user?.role)} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ pb: 0 }}>Edit Profile</DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Keep your profile details current so your account stays clear and easy to identify across the app.
            </Typography>
            <TextField label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth />
            <TextField label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveProfile} disabled={loading}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={passwordOpen} onClose={() => setPasswordOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ pb: 0 }}>Change Password</DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Use a strong password you do not reuse elsewhere, then confirm it here before saving.
            </Typography>
            <TextField
              label="Old Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              fullWidth
            />
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setPasswordOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleChangePassword} disabled={loading}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
