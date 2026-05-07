import { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Button, Space, Typography, Input, Spin, Tag,
  Empty, Modal, Popconfirm, message, theme, Grid, Tooltip, Switch,
} from 'antd';
import {
  AppstoreOutlined, PlusOutlined, SaveOutlined, DeleteOutlined,
  HolderOutlined, ArrowLeftOutlined, BarChartOutlined, DownloadOutlined,
  EditOutlined, ReloadOutlined, FormOutlined, GlobalOutlined, LockOutlined,
} from '@ant-design/icons';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, RadialLinearScale, Title as ChartTitle, Tooltip as ChartTooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Radar as RadarChart, PolarArea } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import api from '../lib/api';
import type { Dashboard, Chart, ChartType, DashboardLayoutItem } from '../lib/types';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface ChartApiData { labels: string[]; values: number[] }

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, RadialLinearScale, ChartTitle, ChartTooltip, Legend, Filler,
);

const PALETTE = [
  'rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)', 'rgba(245, 158, 11, 0.7)',
  'rgba(239, 68, 68, 0.7)', 'rgba(139, 92, 246, 0.7)', 'rgba(236, 72, 153, 0.7)',
  'rgba(20, 184, 166, 0.7)', 'rgba(249, 115, 22, 0.7)', 'rgba(99, 102, 241, 0.7)',
  'rgba(168, 85, 247, 0.7)', 'rgba(34, 197, 94, 0.7)', 'rgba(234, 179, 8, 0.7)',
];

function SortableChartCard({
  chartId, chart, chartData, onRemove,
}: {
  chartId: number; chart?: Chart; chartData?: ChartApiData; onRemove: (id: number) => void;
}) {
  const { token } = theme.useToken();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chartId });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  function renderMini(type: ChartType, data: ChartApiData) {
    const chartJsData = {
      labels: data.labels,
      datasets: [{
        label: chart?.title || '', data: data.values,
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

  const unavailable = !chart || (chartData !== undefined && chartData.labels.length === 0);

  if (unavailable) {
    return (
      <div ref={setNodeRef} style={{
        ...style,
        border: `1px dashed ${token.colorBorder}`,
        background: token.colorBgContainer, borderRadius: 8, padding: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <button {...attributes} {...listeners} style={{ cursor: 'grab', border: 'none', background: 'none', padding: 0, color: token.colorTextQuaternary }}>
            <HolderOutlined />
          </button>
          <Text type="secondary" style={{ fontSize: 12, flex: 1 }}>Chart #{chartId}</Text>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => onRemove(chartId)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, height: 220 }}>
          <BarChartOutlined style={{ fontSize: 32, opacity: 0.3, color: token.colorTextQuaternary }} />
          <Text type="secondary" style={{ fontSize: 12 }}>Chart no longer exists</Text>
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} data-chart-id={chartId} style={{
      ...style,
      border: `1px solid ${token.colorBorder}`,
      background: token.colorBgContainer, borderRadius: 8, padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button {...attributes} {...listeners} style={{ cursor: 'grab', border: 'none', background: 'none', padding: 0, color: token.colorTextQuaternary }}>
          <HolderOutlined />
        </button>
        <Text strong style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {chart?.title || `Chart #${chartId}`}
        </Text>
        <Tag color={token.colorPrimary}>{chart?.chart_type || 'bar'}</Tag>
        <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => onRemove(chartId)} />
      </div>
      <div style={{ height: 220 }}>
        {chartData ? renderMini(chart?.chart_type || 'bar', chartData) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Spin />
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardCanvasPage() {
  const { token } = theme.useToken();
  const screens = useBreakpoint();
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
  const [pickerSearch, setPickerSearch] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  const isMobile = !screens.md;

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
    const results: Record<number, ChartApiData> = {};
    await Promise.all(items.map(async (it) => {
      try {
        const res = await api.get(`/charts/${it.chartId}/data`);
        results[it.chartId] = res.data.data;
      } catch {
        results[it.chartId] = { labels: [], values: [] };
      }
    }));
    setChartDataMap((prev) => ({ ...prev, ...results }));
  }, []);

  const refreshAllCharts = useCallback(async () => {
    if (layoutItems.length === 0) return;
    const results: Record<number, ChartApiData> = {};
    await Promise.all(layoutItems.map(async (it) => {
      try {
        const res = await api.get(`/charts/${it.chartId}/data`);
        results[it.chartId] = res.data.data;
      } catch {
        results[it.chartId] = { labels: [], values: [] };
      }
    }));
    setChartDataMap(results);
  }, [layoutItems]);

  useEffect(() => {
    if (autoRefresh && activeDashboard) {
      const interval = setInterval(() => { refreshAllCharts(); }, 30000);
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (refreshInterval) clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, activeDashboard]); // eslint-disable-line

  async function openDashboard(dashboard: Dashboard) {
    setActiveDashboard(dashboard);
    setIsPublic((dashboard as any).is_public || false);
    const raw: DashboardLayoutItem[] = Array.isArray(dashboard.layout) ? dashboard.layout : [];
    const knownIds = new Set(charts.map((c) => c.id));
    const items = raw.filter((it) => knownIds.has(it.chartId));
    setLayoutItems(items);
    setChartDataMap({});
    loadChartData(items);
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/dashboards', { title: newTitle.trim(), description: newDescription.trim() });
      const created = res.data.data;
      setDashboards((prev) => [created, ...prev]);
      setShowCreate(false);
      setNewTitle('');
      setNewDescription('');
      openDashboard(created);
      message.success('Dashboard created.');
    } catch { message.error('Failed to create dashboard.'); } finally { setSaving(false); }
  }

  async function saveLayout() {
    if (!activeDashboard) return;
    setSaving(true);
    try {
      await api.put(`/dashboards/${activeDashboard.id}`, {
        title: activeDashboard.title,
        description: activeDashboard.description,
        layout: layoutItems,
      });
      setDashboards((prev) => prev.map((d) => d.id === activeDashboard.id ? { ...d, layout: layoutItems } : d));
      message.success('Layout saved.');
    } catch { message.error('Failed to save layout.'); } finally { setSaving(false); }
  }

  async function saveTitle(newTitleValue: string) {
    if (!activeDashboard || !newTitleValue.trim()) { setEditingTitle(false); return; }
    try {
      const updated = { ...activeDashboard, title: newTitleValue.trim() };
      await api.put(`/dashboards/${activeDashboard.id}`, {
        title: updated.title,
        description: updated.description,
        layout: layoutItems,
      });
      setActiveDashboard(updated);
      setDashboards((prev) => prev.map((d) => d.id === activeDashboard.id ? updated : d));
      message.success('Title updated.');
    } catch { message.error('Failed to update title.'); }
    setEditingTitle(false);
  }

  async function togglePublic() {
    if (!activeDashboard) return;
    try {
      const newValue = !isPublic;
      await api.put(`/dashboards/${activeDashboard.id}`, {
        title: activeDashboard.title,
        description: activeDashboard.description,
        layout: layoutItems,
        isPublic: newValue,
      });
      setIsPublic(newValue);
      setActiveDashboard((prev) => prev ? { ...prev, is_public: newValue } as any : prev);
      setDashboards((prev) => prev.map((d) => d.id === activeDashboard.id ? { ...d, is_public: newValue } as any : d));
      message.success(newValue ? 'Dashboard published.' : 'Dashboard unpublished.');
    } catch { message.error('Failed to update visibility.'); }
  }

  function addChart(chartId: number) {
    if (layoutItems.some((it) => it.chartId === chartId)) return;
    const newItem: DashboardLayoutItem = { chartId, x: 0, y: layoutItems.length, w: 6, h: 4 };
    const updated = [...layoutItems, newItem];
    setLayoutItems(updated);
    loadChartData([newItem]);
    setShowPicker(false);
  }

  function removeChart(chartId: number) {
    setLayoutItems((prev) => prev.filter((it) => it.chartId !== chartId));
    setChartDataMap((prev) => {
      const next = { ...prev };
      delete next[chartId];
      return next;
    });
  }

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
    try {
      await api.delete(`/dashboards/${id}`);
      setDashboards((prev) => prev.filter((d) => d.id !== id));
      if (activeDashboard?.id === id) {
        setActiveDashboard(null);
        setLayoutItems([]);
        setChartDataMap({});
      }
      message.success('Dashboard deleted.');
    } catch { message.error('Failed to delete dashboard.'); }
  }

  async function exportPDF() {
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageW = 210;
      const pageH = 297;
      const marginL = 18;
      const marginR = 18;
      const usableW = pageW - marginL - marginR;
      const dashTitle = activeDashboard?.title || 'Dashboard';
      const exportDate = new Date().toLocaleString();

      function canvasToPng(canvas: HTMLCanvasElement): string {
        const tmp = document.createElement('canvas');
        tmp.width = canvas.width;
        tmp.height = canvas.height;
        const ctx = tmp.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tmp.width, tmp.height);
        ctx.drawImage(canvas, 0, 0);
        return tmp.toDataURL('image/png');
      }

      const entries: { chart: Chart; png: string }[] = [];
      for (const item of layoutItems) {
        const chart = charts.find((c) => c.id === item.chartId);
        const container = document.querySelector(`[data-chart-id="${item.chartId}"]`);
        const canvas = container?.querySelector('canvas') as HTMLCanvasElement | null;
        if (!chart || !canvas) continue;
        entries.push({ chart, png: canvasToPng(canvas) });
      }

      let currentPage = 1;
      function addHeader() {
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, pageW, 38, 'F');
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(dashTitle, marginL, 22);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('ISET Tozeur — Adaptive Digital Observatory', marginL, 31);
      }

      function addFooter() {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 170);
        doc.text(`Generated: ${exportDate}`, marginL, pageH - 8);
        doc.text(`Page ${currentPage}`, pageW - marginR, pageH - 8, { align: 'right' });
        doc.setDrawColor(220, 220, 235);
        doc.setLineWidth(0.3);
        doc.line(marginL, pageH - 12, pageW - marginR, pageH - 12);
      }

      addHeader();

      doc.setTextColor(90, 90, 110);
      doc.setFontSize(8.5);
      doc.text(`Generated: ${exportDate} · ${entries.length} chart${entries.length !== 1 ? 's' : ''}`, marginL, 47);
      doc.setDrawColor(220, 220, 235);
      doc.setLineWidth(0.4);
      doc.line(marginL, 50, pageW - marginR, 50);

      const imgH = 88;
      const titleBlockH = 14;
      const sectionH = titleBlockH + imgH + 10;
      let y = 56;

      for (let i = 0; i < entries.length; i++) {
        const { chart, png } = entries[i];
        if (y + sectionH > pageH - 20) {
          addFooter();
          doc.addPage();
          currentPage++;
          addHeader();
          y = 50;
        }
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(25, 25, 50);
        doc.text(chart.title, marginL, y + 6, { maxWidth: usableW });
        const meta = [chart.chart_type, chart.dataset_name].filter(Boolean).join(' · ');
        if (meta) {
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(130, 130, 150);
          doc.text(meta.toUpperCase(), marginL, y + 11);
        }
        doc.setDrawColor(235, 235, 245);
        doc.setLineWidth(0.3);
        doc.line(marginL, y + titleBlockH - 2, pageW - marginR, y + titleBlockH - 2);
        doc.addImage(png, 'PNG', marginL, y + titleBlockH, usableW, imgH);
        y += sectionH;
      }

      addFooter();
      doc.save(`${dashTitle.replace(/\s+/g, '_')}_report.pdf`);
      message.success('PDF exported.');
    } catch (err) {
      console.error('PDF export error:', err);
      message.error('Failed to export PDF.');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (activeDashboard) {
    const filteredCharts = charts.filter((c) => {
      if (!pickerSearch.trim()) return true;
      const q = pickerSearch.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.chart_type.toLowerCase().includes(q) || (c.dataset_name ?? '').toLowerCase().includes(q);
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          <Space size="middle">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                setActiveDashboard(null);
                setLayoutItems([]);
                setChartDataMap({});
                setAutoRefresh(false);
              }}
            />
            <div>
              {editingTitle ? (
                <Input
                  autoFocus
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={() => saveTitle(titleInput)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(titleInput); if (e.key === 'Escape') setEditingTitle(false); }}
                  style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}
                />
              ) : (
                <Title
                  level={4}
                  style={{ margin: 0, cursor: 'pointer' }}
                  onClick={() => { setTitleInput(activeDashboard.title); setEditingTitle(true); }}
                >
                  {activeDashboard.title}
                  <EditOutlined style={{ fontSize: 14, marginLeft: 8, color: token.colorTextQuaternary }} />
                </Title>
              )}
              {activeDashboard.description && <Text type="secondary">{activeDashboard.description}</Text>}
            </div>
          </Space>
        <Space wrap>
          <Tooltip title={isPublic ? 'Published — click to unpublish' : 'Private — click to publish'}>
            <Switch
              checked={isPublic}
              onChange={togglePublic}
              checkedChildren={<GlobalOutlined />}
              unCheckedChildren={<LockOutlined />}
            />
          </Tooltip>
          <Tooltip title={autoRefresh ? 'Auto-refresh ON (30s)' : 'Auto-refresh OFF'}>
              <Button
                icon={<ReloadOutlined spin={autoRefresh} />}
                type={autoRefresh ? 'primary' : 'default'}
                onClick={() => setAutoRefresh((v) => !v)}
              />
            </Tooltip>
            <Button icon={<ReloadOutlined />} onClick={refreshAllCharts} disabled={layoutItems.length === 0}>Refresh</Button>
            <Button icon={<DownloadOutlined />} onClick={exportPDF} disabled={layoutItems.length === 0}>PDF</Button>
            <Button icon={<PlusOutlined />} onClick={() => { setShowPicker(true); setPickerSearch(''); }}>Add Chart</Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={saveLayout} loading={saving}>Save</Button>
          </Space>
        </div>

        <Modal
          title="Add Chart to Dashboard"
          open={showPicker}
          onCancel={() => setShowPicker(false)}
          footer={<Button onClick={() => setShowPicker(false)}>Close</Button>}
          width={560}
        >
          <Input
            placeholder="Search charts by title, type, or dataset…"
            prefix={<span style={{ color: token.colorTextQuaternary }}>🔍</span>}
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            allowClear
            style={{ marginBottom: 12 }}
          />
          {charts.length === 0 ? (
            <Empty description="No charts available. Create charts first in the Visualizations page." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : filteredCharts.length === 0 ? (
            <Empty description="No charts match your search." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredCharts.map((chart) => {
                const alreadyAdded = layoutItems.some((it) => it.chartId === chart.id);
                return (
                  <Card
                    key={chart.id}
                    hoverable={!alreadyAdded}
                    size="small"
                    style={{
                      opacity: alreadyAdded ? 0.6 : 1,
                      cursor: alreadyAdded ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => !alreadyAdded && addChart(chart.id)}
                  >
                    <Space>
                      <BarChartOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                      <div>
                        <Text strong>{chart.title}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <Tag color={token.colorPrimary} style={{ fontSize: 10 }}>{chart.chart_type}</Tag>
                          {chart.dataset_name || `Dataset #${chart.dataset_id}`}
                        </Text>
                      </div>
                      {alreadyAdded && <Tag color="success">Added</Tag>}
                    </Space>
                  </Card>
                );
              })}
            </div>
          )}
        </Modal>

        {layoutItems.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 24px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: `linear-gradient(135deg, ${token.colorPrimaryBg}, ${token.colorBgContainer})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 24,
            }}>
              <AppstoreOutlined style={{ fontSize: 36, color: token.colorPrimary }} />
            </div>
            <Title level={4} style={{ color: token.colorTextSecondary, marginBottom: 8 }}>
              Empty Dashboard
            </Title>
            <Text type="secondary" style={{ fontSize: 14, maxWidth: 400, marginBottom: 24 }}>
              Add charts from your saved visualizations to build a comprehensive dashboard view.
            </Text>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => { setShowPicker(true); setPickerSearch(''); }}>
              Add Your First Chart
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={layoutItems.map((it) => it.chartId)} strategy={rectSortingStrategy}>
              <Row gutter={[16, 16]}>
                {layoutItems.map((item) => (
                  <Col xs={24} md={12} lg={8} key={item.chartId}>
                    <SortableChartCard
                      chartId={item.chartId}
                      chart={charts.find((c) => c.id === item.chartId)}
                      chartData={chartDataMap[item.chartId]}
                      onRemove={removeChart}
                    />
                  </Col>
                ))}
              </Row>
            </SortableContext>
          </DndContext>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 12,
      }}>
        <Space size="middle">
          <AppstoreOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>Dashboards</Title>
            <Text type="secondary">Compose multi-chart dashboards with drag-and-drop</Text>
          </div>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>New Dashboard</Button>
      </div>

      <Modal
        title={<Space><FormOutlined style={{ color: token.colorPrimary }} /> Create Dashboard</Space>}
        open={showCreate}
        onCancel={() => { setShowCreate(false); setNewTitle(''); setNewDescription(''); }}
        onOk={handleCreate}
        okText="Create"
        okButtonProps={{ loading: saving, disabled: !newTitle.trim() }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Title</Text>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Student Performance Overview" />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Description (optional)</Text>
            <Input.TextArea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Briefly describe this dashboard"
              rows={3}
            />
          </div>
        </div>
      </Modal>

      {dashboards.length === 0 && !showCreate ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: `linear-gradient(135deg, ${token.colorPrimaryBg}, ${token.colorBgContainer})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
          }}>
            <AppstoreOutlined style={{ fontSize: 36, color: token.colorPrimary }} />
          </div>
          <Title level={4} style={{ color: token.colorTextSecondary, marginBottom: 8 }}>
            No Dashboards Yet
          </Title>
          <Text type="secondary" style={{ fontSize: 14, maxWidth: 400, marginBottom: 24 }}>
            Create a dashboard to combine multiple charts into a single, organized view for presentations and analysis.
          </Text>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>
            Create Your First Dashboard
          </Button>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {dashboards.map((db) => {
            const chartCount = Array.isArray(db.layout) ? db.layout.length : 0;
            return (
              <Col xs={24} sm={12} lg={8} key={db.id}>
                <Card
                  hoverable
                  onClick={() => openDashboard(db)}
                  style={{ cursor: 'pointer', height: '100%' }}
                  styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 16 }}>{db.title}</Text>
                    <Tag color={chartCount > 0 ? 'blue' : 'default'}>{chartCount} chart{chartCount !== 1 ? 's' : ''}</Tag>
                  </div>
                  {db.description && <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>{db.description}</Text>}
                  {chartCount > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
                      {Array.isArray(db.layout) && db.layout.slice(0, 4).map((item) => {
                        const c = charts.find((ch) => ch.id === item.chartId);
                        return c ? (
                          <Tag key={item.chartId} style={{ fontSize: 11 }}>
                            <BarChartOutlined /> {c.title.length > 16 ? c.title.slice(0, 16) + '…' : c.title}
                          </Tag>
                        ) : null;
                      })}
                      {chartCount > 4 && <Tag>+{chartCount - 4} more</Tag>}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{new Date(db.updated_at).toLocaleDateString()}</Text>
                    <Popconfirm title="Delete this dashboard?" onConfirm={() => deleteDashboard(db.id)} okText="Delete" okButtonProps={{ danger: true }}>
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
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
