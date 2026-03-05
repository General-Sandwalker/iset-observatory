import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, RefreshCw, Plus, Trash2, Save, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUpDown, ArrowUp, ArrowDown, Settings2, AlertTriangle,
  Loader2, DatabaseZap,
} from 'lucide-react';
import api from '../lib/api';
import type { Dataset, TableColumn, TablePagination } from '../lib/types';

// ─── Cell editor ─────────────────────────────────────────────────────────────
function CellInput({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <div className="flex items-center gap-1 min-w-0">
      <input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(val);
          if (e.key === 'Escape') onCancel();
        }}
        className="ag-input py-0.5 px-1.5 text-xs w-full min-w-0"
        style={{ minWidth: 60 }}
      />
      <button onClick={() => onSave(val)} title="Save"
        className="shrink-0 text-green-400 hover:text-green-300"><Save className="w-3 h-3" /></button>
      <button onClick={onCancel} title="Cancel"
        className="shrink-0 text-red-400 hover:text-red-300"><X className="w-3 h-3" /></button>
    </div>
  );
}

// ─── Schema editor modal ──────────────────────────────────────────────────────
function SchemaEditor({
  columns,
  datasetId,
  onClose,
  onChanged,
}: {
  columns: TableColumn[];
  datasetId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<Record<string, { name: string; type: string }>>(() =>
    Object.fromEntries(columns.map((c) => [c.column_name, { name: c.column_name, type: c.data_type.toUpperCase() }]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const TYPES = ['TEXT', 'INTEGER', 'NUMERIC', 'DATE', 'BOOLEAN'];

  async function applyColumn(col: TableColumn) {
    const target = editing[col.column_name];
    setSaving(col.column_name);
    setErrors((e) => ({ ...e, [col.column_name]: '' }));
    try {
      const nameChanged = target.name !== col.column_name;
      const typeChanged = target.type !== col.data_type.toUpperCase() && target.type !== col.udt_name.toUpperCase();
      if (nameChanged) {
        await api.patch(`/datasets/${datasetId}/columns/${col.column_name}/rename`, { newName: target.name });
      }
      const resolvedName = nameChanged ? target.name : col.column_name;
      if (typeChanged) {
        await api.patch(`/datasets/${datasetId}/columns/${resolvedName}/type`, { newType: target.type });
      }
      if (!nameChanged && !typeChanged) {
        setSaving(null);
        return;
      }
      onChanged();
    } catch (err: unknown) {
      setErrors((e) => ({ ...e, [col.column_name]: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error' }));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="ag-card w-full max-w-lg max-h-[80vh] flex flex-col"
        style={{ background: 'var(--ag-card-bg)', border: '1px solid var(--ag-border)' }}>
        <div className="flex items-center justify-between p-5 shrink-0"
          style={{ borderBottom: '1px solid var(--ag-border)' }}>
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" style={{ color: 'var(--ag-accent)' }} />
            <h2 className="font-semibold text-sm" style={{ color: 'var(--ag-text1)' }}>
              Schema Editor
            </h2>
          </div>
          <button onClick={onClose} className="ag-btn-ghost p-1 rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {columns.filter(c => c.column_name !== 'id').map((col) => {
            const ed = editing[col.column_name];
            const isSaving = saving === col.column_name;
            return (
              <div key={col.column_name} className="rounded-lg p-3 space-y-2"
                style={{ background: 'var(--ag-bg)', border: '1px solid var(--ag-border)' }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono" style={{ color: 'var(--ag-text3)' }}>
                    {col.column_name}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--ag-accent-lo)', color: 'var(--ag-accent)' }}>
                    {col.data_type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="ag-input text-xs py-1 flex-1"
                    value={ed.name}
                    onChange={(e) => setEditing((p) => ({ ...p, [col.column_name]: { ...p[col.column_name], name: e.target.value } }))}
                    placeholder="Column name"
                  />
                  <select
                    className="ag-input text-xs py-1 w-32 shrink-0"
                    value={ed.type}
                    onChange={(e) => setEditing((p) => ({ ...p, [col.column_name]: { ...p[col.column_name], type: e.target.value } }))}
                  >
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <button
                    onClick={() => applyColumn(col)}
                    disabled={isSaving}
                    className="ag-btn-primary text-xs px-3 py-1 shrink-0 flex items-center gap-1"
                  >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Apply
                  </button>
                </div>
                {errors[col.column_name] && (
                  <p className="text-xs" style={{ color: 'var(--ag-red)' }}>{errors[col.column_name]}</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="p-4 shrink-0" style={{ borderTop: '1px solid var(--ag-border)' }}>
          <button onClick={onClose} className="ag-btn-ghost w-full text-sm py-2">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Row modal ────────────────────────────────────────────────────────────
function AddRowModal({
  columns,
  datasetId,
  onClose,
  onAdded,
}: {
  columns: TableColumn[];
  datasetId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const editableCols = columns.filter((c) => c.column_name !== 'id');
  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(editableCols.map((c) => [c.column_name, ''])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post(`/datasets/${datasetId}/rows`, form);
      onAdded();
      onClose();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add row.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="ag-card w-full max-w-md flex flex-col max-h-[80vh]"
        style={{ background: 'var(--ag-card-bg)', border: '1px solid var(--ag-border)' }}>
        <div className="flex items-center justify-between p-5 shrink-0"
          style={{ borderBottom: '1px solid var(--ag-border)' }}>
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" style={{ color: 'var(--ag-accent)' }} />
            <h2 className="font-semibold text-sm" style={{ color: 'var(--ag-text1)' }}>Add New Row</h2>
          </div>
          <button onClick={onClose} className="ag-btn-ghost p-1 rounded"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="overflow-y-auto flex-1 p-4 space-y-3">
          {editableCols.map((col) => (
            <div key={col.column_name}>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ag-text2)' }}>
                {col.column_name}
                <span className="ml-1 font-normal" style={{ color: 'var(--ag-text3)' }}>({col.data_type})</span>
              </label>
              <input
                className="ag-input text-sm py-1.5 w-full"
                value={form[col.column_name]}
                onChange={(e) => setForm((f) => ({ ...f, [col.column_name]: e.target.value }))}
                placeholder={`Enter ${col.column_name}…`}
              />
            </div>
          ))}
          {error && <p className="text-xs" style={{ color: 'var(--ag-red)' }}>{error}</p>}
        </form>
        <div className="p-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid var(--ag-border)' }}>
          <button onClick={onClose} className="ag-btn-ghost flex-1 text-sm py-2">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="ag-btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Add Row
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Drop table confirm modal ─────────────────────────────────────────────────
function DropConfirmModal({
  datasetName,
  onClose,
  onConfirm,
}: {
  datasetName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="ag-card w-full max-w-sm"
        style={{ background: 'var(--ag-card-bg)', border: '1px solid var(--ag-border)' }}>
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'var(--ag-red-lo)' }}>
            <AlertTriangle className="w-6 h-6" style={{ color: 'var(--ag-red)' }} />
          </div>
          <h2 className="font-semibold" style={{ color: 'var(--ag-text1)' }}>Drop Table</h2>
          <p className="text-sm" style={{ color: 'var(--ag-text2)' }}>
            This will permanently delete <strong>{datasetName}</strong> and all its data.
            This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="ag-btn-ghost flex-1 py-2 text-sm">Cancel</button>
            <button onClick={onConfirm}
              className="flex-1 py-2 text-sm rounded-lg font-medium"
              style={{ background: 'var(--ag-red)', color: '#fff' }}>
              Delete Forever
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete rows confirm modal ────────────────────────────────────────────────
function DeleteRowsModal({
  count,
  onClose,
  onConfirm,
  loading,
}: {
  count: number;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="ag-card w-full max-w-sm"
        style={{ background: 'var(--ag-card-bg)', border: '1px solid var(--ag-border)' }}>
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'var(--ag-red-lo)' }}>
            <Trash2 className="w-6 h-6" style={{ color: 'var(--ag-red)' }} />
          </div>
          <h2 className="font-semibold" style={{ color: 'var(--ag-text1)' }}>Delete {count} row{count !== 1 ? 's' : ''}?</h2>
          <p className="text-sm" style={{ color: 'var(--ag-text2)' }}>
            This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} disabled={loading} className="ag-btn-ghost flex-1 py-2 text-sm">Cancel</button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 py-2 text-sm rounded-lg font-medium flex items-center justify-center gap-2"
              style={{ background: 'var(--ag-red)', color: '#fff' }}>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TableEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [pagination, setPagination] = useState<TablePagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search + sort
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortCol, setSortCol] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Inline edit state
  const [editingCell, setEditingCell] = useState<{ rowId: number; col: string } | null>(null);
  const [savingCell, setSavingCell] = useState<{ rowId: number; col: string } | null>(null);

  // Modals
  const [showSchema, setShowSchema] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [showDropConfirm, setShowDropConfirm] = useState(false);
  const [showDeleteRows, setShowDeleteRows] = useState(false);
  const [deletingRows, setDeletingRows] = useState(false);
  const [droppingTable, setDroppingTable] = useState(false);

  // ── Fetch dataset metadata + schema ──────────────────────────────────────
  const fetchMeta = useCallback(async () => {
    if (!id) return;
    try {
      const [dsRes, schRes] = await Promise.all([
        api.get<{ success: boolean; data: Dataset }>(`/datasets/${id}`),
        api.get<{ success: boolean; data: TableColumn[] }>(`/datasets/${id}/schema`),
      ]);
      if (dsRes.data.success) setDataset(dsRes.data.data);
      if (schRes.data.success) setColumns(schRes.data.data);
    } catch { setError('Failed to load dataset info.'); }
  }, [id]);

  // ── Fetch rows ────────────────────────────────────────────────────────────
  const fetchRows = useCallback(async (page = 1) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        sort: sortCol,
        order: sortOrder,
        ...(search ? { search } : {}),
      });
      const res = await api.get<{
        success: boolean;
        data: Record<string, unknown>[];
        pagination: TablePagination;
      }>(`/datasets/${id}/data?${params}`);
      if (res.data.success) {
        setRows(res.data.data);
        setPagination(res.data.pagination);
        setSelected(new Set());
      }
    } catch { setError('Failed to load table data.'); }
    finally { setLoading(false); }
  }, [id, search, sortCol, sortOrder, pagination.limit]);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);
  useEffect(() => { fetchRows(1); }, [search, sortCol, sortOrder]); // eslint-disable-line

  function goPage(p: number) { fetchRows(p); }

  // ── Sort toggle ───────────────────────────────────────────────────────────
  function handleSort(col: string) {
    if (sortCol === col) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortOrder('asc');
    }
  }

  // ── Inline save ───────────────────────────────────────────────────────────
  async function saveCell(rowId: number, col: string, value: string) {
    setSavingCell({ rowId, col });
    setEditingCell(null);
    try {
      const res = await api.patch<{ success: boolean; data: Record<string, unknown> }>(
        `/datasets/${id}/rows/${rowId}`,
        { column: col, value },
      );
      if (res.data.success) {
        setRows((prev) => prev.map((r) => (r.id === rowId ? res.data.data : r)));
      }
    } catch { /* silently revert – row stays as was */ }
    finally { setSavingCell(null); }
  }

  // ── Delete rows ───────────────────────────────────────────────────────────
  async function confirmDeleteRows() {
    setDeletingRows(true);
    try {
      await api.delete(`/datasets/${id}/rows`, { data: { ids: [...selected] } });
      setShowDeleteRows(false);
      setSelected(new Set());
      fetchRows(pagination.page);
      fetchMeta();
    } catch { /* ignore */ }
    finally { setDeletingRows(false); }
  }

  // ── Drop table ────────────────────────────────────────────────────────────
  async function confirmDropTable() {
    setDroppingTable(true);
    try {
      await api.delete(`/datasets/${id}`);
      navigate('/explore');
    } catch { setDroppingTable(false); }
  }

  // ── Selection helpers ─────────────────────────────────────────────────────
  function toggleAll() {
    if (selected.size === rows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r.id as number)));
    }
  }
  function toggleRow(rid: number) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(rid)) next.delete(rid);
      else next.add(rid);
      return next;
    });
  }

  const allCols = columns;

  function SortIcon({ col }: { col: string }) {
    if (sortCol !== col) return <ArrowUpDown className="w-3 h-3 opacity-40 ml-1 inline" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 inline" style={{ color: 'var(--ag-accent)' }} />
      : <ArrowDown className="w-3 h-3 ml-1 inline" style={{ color: 'var(--ag-accent)' }} />;
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Header ── */}
      <div className="px-6 py-4 flex items-center gap-4 flex-wrap shrink-0"
        style={{ borderBottom: '1px solid var(--ag-border)', background: 'var(--ag-card-bg)' }}>
        <button onClick={() => navigate('/explore')}
          className="ag-btn-ghost p-2 rounded-lg" title="Back to Explorer">
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <DatabaseZap className="w-5 h-5 shrink-0" style={{ color: 'var(--ag-accent)' }} />
          <div className="min-w-0">
            <h1 className="font-semibold text-sm truncate" style={{ color: 'var(--ag-text1)' }}>
              {dataset?.name ?? '…'}
            </h1>
            <p className="text-xs font-mono truncate" style={{ color: 'var(--ag-text3)' }}>
              {dataset?.table_name ?? ''}
              {pagination.total > 0 && ` · ${pagination.total.toLocaleString()} rows`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selected.size > 0 && (
            <button
              onClick={() => setShowDeleteRows(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: 'var(--ag-red-lo)', color: 'var(--ag-red)', border: '1px solid var(--ag-red)' }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete {selected.size}
            </button>
          )}
          <button onClick={() => setShowAddRow(true)}
            className="ag-btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
          <button onClick={() => setShowSchema(true)}
            className="ag-btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5">
            <Settings2 className="w-3.5 h-3.5" /> Schema
          </button>
          <button onClick={() => setShowDropConfirm(true)}
            className="ag-btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5"
            style={{ color: 'var(--ag-red)' }} disabled={droppingTable}>
            {droppingTable ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Drop
          </button>
        </div>
      </div>

      {/* ── Search + pagination bar ── */}
      <div className="px-6 py-3 flex items-center gap-3 flex-wrap shrink-0"
        style={{ borderBottom: '1px solid var(--ag-border)' }}>
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--ag-text3)' }} />
          <input
            className="ag-input pl-8 pr-3 py-1.5 text-xs w-full"
            placeholder="Search all columns…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput); }}
          />
        </div>
        {search && (
          <button onClick={() => { setSearch(''); setSearchInput(''); }}
            className="text-xs ag-btn-ghost flex items-center gap-1 px-2 py-1.5">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        <button onClick={() => fetchRows(pagination.page)}
          className="ag-btn-ghost p-1.5 rounded-lg ml-auto" title="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* Pagination controls */}
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--ag-text2)' }}>
          <span>
            {pagination.total === 0 ? '0' : `${((pagination.page - 1) * pagination.limit) + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)}`}
            {' '}of {pagination.total.toLocaleString()}
          </span>
          <button onClick={() => goPage(1)} disabled={pagination.page <= 1}
            className="ag-btn-ghost p-1 rounded disabled:opacity-30">
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => goPage(pagination.page - 1)} disabled={pagination.page <= 1}
            className="ag-btn-ghost p-1 rounded disabled:opacity-30">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => goPage(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
            className="ag-btn-ghost p-1 rounded disabled:opacity-30">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => goPage(pagination.totalPages)} disabled={pagination.page >= pagination.totalPages}
            className="ag-btn-ghost p-1 rounded disabled:opacity-30">
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2" style={{ color: 'var(--ag-text3)' }}>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 m-6 p-4 rounded-lg"
            style={{ background: 'var(--ag-red-lo)', color: 'var(--ag-red)', border: '1px solid var(--ag-red)' }}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        ) : (
          <table className="w-full text-xs border-collapse" style={{ minWidth: allCols.length * 140 }}>
            <thead className="sticky top-0 z-10" style={{ background: 'var(--ag-sidebar-bg)' }}>
              <tr>
                {/* Checkbox */}
                <th className="w-10 px-3 py-2.5 text-left"
                  style={{ borderBottom: '1px solid var(--ag-border)' }}>
                  <input type="checkbox"
                    checked={rows.length > 0 && selected.size === rows.length}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                {allCols.map((col) => (
                  <th
                    key={col.column_name}
                    className="px-3 py-2.5 text-left font-medium cursor-pointer select-none whitespace-nowrap"
                    style={{ borderBottom: '1px solid var(--ag-border)', color: 'var(--ag-text2)' }}
                    onClick={() => handleSort(col.column_name)}
                  >
                    {col.column_name}
                    <SortIcon col={col.column_name} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={allCols.length + 1} className="text-center py-16"
                    style={{ color: 'var(--ag-text3)' }}>
                    {search ? 'No rows match your search.' : 'No rows in this table.'}
                  </td>
                </tr>
              ) : rows.map((row) => {
                const rid = row.id as number;
                const isSelected = selected.has(rid);
                return (
                  <tr
                    key={rid}
                    style={{
                      background: isSelected ? 'var(--ag-accent-lo)' : undefined,
                      borderBottom: '1px solid var(--ag-border)',
                    }}
                    className="hover:bg-[var(--ag-hover)] transition-colors"
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={isSelected}
                        onChange={() => toggleRow(rid)} className="rounded" />
                    </td>
                    {allCols.map((col) => {
                      const isId = col.column_name === 'id';
                      const isEditing = !isId && editingCell?.rowId === rid && editingCell?.col === col.column_name;
                      const isSaving = savingCell?.rowId === rid && savingCell?.col === col.column_name;
                      const cellVal = String(row[col.column_name] ?? '');

                      return (
                        <td
                          key={col.column_name}
                          className="px-3 py-1.5 max-w-[240px]"
                          style={{ color: isId ? 'var(--ag-text3)' : 'var(--ag-text1)' }}
                        >
                          {isEditing ? (
                            <CellInput
                              initial={cellVal}
                              onSave={(v) => saveCell(rid, col.column_name, v)}
                              onCancel={() => setEditingCell(null)}
                            />
                          ) : isSaving ? (
                            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--ag-text3)' }}>
                              <Loader2 className="w-3 h-3 animate-spin" /> saving…
                            </span>
                          ) : (
                            <span
                              className={`block truncate ${isId ? '' : 'cursor-pointer hover:underline'}`}
                              title={cellVal}
                              onDoubleClick={() => {
                                if (!isId) setEditingCell({ rowId: rid, col: col.column_name });
                              }}
                            >
                              {cellVal === '' ? (
                                <span style={{ color: 'var(--ag-text3)' }}>—</span>
                              ) : cellVal}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modals ── */}
      {showSchema && (
        <SchemaEditor
          columns={columns}
          datasetId={id!}
          onClose={() => setShowSchema(false)}
          onChanged={() => { fetchMeta(); fetchRows(1); }}
        />
      )}
      {showAddRow && (
        <AddRowModal
          columns={columns}
          datasetId={id!}
          onClose={() => setShowAddRow(false)}
          onAdded={() => { fetchRows(pagination.page); fetchMeta(); }}
        />
      )}
      {showDropConfirm && (
        <DropConfirmModal
          datasetName={dataset?.name ?? 'this table'}
          onClose={() => setShowDropConfirm(false)}
          onConfirm={confirmDropTable}
        />
      )}
      {showDeleteRows && (
        <DeleteRowsModal
          count={selected.size}
          onClose={() => setShowDeleteRows(false)}
          onConfirm={confirmDeleteRows}
          loading={deletingRows}
        />
      )}
    </div>
  );
}
