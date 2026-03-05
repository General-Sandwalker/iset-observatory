import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity, LogIn, AlertCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ag-bg)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: 'var(--ag-accent)' }} />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--ag-bg)' }}
    >
      {/* Aerogel ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 50% 40%, rgba(96 165 250 / 0.08) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'var(--ag-accent-lo)', boxShadow: '0 0 0 1px var(--ag-accent)' }}
          >
            <Activity className="w-7 h-7" style={{ color: 'var(--ag-accent)' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ag-text)' }}>
            ISET Observatory
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ag-text2)' }}>
            Sign in to access your dashboard
          </p>
        </div>

        {/* Card */}
        <div className="ag-card p-8">
          {error && (
            <div className="ag-alert-red flex items-center gap-2 text-sm px-4 py-3 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--ag-text2)' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@iset-tozeur.tn"
                className="ag-input w-full px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--ag-text2)' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="ag-input w-full px-3 py-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="ag-btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm"
            >
              <LogIn className="w-4 h-4" />
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--ag-text3)' }}>
          ISET Tozeur — Adaptive Digital Observatory
        </p>
      </div>
    </div>
  );
}
