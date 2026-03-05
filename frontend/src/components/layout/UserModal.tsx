import { useState, type FormEvent } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { User, Role } from '../../lib/types';

interface Props {
  user: User | null;
  roles: Role[];
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

export default function UserModal({ user, roles, onSave, onClose }: Props) {
  const isEdit = !!user;
  const [email, setEmail] = useState(user?.email || '');
  const [fullName, setFullName] = useState(user?.full_name || user?.fullName || '');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(user?.is_active ?? user?.isActive ?? true);
  const [selectedRoles, setSelectedRoles] = useState<number[]>(
    user?.roles?.map((r) => r.id) || []
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleRole = (roleId: number) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data: any = { email, fullName, roleIds: selectedRoles, isActive };
      if (password) data.password = password;
      if (!isEdit && !password) {
        setError('Password is required for new users.');
        setSubmitting(false);
        return;
      }
      await onSave(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0 0 0 / 0.55)' }}>
      <div
        className="ag-card w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--ag-surface)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--ag-border)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--ag-text)' }}>
            {isEdit ? 'Edit User' : 'Add User'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--ag-text3)' }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ag-text)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ag-text3)')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="ag-alert-red flex items-center gap-2 text-sm px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ag-text2)' }}>
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="ag-input w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ag-text2)' }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ag-input w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ag-text2)' }}>
              Password{' '}
              {isEdit && (
                <span style={{ color: 'var(--ag-text3)' }}>(leave blank to keep current)</span>
              )}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? '••••••••' : ''}
              className="ag-input w-full px-3 py-2.5 text-sm"
            />
          </div>

          {/* Roles */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ag-text2)' }}>
              Roles
            </label>
            <div className="space-y-2">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors"
                  style={{
                    border: '1px solid var(--ag-border)',
                    background: selectedRoles.includes(role.id) ? 'var(--ag-accent-lo)' : 'var(--ag-surface2)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: 'var(--ag-accent)' }}
                  />
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--ag-text)' }}>
                      {role.name}
                    </span>
                    {role.description && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--ag-text3)' }}>
                        {role.description}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          {isEdit && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'var(--ag-accent)' }}
              />
              <span className="text-sm" style={{ color: 'var(--ag-text2)' }}>
                Account active
              </span>
            </label>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="ag-btn-ghost px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="ag-btn-primary px-4 py-2 text-sm"
            >
              {submitting ? 'Saving…' : isEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
