import { useEffect, useMemo, useState } from 'react';

// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { InputLabel } from '@mui/material';

import MainCard from 'components/MainCard';

// MUI table
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

// icons (optional)
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import StorageIcon from '@mui/icons-material/Storage';
import RuleIcon from '@mui/icons-material/Rule';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

// ==============================|| ADMIN SUMMARY CARD (NEW) ||============================== //

function AdminSummaryCard({ title, value, subtitle, icon, loading }) {
  return (
    <MainCard content={false} sx={{ height: '100%' }}>
      <Stack sx={{ p: 2.5 }} spacing={1.25}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>

          {icon && (
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover'
              }}
            >
              {icon}
            </Box>
          )}
        </Stack>

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

// ==============================|| ADMIN DASHBOARD ||============================== //

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  // ✅ Optional filter (same UI pattern as your Province select)
  const MODULES = useMemo(() => ['ALL', 'USERS', 'DATASETS', 'SYSTEM', 'SECURITY'], []);
  const [moduleFilter, setModuleFilter] = useState('ALL');

  const [summary, setSummary] = useState({
    totalUsers: 0,
    activeUsers: 0,
    datasets: 0,
    auditEvents: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // ✅ Replace later with Firestore / analytics endpoint
    const mockFetch = async () => {
      setLoading(true);

      await new Promise((r) => setTimeout(r, 650));

      setSummary({
        totalUsers: 128,
        activeUsers: 93,
        datasets: 12,
        auditEvents: 57
      });

      setRecentActivity([
        {
          id: '1',
          module: 'USERS',
          action: 'USER_REGISTER',
          detail: 'New user registered (juan@email.com)',
          actor: 'System',
          timestamp: 'Today • 6:11 PM'
        },
        {
          id: '2',
          module: 'DATASETS',
          action: 'DATASET_UPLOAD',
          detail: 'ProvincialYield_2015_2024.csv uploaded',
          actor: 'Admin',
          timestamp: 'Yesterday • 2:34 PM'
        },
        {
          id: '3',
          module: 'SYSTEM',
          action: 'CONFIG_UPDATE',
          detail: 'Default horizon changed to Q+4',
          actor: 'Admin',
          timestamp: '2 days ago • 9:02 AM'
        }
      ]);

      setLoading(false);
    };

    mockFetch();
  }, []);

  const filteredActivity = moduleFilter === 'ALL' ? recentActivity : recentActivity.filter((x) => x.module === moduleFilter);

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
          <Typography variant="h5">Admin Dashboard</Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <InputLabel>Module:</InputLabel>
            <Select
              size="small"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 220 } }}
            >
              {MODULES.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </Stack>
      </Grid>

      {/* Summary cards (NEW custom cards) */}
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard
          title="Total Users"
          value={summary.totalUsers}
          subtitle="All registered accounts"
          icon={<PeopleOutlineIcon fontSize="small" />}
          loading={loading}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard
          title="Active Users"
          value={summary.activeUsers}
          subtitle="Accounts currently enabled"
          icon={<VerifiedUserIcon fontSize="small" />}
          loading={loading}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard
          title="Datasets"
          value={summary.datasets}
          subtitle="Available dataset files"
          icon={<StorageIcon fontSize="small" />}
          loading={loading}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AdminSummaryCard
          title="Audit Events"
          value={summary.auditEvents}
          subtitle="Logged admin/system actions"
          icon={<RuleIcon fontSize="small" />}
          loading={loading}
        />
      </Grid>

      <Grid sx={{ display: { sm: 'none', md: 'block', lg: 'none' } }} size={{ md: 8 }} />

      {/* row 2 (Chart area placeholder) */}
      <Grid size={{ xs: 12 }}>
        <MainCard content={false} sx={{ mt: 1.5 }}>
          {loading ? (
            <Stack sx={{ p: 2.5 }} spacing={1.5}>
              <Typography variant="h6">System Activity Overview</Typography>
              <Skeleton height={22} width="40%" />
              <Skeleton height={220} />
            </Stack>
          ) : (
            <Stack spacing={1.2} sx={{ p: 2.5 }}>
              <Typography variant="h6">System Activity Overview</Typography>
              <Typography variant="body2" color="text.secondary">
                This section will show charts for logins, uploads, and admin events (coming next).
              </Typography>

              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  No chart connected yet.
                </Typography>
              </Paper>
            </Stack>
          )}
        </MainCard>
      </Grid>

      {/* row 3 (Recent activity table) */}
      <Grid size={{ xs: 12, lg: 8 }}>
        <MainCard sx={{ mt: 2 }} content={false}>
          <Stack sx={{ p: 2.5 }} spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Recent Activity</Typography>
              <Typography variant="caption" color="text.secondary">
                Filter: {moduleFilter}
              </Typography>
            </Stack>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Module</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Detail</TableCell>
                    <TableCell>Actor</TableCell>
                    <TableCell align="right">Time</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading
                    ? Array.from({ length: 6 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Skeleton width={70} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={120} />
                          </TableCell>
                          <TableCell>
                            <Skeleton width="90%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton width={90} />
                          </TableCell>
                          <TableCell align="right">
                            <Skeleton width={90} />
                          </TableCell>
                        </TableRow>
                      ))
                    : filteredActivity.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>
                            <Chip size="small" label={row.module} variant="outlined" />
                          </TableCell>
                          <TableCell>{row.action}</TableCell>
                          <TableCell>{row.detail}</TableCell>
                          <TableCell>{row.actor}</TableCell>
                          <TableCell align="right">{row.timestamp}</TableCell>
                        </TableRow>
                      ))}

                  {!loading && filteredActivity.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary">
                          No activity found for this module.
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

      {/* row 3 right (status summary) */}
      <Grid size={{ xs: 12, lg: 4 }}>
        <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Grid sx={{ mt: 2 }} size={12}>
            <MainCard content={false}>
              <Stack sx={{ p: 2.5 }} spacing={1.5}>
                <Typography variant="h6">Quick Status</Typography>

                {loading ? (
                  <>
                    <Skeleton height={28} width="60%" />
                    <Skeleton height={28} width="70%" />
                    <Skeleton height={28} width="55%" />
                  </>
                ) : (
                  <>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Total Users
                      </Typography>
                      <Typography variant="body2">{summary.totalUsers.toLocaleString()}</Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Active Users
                      </Typography>
                      <Typography variant="body2">{summary.activeUsers.toLocaleString()}</Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Datasets
                      </Typography>
                      <Typography variant="body2">{summary.datasets.toLocaleString()}</Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Audit Events
                      </Typography>
                      <Typography variant="body2">{summary.auditEvents.toLocaleString()}</Typography>
                    </Stack>
                  </>
                )}
              </Stack>
            </MainCard>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
