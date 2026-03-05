import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  PlusCircle,
  Trash2,
  Loader2,
  Save,
  Eye,
  LineChart,
  PieChart,
  Radar,
  X,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Radar as RadarChart, PolarArea } from 'react-chartjs-2';
import api from '../lib/api';
import type { Chart, ChartType, AggregationType, Dataset, ColumnMapping } from '../lib/types';

interface ChartApiData { labels: string[]; values: number[] }

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler,
);

const CHART_TYPES: { value: ChartType; label: string; icon: React.ElementType }[] = [
  { value: 'bar', label: 'Bar', icon: BarChart3 },
  { value: 'horizontalBar', label: 'H-Bar', icon: BarChart3 },
  { value: 'line', label: 'Line', icon: LineChart },
  { value: 'pie', label: 'Pie', icon: PieChart },
  { value: 'doughnut', label: 'Doughnut', icon: PieChart },
  { value: 'radar', label: 'Radar', icon: Radar },
  { value: 'polarArea', label: 'Polar Area', icon: Radar },
];

const AGGREGATIONS: { value: AggregationType; label: string }[] = [
  { value: 'COUNT', label: 'Count' },
  { value: 'SUM', label: 'Sum' },
  { value: 'AVG', label: 'Average' },
  { value: 'MIN', label: 'Minimum' },
  { value: 'MAX', label: 'Maximum' },
];

const PALETTE = [
  'rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)', 'rgba(245, 158, 11, 0.7)',
  'rgba(239, 68, 68, 0.7)', 'rgba(139, 92, 246, 0.7)', 'rgba(236, 72, 153, 0.7)',
  'rgba(20, 184, 166, 0.7)', 'rgba(249, 115, 22, 0.7)', 'rgba(99, 102, 241, 0.7)',
  'rgba(168, 85, 247, 0.7)', 'rgba(34, 197, 94, 0.7)', 'rgba(234, 179, 8, 0.7)',
];

function buildChartData(data: ChartApiData, xLabel: string, yLabel: string, agg: string) {
  return {
    labels: data.labels,
    datasets: [{
      label: yLabel ? `${agg}(${yLabel}) by ${xLabel}` : `COUNT by ${xLabel}`,
      data: data.values,
      backgroundColor: PALETTE.slice(0, data.labels.length),
      borderColor: PALETTE.map((c) => c.replace('0.7', '1')).slice(0, data.labels.length),
      borderWidth: 1,
      fill: false,
    }],
  };
}

function renderChartJS(type: ChartType, data: ChartApiData, title: string, xCol: string, yCol: string, agg: string) {
  const chartData = buildChartData(data, xCol, yCol, agg);
  const baseOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' as const }, title: { display: true, text: title || 'Preview' } } };
  const barOpts = { ...baseOpts, ...(type === 'horizontalBar' ? { indexAxis: 'y' as const } : {}) };
  switch (type) {
    case 'bar':
    case 'horizontalBar': return <Bar data={chartData} options={barOpts} />;
    case 'line': return <Line data={chartData} options={baseOpts} />;
    case 'pie': return <Pie data={chartData} options={baseOpts} />;
    case 'doughnut': return <Doughnut data={chartData} options={baseOpts} />;
    case 'radar': return <RadarChart data={chartData} options={baseOpts} />;
    case 'polarArea': return <PolarArea data={chartData} options={baseOpts} />;
    default: return <Bar data={chartData} options={baseOpts} />;
  }
}

export default function ChartBuilderPage() {
  const [charts, setCharts] = useState<Chart[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showBuilder, setShowBuilder] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [datasetId, setDatasetId] = useState<number | null>(null);
  const [xColumn, setXColumn] = useState('');
  const [yColumn, setYColumn] = useState('');
  const [aggregation, setAggregation] = useState<AggregationType>('COUNT');

  const [previewData, setPreviewData] = useState<ChartApiData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [viewingChart, setViewingChart] = useState<number | null>(null);
  const [viewData, setViewData] = useState<ChartApiData | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const selectedDataset = useMemo(() => datasets.find((d) => d.id === datasetId), [datasets, datasetId]);
  const columns: ColumnMapping[] = useMemo(() => selectedDataset?.column_mapping || [], [selectedDataset]);

  useEffect(() => {
    Promise.all([
      api.get('/charts').then((r) => setCharts(r.data.data)),
      api.get('/datasets').then((r) => setDatasets(r.data.data.filter((d: Dataset) => d.status === 'imported'))),
    ]).finally(() => setLoading(false));
  }, []);

  function resetBuilder() {
    setShowBuilder(false); setEditingId(null); setTitle(''); setChartType('bar');
    setDatasetId(null); setXColumn(''); setYColumn(''); setAggregation('COUNT'); setPreviewData(null);
  }

  function openEdit(chart: Chart) {
    setEditingId(chart.id); setTitle(chart.title); setChartType(chart.chart_type);
    setDatasetId(chart.dataset_id ?? null); setXColumn(chart.config?.xColumn || '');
    setYColumn(chart.config?.yColumn || ''); setAggregation(chart.config?.aggregation || 'COUNT');
    setShowBuilder(true); setPreviewData(null);
  }

  async function handleSave() {
    if (!title.trim() || !datasetId || !xColumn) return;
    setSaving(true);
    try {
      const payload = { title: title.trim(), chartType, datasetId, config: { xColumn, yColumn, aggregation } };
      let saved: Chart;
      if (editingId) {
        const res = await api.put(`/charts/${editingId}`, payload);
        saved = res.data.data;
        setCharts((prev) => prev.map((c) => (c.id === editingId ? saved : c)));
      } else {
        const res = await api.post('/charts', payload);
        saved = res.data.data;
        setCharts((prev) => [saved, ...prev]);
      }
      resetBuilder();
      api.get('/charts').then((r) => setCharts(r.data.data));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save chart.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    if (!datasetId || !xColumn) return;
    setPreviewLoading(true);
    try {
      let chartId = editingId;
      if (!chartId) {
        const res = await api.post('/charts', { title: title.trim() || 'Preview', chartType, datasetId, config: { xColumn, yColumn, aggregation } });
        chartId = res.data.data.id;
        setEditingId(chartId);
        setCharts((prev) => [res.data.data, ...prev]);
      } else {
        await api.put(`/charts/${chartId}`, { title: title.trim(), chartType, config: { xColumn, yColumn, aggregation } });
      }
      const dataRes = await api.get(`/charts/${chartId}/data`);
      setPreviewData(dataRes.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate preview.');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this chart?')) return;
    try {
      await api.delete(`/charts/${id}`);
      setCharts((prev) => prev.filter((c) => c.id !== id));
    } catch { alert('Failed to delete chart.'); }
  }

  async function viewChart(chart: Chart) {
    setViewingChart(chart.id); setViewLoading(true);
    try {
      const res = await api.get(`/charts/${chart.id}/data`);
      setViewData(res.data.data);
    } catch { alert('Failed to load chart data.'); setViewingChart(null); }
    finally { setViewLoading(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--ag-accent)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--ag-text)' }}>
            <BarChart3 className="w-7 h-7" style={{ color: 'var(--ag-accent)' }} />
            Visualizations
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ag-text2)' }}>
            Create charts from your imported datasets
          </p>
        </div>
        <button
          onClick={() => { resetBuilder(); setShowBuilder(true); }}
          className="ag-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          New Chart
        </button>
      </div>

      {/* Builder Panel */}
      {showBuilder && (
        <div className="ag-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold" style={{ color: 'var(--ag-text)' }}>
              {editingId ? 'Edit Chart' : 'Create New Chart'}
            </h2>
            <button
              onClick={resetBuilder}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--ag-text3)' }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ag-text)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ag-text3)')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--ag-text2)' }}>Chart Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Students by Department"
                className="ag-input w-full px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--ag-text2)' }}>Chart Type</label>
              <div className="flex gap-2 flex-wrap">
                {CHART_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setChartType(value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                    style={{
                      background: chartType === value ? 'var(--ag-accent-lo)' : 'var(--ag-surface2)',
                      borderColor: chartType === value ? 'var(--ag-accent)' : 'var(--ag-border)',
                      color: chartType === value ? 'var(--ag-accent)' : 'var(--ag-text2)',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--ag-text2)' }}>Dataset</label>
              <select
                value={datasetId || ''}
                onChange={(e) => { setDatasetId(Number(e.target.value) || null); setXColumn(''); setYColumn(''); setPreviewData(null); }}
                className="ag-input w-full px-3 py-2 text-sm"
              >
                <option value="">Select a dataset…</option>
                {datasets.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.row_count} rows)</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--ag-text2)' }}>Aggregation</label>
              <select
                value={aggregation}
                onChange={(e) => { setAggregation(e.target.value as AggregationType); setPreviewData(null); }}
                className="ag-input w-full px-3 py-2 text-sm"
              >
                {AGGREGATIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--ag-text2)' }}>X Axis (Group By)</label>
              <select
                value={xColumn}
                onChange={(e) => { setXColumn(e.target.value); setPreviewData(null); }}
                disabled={!datasetId}
                className="ag-input w-full px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">Select column…</option>
                {columns.map((c) => <option key={c.columnName} value={c.columnName}>{c.originalHeader} ({c.columnType})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--ag-text2)' }}>Y Axis (Value) — optional for COUNT</label>
              <select
                value={yColumn}
                onChange={(e) => { setYColumn(e.target.value); setPreviewData(null); }}
                disabled={!datasetId}
                className="ag-input w-full px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">None (use COUNT)</option>
                {columns.filter((c) => c.columnType === 'INTEGER' || c.columnType === 'NUMERIC').map((c) => (
                  <option key={c.columnName} value={c.columnName}>{c.originalHeader} ({c.columnType})</option>
                ))}
              </select>
            </div>
          </div>

          {previewData && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: 'var(--ag-surface2)', border: '1px solid var(--ag-border)', height: 400, padding: '16px' }}
            >
              {renderChartJS(chartType, previewData, title, xColumn, yColumn, aggregation)}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              disabled={!datasetId || !xColumn || previewLoading}
              className="ag-btn-ghost flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
            >
              {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !datasetId || !xColumn || saving}
              className="ag-btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* View modal */}
      {viewingChart && (
        <div className="ag-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: 'var(--ag-text)' }}>
              {charts.find((c) => c.id === viewingChart)?.title}
            </h2>
            <button
              onClick={() => { setViewingChart(null); setViewData(null); }}
              className="ag-btn-ghost px-3 py-1.5 text-sm"
            >
              Close
            </button>
          </div>
          {viewLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--ag-accent)' }} />
            </div>
          ) : viewData ? (
            <div style={{ height: 400 }}>
              {(() => {
                const c = charts.find((ch) => ch.id === viewingChart);
                return renderChartJS(c?.chart_type || 'bar', viewData, c?.title || '', c?.config?.xColumn || '', c?.config?.yColumn || '', c?.config?.aggregation || 'COUNT');
              })()}
            </div>
          ) : null}
        </div>
      )}

      {/* Charts Grid */}
      {charts.length === 0 && !showBuilder ? (
        <div
          className="rounded-xl p-12 text-center border"
          style={{ background: 'var(--ag-surface2)', borderColor: 'var(--ag-border)' }}
        >
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--ag-text3)' }} />
          <h3 className="font-medium mb-2" style={{ color: 'var(--ag-text)' }}>No charts yet</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--ag-text3)' }}>
            Create your first visualization from an imported dataset.
          </p>
          <button onClick={() => setShowBuilder(true)} className="ag-btn-primary px-4 py-2 text-sm">
            Create Chart
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {charts.map((chart) => (
            <div
              key={chart.id}
              className="ag-card p-4 transition-all"
              onMouseOver={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--ag-accent)')}
              onMouseOut={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--ag-border)')}
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="text-sm font-medium" style={{ color: 'var(--ag-text)' }}>{chart.title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--ag-text3)' }}>
                    {chart.dataset_name
                      ? `${chart.dataset_name} · ${chart.chart_type}`
                      : `AI Query · ${chart.chart_type}`}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                  style={{ background: 'var(--ag-accent-lo)', color: 'var(--ag-accent)' }}
                >
                  {chart.chart_type}
                </span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--ag-text3)' }}>
                {chart.config?.sql
                  ? <span className="font-mono truncate block max-w-[28ch]" title={chart.config.sql}>SQL: {chart.config.sql.slice(0, 40)}…</span>
                  : chart.config?.xColumn && (
                      <>X: {chart.config.xColumn}{chart.config.yColumn ? ` · Y: ${chart.config.aggregation}(${chart.config.yColumn})` : ' · COUNT'}</>
                    )
                }
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => viewChart(chart)}
                  className="ag-btn-ghost flex items-center gap-1 px-2.5 py-1.5 text-xs"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                {chart.dataset_id && (
                  <button
                    onClick={() => openEdit(chart)}
                    className="ag-btn-ghost flex items-center gap-1 px-2.5 py-1.5 text-xs"
                  >
                    <BarChart3 className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(chart.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors ml-auto"
                  style={{ background: 'var(--ag-red-lo)', color: 'var(--ag-red)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
