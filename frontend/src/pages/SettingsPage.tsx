import { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  Sun,
  Moon,
  Info,
  Check,
  AlertCircle,
  Loader2,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type AlertType = 'success' | 'error' | null;

function Alert({ type, message }: { type: AlertType; message: string }) {
  if (!type) return null;
  return (
    <div
      className={`flex items-center gap-2 mt-3 px-3 py-2 text-sm rounded-lg ${
        type === 'success' ? 'ag-alert-green' : 'ag-alert-red'
      }`}
    >
      {type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      {message}
    </div>
  );
}

// ─── Profile Card ────────────────────────────────────────────────────────────
function ProfileCard() {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertType; msg: string }>({ type: null, msg: '' });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setAlert({ type: null, msg: '' });
    try {
      const { data } = await api.put('/auth/me', { fullName, email });
      updateUser({ fullName: data.user.fullName, email: data.user.email });
      setAlert({ type: 'success', msg: 'Profile updated successfully.' });
    } catch (err: any) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="ag-card p-6">
      <h2
        className="flex items-center gap-2 text-base font-semibold mb-5"
        style={{ color: 'var(--ag-text)' }}
      >
        <UserIcon className="w-4.5 h-4.5" style={{ color: 'var(--ag-accent)', width: '1.125rem', height: '1.125rem' }} />
        Profile
      </h2>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm mb-1.5" style={{ color: 'var(--ag-text2)' }}>
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="ag-input w-full px-3 py-2 text-sm"
            placeholder="Your display name"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1.5" style={{ color: 'var(--ag-text2)' }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="ag-input w-full px-3 py-2 text-sm"
            placeholder="you@example.com"
            required
          />
        </div>

        <Alert type={alert.type} message={alert.msg} />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="ag-btn-primary flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Profile
          </button>
        </div>
      </form>
    </section>
  );
}

// ─── Change Password Card ────────────────────────────────────────────────────
function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving]                   = useState(false);
  const [alert, setAlert]                     = useState<{ type: AlertType; msg: string }>({ type: null, msg: '' });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setAlert({ type: null, msg: '' });

    if (newPassword !== confirmPassword) {
      setAlert({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setAlert({ type: 'error', msg: 'Password must be at least 6 characters.' });
      return;
    }

    setSaving(true);
    try {
      await api.put('/auth/me/password', { currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setAlert({ type: 'success', msg: 'Password changed successfully.' });
    } catch (err: any) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="ag-card p-6">
      <h2
        className="flex items-center gap-2 text-base font-semibold mb-5"
        style={{ color: 'var(--ag-text)' }}
      >
        <Lock className="w-4.5 h-4.5" style={{ color: 'var(--ag-accent)', width: '1.125rem', height: '1.125rem' }} />
        Change Password
      </h2>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm mb-1.5" style={{ color: 'var(--ag-text2)' }}>
            Current Password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="ag-input w-full px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1.5" style={{ color: 'var(--ag-text2)' }}>
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="ag-input w-full px-3 py-2 text-sm"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm mb-1.5" style={{ color: 'var(--ag-text2)' }}>
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="ag-input w-full px-3 py-2 text-sm"
            required
          />
        </div>

        <Alert type={alert.type} message={alert.msg} />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="ag-btn-primary flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Update Password
          </button>
        </div>
      </form>
    </section>
  );
}

// ─── Theme Card ──────────────────────────────────────────────────────────────
function ThemeCard() {
  const { theme, toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    setSaving(true);
    toggleTheme();
    const next = theme === 'dark' ? 'light' : 'dark';
    try {
      await api.patch('/auth/me/preferences', { preferences: { theme: next } });
    } catch {
      // Non-critical – local state already changed
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="ag-card p-6">
      <h2
        className="flex items-center gap-2 text-base font-semibold mb-5"
        style={{ color: 'var(--ag-text)' }}
      >
        {theme === 'dark' ? (
          <Moon className="w-4.5 h-4.5" style={{ color: 'var(--ag-accent)', width: '1.125rem', height: '1.125rem' }} />
        ) : (
          <Sun className="w-4.5 h-4.5" style={{ color: 'var(--ag-accent)', width: '1.125rem', height: '1.125rem' }} />
        )}
        Appearance
      </h2>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--ag-text)' }}>
            {theme === 'dark' ? 'Dark mode' : 'Light mode'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ag-text3)' }}>
            Aerogel theme — preference saved to your account
          </p>
        </div>

        {/* Toggle pill */}
        <button
          onClick={handleToggle}
          disabled={saving}
          title="Toggle theme"
          className="relative inline-flex items-center w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-60"
          style={{ background: theme === 'dark' ? 'var(--ag-accent)' : 'var(--ag-border)' }}
        >
          <span
            className="absolute flex items-center justify-center w-5 h-5 rounded-full bg-white shadow transition-transform duration-300"
            style={{ transform: theme === 'dark' ? 'translateX(calc(3.5rem - 1.5rem))' : 'translateX(0.25rem)' }}
          >
            {saving ? (
              <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
            ) : theme === 'dark' ? (
              <Moon className="w-3 h-3 text-gray-600" />
            ) : (
              <Sun className="w-3 h-3 text-yellow-500" />
            )}
          </span>
        </button>
      </div>
    </section>
  );
}

// ─── App Info Card ───────────────────────────────────────────────────────────
function AppInfoCard() {
  const { user, logout } = useAuth();

  return (
    <section className="ag-card p-6">
      <h2
        className="flex items-center gap-2 text-base font-semibold mb-5"
        style={{ color: 'var(--ag-text)' }}
      >
        <Info className="w-4.5 h-4.5" style={{ color: 'var(--ag-accent)', width: '1.125rem', height: '1.125rem' }} />
        About
      </h2>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt style={{ color: 'var(--ag-text3)' }}>Application</dt>
          <dd className="font-medium" style={{ color: 'var(--ag-text)' }}>ISET Observatory</dd>
        </div>
        <div className="flex justify-between">
          <dt style={{ color: 'var(--ag-text3)' }}>Version</dt>
          <dd style={{ color: 'var(--ag-text2)' }}>1.0.0</dd>
        </div>
        <div className="flex justify-between items-center">
          <dt style={{ color: 'var(--ag-text3)' }}>Your Role</dt>
          <dd>
            <span
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: 'var(--ag-accent-lo)', color: 'var(--ag-accent)' }}
            >
              <ShieldCheck className="w-3 h-3" />
              {user?.role?.replace('_', ' ')}
            </span>
          </dd>
        </div>
        {user?.createdAt && (
          <div className="flex justify-between">
            <dt style={{ color: 'var(--ag-text3)' }}>Member since</dt>
            <dd style={{ color: 'var(--ag-text2)' }}>
              {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </dd>
          </div>
        )}
      </dl>

      <div className="ag-divider my-5" />

      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg transition-colors"
        style={{ background: 'var(--ag-red-lo)', color: 'var(--ag-red)', border: '1px solid var(--ag-red)' }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ag-text)' }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--ag-text2)' }}>
          Manage your profile, security, and preferences.
        </p>
      </div>

      <ProfileCard />
      <PasswordCard />
      <ThemeCard />
      <AppInfoCard />
    </div>
  );
}
