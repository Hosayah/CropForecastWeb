import { useEffect, useMemo, useState } from 'react';

// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { InputLabel } from '@mui/material';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

import MainCard from 'components/MainCard';

// table
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';

// dialog
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// checkbox
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

// icons
import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

// viewModel
import { useAdminUsersViewModel } from 'viewmodel/useAdminUsersViewModel';

// ==============================|| HELPERS ||============================== //

function RoleChip({ role }) {
  const roleConfig = useMemo(() => {
    switch (role) {
      case 'superadmin':
        return { label: 'Superadmin', color: 'error' };
      case 'admin':
        return { label: 'Admin', color: 'primary' };
      case 'analyst':
        return { label: 'Analyst', color: 'info' };
      case 'ml_engineer':
        return { label: 'ML Engineer', color: 'warning' };
      case 'farm_owner':
        return { label: 'Farm Owner', color: 'success' };
      default:
        return { label: 'User', color: 'default' };
    }
  }, [role]);

  return <Chip size="small" label={roleConfig.label} color={roleConfig.color} variant="outlined" />;
}

function StatusChip({ status }) {
  const config = useMemo(() => {
    return status === 'active' ? { label: 'Active', color: 'success' } : { label: 'Deactivated', color: 'error' };
  }, [status]);

  return <Chip size="small" label={config.label} color={config.color} variant="outlined" />;
}

function AdminSummaryCard({ title, value, subtitle, loading }) {
  return (
    <MainCard content={false} sx={{ height: '100%' }}>
      <Stack sx={{ p: 2.5 }} spacing={1.25}>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>

        {loading ? (
          <>
            <Skeleton height={34} width="55%" />
            <Skeleton height={18} width="75%" />
          </>
        ) : (
          <>
            <Typography variant="h4">{typeof value === 'number' ? value.toLocaleString() : value}</Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </>
        )}
      </Stack>
    </MainCard>
  );
}

function generateTempPassword() {
  // simple UI-only generator (backend will enforce final rules later)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// ==============================|| ADMIN USERS PAGE ||============================== //

export default function AdminUsers() {
  const { users, stats, loading, error, fetchUsers, changeRole, toggleStatus, createUser } = useAdminUsersViewModel();

  const ROLE_FILTERS = useMemo(() => ['ALL', 'farm_owner', 'admin', 'ml_engineer', 'analyst'], []);
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    role: 'farm_owner',
    tempPassword: '',
    confirmPassword: '',
    requirePasswordChange: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (roleFilter !== 'ALL') list = list.filter((u) => u.role === roleFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    return list;
  }, [users, roleFilter, search]);

  const handleChangeRole = async (userId, nextRole) => {
    await changeRole(userId, nextRole);
  };

  const handleToggleStatus = async (userId) => {
    await toggleStatus(userId);
  };

  const handleOpenCreate = () => {
    setCreateForm({
      fullName: '',
      email: '',
      role: 'farm_owner',
      tempPassword: generateTempPassword(),
      confirmPassword: '',
      requirePasswordChange: true
    });
    setCreateOpen(true);
  };

  const passwordMismatch =
    createForm.tempPassword.trim() && createForm.confirmPassword.trim() ? createForm.tempPassword !== createForm.confirmPassword : false;

  const canCreate =
    createForm.fullName.trim() &&
    createForm.email.trim() &&
    createForm.tempPassword.trim() &&
    createForm.confirmPassword.trim() &&
    !passwordMismatch;

  const handleCreateAccountUIOnly = async () => {
    const payload = {
      fullName: createForm.fullName.trim(),
      email: createForm.email.trim(),
      role: createForm.role,
      tempPassword: createForm.tempPassword,
      requirePasswordChange: createForm.requirePasswordChange
    };

    const res = await createUser(payload);

    if (res.success) {
      setCreateOpen(false);
    }
  };

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* row 1 */}
      <Grid size={12}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Typography variant="h5">User Management</Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              sx={{ minWidth: { xs: '100%', sm: 260 } }}
            />

            <Stack direction="row" spacing={1} alignItems="center">
              <InputLabel>Role:</InputLabel>
              <Select
                size="small"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                sx={{ minWidth: { xs: '100%', sm: 170 } }}
              >
                {ROLE_FILTERS.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r === 'ALL' ? 'ALL' : r.replace('_', ' ').toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchUsers}>
              Refresh
            </Button>

            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
              Create Account
            </Button>
          </Stack>
        </Stack>

        {error && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            {error}
          </Typography>
        )}
      </Grid>

      {/* stats */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <AdminSummaryCard title="Total Users" value={stats.totalUsers} subtitle="All user profiles" loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <AdminSummaryCard title="Active Users" value={stats.activeUsers} subtitle="Enabled accounts" loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <AdminSummaryCard title="Deactivated Users" value={stats.deactivatedUsers} subtitle="Disabled accounts" loading={loading} />
      </Grid>

      {/* users table */}
      <Grid size={{ xs: 12 }}>
        <MainCard content={false} sx={{ mt: 1.5 }}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Users</Typography>
              <Typography variant="caption" color="text.secondary">
                Showing {loading ? '...' : filteredUsers.length} result(s)
              </Typography>
            </Stack>

            <Divider />

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading
                    ? Array.from({ length: 8 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Skeleton width="70%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton width="80%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={90} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={80} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={120} />
                          </TableCell>
                          <TableCell align="right">
                            <Skeleton width={120} />
                          </TableCell>
                        </TableRow>
                      ))
                    : filteredUsers.map((u) => (
                        <TableRow key={u.id} hover>
                          <TableCell>{u.fullName}</TableCell>
                          <TableCell>{u.email}</TableCell>

                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <RoleChip role={u.role} />
                              <Select
                                size="small"
                                value={u.role}
                                onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                sx={{ minWidth: 160 }}
                              >
                                <MenuItem value="farm_owner">FARM OWNER</MenuItem>
                                <MenuItem value="ml_engineer">ML ENGINEER</MenuItem>
                                <MenuItem value="analyst">Analyst</MenuItem>
                                <MenuItem value="admin">ADMIN</MenuItem>
                              </Select>
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <StatusChip status={u.status} />
                          </TableCell>

                          <TableCell>{u.lastLoginAt || '—'}</TableCell>

                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <IconButton
                                size="small"
                                onClick={() => handleToggleStatus(u.id)}
                                title={u.status === 'active' ? 'Deactivate user' : 'Activate user'}
                              >
                                {u.status === 'active' ? <BlockIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}

                  {!loading && filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary">
                          No users found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </MainCard>
      </Grid>

      {/* Create Account Dialog (UI-ready for backend later) */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Account</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              This will create a Firebase Auth account through the backend (Admin SDK). For now, this is UI-only.
            </Typography>

            <TextField
              label="Full Name"
              value={createForm.fullName}
              onChange={(e) => setCreateForm((p) => ({ ...p, fullName: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Email"
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              fullWidth
            />

            <Stack direction="row" spacing={2} alignItems="center">
              <InputLabel sx={{ minWidth: 60 }}>Role:</InputLabel>
              <Select value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))} fullWidth>
                <MenuItem value="farm_owner">FARM OWNER</MenuItem>
                <MenuItem value="admin">ADMIN</MenuItem>
                <MenuItem value="ml_engineer">ML ENGINEER</MenuItem>
                <MenuItem value="analyst">Analyst</MenuItem>
              </Select>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <TextField
                label="Temporary Password"
                value={createForm.tempPassword}
                onChange={(e) => setCreateForm((p) => ({ ...p, tempPassword: e.target.value }))}
                fullWidth
              />
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() =>
                  setCreateForm((p) => ({
                    ...p,
                    tempPassword: generateTempPassword(),
                    confirmPassword: ''
                  }))
                }
                sx={{ minWidth: { xs: '100%', sm: 160 } }}
              >
                Generate
              </Button>
            </Stack>

            <TextField
              label="Confirm Temporary Password"
              value={createForm.confirmPassword}
              onChange={(e) => setCreateForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              fullWidth
              error={passwordMismatch}
              helperText={passwordMismatch ? 'Passwords do not match.' : ''}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={createForm.requirePasswordChange}
                  onChange={(e) => setCreateForm((p) => ({ ...p, requirePasswordChange: e.target.checked }))}
                />
              }
              label="Require password change on first login"
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateAccountUIOnly} disabled={!canCreate}>
            Create Account
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
