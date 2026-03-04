import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Save,
  Loader2,
  Trash2,
  GripVertical,
  ArrowLeft,
  BarChart3,
  Download,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import type { Dashboard, Chart, ChartType, DashboardLayoutItem } from '../lib/types';

interface ChartApiData {
  labels: string[];
  values: number[];
}

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler,
);

const PALETTE = [
  'rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)', 'rgba(245, 158, 11, 0.7)',
  'rgba(239, 68, 68, 0.7)', 'rgba(139, 92, 246, 0.7)', 'rgba(236, 72, 153, 0.7)',
  'rgba(20, 184, 166, 0.7)', 'rgba(249, 115, 22, 0.7)', 'rgba(99, 102, 241, 0.7)',
  'rgba(168, 85, 247, 0.7)', 'rgba(34, 197, 94, 0.7)', 'rgba(234, 179, 8, 0.7)',
];

// ─── Sortable Chart Item ───────────────────────────────────────

function SortableChartCard({
  chartId,
  chart,
  chartData,
  onRemove,
}: {
  chartId: number;
  chart?: Chart;
  chartData?: ChartApiData;
  onRemove: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: chartId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function renderMiniChart(type: ChartType, data: ChartApiData) {
    const chartJsData = {
      labels: data.labels,
      datasets: [
        {
          label: chart?.title || '',
          data: data.values,
          backgroundColor: PALETTE.slice(0, data.labels.length),
          borderColor: PALETTE.map((c) => c.replace('0.7', '1')).slice(0, data.labels.length),
          borderWidth: 1,
          fill: type === 'radar' || type === 'polarArea',
        },
      ],
    };

    const opts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: false },
      },
      scales: type === 'pie' || type === 'doughnut' || type === 'radar' || type === 'polarArea'
        ? undefined
        : {
            x: { ticks: { display: true, maxTicksLimit: 6, font: { size: 10 } }, grid: { display: false } },
            y: { ticks: { display: true, font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
          },
    };

    const props = { data: chartJsData, options: opts };
    switch (type) {
      case 'bar': return <Bar {...props} />;
      case 'line': return <Line {...props} />;
      case 'pie': return <Pie {...props} />;
      case 'doughnut': return <Doughnut {...props} />;
      case 'radar': return <RadarChart {...props} />;
      case 'polarArea': return <PolarArea {...props} />;
      default: return <Bar {...props} />;
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-800 rounded-xl border border-gray-700 p-4 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-center gap-2 mb-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-500 hover:text-gray-300"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-medium text-gray-100 flex-1 truncate">
          {chart?.title || `Chart #${chartId}`}
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 capitalize">
          {chart?.chart_type || 'bar'}
        </span>
        <button
          onClick={() => onRemove(chartId)}
          className="text-gray-500 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div style={{ height: 220 }}>
        {chartData ? (
          renderMiniChart(chart?.chart_type || 'bar', chartData)
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function DashboardCanvasPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [charts, setCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Active dashboard
  const [activeDashboard, setActiveDashboard] = useState<Dashboard | null>(null);
  const [layoutItems, setLayoutItems] = useState<DashboardLayoutItem[]>([]);
  const [chartDataMap, setChartDataMap] = useState<Record<number, ChartApiData>>({});

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Picker
  const [showPicker, setShowPicker] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ─── Fetch data ──────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get('/dashboards').then((r) => setDashboards(r.data.data)),
      api.get('/charts').then((r) => setCharts(r.data.data)),
    ]).finally(() => setLoading(false));
  }, []);

  // ─── Load chart data when layout changes ─────────────────────
  const loadChartData = useCallback(
    async (items: DashboardLayoutItem[]) => {
      const needed = items.filter((it) => !chartDataMap[it.chartId]);
      if (needed.length === 0) return;

      const results: Record<number, ChartApiData> = {};
      await Promise.all(
        needed.map(async (it) => {
          try {
            const res = await api.get(`/charts/${it.chartId}/data`);
            results[it.chartId] = res.data.data;
          } catch {
            results[it.chartId] = { labels: [], values: [] };
          }
        }),
      );
      setChartDataMap((prev) => ({ ...prev, ...results }));
    },
    [chartDataMap],
  );

  // ─── Open dashboard ─────────────────────────────────────────
  async function openDashboard(dashboard: Dashboard) {
    setActiveDashboard(dashboard);
    const items: DashboardLayoutItem[] = Array.isArray(dashboard.layout)
      ? dashboard.layout
      : [];
    setLayoutItems(items);
    loadChartData(items);
  }

  // ─── Create dashboard ───────────────────────────────────────
  async function handleCreate() {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/dashboards', {
        title: newTitle.trim(),
        description: newDescription.trim(),
      });
      const created = res.data.data;
      setDashboards((prev) => [created, ...prev]);
      setShowCreate(false);
      setNewTitle('');
      setNewDescription('');
      openDashboard(created);
    } catch {
      alert('Failed to create dashboard.');
    } finally {
      setSaving(false);
    }
  }

  // ─── Save layout ────────────────────────────────────────────
  async function saveLayout() {
    if (!activeDashboard) return;
    setSaving(true);
    try {
      await api.put(`/dashboards/${activeDashboard.id}`, { layout: layoutItems });
      // Update local state
      setDashboards((prev) =>
        prev.map((d) =>
          d.id === activeDashboard.id ? { ...d, layout: layoutItems } : d,
        ),
      );
    } catch {
      alert('Failed to save layout.');
    } finally {
      setSaving(false);
    }
  }

  // ─── Add chart to layout ────────────────────────────────────
  function addChart(chartId: number) {
    if (layoutItems.some((it) => it.chartId === chartId)) return;
    const newItem: DashboardLayoutItem = {
      chartId,
      x: 0,
      y: layoutItems.length,
      w: 6,
      h: 4,
    };
    const updated = [...layoutItems, newItem];
    setLayoutItems(updated);
    loadChartData(updated);
    setShowPicker(false);
  }

  // ─── Remove chart from layout ──────────────────────────────
  function removeChart(chartId: number) {
    setLayoutItems((prev) => prev.filter((it) => it.chartId !== chartId));
  }

  // ─── Drag and drop reorder ─────────────────────────────────
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLayoutItems((items) => {
      const oldIndex = items.findIndex((it) => it.chartId === active.id);
      const newIndex = items.findIndex((it) => it.chartId === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  // ─── Delete dashboard ──────────────────────────────────────
  async function deleteDashboard(id: number) {
    if (!confirm('Delete this dashboard?')) return;
    try {
      await api.delete(`/dashboards/${id}`);
      setDashboards((prev) => prev.filter((d) => d.id !== id));
      if (activeDashboard?.id === id) {
        setActiveDashboard(null);
        setLayoutItems([]);
      }
    } catch {
      alert('Failed to delete dashboard.');
    }
  }

  // ─── Export to PDF ──────────────────────────────────────────
  async function exportPDF() {
    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      const doc = new jsPDF('landscape', 'mm', 'a4');

      doc.setFontSize(20);
      doc.text(activeDashboard?.title || 'Dashboard', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(
        `Exported on ${new Date().toLocaleString()} • ${layoutItems.length} charts`,
        14,
        28,
      );

      // For each chart in layout, draw a summary table
      let yPos = 40;
      for (const item of layoutItems) {
        const chart = charts.find((c) => c.id === item.chartId);
        const data = chartDataMap[item.chartId];
        if (!chart || !data) continue;

        if (yPos > 160) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(30);
        doc.text(chart.title, 14, yPos);
        yPos += 6;

        const tableBody = data.labels.slice(0, 20).map((label, i) => [label, String(data.values[i])]);
        (doc as any).autoTable({
          startY: yPos,
          head: [['Label', 'Value']],
          body: tableBody,
          theme: 'striped',
          styles: { fontSize: 8 },
          margin: { left: 14 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 12;
      }

      doc.save(`${activeDashboard?.title || 'dashboard'}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to export PDF.');
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

  // ═══ Active dashboard canvas view ═══════════════════════════
  if (activeDashboard) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveDashboard(null);
                setLayoutItems([]);
                setChartDataMap({});
              }}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-100">{activeDashboard.title}</h1>
              {activeDashboard.description && (
                <p className="text-sm text-gray-400">{activeDashboard.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              disabled={layoutItems.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 text-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Add Chart
            </button>
            <button
              onClick={saveLayout}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>

        {/* Chart Picker Modal */}
        {showPicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Add Chart to Dashboard</h2>
              {charts.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  No charts available. Create charts first in the Visualizations page.
                </p>
              ) : (
                <div className="space-y-2">
                  {charts.map((chart) => {
                    const alreadyAdded = layoutItems.some((it) => it.chartId === chart.id);
                    return (
                      <button
                        key={chart.id}
                        onClick={() => !alreadyAdded && addChart(chart.id)}
                        disabled={alreadyAdded}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                          alreadyAdded
                            ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-900 text-gray-200 hover:bg-gray-700'
                        }`}
                      >
                        <BarChart3 className="w-5 h-5 text-blue-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{chart.title}</p>
                          <p className="text-xs text-gray-500">
                            {chart.chart_type} • {chart.dataset_name || `Dataset #${chart.dataset_id}`}
                          </p>
                        </div>
                        {alreadyAdded && (
                          <span className="text-xs text-gray-500">Already added</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                onClick={() => setShowPicker(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Canvas */}
        {layoutItems.length === 0 ? (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 border-dashed p-16 text-center">
            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-gray-300 font-medium mb-2">Empty Dashboard</h3>
            <p className="text-gray-500 text-sm mb-4">
              Add charts from your saved visualizations to build this dashboard.
            </p>
            <button
              onClick={() => setShowPicker(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Add Chart
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={layoutItems.map((it) => it.chartId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {layoutItems.map((item) => (
                  <SortableChartCard
                    key={item.chartId}
                    chartId={item.chartId}
                    chart={charts.find((c) => c.id === item.chartId)}
                    chartData={chartDataMap[item.chartId]}
                    onRemove={removeChart}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    );
  }

  // ═══ Dashboard List View ════════════════════════════════════
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7 text-blue-400" />
            Dashboards
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Compose multi-chart dashboards with drag-and-drop
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          New Dashboard
        </button>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-100">Create Dashboard</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Student Performance Overview"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
            <input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Briefly describe this dashboard"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Create
            </button>
            <button
              onClick={() => {
                setShowCreate(false);
                setNewTitle('');
                setNewDescription('');
              }}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Dashboard list */}
      {dashboards.length === 0 && !showCreate ? (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-12 text-center">
          <LayoutDashboard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-gray-300 font-medium mb-2">No dashboards yet</h3>
          <p className="text-gray-500 text-sm mb-4">
            Create a dashboard to combine multiple charts in one view.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Create Dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboards.map((db) => {
            const chartCount = Array.isArray(db.layout) ? db.layout.length : 0;
            return (
              <div
                key={db.id}
                className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:border-gray-600 transition-colors cursor-pointer"
                onClick={() => openDashboard(db)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-100">{db.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                    {chartCount} chart{chartCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {db.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{db.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    {new Date(db.updated_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDashboard(db.id);
                    }}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
