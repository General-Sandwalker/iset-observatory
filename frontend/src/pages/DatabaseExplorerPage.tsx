import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Table2,
  Rows3,
  Columns3,
  CalendarDays,
  User,
  Search,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import api from '../lib/api';
import type { Dataset } from '../lib/types';

function fmt(n: number) {
  return n.toLocaleString();
}

function relDate(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function DatabaseExplorerPage() {
  const [all, setAll] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ success: boolean; data: Dataset[] }>('/datasets');
      if (data.success) setAll(data.data.filter((d) => d.status === 'imported'));
    } catch {
      setError('Failed to load datasets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDatasets(); }, [fetchDatasets]);

  const filtered = all.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.table_name ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--ag-accent-lo)' }}>
            <Database className="w-5 h-5" style={{ color: 'var(--ag-accent)' }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--ag-text1)' }}>
              Database Explorer
            </h1>
            <p className="text-sm" style={{ color: 'var(--ag-text3)' }}>
              {all.length} imported table{all.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--ag-text3)' }} />
            <input
              className="ag-input pl-9 pr-3 py-2 text-sm w-56"
              placeholder="Search tables…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={fetchDatasets}
            className="ag-btn-ghost p-2 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="ag-card h-40 animate-pulse"
              style={{ background: 'var(--ag-card-bg)' }} />
          ))}
        </div>
      ) : error ? (
        <div className="ag-card flex items-center gap-3 p-6" style={{ color: 'var(--ag-red)' }}>
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="ag-card flex flex-col items-center gap-3 py-20 text-center">
          <Database className="w-12 h-12 opacity-20" style={{ color: 'var(--ag-text3)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--ag-text2)' }}>
            {search ? 'No tables match your search.' : 'No imported tables yet. Go to Data Import to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ds) => {
            const colCount = ds.column_mapping?.length ?? 0;
            return (
              <button
                key={ds.id}
                onClick={() => navigate(`/explore/${ds.id}`)}
                className="ag-card text-left group transition-all hover:shadow-lg"
                style={{ cursor: 'pointer', borderColor: 'var(--ag-border)' }}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--ag-accent-lo)' }}>
                    <Table2 className="w-4.5 h-4.5" style={{ color: 'var(--ag-accent)' }} />
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--ag-accent)' }} />
                </div>

                {/* Name */}
                <h3 className="font-semibold text-sm mb-0.5 truncate" style={{ color: 'var(--ag-text1)' }}>
                  {ds.name}
                </h3>
                <p className="text-xs font-mono mb-4 truncate" style={{ color: 'var(--ag-text3)' }}>
                  {ds.table_name}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-xs" style={{ color: 'var(--ag-text2)' }}>
                  <div className="flex items-center gap-1.5">
                    <Rows3 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--ag-accent)' }} />
                    <span>{fmt(ds.row_count)} rows</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Columns3 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--ag-accent)' }} />
                    <span>{colCount} columns</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--ag-text3)' }} />
                    <span>{relDate(ds.created_at)}</span>
                  </div>
                  {ds.uploaded_by_name && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--ag-text3)' }} />
                      <span className="truncate">{ds.uploaded_by_name}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
