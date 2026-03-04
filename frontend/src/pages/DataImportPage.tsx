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

// ─── Status badge helper ─────────────────────────────────────────

function StatusBadge({ status }: { status: Dataset['status'] }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    uploaded: { bg: 'bg-yellow-900/40', text: 'text-yellow-400', label: 'Uploaded' },
    processing: { bg: 'bg-blue-900/40', text: 'text-blue-400', label: 'Processing' },
    imported: { bg: 'bg-green-900/40', text: 'text-green-400', label: 'Imported' },
    error: { bg: 'bg-red-900/40', text: 'text-red-400', label: 'Error' },
  };
  const s = map[status] ?? map.uploaded;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${s.bg} ${s.text}`}>
      {status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'imported' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'error' && <AlertTriangle className="w-3 h-3" />}
      {s.label}
    </span>
  );
}

// ─── Main page ──────────────────────────────────────────────────

export default function DataImportPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Mapping workspace state
  const [activePreview, setActivePreview] = useState<ParsedPreview | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [tableName, setTableName] = useState('');
  const [importing, setImporting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Data viewer
  const [viewData, setViewData] = useState<{ rows: Record<string, unknown>[]; dataset: Dataset } | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const fetchDatasets = useCallback(async () => {
    try {
      const res = await api.get('/datasets');
      setDatasets(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  // ─── Upload ────────────────────────────────────────────────────

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];

    const formData = new FormData();
    formData.append('file', file);

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

  // ─── Preview / open mapping workspace ──────────────────────────

  async function openMappingWorkspace(ds: Dataset) {
    setPreviewLoading(true);
    try {
      const res = await api.get(`/datasets/${ds.id}/preview`);
      const data: ParsedPreview = res.data.data;
      setActivePreview(data);

      // Auto-generate column mappings from headers
      setMappings(
        data.headers.map((h) => ({
          originalHeader: h,
          columnName: h
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_+|_+$/g, ''),
          columnType: 'TEXT' as const,
        })),
      );
      setTableName(
        ds.name
          .replace(/\.[^/.]+$/, '') // remove extension
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .replace(/_{2,}/g, '_')
          .replace(/^_+|_+$/g, ''),
      );
    } catch {
      alert('Failed to preview file.');
    } finally {
      setPreviewLoading(false);
    }
  }

  function closeMappingWorkspace() {
    setActivePreview(null);
    setMappings([]);
    setTableName('');
  }

  // ─── Import (create table + insert) ────────────────────────────

  async function handleImport() {
    if (!activePreview || !tableName) return;
    setImporting(true);
    try {
      await api.post(`/datasets/${activePreview.dataset.id}/import`, {
        tableName,
        columns: mappings,
      });
      closeMappingWorkspace();
      await fetchDatasets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  // ─── View imported data ────────────────────────────────────────

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

  // ─── Delete ────────────────────────────────────────────────────

  async function handleDelete(ds: Dataset) {
    if (!confirm(`Delete "${ds.name}" and its data?`)) return;
    try {
      await api.delete(`/datasets/${ds.id}`);
      await fetchDatasets();
    } catch {
      alert('Delete failed.');
    }
  }

  // ─── Update a single column mapping ───────────────────────────

  function updateMapping(idx: number, field: keyof ColumnMapping, value: string) {
    setMappings((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    );
  }

  // ──────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────

  // If mapping workspace is active, show it full-screen
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

  // If data viewer is active
  if (viewData) {
    return (
      <DataViewer
        data={viewData}
        onClose={() => setViewData(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Data Import</h1>
        <p className="text-gray-400 mt-1">Upload CSV or Excel files, map columns, and import into the database.</p>
      </div>

      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-700 hover:border-gray-600 bg-gray-800/40'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <p className="text-gray-300">Uploading…</p>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-3 cursor-pointer">
            <Upload className="w-10 h-10 text-gray-500" />
            <p className="text-gray-300 font-medium">
              Drag &amp; drop a file here, or <span className="text-blue-400 underline">browse</span>
            </p>
            <p className="text-xs text-gray-500">CSV, XLS, XLSX — up to 50 MB</p>
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>
        )}
      </div>

      {/* Datasets list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : datasets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No datasets yet. Upload a file to get started.</p>
        </div>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-left">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Table</th>
                <th className="px-5 py-3 font-medium">Rows</th>
                <th className="px-5 py-3 font-medium">Uploaded</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/60">
              {datasets.map((ds) => (
                <tr key={ds.id} className="hover:bg-gray-800/60 transition-colors">
                  <td className="px-5 py-3 text-white font-medium flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-gray-500 shrink-0" />
                    {ds.name}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={ds.status} /></td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">{ds.table_name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-400">{ds.row_count > 0 ? ds.row_count.toLocaleString() : '—'}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{new Date(ds.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {ds.status === 'uploaded' && (
                        <button
                          onClick={() => openMappingWorkspace(ds)}
                          disabled={previewLoading}
                          className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-400/10 transition-colors"
                          title="Map & Import"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                      {ds.status === 'imported' && ds.table_name && (
                        <button
                          onClick={() => viewTableData(ds)}
                          disabled={viewLoading}
                          className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                          title="View data"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(ds)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
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

// ═════════════════════════════════════════════════════════════════
// Mapping Workspace – A dedicated screen for header → type mapping
// ═════════════════════════════════════════════════════════════════

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

function MappingWorkspace({
  preview,
  mappings,
  tableName,
  importing,
  onTableNameChange,
  onUpdateMapping,
  onImport,
  onClose,
}: MappingWorkspaceProps) {
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" />
            Mapping Workspace
          </h1>
          <p className="text-gray-400 mt-1">
            File: <span className="text-white font-medium">{preview.dataset.name}</span>
            {' · '}
            {preview.totalRows.toLocaleString()} rows · {preview.headers.length} columns
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Table name */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Target table name <span className="text-gray-500">(prefixed with dyn_)</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-mono text-sm">dyn_</span>
          <input
            type="text"
            value={tableName}
            onChange={(e) => onTableNameChange(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="my_table"
          />
        </div>
      </div>

      {/* Column mapping table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700">
          <h2 className="text-sm font-medium text-gray-300">Column Mapping</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="px-5 py-2.5 text-left font-medium">#</th>
              <th className="px-5 py-2.5 text-left font-medium">Original Header</th>
              <th className="px-5 py-2.5 text-left font-medium">Column Name (SQL)</th>
              <th className="px-5 py-2.5 text-left font-medium">Type</th>
              <th className="px-5 py-2.5 text-left font-medium">Sample Values</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/60">
            {mappings.map((col, idx) => (
              <tr key={idx} className="hover:bg-gray-800/60">
                <td className="px-5 py-2.5 text-gray-500">{idx + 1}</td>
                <td className="px-5 py-2.5 text-white font-mono text-xs">{col.originalHeader}</td>
                <td className="px-5 py-2.5">
                  <input
                    type="text"
                    value={col.columnName}
                    onChange={(e) => onUpdateMapping(idx, 'columnName', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-xs font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </td>
                <td className="px-5 py-2.5">
                  <select
                    value={col.columnType}
                    onChange={(e) => onUpdateMapping(idx, 'columnType', e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    {COLUMN_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-2.5 text-gray-500 text-xs truncate max-w-[200px]">
                  {preview.preview
                    .slice(0, 3)
                    .map((row) => String(row[col.originalHeader] ?? ''))
                    .join(' | ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preview table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700">
          <h2 className="text-sm font-medium text-gray-300">
            Data Preview <span className="text-gray-500">({Math.min(20, preview.totalRows)} of {preview.totalRows.toLocaleString()} rows)</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                {preview.headers.map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/40 text-gray-300">
              {preview.preview.map((row, ri) => (
                <tr key={ri} className="hover:bg-gray-800/40">
                  {preview.headers.map((h) => (
                    <td key={h} className="px-4 py-1.5 whitespace-nowrap max-w-[200px] truncate">
                      {String(row[h] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onImport}
          disabled={importing || !tableName}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {importing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Importing…
            </>
          ) : (
            <>
              <Database className="w-4 h-4" /> Create Table &amp; Import
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// Data Viewer – Shows rows from an imported dynamic table
// ═════════════════════════════════════════════════════════════════

interface DataViewerProps {
  data: { rows: Record<string, unknown>[]; dataset: Dataset };
  onClose: () => void;
}

function DataViewer({ data, onClose }: DataViewerProps) {
  const columns = data.rows.length > 0 ? Object.keys(data.rows[0]).filter(k => k !== 'id' && k !== '_imported_at') : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Table2 className="w-6 h-6 text-emerald-400" />
            {data.dataset.name}
          </h1>
          <p className="text-gray-400 mt-1">
            Table: <span className="font-mono text-white text-sm">{data.dataset.table_name}</span>
            {' · '}
            {data.dataset.row_count.toLocaleString()} rows
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Data table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="px-4 py-2.5 text-left font-medium">#</th>
                {columns.map((c) => (
                  <th key={c} className="px-4 py-2.5 text-left font-medium whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/40 text-gray-300">
              {data.rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-gray-800/40">
                  <td className="px-4 py-1.5 text-gray-500">{ri + 1}</td>
                  {columns.map((c) => (
                    <td key={c} className="px-4 py-1.5 whitespace-nowrap max-w-[220px] truncate">
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
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Datasets
        </button>
      </div>
    </div>
  );
}
