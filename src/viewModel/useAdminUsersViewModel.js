// features/adminUsers/viewmodel/useAdminUsersViewModel.js
import { useState } from 'react';
import { activateUserApi, deactivateUserApi, listUsersApi, updateUserRoleApi, createUserApi } from '../model/adminUsersApi';

export function useAdminUsersViewModel() {
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    deactivatedUsers: 0
  });

  const [error, setError] = useState(null);

  const recomputeStats = (list) => {
    const totalUsers = list.length;
    const activeUsers = list.filter((u) => u.status === 'active').length;
    const deactivatedUsers = list.filter((u) => u.status !== 'active').length;
    setStats({ totalUsers, activeUsers, deactivatedUsers });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await listUsersApi();
      const list = res.data.users || [];

      setUsers(list);
      recomputeStats(list);

      return { success: true, users: list };
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch users');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId, nextRole) => {
    try {
      setError(null);

      await updateUserRoleApi(userId, nextRole);

      setUsers((prev) => {
        const updated = prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u));
        return updated;
      });

      return { success: true };
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update role');
      return { success: false };
    }
  };

  const toggleStatus = async (userId) => {
    const current = users.find((u) => u.id === userId);
    if (!current) return { success: false };

    const nextStatus = current.status === 'active' ? 'deactivated' : 'active';

    try {
      setError(null);

      if (nextStatus === 'deactivated') {
        await deactivateUserApi(userId);
      } else {
        await activateUserApi(userId);
      }

      setUsers((prev) => {
        const updated = prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u));
        recomputeStats(updated);
        return updated;
      });

      return { success: true, status: nextStatus };
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update status');
      return { success: false };
    }
  };
  const createUser = async (payload) => {
    try {
        setError(null);

        const res = await createUserApi(payload);
        const created = res.data.user;

        setUsers((prev) => [created, ...prev]);

        // update stats
        setStats((prevStats) => ({
        ...prevStats,
        totalUsers: prevStats.totalUsers + 1,
        activeUsers: prevStats.activeUsers + 1
        }));

        return { success: true, user: created };
    } catch (err) {
        console.error(err);
        const msg = err.response?.data?.error || 'Failed to create user';
        setError(msg);
        return { success: false, error: msg };
    }
    };


  return {
    users,
    stats,
    loading,
    error,
    fetchUsers,
    changeRole,
    createUser,
    toggleStatus
  };
}
