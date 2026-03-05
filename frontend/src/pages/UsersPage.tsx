import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Pencil, Trash2, Shield, Search,
  CheckCircle, XCircle, AlertCircle,
} from 'lucide-react';
import api from '../lib/api';
import type { User, Role } from '../lib/types';
import UserModal from '../components/layout/UserModal';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
      ]);
      setUsers(usersRes.data.users);
      setRoles(rolesRes.data.roles);
    } catch {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (error || success) {
      const t = setTimeout(() => { setError(''); setSuccess(''); }, 3000);
      return () => clearTimeout(t);
    }
  }, [error, success]);

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete user "${user.full_name || user.fullName}"?`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      setSuccess('User deleted.');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, data);
        setSuccess('User updated.');
      } else {
        await api.post('/users', data);
        setSuccess('User created.');
      }
      setModalOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      throw err;
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const name = (u.full_name || u.fullName || '').toLowerCase();
    return name.includes(q) || u.email.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: 'var(--ag-accent)' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6" style={{ color: 'var(--ag-accent)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ag-text)' }}>
            User Management
          </h1>
        </div>
        <button
          onClick={() => { setEditingUser(null); setModalOpen(true); }}
          className="ag-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="ag-alert-red flex items-center gap-2 text-sm px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="ag-alert-green flex items-center gap-2 text-sm px-4 py-3 mb-4">
          <CheckCircle className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--ag-text3)' }}
        />
        <input
          type="text"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ag-input w-full pl-10 pr-4 py-2.5 text-sm"
        />
      </div>

      {/* Table */}
      <div className="ag-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="ag-table-head">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Roles</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="ag-table-row">
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--ag-text)' }}>
                  {user.full_name || user.fullName}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--ag-text2)' }}>
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(user.roles && user.roles.length > 0)
                      ? user.roles.map((r) => (
                          <span key={r.id} className="ag-badge ag-badge-accent inline-flex items-center gap-1">
                            <Shield className="w-3 h-3" /> {r.name}
                          </span>
                        ))
                      : (
                          <span className="text-xs" style={{ color: 'var(--ag-text3)' }}>
                            {user.legacy_role || user.role}
                          </span>
                        )
                    }
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {(user.is_active ?? user.isActive)
                    ? <CheckCircle className="w-[1.125rem] h-[1.125rem] mx-auto" style={{ color: 'var(--ag-green)' }} />
                    : <XCircle className="w-[1.125rem] h-[1.125rem] mx-auto" style={{ color: 'var(--ag-red)' }} />
                  }
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setEditingUser(user); setModalOpen(true); }}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--ag-text3)' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ag-accent)')}
                      onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ag-text3)')}
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--ag-text3)' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ag-red)')}
                      onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ag-text3)')}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--ag-text3)' }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <UserModal
          user={editingUser}
          roles={roles}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingUser(null); }}
        />
      )}
    </div>
  );
}
