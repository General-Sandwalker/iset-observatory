import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowsClockwise,
  ChartBar,
  ChartPieSlice,
  Database,
  Gauge,
  GridFour,
  Brain,
  ClipboardText,
  Users,
  TrendUp,
  ArrowRight,
  ChartLine,
} from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

interface Stats {
  datasets: number;
  totalRecords: number;
  activeUsers: number;
  charts: number;
  dashboards: number;
  aiQueriesThisMonth: number;
}

const quickActions = [
  { label: 'Import Data', description: 'Upload and map a dataset', icon: Database, to: '/import' },
  { label: 'AI Analysis', description: 'Run natural language analytics', icon: Brain, to: '/ai' },
  { label: 'Chart Studio', description: 'Build chart configurations', icon: ChartBar, to: '/charts' },
  { label: 'Dashboard Canvas', description: 'Arrange and export views', icon: GridFour, to: '/dashboards' },
  { label: 'Survey Manager', description: 'Create, publish, and manage surveys', icon: ClipboardText, to: '/surveys' },
  { label: 'User Access', description: 'Manage users and roles', icon: Users, to: '/users' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ success: boolean; data: Stats }>('/stats');
      if (data.success) setStats(data.data);
    } catch {
      setError('Unable to load dashboard analytics at the moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const cards = stats
    ? [
        { label: 'Datasets', value: stats.datasets, icon: Database },
        { label: 'Total Records', value: stats.totalRecords.toLocaleString(), icon: ChartLine },
        { label: 'Active Users', value: stats.activeUsers, icon: Users },
        { label: 'Charts', value: stats.charts, icon: ChartBar },
        { label: 'Dashboards', value: stats.dashboards, icon: ChartPieSlice },
        { label: 'AI Queries (30d)', value: stats.aiQueriesThisMonth, icon: Brain },
      ]
    : [];

  return (
    <div className="space-y-6">
      <header className="ag-card p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-900 flex items-center justify-center">
              <Gauge size={22} weight="duotone" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold">Executive Dashboard</h1>
              <p className="text-sm text-base-content/70 mt-1">
                Welcome {user?.fullName || user?.full_name || 'User'}. Track platform activity and jump into operations.
              </p>
            </div>
          </div>

          <button onClick={fetchStats} disabled={loading} className="btn btn-outline rounded-xl">
            <ArrowsClockwise size={18} className={loading ? 'animate-spin' : ''} />
            Refresh metrics
          </button>
        </div>
      </header>

      {error && (
        <div className="alert alert-error rounded-xl">
          <span>{error}</span>
        </div>
      )}

      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendUp size={18} weight="duotone" className="text-primary" />
          <h2 className="text-lg font-semibold">Key Metrics</h2>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="ag-card p-5">
                <div className="skeleton h-4 w-24 mb-3" />
                <div className="skeleton h-7 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {cards.map(({ label, value, icon: Icon }) => (
              <article key={label} className="ag-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-base-content/60">{label}</p>
                    <p className="text-3xl font-semibold mt-2">{value}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                    <Icon size={20} weight="duotone" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <ArrowRight size={18} weight="duotone" className="text-primary" />
          <h2 className="text-lg font-semibold">Quick Actions</h2>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {quickActions.map(({ label, description, icon: Icon, to }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="ag-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="h-10 w-10 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center">
                  <Icon size={20} weight="duotone" />
                </div>
                <ArrowRight size={16} className="text-base-content/45" />
              </div>
              <h3 className="text-base font-semibold mt-4">{label}</h3>
              <p className="text-sm text-base-content/65 mt-1.5">{description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
