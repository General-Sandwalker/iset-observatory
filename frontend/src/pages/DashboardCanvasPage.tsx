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
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Radar as RadarChart, PolarArea } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import api from '../lib/api';
import type { Dashboard, Chart, ChartType, DashboardLayoutItem } from '../lib/types';

interface ChartApiData { labels: string[]; values: number[] }

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

// ── Issue #21: unavailable placeholder ──────────────────────────
function UnavailablePlaceholder({ chartId, onRemove }: { chartId: number; onRemove: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: chartId });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, border: '1px dashed var(--ag-border)', background: 'var(--ag-surface)' }}
      className="rounded-xl p-4 backdrop-blur"
    >
      <div className="flex items-center gap-2 mb-3">
        <button {...attributes} {...listeners} className="cursor-grab" style={{ color: 'var(--ag-text3)' }}>
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-xs flex-1" style={{ color: 'var(--ag-text3)' }}>Chart #{chartId}</span>
        <button
          onClick={() => onRemove(chartId)}
          className="transition-colors"
          style={{ color: 'var(--ag-text3)' }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ag-red)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ag-text3)')}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex flex-col items-center justify-center gap-2" style={{ height: 220 }}>
        <BarChart3 className="w-8 h-8 opacity-30" style={{ color: 'var(--ag-text3)' }} />
        <p className="text-xs" style={{ color: 'var(--ag-text3)' }}>Chart no longer exists</p>
      </div>
    </div>
  );
}

function SortableChartCard({
  chartId, chart, chartData, onRemove,
}: {
  chartId: number;
  chart?: Chart;
  chartData?: ChartApiData;
  onRemove: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: chartId });
  const style = { transform: CSS.Transform.toString(transform), transition };

  function renderMini(type: ChartType, data: ChartApiData) {
    const chartJsData = {
      labels: data.labels,
      datasets: [{
        label: chart?.title || '',
        data: data.values,
        backgroundColor: PALETTE.slice(0, data.labels.length),
        borderColor: PALETTE.map((c) => c.replace('0.7', '1')).slice(0, data.labels.length),
        borderWidth: 1,
        fill: type === 'radar' || type === 'polarArea',
      }],
    };
    const opts = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, title: { display: false } },
      scales: (type === 'pie' || type === 'doughnut' || type === 'radar' || type === 'polarArea') ? undefined : {
        x: { ticks: { display: true, maxTicksLimit: 6, font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { display: true, font: { size: 10 } }, grid: { color: 'rgba(128,128,128,0.1)' } },
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
      data-chart-id={chartId}
      style={{ ...style, border: '1px solid var(--ag-border)', background: 'var(--ag-surface)' }}
      className="rounded-xl p-4 backdrop-blur transition-all"
    >
      <div className="flex items-center gap-2 mb-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab transition-colors"
          style={{ color: 'var(--ag-text3)' }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ag-text)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ag-text3)')}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--ag-text)' }}>
          {chart?.title || `Chart #${chartId}`}
        </h3>
        <span
          className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
          style={{ background: 'var(--ag-accent-lo)', color: 'var(--ag-accent)' }}
        >
          {chart?.chart_type || 'bar'}
        </span>
        <button
          onClick={() => onRemove(chartId)}
          className="transition-colors"
          style={{ color: 'var(--ag-text3)' }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ag-red)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ag-text3)')}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div style={{ height: 220 }}>
        {chartData ? renderMini(chart?.chart_type || 'bar', chartData) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--ag-accent)' }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardCanvasPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [charts, setCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDashboard, setActiveDashboard] = useState<Dashboard | null>(null);
  const [layoutItems, setLayoutItems] = useState<DashboardLayoutItem[]>([]);
  const [chartDataMap, setChartDataMap] = useState<Record<number, ChartApiData>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    Promise.all([
      api.get('/dashboards').then((r) => setDashboards(r.data.data)),
      api.get('/charts').then((r) => setCharts(r.data.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const loadChartData = useCallback(async (items: DashboardLayoutItem[]) => {
    const needed = items.filter((it) => !chartDataMap[it.chartId]);
    if (!needed.length) return;
    const results: Record<number, ChartApiData> = {};
    await Promise.all(needed.map(async (it) => {
      try { const res = await api.get(`/charts/${it.chartId}/data`); results[it.chartId] = res.data.data; }
      catch { results[it.chartId] = { labels: [], values: [] }; }
    }));
    setChartDataMap((prev) => ({ ...prev, ...results }));
  }, [chartDataMap]);

  async function openDashboard(dashboard: Dashboard) {
    setActiveDashboard(dashboard);
    const raw: DashboardLayoutItem[] = Array.isArray(dashboard.layout) ? dashboard.layout : [];

    // ── Issue #20: drop any layout entries whose chartId no longer exists ──
    const knownIds = new Set(charts.map((c) => c.id));
    const items = raw.filter((it) => {
      const valid = knownIds.has(it.chartId);
      if (!valid) console.warn(`[Dashboard] Dropping orphaned chartId ${it.chartId} from layout.`);
      return valid;
    });

    setLayoutItems(items);
    loadChartData(items);
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/dashboards', { title: newTitle.trim(), description: newDescription.trim() });
      const created = res.data.data;
      setDashboards((prev) => [created, ...prev]);
      setShowCreate(false); setNewTitle(''); setNewDescription('');
      openDashboard(created);
    } catch { alert('Failed to create dashboard.'); }
    finally { setSaving(false); }
  }

  async function saveLayout() {
    if (!activeDashboard) return;
    setSaving(true);
    try {
      await api.put(`/dashboards/${activeDashboard.id}`, { layout: layoutItems });
      setDashboards((prev) => prev.map((d) => d.id === activeDashboard.id ? { ...d, layout: layoutItems } : d));
    } catch { alert('Failed to save layout.'); }
    finally { setSaving(false); }
  }

  function addChart(chartId: number) {
    if (layoutItems.some((it) => it.chartId === chartId)) return;
    const newItem: DashboardLayoutItem = { chartId, x: 0, y: layoutItems.length, w: 6, h: 4 };
    const updated = [...layoutItems, newItem];
    setLayoutItems(updated); loadChartData(updated); setShowPicker(false);
  }

  function removeChart(chartId: number) { setLayoutItems((prev) => prev.filter((it) => it.chartId !== chartId)); }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLayoutItems((items) => {
      const oldIdx = items.findIndex((it) => it.chartId === active.id);
      const newIdx = items.findIndex((it) => it.chartId === over.id);
      return arrayMove(items, oldIdx, newIdx);
    });
  }

  async function deleteDashboard(id: number) {
    if (!confirm('Delete this dashboard?')) return;
    try {
      await api.delete(`/dashboards/${id}`);
      setDashboards((prev) => prev.filter((d) => d.id !== id));
      if (activeDashboard?.id === id) { setActiveDashboard(null); setLayoutItems([]); }
    } catch { alert('Failed to delete dashboard.'); }
  }

  async function exportPDF() {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageW = 297; const pageH = 210;
      const marginL = 14; const marginR = 14;
      const usableW = pageW - marginL - marginR; // 269
      const cols = 2;
      const colGap = 8;
      const imgW = (usableW - colGap * (cols - 1)) / cols; // ~130.5
      const titleH = 12;  // space for chart title lines
      const imgH = 75;
      const rowH = titleH + imgH + 8;
      const colXs = [marginL, marginL + imgW + colGap];

      // Page header
      doc.setFontSize(20);
      doc.setTextColor(30, 30, 60);
      doc.text(activeDashboard?.title || 'Dashboard', marginL, 16);
      doc.setFontSize(8.5);
      doc.setTextColor(110);
      doc.text(
        `Exported ${new Date().toLocaleString()} \u00b7 ${layoutItems.length} chart${layoutItems.length !== 1 ? 's' : ''}`,
        marginL, 23,
      );

      let col = 0;
      let yRow = 30;

      // Helper: render canvas with white background
      function canvasToPng(canvas: HTMLCanvasElement): string {
        const tmp = document.createElement('canvas');
        tmp.width = canvas.width; tmp.height = canvas.height;
        const ctx = tmp.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tmp.width, tmp.height);
        ctx.drawImage(canvas, 0, 0);
        return tmp.toDataURL('image/png');
      }

      for (const item of layoutItems) {
        const chart = charts.find((c) => c.id === item.chartId);
        const container = document.querySelector(`[data-chart-id="${item.chartId}"]`);
        const canvas = container?.querySelector('canvas') as HTMLCanvasElement | null;
        if (!chart || !canvas) continue;

        // New page if needed
        if (yRow + rowH > pageH - 10) {
          doc.addPage();
          col = 0;
          yRow = 14;
        }

        const x = colXs[col];

        // Title
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 60);
        doc.text(chart.title, x, yRow + 5, { maxWidth: imgW });
        doc.setFontSize(7.5);
        doc.setTextColor(120);
        const meta = [chart.chart_type, chart.dataset_name].filter(Boolean).join(' \u00b7 ');
        if (meta) doc.text(meta, x, yRow + 10);

        // Chart image
        const png = canvasToPng(canvas);
        doc.addImage(png, 'PNG', x, yRow + titleH, imgW, imgH);

        col++;
        if (col >= cols) {
          col = 0;
          yRow += rowH;
        }
      }

      doc.save(`${(activeDashboard?.title || 'dashboard').replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to export PDF. Check the browser console for details.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--ag-accent)' }} />
      </div>
    );
  }

  if (activeDashboard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveDashboard(null); setLayoutItems([]); setChartDataMap({}); }}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--ag-text3)' }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ag-text)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ag-text3)')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--ag-text)' }}>{activeDashboard.title}</h1>
              {activeDashboard.description && (
                <p className="text-sm" style={{ color: 'var(--ag-text2)' }}>{activeDashboard.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              disabled={layoutItems.length === 0}
              className="ag-btn-ghost flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
            <button onClick={() => setShowPicker(true)} className="ag-btn-ghost flex items-center gap-2 px-3 py-2 text-sm">
              <PlusCircle className="w-4 h-4" /> Add Chart
            </button>
            <button
              onClick={saveLayout}
              disabled={saving}
              className="ag-btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>

        {/* Chart Picker Modal */}
        {showPicker && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0 0 0 / 0.55)' }}>
            <div
              className="rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
              style={{ background: 'var(--ag-surface)', border: '1px solid var(--ag-border)', backdropFilter: 'blur(12px)' }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ag-text)' }}>Add Chart to Dashboard</h2>
              {charts.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--ag-text2)' }}>
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
                        className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
                        style={{
                          background: alreadyAdded ? 'var(--ag-surface2)' : 'var(--ag-bg2, var(--ag-surface2))',
                          color: alreadyAdded ? 'var(--ag-text3)' : 'var(--ag-text)',
                          cursor: alreadyAdded ? 'not-allowed' : 'pointer',
                          opacity: alreadyAdded ? 0.6 : 1,
                        }}
                        onMouseOver={(e) => !alreadyAdded && ((e.currentTarget as HTMLButtonElement).style.background = 'var(--ag-accent-lo)')}
                        onMouseOut={(e) => !alreadyAdded && ((e.currentTarget as HTMLButtonElement).style.background = 'var(--ag-surface2)')}
                      >
                        <BarChart3 className="w-5 h-5 shrink-0" style={{ color: 'var(--ag-accent)' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{chart.title}</p>
                          <p className="text-xs" style={{ color: 'var(--ag-text3)' }}>
                            {chart.chart_type} · {chart.dataset_name || `Dataset #${chart.dataset_id}`}
                          </p>
                        </div>
                        {alreadyAdded && <span className="text-xs" style={{ color: 'var(--ag-text3)' }}>Added</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              <button onClick={() => setShowPicker(false)} className="ag-btn-ghost w-full mt-4 px-4 py-2 text-sm">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Canvas */}
        {layoutItems.length === 0 ? (
          <div
            className="rounded-xl p-16 text-center border-2 border-dashed"
            style={{ background: 'var(--ag-surface2)', borderColor: 'var(--ag-border)' }}
          >
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--ag-text3)' }} />
            <h3 className="font-medium mb-2" style={{ color: 'var(--ag-text)' }}>Empty Dashboard</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--ag-text3)' }}>
              Add charts from your saved visualizations to build this dashboard.
            </p>
            <button onClick={() => setShowPicker(true)} className="ag-btn-primary px-4 py-2 text-sm">
              Add Chart
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={layoutItems.map((it) => it.chartId)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {layoutItems.map((item) => {
                  const chart = charts.find((c) => c.id === item.chartId);
                  const chartData = chartDataMap[item.chartId];
                  // Issue #21: show placeholder if chart missing or data resolved empty
                  const unavailable = !chart || (chartData !== undefined && chartData.labels.length === 0);
                  if (unavailable) {
                    return (
                      <UnavailablePlaceholder
                        key={item.chartId}
                        chartId={item.chartId}
                        onRemove={removeChart}
                      />
                    );
                  }
                  return (
                    <SortableChartCard
                      key={item.chartId}
                      chartId={item.chartId}
                      chart={chart}
                      chartData={chartData}
                      onRemove={removeChart}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--ag-text)' }}>
            <LayoutDashboard className="w-7 h-7" style={{ color: 'var(--ag-accent)' }} />
            Dashboards
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ag-text2)' }}>
            Compose multi-chart dashboards with drag-and-drop
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="ag-btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <PlusCircle className="w-4 h-4" /> New Dashboard
        </button>
      </div>

      {showCreate && (
        <div className="ag-card p-6 space-y-4">
          <h2 className="text-base font-semibold" style={{ color: 'var(--ag-text)' }}>Create Dashboard</h2>
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--ag-text2)' }}>Title</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Student Performance Overview"
              className="ag-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--ag-text2)' }}>Description (optional)</label>
            <input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Briefly describe this dashboard"
              className="ag-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || saving}
              className="ag-btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Create
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewTitle(''); setNewDescription(''); }}
              className="ag-btn-ghost px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {dashboards.length === 0 && !showCreate ? (
        <div
          className="rounded-xl p-12 text-center border"
          style={{ background: 'var(--ag-surface2)', borderColor: 'var(--ag-border)' }}
        >
          <LayoutDashboard className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--ag-text3)' }} />
          <h3 className="font-medium mb-2" style={{ color: 'var(--ag-text)' }}>No dashboards yet</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--ag-text3)' }}>
            Create a dashboard to combine multiple charts in one view.
          </p>
          <button onClick={() => setShowCreate(true)} className="ag-btn-primary px-4 py-2 text-sm">
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
                className="ag-card p-5 cursor-pointer transition-all"
                onClick={() => openDashboard(db)}
                onMouseOver={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--ag-accent)')}
                onMouseOut={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--ag-border)')}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--ag-text)' }}>{db.title}</h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--ag-surface2)', color: 'var(--ag-text3)' }}
                  >
                    {chartCount} chart{chartCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {db.description && (
                  <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--ag-text3)' }}>{db.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs" style={{ color: 'var(--ag-text3)' }}>
                    {new Date(db.updated_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteDashboard(db.id); }}
                    className="transition-colors"
                    style={{ color: 'var(--ag-text3)' }}
                    onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ag-red)')}
                    onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ag-text3)')}
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
