import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldCheck, SignIn, WarningCircle, ArrowLeft, ChartLineUp } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
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
      setError(err.response?.data?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 flex items-center">
      <div className="mx-auto w-full max-w-6xl grid lg:grid-cols-2 gap-8">
        <section className="hidden lg:flex ag-card p-8 xl:p-10 flex-col justify-between bg-gradient-to-br from-base-100/90 to-base-200/70">
          <div>
            <button onClick={() => navigate('/')} className="btn btn-ghost btn-sm rounded-xl px-2 -ml-2">
              <ArrowLeft size={16} />
              Back to landing
            </button>
            <div className="mt-10">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-500 dark:text-teal-300">
                <ChartLineUp size={24} weight="duotone" />
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight">Observatory Control Center</h1>
              <p className="mt-4 text-base-content/70 leading-relaxed max-w-md">
                Monitor institutional indicators, query data with AI, and publish dashboard-ready intelligence from one workspace.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-base-300 bg-base-100/80 p-4">
              <p className="text-2xl font-semibold">99.9%</p>
              <p className="text-xs text-base-content/65 mt-1">Service reliability target</p>
            </div>
            <div className="rounded-2xl border border-base-300 bg-base-100/80 p-4">
              <p className="text-2xl font-semibold">RBAC</p>
              <p className="text-xs text-base-content/65 mt-1">Role-governed access model</p>
            </div>
          </div>
        </section>

        <section className="ag-card p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-900 flex items-center justify-center shadow-lg shadow-teal-700/35">
              <ShieldCheck size={22} weight="duotone" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Sign in</h2>
              <p className="text-sm text-base-content/70">Use your authorized account to continue</p>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-error/40 bg-error/10 text-error px-4 py-3 flex items-center gap-2 text-sm">
              <WarningCircle size={18} weight="fill" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="label px-0 pb-1">
                <span className="label-text font-medium">Email</span>
              </label>
              <input
                id="email"
                type="email"
                required
                className="input input-bordered w-full rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@iset-tozeur.tn"
              />
            </div>

            <div>
              <label htmlFor="password" className="label px-0 pb-1">
                <span className="label-text font-medium">Password</span>
              </label>
              <input
                id="password"
                type="password"
                required
                className="input input-bordered w-full rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary w-full rounded-xl mt-1">
              <SignIn size={18} weight="duotone" />
              {submitting ? 'Signing in...' : 'Continue to dashboard'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-base-content/60">Protected institutional workspace • ISET Tozeur</p>
        </section>
      </div>
    </div>
  );
}
