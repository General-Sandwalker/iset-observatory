import { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  Trash2,
  Eye,
  Database,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  Table2,
} from 'lucide-react';
import api from '../lib/api';
import type { Dataset, ColumnMapping, ParsedPreview } from '../lib/types';

const COLUMN_TYPES = ['TEXT', 'INTEGER', 'NUMERIC', 'DATE', 'BOOLEAN'] as const;

function StatusBadge({ status }: { status: Dataset['status'] }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    uploaded: { bg: 'var(--ag-amber-lo)', text: 'var(--ag-amber)', label: 'Uploaded' },
    processing: { bg: 'var(--ag-accent-lo)', text: 'var(--ag-accent)', label: 'Processing' },
    imported: { bg: 'var(--ag-green-lo)', text: 'var(--ag-green)', label: 'Imported' },
    error: { bg: 'var(--ag-red-lo)', text: 'var(--ag-red)', label: 'Error' },
  };
  const s = map[status] ?? map.uploaded;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.text}` }}
    >
      {status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'imported' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'error' && <AlertTriangle className="w-3 h-3" />}
      {s.label}
    </span>
  );
}

export default function DataImportPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activePreview, setActivePreview] = useState<ParsedPreview | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [tableName, setTableName] = useState('');
  const [importing, setImporting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [viewData, setViewData] = useState<{ rows: Record<string, unknown>[]; dataset: Dataset } | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const fetchDatasets = useCallback(async () => {
    try {
      const res = await api.get('/datasets');
      setDatasets(res.data.data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDatasets(); }, [fetchDatasets]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    formData.append('file', files[0]);
    setUploading(true);
    try {
      await api.post('/datasets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchDatasets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  }

  async function openMappingWorkspace(ds: Dataset) {
    setPreviewLoading(true);
    try {
      const res = await api.get(`/datasets/${ds.id}/preview`);
      const data: ParsedPreview = res.data.data;
      setActivePreview(data);
      setMappings(
        data.headers.map((h) => ({
          originalHeader: h,
          columnName: h.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_{2,}/g, '_').replace(/^_+|_+$/g, ''),
          columnType: 'TEXT' as const,
        })),
      );
      setTableName(
        ds.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_{2,}/g, '_').replace(/^_+|_+$/g, ''),
      );
    } catch {
      alert('Failed to preview file.');
    } finally {
      setPreviewLoading(false);
    }
  }

  function closeMappingWorkspace() { setActivePreview(null); setMappings([]); setTableName(''); }

  async function handleImport() {
    if (!activePreview || !tableName) return;
    setImporting(true);
    try {
      await api.post(`/datasets/${activePreview.dataset.id}/import`, { tableName, columns: mappings });
      closeMappingWorkspace();
      await fetchDatasets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  async function viewTableData(ds: Dataset) {
    setViewLoading(true);
    try {
      const res = await api.get(`/datasets/${ds.id}/data?limit=100`);
      setViewData({ rows: res.data.data, dataset: ds });
    } catch {
      alert('Failed to load table data.');
    } finally {
      setViewLoading(false);
    }
  }

  async function handleDelete(ds: Dataset) {
    if (!confirm(`Delete "${ds.name}" and its data?`)) return;
    try {
      await api.delete(`/datasets/${ds.id}`);
      await fetchDatasets();
    } catch {
      alert('Delete failed.');
    }
  }

  function updateMapping(idx: number, field: keyof ColumnMapping, value: string) {
    setMappings((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  }

  if (activePreview) {
    return (
      <MappingWorkspace
        preview={activePreview}
        mappings={mappings}
        tableName={tableName}
        importing={importing}
        onTableNameChange={setTableName}
        onUpdateMapping={updateMapping}
        onImport={handleImport}
        onClose={closeMappingWorkspace}
      />
    );
  }

  if (viewData) {
    return <DataViewer data={viewData} onClose={() => setViewData(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ag-text)' }}>Data Import</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--ag-text2)' }}>
          Upload CSV or Excel files, map columns, and import into the database.
        </p>
      </div>

      {/* Upload zone */}
      <div
        className="rounded-xl p-10 text-center transition-all border-2 border-dashed"
        style={{
          borderColor: dragActive ? 'var(--ag-accent)' : 'var(--ag-border)',
          background: dragActive ? 'var(--ag-accent-lo)' : 'var(--ag-surface2)',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--ag-accent)' }} />
            <p style={{ color: 'var(--ag-text2)' }}>Uploading…</p>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-3 cursor-pointer">
            <Upload className="w-10 h-10" style={{ color: 'var(--ag-text3)' }} />
            <p className="font-medium" style={{ color: 'var(--ag-text2)' }}>
              Drag &amp; drop a file here, or{' '}
              <span style={{ color: 'var(--ag-accent)' }} className="underline">browse</span>
            </p>
            <p className="text-xs" style={{ color: 'var(--ag-text3)' }}>CSV, XLS, XLSX — up to 50 MB</p>
            <input type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          </label>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--ag-accent)' }} />
        </div>
      ) : datasets.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--ag-text3)' }}>
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No datasets yet. Upload a file to get started.</p>
        </div>
      ) : (
        <div className="ag-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="ag-table-head">
              <tr>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Table</th>
                <th className="px-5 py-3 text-left">Rows</th>
                <th className="px-5 py-3 text-left">Uploaded</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((ds) => (
                <tr key={ds.id} className="ag-table-row">
                  <td className="px-5 py-3 font-medium" style={{ color: 'var(--ag-text)' }}>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 shrink-0" style={{ color: 'var(--ag-text3)' }} />
                      {ds.name}
                    </div>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={ds.status} /></td>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: 'var(--ag-text3)' }}>{ds.table_name ?? '—'}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--ag-text2)' }}>{ds.row_count > 0 ? ds.row_count.toLocaleString() : '—'}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--ag-text3)' }}>{new Date(ds.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      {ds.status === 'uploaded' && (
                        <button
                          onClick={() => openMappingWorkspace(ds)}
                          disabled={previewLoading}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--ag-accent)' }}
                          title="Map & Import"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                      {ds.status === 'imported' && ds.table_name && (
                        <button
                          onClick={() => viewTableData(ds)}
                          disabled={viewLoading}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--ag-green)' }}
                          title="View data"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(ds)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--ag-text3)' }}
                        onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ag-red)')}
                        onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ag-text3)')}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface MappingWorkspaceProps {
  preview: ParsedPreview;
  mappings: ColumnMapping[];
  tableName: string;
  importing: boolean;
  onTableNameChange: (v: string) => void;
  onUpdateMapping: (idx: number, field: keyof ColumnMapping, value: string) => void;
  onImport: () => void;
  onClose: () => void;
}

function MappingWorkspace({ preview, mappings, tableName, importing, onTableNameChange, onUpdateMapping, onImport, onClose }: MappingWorkspaceProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--ag-text)' }}>
            <Database className="w-6 h-6" style={{ color: 'var(--ag-accent)' }} />
            Mapping Workspace
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ag-text2)' }}>
            File: <span className="font-medium" style={{ color: 'var(--ag-text)' }}>{preview.dataset.name}</span>
            {' · '}{preview.totalRows.toLocaleString()} rows · {preview.headers.length} columns
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--ag-text3)' }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ag-text)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ag-text3)')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="ag-card p-5">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ag-text2)' }}>
          Target table name <span style={{ color: 'var(--ag-text3)' }}>(prefixed with dyn_)</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm" style={{ color: 'var(--ag-text3)' }}>dyn_</span>
          <input
            type="text"
            value={tableName}
            onChange={(e) => onTableNameChange(e.target.value)}
            className="ag-input flex-1 px-3 py-2 text-sm font-mono"
            placeholder="my_table"
          />
        </div>
      </div>

      <div className="ag-card overflow-hidden">
        <div className="px-5 py-3 ag-table-head">
          <h2 className="text-sm font-medium">Column Mapping</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="ag-table-head">
            <tr>
              <th className="px-5 py-2.5 text-left">#</th>
              <th className="px-5 py-2.5 text-left">Original Header</th>
              <th className="px-5 py-2.5 text-left">Column Name (SQL)</th>
              <th className="px-5 py-2.5 text-left">Type</th>
              <th className="px-5 py-2.5 text-left">Sample Values</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((col, idx) => (
              <tr key={idx} className="ag-table-row">
                <td className="px-5 py-2.5" style={{ color: 'var(--ag-text3)' }}>{idx + 1}</td>
                <td className="px-5 py-2.5 font-mono text-xs" style={{ color: 'var(--ag-text)' }}>{col.originalHeader}</td>
                <td className="px-5 py-2.5">
                  <input
                    type="text"
                    value={col.columnName}
                    onChange={(e) => onUpdateMapping(idx, 'columnName', e.target.value)}
                    className="ag-input w-full px-2 py-1 text-xs font-mono"
                  />
                </td>
                <td className="px-5 py-2.5">
                  <select
                    value={col.columnType}
                    onChange={(e) => onUpdateMapping(idx, 'columnType', e.target.value)}
                    className="ag-input px-2 py-1 text-xs"
                  >
                    {COLUMN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td className="px-5 py-2.5 text-xs truncate max-w-[200px]" style={{ color: 'var(--ag-text3)' }}>
                  {preview.preview.slice(0, 3).map((row) => String(row[col.originalHeader] ?? '')).join(' | ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ag-card overflow-hidden">
        <div className="px-5 py-3 ag-table-head">
          <h2 className="text-sm font-medium">
            Data Preview{' '}
            <span style={{ color: 'var(--ag-text3)' }}>({Math.min(20, preview.totalRows)} of {preview.totalRows.toLocaleString()} rows)</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="ag-table-head">
              <tr>
                {preview.headers.map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.preview.map((row, ri) => (
                <tr key={ri} className="ag-table-row">
                  {preview.headers.map((h) => (
                    <td key={h} className="px-4 py-1.5 whitespace-nowrap max-w-[200px] truncate" style={{ color: 'var(--ag-text2)' }}>
                      {String(row[h] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="ag-btn-ghost px-5 py-2.5 text-sm">Cancel</button>
        <button
          onClick={onImport}
          disabled={importing || !tableName}
          className="ag-btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
        >
          {importing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
          ) : (
            <><Database className="w-4 h-4" /> Create Table & Import</>
          )}
        </button>
      </div>
    </div>
  );
}

interface DataViewerProps {
  data: { rows: Record<string, unknown>[]; dataset: Dataset };
  onClose: () => void;
}

function DataViewer({ data, onClose }: DataViewerProps) {
  const columns = data.rows.length > 0
    ? Object.keys(data.rows[0]).filter((k) => k !== 'id' && k !== '_imported_at')
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--ag-text)' }}>
            <Table2 className="w-6 h-6" style={{ color: 'var(--ag-green)' }} />
            {data.dataset.name}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ag-text2)' }}>
            Table: <span className="font-mono font-medium" style={{ color: 'var(--ag-text)' }}>{data.dataset.table_name}</span>
            {' · '}{data.dataset.row_count.toLocaleString()} rows
          </p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--ag-text3)' }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ag-text)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ag-text3)')}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="ag-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="ag-table-head">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">#</th>
                {columns.map((c) => (
                  <th key={c} className="px-4 py-2.5 text-left font-medium whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, ri) => (
                <tr key={ri} className="ag-table-row">
                  <td className="px-4 py-1.5" style={{ color: 'var(--ag-text3)' }}>{ri + 1}</td>
                  {columns.map((c) => (
                    <td key={c} className="px-4 py-1.5 whitespace-nowrap max-w-[220px] truncate" style={{ color: 'var(--ag-text2)' }}>
                      {String(row[c] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={onClose} className="ag-btn-ghost px-5 py-2.5 text-sm">Back to Datasets</button>
      </div>
    </div>
  );
}
