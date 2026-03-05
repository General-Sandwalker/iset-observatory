import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  BarChart2,
  Users,
  Rows3,
  BrainCircuit,
  PanelTop,
  ClipboardList,
  TrendingUp,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
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

const QUICK_ACTIONS = [
  { label: 'Import Data', desc: 'Upload a CSV dataset', icon: Database, to: '/import', color: 'var(--ag-accent)' },
  { label: 'AI Analysis', desc: 'Query your data with AI', icon: BrainCircuit, to: '/ai', color: '#8b5cf6' },
  { label: 'Chart Builder', desc: 'Create visualisations', icon: BarChart2, to: '/charts', color: '#0ea5e9' },
  { label: 'Dashboards', desc: 'Arrange & export charts', icon: PanelTop, to: '/dashboards', color: '#10b981' },
  { label: 'Survey Generator', desc: 'Build AI-powered surveys', icon: ClipboardList, to: '/surveys', color: '#f59e0b' },
  { label: 'User Management', desc: 'Manage users & roles', icon: Users, to: '/users', color: '#ef4444' },
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
      setError('Could not load statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const statCards = stats ? [
    { label: 'Datasets Imported', value: stats.datasets, icon: Database, color: 'var(--ag-accent)' },
    { label: 'Total Records', value: stats.totalRecords.toLocaleString(), icon: Rows3, color: '#0ea5e9' },
    { label: 'Active Users', value: stats.activeUsers, icon: Users, color: '#10b981' },
    { label: 'Charts Created', value: stats.charts, icon: BarChart2, color: '#8b5cf6' },
    { label: 'Dashboards', value: stats.dashboards, icon: PanelTop, color: '#f59e0b' },
    { label: 'AI Queries (30d)', value: stats.aiQueriesThisMonth, icon: BrainCircuit, color: '#ef4444' },
  ] : [];

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-6 h-6" style={{ color: 'var(--ag-accent)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ag-text)' }}>Dashboard</h1>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: 'var(--ag-card)', color: 'var(--ag-text2)', border: '1px solid var(--ag-border)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Welcome card */}
      <div className="ag-card p-6 mb-6 flex items-center gap-4" style={{ borderLeft: '4px solid var(--ag-accent)' }}>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
          style={{ background: 'var(--ag-accent)', color: '#fff' }}
        >
          {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--ag-text)' }}>
            Welcome back, {user?.fullName} 👋
          </h2>
          <p className="text-sm" style={{ color: 'var(--ag-text2)' }}>
            Signed in as{' '}
            <span className="font-medium" style={{ color: 'var(--ag-accent)' }}>{user?.role}</span>.
            {' '}Here's an overview of your observatory.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      {error ? (
        <div className="ag-card p-5 mb-6 text-sm" style={{ color: '#ef4444', border: '1px solid #ef444430' }}>
          {error}
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ag-card p-6 animate-pulse">
              <div className="h-3 w-24 rounded mb-3" style={{ background: 'var(--ag-border)' }} />
              <div className="h-8 w-16 rounded" style={{ background: 'var(--ag-border)' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="ag-card p-5 flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: card.color + '1a' }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--ag-text2)' }}>{card.label}</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--ag-text)' }}>{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4" style={{ color: 'var(--ag-accent)' }} />
        <h2 className="text-base font-semibold" style={{ color: 'var(--ag-text)' }}>Quick Actions</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="ag-card p-5 text-left flex items-start gap-4 group transition-all"
              style={{ cursor: 'pointer' }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: action.color + '1a' }}
              >
                <Icon className="w-[18px] h-[18px]" style={{ color: action.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--ag-text)' }}>{action.label}</p>
                <p className="text-xs leading-snug" style={{ color: 'var(--ag-text2)' }}>{action.desc}</p>
              </div>
              <ArrowRight
                className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                style={{ color: action.color }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
