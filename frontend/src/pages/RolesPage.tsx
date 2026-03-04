import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  Shield, Plus, Pencil, Trash2, Lock, CheckCircle, AlertCircle, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import api from '../lib/api';
import type { Role, Permission } from '../lib/types';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [expandedRole, setExpandedRole] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/permissions'),
      ]);
      setRoles(rolesRes.data.roles);
      setAllPermissions(permsRes.data.permissions);
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

  const handleDelete = async (role: Role) => {
    if (!confirm(`Delete role "${role.name}"?`)) return;
    try {
      await api.delete(`/roles/${role.id}`);
      setSuccess('Role deleted.');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  // Group permissions by category
  const permsByCategory = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
        </div>
        <button
          onClick={() => { setEditingRole(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Role
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
          <CheckCircle className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {/* Roles list */}
      <div className="space-y-3">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Role header */}
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
            >
              <div className="flex items-center gap-3">
                <Shield className={`w-5 h-5 ${role.is_system ? 'text-amber-500' : 'text-blue-500'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{role.name}</span>
                    {role.is_system && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700">
                        <Lock className="w-3 h-3" /> System
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {role.permissions?.length || 0} permissions
                </span>
                {expandedRole === role.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded permissions */}
            {expandedRole === role.id && (
              <div className="border-t border-gray-200 px-5 py-4 bg-gray-50">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {role.permissions?.map((p) => (
                    <span
                      key={p.id}
                      className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {p.name}
                    </span>
                  ))}
                  {(!role.permissions || role.permissions.length === 0) && (
                    <span className="text-xs text-gray-400">No permissions assigned</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingRole(role); setModalOpen(true); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  {!role.is_system && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(role); }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Role Modal */}
      {modalOpen && (
        <RoleModal
          role={editingRole}
          permsByCategory={permsByCategory}
          onSave={async (data) => {
            try {
              if (editingRole) {
                await api.put(`/roles/${editingRole.id}`, data);
                setSuccess('Role updated.');
              } else {
                await api.post('/roles', data);
                setSuccess('Role created.');
              }
              setModalOpen(false);
              setEditingRole(null);
              fetchData();
            } catch (err: any) {
              throw err;
            }
          }}
          onClose={() => { setModalOpen(false); setEditingRole(null); }}
        />
      )}
    </div>
  );
}

// ── Inline Role Modal Component ─────────────────────────────

interface RoleModalProps {
  role: Role | null;
  permsByCategory: Record<string, Permission[]>;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

function RoleModal({ role, permsByCategory, onSave, onClose }: RoleModalProps) {
  const isEdit = !!role;

  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selectedPerms, setSelectedPerms] = useState<number[]>(
    role?.permissions?.map((p) => p.id) || []
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const togglePerm = (id: number) => {
    setSelectedPerms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleCategory = (perms: Permission[]) => {
    const ids = perms.map((p) => p.id);
    const allSelected = ids.every((id) => selectedPerms.includes(id));
    if (allSelected) {
      setSelectedPerms((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedPerms((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSave({ name, description, permissionIds: selectedPerms });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Role' : 'Create Role'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEdit && role?.is_system}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Permissions by category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div className="space-y-3">
              {Object.entries(permsByCategory).map(([category, perms]) => {
                const allChecked = perms.every((p) => selectedPerms.includes(p.id));
                const someChecked = perms.some((p) => selectedPerms.includes(p.id));
                return (
                  <div key={category} className="border border-gray-200 rounded-lg p-3">
                    <label className="flex items-center gap-2 mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                        onChange={() => toggleCategory(perms)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-800 capitalize">{category}</span>
                    </label>
                    <div className="ml-6 space-y-1">
                      {perms.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPerms.includes(p.id)}
                            onChange={() => togglePerm(p.id)}
                            className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300"
                          />
                          <span className="text-xs text-gray-700">{p.name}</span>
                          {p.description && (
                            <span className="text-xs text-gray-400">— {p.description}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving…' : isEdit ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
