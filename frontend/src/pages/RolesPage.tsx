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

  const permsByCategory = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6" style={{ color: 'var(--ag-accent)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ag-text)' }}>Roles & Permissions</h1>
        </div>
        <button
          onClick={() => { setEditingRole(null); setModalOpen(true); }}
          className="ag-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Create Role
        </button>
      </div>

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

      <div className="space-y-3">
        {roles.map((role) => (
          <div key={role.id} className="ag-card overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer transition-colors"
              style={{ background: expandedRole === role.id ? 'var(--ag-surface2)' : 'transparent' }}
              onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5" style={{ color: role.is_system ? 'var(--ag-amber)' : 'var(--ag-accent)' }} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: 'var(--ag-text)' }}>{role.name}</span>
                    {role.is_system && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                        style={{ background: 'var(--ag-amber-lo)', color: 'var(--ag-amber)', border: '1px solid var(--ag-amber)' }}
                      >
                        <Lock className="w-3 h-3" /> System
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ag-text3)' }}>{role.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--ag-text3)' }}>
                  {role.permissions?.length || 0} permissions
                </span>
                {expandedRole === role.id
                  ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--ag-text3)' }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: 'var(--ag-text3)' }} />
                }
              </div>
            </div>

            {expandedRole === role.id && (
              <div className="px-5 py-4" style={{ borderTop: '1px solid var(--ag-border)', background: 'var(--ag-surface2)' }}>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {role.permissions?.map((p) => (
                    <span key={p.id} className="ag-badge ag-badge-accent">{p.name}</span>
                  ))}
                  {(!role.permissions || role.permissions.length === 0) && (
                    <span className="text-xs" style={{ color: 'var(--ag-text3)' }}>No permissions assigned</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingRole(role); setModalOpen(true); }}
                    className="ag-btn-ghost flex items-center gap-1 px-3 py-1.5 text-xs"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  {!role.is_system && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(role); }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors"
                      style={{ border: '1px solid var(--ag-red)', color: 'var(--ag-red)', background: 'var(--ag-red-lo)' }}
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
    setSelectedPerms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0 0 0 / 0.55)' }}>
      <div className="ag-card w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--ag-surface)' }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--ag-border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--ag-text)' }}>
            {isEdit ? 'Edit Role' : 'Create Role'}
          </h2>
          <button onClick={onClose} className="p-1 rounded transition-colors"
            style={{ color: 'var(--ag-text3)' }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ag-text)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ag-text3)')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="ag-alert-red flex items-center gap-2 text-sm px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ag-text2)' }}>Role Name</label>
            <input
              type="text" required value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEdit && role?.is_system}
              className="ag-input w-full px-3 py-2.5 text-sm disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ag-text2)' }}>Description</label>
            <input
              type="text" value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="ag-input w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ag-text2)' }}>Permissions</label>
            <div className="space-y-2">
              {Object.entries(permsByCategory).map(([category, perms]) => {
                const allChecked = perms.every((p) => selectedPerms.includes(p.id));
                const someChecked = perms.some((p) => selectedPerms.includes(p.id));
                return (
                  <div key={category} className="rounded-lg p-3"
                    style={{ border: '1px solid var(--ag-border)', background: 'var(--ag-surface2)' }}>
                    <label className="flex items-center gap-2 mb-2 cursor-pointer">
                      <input
                        type="checkbox" checked={allChecked}
                        ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                        onChange={() => toggleCategory(perms)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: 'var(--ag-accent)' }}
                      />
                      <span className="text-sm font-medium capitalize" style={{ color: 'var(--ag-text)' }}>{category}</span>
                    </label>
                    <div className="ml-6 space-y-1">
                      {perms.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox" checked={selectedPerms.includes(p.id)}
                            onChange={() => togglePerm(p.id)}
                            className="w-3.5 h-3.5 rounded"
                            style={{ accentColor: 'var(--ag-accent)' }}
                          />
                          <span className="text-xs" style={{ color: 'var(--ag-text2)' }}>{p.name}</span>
                          {p.description && (
                            <span className="text-xs" style={{ color: 'var(--ag-text3)' }}>— {p.description}</span>
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
            <button type="button" onClick={onClose} className="ag-btn-ghost px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="ag-btn-primary px-4 py-2 text-sm">
              {submitting ? 'Saving…' : isEdit ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
