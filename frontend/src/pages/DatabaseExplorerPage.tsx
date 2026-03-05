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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse"
              style={{ background: 'var(--ag-card-bg)', border: '1px solid var(--ag-border)', height: 176 }}>
              <div className="h-0.5 w-full" style={{ background: 'var(--ag-border)' }} />
              <div className="p-5 space-y-3">
                <div className="flex justify-between">
                  <div className="w-10 h-10 rounded-xl" style={{ background: 'var(--ag-border)' }} />
                  <div className="w-16 h-5 rounded-full" style={{ background: 'var(--ag-border)' }} />
                </div>
                <div className="w-3/4 h-3.5 rounded" style={{ background: 'var(--ag-border)' }} />
                <div className="w-1/2 h-3 rounded" style={{ background: 'var(--ag-border)' }} />
              </div>
              <div className="h-10" style={{ background: 'var(--ag-hover)' }} />
            </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ds) => {
            const colCount = ds.column_mapping?.length ?? 0;
            return (
              <button
                key={ds.id}
                onClick={() => navigate(`/explore/${ds.id}`)}
                className="group text-left relative overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                style={{
                  background: 'var(--ag-card-bg)',
                  border: '1px solid var(--ag-border)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                }}
              >
                {/* Accent top bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl transition-opacity duration-200 opacity-60 group-hover:opacity-100"
                  style={{ background: 'linear-gradient(90deg, var(--ag-accent), var(--ag-accent2, var(--ag-accent)))' }}
                />

                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: 'var(--ag-accent-lo)',
                        boxShadow: 'inset 0 0 0 1px var(--ag-accent)',
                      }}
                    >
                      <Table2 className="w-5 h-5" style={{ color: 'var(--ag-accent)' }} />
                    </div>
                    <span
                      className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--ag-accent-lo)', color: 'var(--ag-accent)' }}
                    >
                      <Rows3 className="w-3 h-3" />
                      {fmt(ds.row_count)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm leading-snug truncate mb-0.5" style={{ color: 'var(--ag-text1)' }}>
                    {ds.name}
                  </h3>
                  <p className="text-xs font-mono truncate mb-4" style={{ color: 'var(--ag-text3)' }}>
                    {ds.table_name}
                  </p>

                  {/* Divider */}
                  <div className="mb-4" style={{ borderTop: '1px solid var(--ag-border)' }} />

                  {/* Stats row */}
                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--ag-text2)' }}>
                    <div className="flex items-center gap-1">
                      <Columns3 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--ag-text3)' }} />
                      <span>{colCount} cols</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--ag-text3)' }} />
                      <span>{relDate(ds.created_at)}</span>
                    </div>
                    {ds.uploaded_by_name && (
                      <div className="flex items-center gap-1 max-w-[90px]">
                        <User className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--ag-text3)' }} />
                        <span className="truncate">{ds.uploaded_by_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer CTA */}
                <div
                  className="px-5 py-3 flex items-center justify-between text-xs font-medium transition-colors duration-150"
                  style={{
                    borderTop: '1px solid var(--ag-border)',
                    background: 'var(--ag-hover)',
                    color: 'var(--ag-accent)',
                  }}
                >
                  <span>Open table</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
