// features/adminUsers/viewmodel/useAdminUsersViewModel.js
import { useState } from 'react';
import { activateUserApi, deactivateUserApi, listUsersApi, updateUserRoleApi, createUserApi } from '../model/adminUsersApi';
import { getAdminPageCache, setAdminPageCache } from '../model/adminPageCache';

const USERS_CACHE_KEY = 'admin-users';

export function useAdminUsersViewModel() {
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    deactivatedUsers: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 25,
    total: 0,
    totalPages: 1
  });

  const [error, setError] = useState(null);

  const recomputeStats = (list) => {
    const totalUsers = list.length;
    const activeUsers = list.filter((u) => u.status === 'active').length;
    const deactivatedUsers = list.filter((u) => u.status !== 'active').length;
    setStats({ totalUsers, activeUsers, deactivatedUsers });
  };

  const applyUsersPayload = ({ list, nextStats = null, nextPagination = null }) => {
    setUsers(list);
    if (nextStats) setStats(nextStats);
    else recomputeStats(list);
    if (nextPagination) setPagination(nextPagination);
  };

  const fetchUsers = async ({ force = false, page = 1, perPage = pagination.perPage } = {}) => {
    const cacheKey = `${USERS_CACHE_KEY}:${page}:${perPage}`;
    const cached = !force ? getAdminPageCache(cacheKey) : null;
    if (cached) {
      applyUsersPayload(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      setError(null);

      const res = await listUsersApi({ page, per_page: perPage });
      const list = res.data.users || [];
      const nextStats = res.data.stats || null;
      const nextPagination = res.data.pagination || null;

      applyUsersPayload({ list, nextStats, nextPagination });
      setAdminPageCache(cacheKey, { list, nextStats, nextPagination });

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
        setAdminPageCache(`${USERS_CACHE_KEY}:${pagination.page}:${pagination.perPage}`, {
          list: updated,
          nextStats: stats,
          nextPagination: pagination
        });
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
        const updatedStats = {
          ...stats,
          activeUsers: stats.activeUsers + (nextStatus === 'active' ? 1 : -1),
          deactivatedUsers: stats.deactivatedUsers + (nextStatus === 'active' ? -1 : 1)
        };
        setStats(updatedStats);
        setAdminPageCache(`${USERS_CACHE_KEY}:${pagination.page}:${pagination.perPage}`, {
          list: updated,
          nextStats: updatedStats,
          nextPagination: pagination
        });
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

        setUsers((prev) => {
          const updated = [created, ...prev];
          const updatedStats = {
            ...stats,
            totalUsers: stats.totalUsers + 1,
            activeUsers: stats.activeUsers + 1
          };
          setStats(updatedStats);
          setAdminPageCache(`${USERS_CACHE_KEY}:${pagination.page}:${pagination.perPage}`, {
            list: updated,
            nextStats: updatedStats,
            nextPagination: pagination
          });
          return updated;
        });

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
    pagination,
    loading,
    error,
    fetchUsers,
    changeRole,
    createUser,
    toggleStatus
  };
}
