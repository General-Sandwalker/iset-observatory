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
import type {
  Chart,
  ChartType,
  AggregationType,
  Dataset,
  ColumnMapping,
} from '../lib/types';

interface ChartApiData {
  labels: string[];
  values: number[];
}

// Register Chart.js components
ChartJS.register(
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
);

const CHART_TYPES: { value: ChartType; label: string; icon: React.ElementType }[] = [
  { value: 'bar', label: 'Bar', icon: BarChart3 },
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
  'rgba(59, 130, 246, 0.7)',
  'rgba(16, 185, 129, 0.7)',
  'rgba(245, 158, 11, 0.7)',
  'rgba(239, 68, 68, 0.7)',
  'rgba(139, 92, 246, 0.7)',
  'rgba(236, 72, 153, 0.7)',
  'rgba(20, 184, 166, 0.7)',
  'rgba(249, 115, 22, 0.7)',
  'rgba(99, 102, 241, 0.7)',
  'rgba(168, 85, 247, 0.7)',
  'rgba(34, 197, 94, 0.7)',
  'rgba(234, 179, 8, 0.7)',
];

export default function ChartBuilderPage() {
  // ─── State ───────────────────────────────────────────────────
  const [charts, setCharts] = useState<Chart[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Builder form state
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [datasetId, setDatasetId] = useState<number | null>(null);
  const [xColumn, setXColumn] = useState('');
  const [yColumn, setYColumn] = useState('');
  const [aggregation, setAggregation] = useState<AggregationType>('COUNT');

  // Preview
  const [previewData, setPreviewData] = useState<ChartApiData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // ─── Derived helpers ─────────────────────────────────────────
  const selectedDataset = useMemo(
    () => datasets.find((d) => d.id === datasetId),
    [datasets, datasetId],
  );

  const columns: ColumnMapping[] = useMemo(
    () => selectedDataset?.column_mapping || [],
    [selectedDataset],
  );

  // ─── Fetch data ──────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get('/charts').then((r) => setCharts(r.data.data)),
      api.get('/datasets').then((r) =>
        setDatasets(r.data.data.filter((d: Dataset) => d.status === 'imported')),
      ),
    ]).finally(() => setLoading(false));
  }, []);

  // ─── Reset builder ──────────────────────────────────────────
  function resetBuilder() {
    setShowBuilder(false);
    setEditingId(null);
    setTitle('');
    setChartType('bar');
    setDatasetId(null);
    setXColumn('');
    setYColumn('');
    setAggregation('COUNT');
    setPreviewData(null);
  }

  // ─── Open edit ──────────────────────────────────────────────
  function openEdit(chart: Chart) {
    setEditingId(chart.id);
    setTitle(chart.title);
    setChartType(chart.chart_type);
    setDatasetId(chart.dataset_id);
    setXColumn(chart.config?.xColumn || '');
    setYColumn(chart.config?.yColumn || '');
    setAggregation(chart.config?.aggregation || 'COUNT');
    setShowBuilder(true);
    setPreviewData(null);
  }

  // ─── Save chart ──────────────────────────────────────────────
  async function handleSave() {
    if (!title.trim() || !datasetId || !xColumn) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        chartType,
        datasetId,
        config: { xColumn, yColumn, aggregation },
      };

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
      // Refresh list with joined data
      api.get('/charts').then((r) => setCharts(r.data.data));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save chart.');
    } finally {
      setSaving(false);
    }
  }

  // ─── Preview ─────────────────────────────────────────────────
  async function handlePreview() {
    if (!datasetId || !xColumn) return;
    setPreviewLoading(true);

    try {
      // Save a temporary chart to get data, or use existing
      let chartId = editingId;

      if (!chartId) {
        // Create temp chart to preview
        const res = await api.post('/charts', {
          title: title.trim() || 'Preview',
          chartType,
          datasetId,
          config: { xColumn, yColumn, aggregation },
        });
        chartId = res.data.data.id;
        // We'll update the editing state
        setEditingId(chartId);
        setCharts((prev) => [res.data.data, ...prev]);
      } else {
        // Update existing with current config
        await api.put(`/charts/${chartId}`, {
          title: title.trim(),
          chartType,
          config: { xColumn, yColumn, aggregation },
        });
      }

      const dataRes = await api.get(`/charts/${chartId}/data`);
      setPreviewData(dataRes.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate preview.');
    } finally {
      setPreviewLoading(false);
    }
  }

  // ─── Delete chart ────────────────────────────────────────────
  async function handleDelete(id: number) {
    if (!confirm('Delete this chart?')) return;
    try {
      await api.delete(`/charts/${id}`);
      setCharts((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert('Failed to delete chart.');
    }
  }

  // ─── Chart.js data builder ──────────────────────────────────
  function buildChartData(data: ChartApiData) {
    const { labels, values } = data;

    return {
      labels,
      datasets: [
        {
          label: yColumn
            ? `${aggregation}(${yColumn}) by ${xColumn}`
            : `COUNT by ${xColumn}`,
          data: values,
          backgroundColor: PALETTE.slice(0, labels.length),
          borderColor: PALETTE.map((c) => c.replace('0.7', '1')).slice(0, labels.length),
          borderWidth: 1,
          fill: chartType === 'radar' || chartType === 'polarArea',
        },
      ],
    };
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: title || 'Chart Preview' },
    },
  };

  // ─── Render chart by type ──────────────────────────────────
  function renderChart(
    type: ChartType,
    data: ChartApiData,
    opts?: Record<string, unknown>,
  ) {
    const chartData = buildChartData(data);
    const finalOptions = { ...chartOptions, ...opts };
    const props = { data: chartData, options: finalOptions };

    switch (type) {
      case 'bar':
        return <Bar {...props} />;
      case 'line':
        return <Line {...props} />;
      case 'pie':
        return <Pie {...props} />;
      case 'doughnut':
        return <Doughnut {...props} />;
      case 'radar':
        return <RadarChart {...props} />;
      case 'polarArea':
        return <PolarArea {...props} />;
      default:
        return <Bar {...props} />;
    }
  }

  // ─── View saved chart ────────────────────────────────────────
  const [viewingChart, setViewingChart] = useState<number | null>(null);
  const [viewData, setViewData] = useState<ChartApiData | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  async function viewChart(chart: Chart) {
    setViewingChart(chart.id);
    setViewLoading(true);
    try {
      const res = await api.get(`/charts/${chart.id}/data`);
      setViewData(res.data.data);
    } catch {
      alert('Failed to load chart data.');
      setViewingChart(null);
    } finally {
      setViewLoading(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-400" />
            Visualizations
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Create charts from your imported datasets
          </p>
        </div>
        <button
          onClick={() => {
            resetBuilder();
            setShowBuilder(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          New Chart
        </button>
      </div>

      {/* ═══ Builder Panel ══════════════════════════════════════ */}
      {showBuilder && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-100">
            {editingId ? 'Edit Chart' : 'Create New Chart'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Chart Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Students by Department"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Chart Type */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Chart Type</label>
              <div className="flex gap-2 flex-wrap">
                {CHART_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setChartType(value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      chartType === value
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dataset */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Dataset</label>
              <select
                value={datasetId || ''}
                onChange={(e) => {
                  setDatasetId(Number(e.target.value) || null);
                  setXColumn('');
                  setYColumn('');
                  setPreviewData(null);
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a dataset...</option>
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.row_count} rows)
                  </option>
                ))}
              </select>
            </div>

            {/* Aggregation */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Aggregation</label>
              <select
                value={aggregation}
                onChange={(e) => {
                  setAggregation(e.target.value as AggregationType);
                  setPreviewData(null);
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AGGREGATIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            {/* X Column */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                X Axis (Group By)
              </label>
              <select
                value={xColumn}
                onChange={(e) => {
                  setXColumn(e.target.value);
                  setPreviewData(null);
                }}
                disabled={!datasetId}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select column...</option>
                {columns.map((c) => (
                  <option key={c.columnName} value={c.columnName}>
                    {c.originalHeader} ({c.columnType})
                  </option>
                ))}
              </select>
            </div>

            {/* Y Column */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Y Axis (Value) — optional for COUNT
              </label>
              <select
                value={yColumn}
                onChange={(e) => {
                  setYColumn(e.target.value);
                  setPreviewData(null);
                }}
                disabled={!datasetId}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">None (use COUNT)</option>
                {columns
                  .filter((c) => c.columnType === 'INTEGER' || c.columnType === 'NUMERIC')
                  .map((c) => (
                    <option key={c.columnName} value={c.columnName}>
                      {c.originalHeader} ({c.columnType})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Preview Area */}
          {previewData && (
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4" style={{ height: 400 }}>
              {renderChart(chartType, previewData)}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              disabled={!datasetId || !xColumn || previewLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {previewLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !datasetId || !xColumn || saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {editingId ? 'Update' : 'Save'}
            </button>
            <button
              onClick={resetBuilder}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ═══ View Modal ════════════════════════════════════════ */}
      {viewingChart && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">
              {charts.find((c) => c.id === viewingChart)?.title}
            </h2>
            <button
              onClick={() => {
                setViewingChart(null);
                setViewData(null);
              }}
              className="text-gray-400 hover:text-gray-200 text-sm"
            >
              Close
            </button>
          </div>
          {viewLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : viewData ? (
            <div style={{ height: 400 }}>
              {renderChart(
                charts.find((c) => c.id === viewingChart)?.chart_type || 'bar',
                viewData,
                {
                  plugins: {
                    title: {
                      display: true,
                      text: charts.find((c) => c.id === viewingChart)?.title || '',
                    },
                    legend: { position: 'top' as const },
                  },
                },
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ═══ Charts Grid ═══════════════════════════════════════ */}
      {charts.length === 0 && !showBuilder ? (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-gray-300 font-medium mb-2">No charts yet</h3>
          <p className="text-gray-500 text-sm mb-4">
            Create your first visualization from an imported dataset.
          </p>
          <button
            onClick={() => setShowBuilder(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Create Chart
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {charts.map((chart) => (
            <div
              key={chart.id}
              className="bg-gray-800 rounded-xl border border-gray-700 p-4 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-100">{chart.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {chart.dataset_name || `Dataset #${chart.dataset_id}`} •{' '}
                    {chart.chart_type}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 font-medium capitalize">
                  {chart.chart_type}
                </span>
              </div>

              <div className="text-xs text-gray-500 mb-3">
                {chart.config?.xColumn && (
                  <span>
                    X: {chart.config.xColumn}
                    {chart.config.yColumn && ` • Y: ${chart.config.aggregation}(${chart.config.yColumn})`}
                    {!chart.config.yColumn && ` • COUNT`}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => viewChart(chart)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-xs transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </button>
                <button
                  onClick={() => openEdit(chart)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-xs transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(chart.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600/10 text-red-400 rounded-lg hover:bg-red-600/20 text-xs transition-colors ml-auto"
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
