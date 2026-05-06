import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Card, Row, Col, Button, Space, Typography, Input, Select, Tag, Spin,
  Empty, Popconfirm, message, theme, Switch, Slider, Collapse, Tooltip,
  Divider,
} from 'antd';import {
  BarChartOutlined, PlusOutlined, DeleteOutlined, EyeOutlined,
  SaveOutlined, CloseOutlined, LineChartOutlined, PieChartOutlined,
  RadarChartOutlined, PictureOutlined, FileTextOutlined,
  CopyOutlined, EditOutlined,
  AreaChartOutlined, FundProjectionScreenOutlined, RadiusSettingOutlined,
  SettingOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, RadialLinearScale, Title as ChartTitle, Tooltip as ChartTooltip, Legend, Filler,
} from 'chart.js';
import {
  Bar, Line, Pie, Doughnut, Radar as RadarChart, PolarArea, Scatter, Bubble,
} from 'react-chartjs-2';
import api from '../lib/api';
import type {
  Chart, ChartType, AggregationType, Dataset, ColumnMapping,
  ChartAdvancedConfig,
} from '../lib/types';

const { Title: AntTitle, Text } = Typography;

interface ChartApiData { labels: string[]; values: number[] }

interface DatasetRow {
  [key: string]: string | number | boolean | null;
}

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, RadialLinearScale, ChartTitle, ChartTooltip, Legend, Filler,
);

const COLOR_PALETTES: Record<string, { label: string; colors: string[] }> = {
  ocean: { label: 'Ocean', colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#1e40af', '#2563eb'] },
  forest: { label: 'Forest', colors: ['#16a34a', '#4ade80', '#86efac', '#15803d', '#166534', '#22c55e'] },
  sunset: { label: 'Sunset', colors: ['#ea580c', '#fb923c', '#fdba74', '#c2410c', '#9a3412', '#f97316'] },
  lavender: { label: 'Lavender', colors: ['#7c3aed', '#a78bfa', '#c4b5fd', '#6d28d9', '#5b21b6', '#8b5cf6'] },
  pastel: { label: 'Pastel', colors: ['#fbbf24', '#a78bfa', '#6ee7b7', '#f87171', '#60a5fa', '#fb923c'] },
  vibrant: { label: 'Vibrant', colors: ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'] },
  earth: { label: 'Earth', colors: ['#92400e', '#b45309', '#d97706', '#f59e0b', '#78350f', '#a16207'] },
  mono: { label: 'Mono', colors: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'] },
};

const CHART_TYPES: { value: ChartType; label: string; icon: React.ReactNode }[] = [
  { value: 'bar', label: 'Bar', icon: <BarChartOutlined /> },
  { value: 'horizontalBar', label: 'H-Bar', icon: <BarChartOutlined style={{ transform: 'rotate(90deg)' }} /> },
  { value: 'line', label: 'Line', icon: <LineChartOutlined /> },
  { value: 'area', label: 'Area', icon: <AreaChartOutlined /> },
  { value: 'pie', label: 'Pie', icon: <PieChartOutlined /> },
  { value: 'doughnut', label: 'Doughnut', icon: <PieChartOutlined style={{ opacity: 0.6 }} /> },
  { value: 'radar', label: 'Radar', icon: <RadarChartOutlined /> },
{ value: 'polarArea', label: 'Polar Area', icon: <RadiusSettingOutlined /> },
{ value: 'scatter', label: 'Scatter', icon: <FundProjectionScreenOutlined /> },
{ value: 'bubble', label: 'Bubble', icon: <RadiusSettingOutlined style={{ fontSize: 18 }} /> },
];

const AGGREGATIONS: { value: AggregationType; label: string }[] = [
  { value: 'COUNT', label: 'Count' },
  { value: 'SUM', label: 'Sum' },
  { value: 'AVG', label: 'Average' },
  { value: 'MIN', label: 'Minimum' },
  { value: 'MAX', label: 'Maximum' },
];

const LEGEND_POSITIONS = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

function isNumericColumn(ct: string): boolean {
  return ct === 'INTEGER' || ct === 'NUMERIC';
}

function expandPalette(palette: string[], count: number): string[] {
  if (count <= palette.length) return palette.slice(0, count);
  const result: string[] = [];
  for (let i = 0; i < count; i++) result.push(palette[i % palette.length]);
  return result;
}

function aggregateRows(
  rows: DatasetRow[],
  xCol: string,
  yCol: string | null,
  agg: AggregationType,
): { labels: string[]; values: number[] } {
  const groups = new Map<string, number[]>();
  for (const row of rows) {
    const key = String(row[xCol] ?? '(null)');
    if (!groups.has(key)) groups.set(key, []);
    if (yCol) {
      const raw = row[yCol];
      const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
      if (!isNaN(num)) groups.get(key)!.push(num);
    } else {
      groups.get(key)!.push(1);
    }
  }
  const labels: string[] = [];
  const values: number[] = [];
  for (const [label, nums] of groups) {
    labels.push(label);
    switch (agg) {
      case 'COUNT': values.push(nums.length); break;
      case 'SUM': values.push(nums.reduce((a, b) => a + b, 0)); break;
      case 'AVG': values.push(nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0); break;
      case 'MIN': values.push(nums.length ? Math.min(...nums) : 0); break;
      case 'MAX': values.push(nums.length ? Math.max(...nums) : 0); break;
    }
  }
  return { labels, values };
}

function buildScatterData(rows: DatasetRow[], xCol: string, yCol: string) {
  const points: { x: number; y: number }[] = [];
  for (const row of rows) {
    const x = typeof row[xCol] === 'number' ? row[xCol] as number : parseFloat(String(row[xCol]));
    const y = typeof row[yCol] === 'number' ? row[yCol] as number : parseFloat(String(row[yCol]));
    if (!isNaN(x) && !isNaN(y)) points.push({ x, y });
  }
  return points;
}

function buildBubbleData(rows: DatasetRow[], xCol: string, yCol: string, sizeCol: string | null) {
  const points: { x: number; y: number; r: number }[] = [];
  for (const row of rows) {
    const x = typeof row[xCol] === 'number' ? row[xCol] as number : parseFloat(String(row[xCol]));
    const y = typeof row[yCol] === 'number' ? row[yCol] as number : parseFloat(String(row[yCol]));
    if (isNaN(x) || isNaN(y)) continue;
    let r = 6;
    if (sizeCol) {
      const raw = typeof row[sizeCol] === 'number' ? row[sizeCol] as number : parseFloat(String(row[sizeCol]));
      if (!isNaN(raw) && raw > 0) r = Math.min(Math.max(raw, 2), 30);
    }
    points.push({ x, y, r });
  }
  return points;
}

function buildChartData(
  type: ChartType,
  data: ChartApiData | null,
  scatterPoints: { x: number; y: number }[] | null,
  bubblePoints: { x: number; y: number; r: number }[] | null,
  xLabel: string,
  yLabel: string,
  agg: string,
  palette: string[],
  adv: ChartAdvancedConfig,
) {
  const bgColors = data ? expandPalette(palette, data.labels.length) : palette;
  const borderColors = bgColors.map((c) => c);

  const isArea = type === 'area';
  const isScatter = type === 'scatter';
  const isBubble = type === 'bubble';

  const label = yLabel ? `${agg}(${yLabel}) by ${xLabel}` : `COUNT by ${xLabel}`;

  if (isScatter && scatterPoints) {
    return {
      datasets: [{
        label,
        data: scatterPoints,
        backgroundColor: palette[0] + '99',
        borderColor: palette[0],
        borderWidth: adv.borderWidth ?? 1,
        pointRadius: adv.pointRadius ?? 4,
      }],
    };
  }

  if (isBubble && bubblePoints) {
    return {
      datasets: [{
        label,
        data: bubblePoints,
        backgroundColor: palette[0] + '99',
        borderColor: palette[0],
        borderWidth: adv.borderWidth ?? 1,
      }],
    };
  }

  if (!data) return { labels: [] as string[], datasets: [] };

  return {
    labels: data.labels,
    datasets: [{
      label,
      data: data.values,
      backgroundColor: bgColors.map((c) => {
        if (isArea || type === 'line' || type === 'radar') return c + '40';
        return c + 'CC';
      }),
      borderColor: borderColors,
      borderWidth: adv.borderWidth ?? 1,
      fill: isArea || (adv.fill ?? false),
      tension: adv.tension ?? 0.3,
      pointRadius: adv.pointRadius ?? 3,
    }],
  };
}

function buildChartOptions(type: ChartType, title: string, adv: ChartAdvancedConfig) {
  const isHorizontal = type === 'horizontalBar';
  const isScatter = type === 'scatter';
  const isBubble = type === 'bubble';

  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: isHorizontal ? ('y' as const) : ('x' as const),
    scales: (type === 'pie' || type === 'doughnut' || type === 'polarArea' || type === 'radar')
      ? (type === 'radar' ? { r: { beginAtZero: true, grid: { display: adv.showGrid ?? true } } } : undefined)
      : {
          x: {
            display: adv.showGrid ?? true,
            grid: { display: adv.showGrid ?? true },
            title: { display: true, text: isScatter || isBubble ? 'X' : 'X Axis' },
          },
          y: {
            display: adv.showGrid ?? true,
            grid: { display: adv.showGrid ?? true },
            title: { display: true, text: 'Y Axis' },
            beginAtZero: true,
          },
        },
    plugins: {
      legend: {
        display: adv.showLegend ?? true,
        position: (adv.legendPosition ?? 'top') as 'top' | 'bottom' | 'left' | 'right',
      },
      title: {
        display: !!title,
        text: title || 'Preview',
      },
      tooltip: { enabled: true },
    },
  };
}

function renderChartComponent(
  type: ChartType,
  chartData: Record<string, unknown>,
  chartOptions: Record<string, unknown>,
) {
  switch (type) {
    case 'bar':
    case 'horizontalBar':
      return <Bar data={chartData} options={chartOptions} />;
    case 'line':
      return <Line data={chartData} options={chartOptions} />;
    case 'area':
      return <Line data={chartData} options={chartOptions} />;
    case 'pie':
      return <Pie data={chartData} options={chartOptions} />;
    case 'doughnut':
      return <Doughnut data={chartData} options={chartOptions} />;
    case 'radar':
      return <RadarChart data={chartData} options={chartOptions} />;
    case 'polarArea':
      return <PolarArea data={chartData} options={chartOptions} />;
    case 'scatter':
      return <Scatter data={chartData} options={chartOptions} />;
    case 'bubble':
      return <Bubble data={chartData} options={chartOptions} />;
    default:
      return <Bar data={chartData} options={chartOptions} />;
  }
}

const defaultAdvanced: ChartAdvancedConfig = {
  showLegend: true,
  showGrid: true,
  showValues: false,
  legendPosition: 'top',
  tension: 0.3,
  fill: false,
  borderWidth: 1,
  pointRadius: 3,
  colorScheme: 'ocean',
  maxDataPoints: 100,
};

export default function ChartBuilderPage() {
  const { token } = theme.useToken();
  const chartRef = useRef<HTMLDivElement>(null);

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
  const [advanced, setAdvanced] = useState<ChartAdvancedConfig>({ ...defaultAdvanced });

  const [previewData, setPreviewData] = useState<ChartApiData | null>(null);
  const [previewScatter, setPreviewScatter] = useState<{ x: number; y: number }[] | null>(null);
  const [previewBubble, setPreviewBubble] = useState<{ x: number; y: number; r: number }[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const [viewingChart, setViewingChart] = useState<Chart | null>(null);
  const [viewData, setViewData] = useState<ChartApiData | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const selectedDataset = useMemo(() => datasets.find((d) => d.id === datasetId), [datasets, datasetId]);
  const columns: ColumnMapping[] = useMemo(() => selectedDataset?.column_mapping || [], [selectedDataset]);
  const numericColumns = useMemo(() => columns.filter((c) => isNumericColumn(c.columnType)), [columns]);
  const activePalette = COLOR_PALETTES[advanced.colorScheme || 'ocean']?.colors || COLOR_PALETTES.ocean.colors;

  useEffect(() => {
    Promise.all([
      api.get('/charts').then((r) => setCharts(r.data.data)),
      api.get('/datasets').then((r) => setDatasets(r.data.data.filter((d: Dataset) => d.status === 'imported'))),
    ]).finally(() => setLoading(false));
  }, []);

  const resetBuilder = useCallback(() => {
    setShowBuilder(false);
    setEditingId(null);
    setTitle('');
    setChartType('bar');
    setDatasetId(null);
    setXColumn('');
    setYColumn('');
    setAggregation('COUNT');
    setAdvanced({ ...defaultAdvanced });
    setPreviewData(null);
    setPreviewScatter(null);
    setPreviewBubble(null);
    setPreviewVisible(false);
  }, []);

  const openEdit = useCallback((chart: Chart) => {
    setEditingId(chart.id);
    setTitle(chart.title);
    setChartType(chart.chart_type);
    setDatasetId(chart.dataset_id ?? null);
    setXColumn(chart.config?.xColumn || '');
    setYColumn(chart.config?.yColumn || '');
    setAggregation(chart.config?.aggregation || 'COUNT');
    setAdvanced({
      showLegend: chart.config?.showLegend ?? true,
      showGrid: chart.config?.showGrid ?? true,
      showValues: chart.config?.showValues ?? false,
      legendPosition: chart.config?.legendPosition ?? 'top',
      tension: chart.config?.tension ?? 0.3,
      fill: chart.chart_type === 'area' ? true : (chart.config?.fill ?? false),
      borderWidth: chart.config?.borderWidth ?? 1,
      pointRadius: chart.config?.pointRadius ?? 3,
      colorScheme: chart.config?.colorScheme ?? 'ocean',
      maxDataPoints: chart.config?.maxDataPoints ?? 100,
    });
    setShowBuilder(true);
    setPreviewData(null);
    setPreviewScatter(null);
    setPreviewBubble(null);
    setPreviewVisible(false);
  }, []);

  const handlePreview = useCallback(async () => {
    if (!datasetId || !xColumn) return;
    if ((chartType === 'scatter' || chartType === 'bubble') && !yColumn) {
      message.warning('Y Axis column is required for scatter/bubble charts.');
      return;
    }
    setPreviewLoading(true);
    setPreviewData(null);
    setPreviewScatter(null);
    setPreviewBubble(null);
    try {
      const maxPts = advanced.maxDataPoints ?? 100;
      const res = await api.get(`/datasets/${datasetId}/data`, { params: { limit: maxPts } });
      const rows: DatasetRow[] = res.data.data || res.data.rows || [];

      if (chartType === 'scatter') {
        setPreviewScatter(buildScatterData(rows, xColumn, yColumn));
      } else if (chartType === 'bubble') {
        setPreviewBubble(buildBubbleData(rows, xColumn, yColumn, null));
      } else {
        setPreviewData(aggregateRows(rows, xColumn, yColumn || null, aggregation));
      }
      setPreviewVisible(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate preview.';
      message.error(msg);
    } finally {
      setPreviewLoading(false);
    }
  }, [datasetId, xColumn, yColumn, chartType, aggregation, advanced.maxDataPoints]);

  const handleSave = useCallback(async () => {
    if (!title.trim() || !datasetId || !xColumn) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        chartType,
        datasetId,
        config: {
          xColumn,
          yColumn,
          aggregation,
          showLegend: advanced.showLegend,
          showGrid: advanced.showGrid,
          showValues: advanced.showValues,
          legendPosition: advanced.legendPosition,
          tension: advanced.tension,
          fill: chartType === 'area' ? true : advanced.fill,
          borderWidth: advanced.borderWidth,
          pointRadius: advanced.pointRadius,
          colorScheme: advanced.colorScheme,
          maxDataPoints: advanced.maxDataPoints,
          colors: activePalette,
        },
      };
      if (editingId) {
        const res = await api.put(`/charts/${editingId}`, payload);
        const saved = res.data.data;
        setCharts((prev) => prev.map((c) => (c.id === editingId ? saved : c)));
        message.success('Chart updated.');
      } else {
        const res = await api.post('/charts', payload);
        const saved = res.data.data;
        setCharts((prev) => [saved, ...prev]);
        message.success('Chart saved.');
      }
      resetBuilder();
      api.get('/charts').then((r) => setCharts(r.data.data));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save chart.';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  }, [title, datasetId, xColumn, chartType, editingId, yColumn, aggregation, advanced, activePalette, resetBuilder]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await api.delete(`/charts/${id}`);
      setCharts((prev) => prev.filter((c) => c.id !== id));
      message.success('Chart deleted.');
    } catch {
      message.error('Failed to delete chart.');
    }
  }, []);

  const handleDuplicate = useCallback(async (chart: Chart) => {
    try {
      const res = await api.post('/charts', {
        title: `${chart.title} (Copy)`,
        chartType: chart.chart_type,
        datasetId: chart.dataset_id,
        config: chart.config,
      });
      setCharts((prev) => [res.data.data, ...prev]);
      message.success('Chart duplicated.');
    } catch {
      message.error('Failed to duplicate chart.');
    }
  }, []);

  const viewChart = useCallback(async (chart: Chart) => {
    setViewingChart(chart);
    setViewLoading(true);
    try {
      const res = await api.get(`/charts/${chart.id}/data`);
      setViewData(res.data.data);
    } catch {
      message.error('Failed to load chart data.');
      setViewingChart(null);
    } finally {
      setViewLoading(false);
    }
  }, []);

  const exportPng = useCallback(() => {
    const canvas = chartRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) { message.warning('No chart to export.'); return; }
    const chartObj = viewingChart || (editingId ? charts.find((c) => c.id === editingId) : null);
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const ctx = tmp.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    ctx.drawImage(canvas, 0, 0);
    const a = document.createElement('a');
    a.href = tmp.toDataURL('image/png');
    a.download = `${(chartObj?.title || 'chart').replace(/\s+/g, '_')}.png`;
    a.click();
  }, [viewingChart, editingId, charts]);

  const exportJson = useCallback(() => {
    const chartObj = viewingChart;
    if (!chartObj || !viewData) { message.warning('No chart data to export.'); return; }
    const payload = {
      title: chartObj.title,
      chartType: chartObj.chart_type,
      config: chartObj.config,
      data: viewData,
      exportedAt: new Date().toISOString(),
      source: 'ISET Observatory',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(chartObj.title || 'chart').replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [viewingChart, viewData]);

  const exportPreviewPng = useCallback(() => {
    const canvas = chartRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) { message.warning('No preview to export.'); return; }
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const ctx = tmp.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    ctx.drawImage(canvas, 0, 0);
    const a = document.createElement('a');
    a.href = tmp.toDataURL('image/png');
    a.download = `${(title || 'chart_preview').replace(/\s+/g, '_')}.png`;
    a.click();
  }, [title]);

  const exportPreviewJson = useCallback(() => {
    if (!previewData && !previewScatter && !previewBubble) {
      message.warning('No preview data to export.');
      return;
    }
    const payload = {
      title: title || 'Untitled',
      chartType,
      config: { xColumn, yColumn, aggregation, ...advanced },
      data: previewData || { scatter: previewScatter, bubble: previewBubble },
      exportedAt: new Date().toISOString(),
      source: 'ISET Observatory',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(title || 'chart_preview').replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [title, chartType, xColumn, yColumn, aggregation, advanced, previewData, previewScatter, previewBubble]);

  const updateAdv = useCallback(<K extends keyof ChartAdvancedConfig>(key: K, val: ChartAdvancedConfig[K]) => {
    setAdvanced((prev) => ({ ...prev, [key]: val }));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <Spin size="large" />
      </div>
    );
  }

  const renderPreviewChart = (forView: boolean = false) => {
    let cType: ChartType;
    let cData: ChartApiData | null;
    let cScatter: { x: number; y: number }[] | null;
    let cBubble: { x: number; y: number; r: number }[] | null;
    let cTitle: string;
    let cXCol: string;
    let cYCol: string;
    let cAgg: string;
    let cAdv: ChartAdvancedConfig;
    let cPalette: string[];

    if (forView && viewingChart) {
      cType = viewingChart.chart_type;
      cData = viewData;
      cScatter = null;
      cBubble = null;
      cTitle = viewingChart.title;
      cXCol = viewingChart.config?.xColumn || '';
      cYCol = viewingChart.config?.yColumn || '';
      cAgg = viewingChart.config?.aggregation || 'COUNT';
      cAdv = {
        showLegend: viewingChart.config?.showLegend ?? true,
        showGrid: viewingChart.config?.showGrid ?? true,
        showValues: viewingChart.config?.showValues ?? false,
        legendPosition: viewingChart.config?.legendPosition ?? 'top',
        tension: viewingChart.config?.tension ?? 0.3,
        fill: cType === 'area' ? true : (viewingChart.config?.fill ?? false),
        borderWidth: viewingChart.config?.borderWidth ?? 1,
        pointRadius: viewingChart.config?.pointRadius ?? 3,
        colorScheme: viewingChart.config?.colorScheme ?? 'ocean',
        maxDataPoints: viewingChart.config?.maxDataPoints ?? 100,
      };
      const scheme = viewingChart.config?.colorScheme ?? 'ocean';
      cPalette = COLOR_PALETTES[scheme]?.colors || COLOR_PALETTES.ocean.colors;
    } else {
      cType = chartType;
      cData = previewData;
      cScatter = previewScatter;
      cBubble = previewBubble;
      cTitle = title;
      cXCol = xColumn;
      cYCol = yColumn;
      cAgg = aggregation;
      cAdv = advanced;
      cPalette = activePalette;
    }

    const data = buildChartData(cType, cData, cScatter, cBubble, cXCol, cYCol, cAgg, cPalette, cAdv);
    const options = buildChartOptions(cType, cTitle, cAdv);
    return renderChartComponent(cType, data, options);
  };

  const builderPanel = (
    <Card
      title={
        <Space>
          <AppstoreOutlined style={{ color: token.colorPrimary }} />
          {editingId ? 'Edit Chart' : 'Chart Builder'}
        </Space>
      }
      extra={<Button type="text" icon={<CloseOutlined />} onClick={resetBuilder} size="small" />}
      style={{ height: '100%' }}
      styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: 4 } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>Chart Title</Text>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Students by Department"
          />
        </div>

        <div>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>Chart Type</Text>
          <Row gutter={[8, 8]}>
            {CHART_TYPES.map(({ value, label, icon }) => (
              <Col xs={8} sm={6} key={value}>
                <div
                  onClick={() => setChartType(value)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    padding: '10px 4px',
                    borderRadius: 8,
                    border: `2px solid ${chartType === value ? token.colorPrimary : token.colorBorder}`,
                    background: chartType === value ? token.colorPrimaryBg : token.colorBgContainer,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontSize: 18, color: chartType === value ? token.colorPrimary : token.colorTextSecondary }}>{icon}</span>
                  <span style={{ color: chartType === value ? token.colorPrimary : token.colorText }}>{label}</span>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        <div>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>Dataset</Text>
          <Select
            value={datasetId ?? undefined}
            onChange={(v) => {
              setDatasetId(v);
              setXColumn('');
              setYColumn('');
              setPreviewData(null);
              setPreviewScatter(null);
              setPreviewBubble(null);
              setPreviewVisible(false);
            }}
            style={{ width: '100%' }}
            placeholder="Select a dataset..."
            options={datasets.map((d) => ({ value: d.id, label: `${d.name} (${d.row_count} rows)` }))}
          />
        </div>

        <Row gutter={12}>
          <Col span={12}>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>X Axis</Text>
            <Select
              value={xColumn || undefined}
              onChange={(v) => {
                setXColumn(v);
                setPreviewData(null);
                setPreviewScatter(null);
                setPreviewBubble(null);
                setPreviewVisible(false);
              }}
              style={{ width: '100%' }}
              disabled={!datasetId}
              placeholder="Select column..."
              options={columns.map((c) => ({
                value: c.columnName,
                label: `${c.originalHeader} (${c.columnType})`,
              }))}
            />
          </Col>
          <Col span={12}>
            <Tooltip title={chartType === 'scatter' || chartType === 'bubble' ? 'Required for scatter/bubble' : 'Optional for COUNT'}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>
                Y Axis {chartType === 'scatter' || chartType === 'bubble' ? '' : '(numeric)'}
              </Text>
            </Tooltip>
            <Select
              value={yColumn || undefined}
              onChange={(v) => {
                setYColumn(v);
                setPreviewData(null);
                setPreviewScatter(null);
                setPreviewBubble(null);
                setPreviewVisible(false);
              }}
              style={{ width: '100%' }}
              disabled={!datasetId}
              placeholder={chartType === 'scatter' || chartType === 'bubble' ? 'Required' : 'None (use COUNT)'}
              allowClear
              options={(chartType === 'scatter' || chartType === 'bubble' ? columns : numericColumns).map((c) => ({
                value: c.columnName,
                label: `${c.originalHeader} (${c.columnType})`,
              }))}
            />
          </Col>
        </Row>

        {chartType !== 'scatter' && chartType !== 'bubble' && (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>Aggregation</Text>
            <Select
              value={aggregation}
              onChange={(v) => {
                setAggregation(v);
                setPreviewData(null);
                setPreviewVisible(false);
              }}
              style={{ width: '100%' }}
              options={AGGREGATIONS.map((a) => ({ value: a.value, label: a.label }))}
            />
          </div>
        )}

        <Collapse
          ghost
          size="small"
          items={[{
            key: 'advanced',
            label: <Space><SettingOutlined /><Text strong>Advanced Configuration</Text></Space>,
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Row gutter={12}>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Legend</Text>
                    <div><Switch size="small" checked={advanced.showLegend ?? true} onChange={(v) => updateAdv('showLegend', v)} /></div>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Grid</Text>
                    <div><Switch size="small" checked={advanced.showGrid ?? true} onChange={(v) => updateAdv('showGrid', v)} /></div>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Values</Text>
                    <div>
                      <Tooltip title="Data labels (experimental)">
                        <Switch size="small" checked={advanced.showValues ?? false} onChange={(v) => updateAdv('showValues', v)} />
                      </Tooltip>
                    </div>
                  </Col>
                </Row>

                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Legend Position</Text>
                  <Select
                    value={advanced.legendPosition ?? 'top'}
                    onChange={(v) => updateAdv('legendPosition', v)}
                    style={{ width: '100%' }}
                    size="small"
                    options={LEGEND_POSITIONS}
                  />
                </div>

                {(chartType === 'line' || chartType === 'area' || chartType === 'radar') && (
                  <>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        Line Tension: {advanced.tension ?? 0.3}
                      </Text>
                      <Slider
                        min={0} max={1} step={0.05}
                        value={advanced.tension ?? 0.3}
                        onChange={(v) => updateAdv('tension', v)}
                      />
                    </div>
                    {chartType === 'line' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Fill (Area)</Text>
                        <Switch size="small" checked={advanced.fill ?? false} onChange={(v) => updateAdv('fill', v)} />
                      </div>
                    )}
                  </>
                )}

                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Border Width: {advanced.borderWidth ?? 1}
                  </Text>
                  <Slider
                    min={0} max={5} step={1}
                    value={advanced.borderWidth ?? 1}
                    onChange={(v) => updateAdv('borderWidth', v)}
                  />
                </div>

                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Point Radius: {advanced.pointRadius ?? 3}
                  </Text>
                  <Slider
                    min={0} max={10} step={1}
                    value={advanced.pointRadius ?? 3}
                    onChange={(v) => updateAdv('pointRadius', v)}
                  />
                </div>

                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Color Palette</Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(COLOR_PALETTES).map(([key, pal]) => (
                      <Tooltip title={pal.label} key={key}>
                        <div
                          onClick={() => updateAdv('colorScheme', key)}
                          style={{
                            display: 'flex',
                            gap: 2,
                            padding: '4px 6px',
                            borderRadius: 6,
                            border: `2px solid ${advanced.colorScheme === key ? token.colorPrimary : 'transparent'}`,
                            cursor: 'pointer',
                            background: advanced.colorScheme === key ? token.colorPrimaryBg : 'transparent',
                          }}
                        >
                          {pal.colors.slice(0, 5).map((c, i) => (
                            <div key={i} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: c }} />
                          ))}
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                </div>

                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Max Data Points: {advanced.maxDataPoints ?? 100}
                  </Text>
                  <Slider
                    min={10} max={1000} step={10}
                    value={advanced.maxDataPoints ?? 100}
                    onChange={(v) => updateAdv('maxDataPoints', v)}
                  />
                </div>
              </div>
            ),
          }]}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            icon={<EyeOutlined />}
            onClick={handlePreview}
            disabled={!datasetId || !xColumn || previewLoading}
            loading={previewLoading}
          >
            Preview
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={!title.trim() || !datasetId || !xColumn || saving}
            loading={saving}
          >
            {editingId ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>
    </Card>
  );

  const previewPanel = (
    <Card
      title={
        <Space>
          <BarChartOutlined style={{ color: token.colorPrimary }} />
          Preview
        </Space>
      }
      extra={
        previewVisible ? (
          <Space size={4}>
            <Tooltip title="Export PNG">
              <Button size="small" icon={<PictureOutlined />} onClick={exportPreviewPng} />
            </Tooltip>
            <Tooltip title="Export JSON">
              <Button size="small" icon={<FileTextOutlined />} onClick={exportPreviewJson} />
            </Tooltip>
          </Space>
        ) : null
      }
      style={{ height: '100%' }}
    >
      {previewVisible ? (
        <div ref={chartRef} style={{ height: 420, position: 'relative' }}>
          {renderPreviewChart(false)}
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 420,
          border: `2px dashed ${token.colorBorder}`,
          borderRadius: 8,
        }}>
          <Empty
            description="Configure and preview your chart"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      )}
    </Card>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <Space size="middle">
          <BarChartOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
          <div>
            <AntTitle level={3} style={{ margin: 0 }}>Visualizations</AntTitle>
            <Text type="secondary">Create charts from your imported datasets</Text>
          </div>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { resetBuilder(); setShowBuilder(true); }}
        >
          New Chart
        </Button>
      </div>

      {viewingChart && (
        <Card
          title={viewingChart.title}
          extra={
            <Space>
              {viewData && !viewLoading && (
                <>
                  <Button size="small" icon={<PictureOutlined />} onClick={exportPng}>PNG</Button>
                  <Button size="small" icon={<FileTextOutlined />} onClick={exportJson}>JSON</Button>
                </>
              )}
              <Button size="small" onClick={() => { setViewingChart(null); setViewData(null); }}>Close</Button>
            </Space>
          }
        >
          {viewLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
              <Spin size="large" />
            </div>
          ) : viewData ? (
            <div ref={chartRef} style={{ height: 400 }}>
              {renderPreviewChart(true)}
            </div>
          ) : null}
        </Card>
      )}

      {showBuilder && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10} xl={9}>
            {builderPanel}
          </Col>
          <Col xs={24} lg={14} xl={15}>
            {previewPanel}
          </Col>
        </Row>
      )}

      <Divider orientation="left" style={{ margin: 0 }}>
        <Space>
          <AppstoreOutlined />
          <span>Saved Charts</span>
          <Tag color={token.colorPrimary}>{charts.length}</Tag>
        </Space>
      </Divider>

      {charts.length === 0 && !showBuilder ? (
        <Empty
          description="No charts yet. Create your first visualization from an imported dataset."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => { resetBuilder(); setShowBuilder(true); }}>Create Chart</Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {charts.map((chart) => {
            const scheme = chart.config?.colorScheme ?? 'ocean';
            const palColors = COLOR_PALETTES[scheme]?.colors || COLOR_PALETTES.ocean.colors;
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={chart.id}>
                <Card
                  hoverable
                  style={{ height: '100%' }}
                  styles={{ body: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong ellipsis style={{ display: 'block', fontSize: 15 }}>{chart.title}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {chart.dataset_name ? `${chart.dataset_name}` : 'AI Query'}
                        </Text>
                      </div>
                      <Tag
                        color={palColors[0]}
                        style={{ marginLeft: 8, flexShrink: 0 }}
                      >
                        {chart.chart_type}
                      </Tag>
                    </div>
                    <div style={{ margin: '8px 0' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {chart.config?.sql
                          ? <Text code style={{ fontSize: 11 }}>SQL: {chart.config.sql.slice(0, 40)}...</Text>
                          : chart.config?.xColumn && (
                            <>X: {chart.config.xColumn}{chart.config?.yColumn ? ` · Y: ${chart.config.aggregation}(${chart.config.yColumn})` : ' · COUNT'}</>
                          )}
                      </Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                      Updated {new Date(chart.updated_at).toLocaleDateString()}
                    </Text>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Tooltip title="View">
                      <Button size="small" icon={<EyeOutlined />} onClick={() => viewChart(chart)} />
                    </Tooltip>
                    {chart.dataset_id && (
                      <Tooltip title="Edit">
                        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(chart)} />
                      </Tooltip>
                    )}
                    <Tooltip title="Duplicate">
                      <Button size="small" icon={<CopyOutlined />} onClick={() => handleDuplicate(chart)} />
                    </Tooltip>
                    <Popconfirm
                      title="Delete this chart?"
                      description="This action cannot be undone."
                      onConfirm={() => handleDelete(chart.id)}
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                    >
                      <Tooltip title="Delete">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Tooltip>
                    </Popconfirm>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
