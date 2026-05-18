import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Row, Col, Space, Typography, Tag, Spin, Empty,
  Button, theme, Grid, Avatar, Divider, Modal, List, Alert, message,
} from 'antd';
import {
  AppstoreOutlined, FileTextOutlined, BarChartOutlined,
  ThunderboltOutlined, EyeOutlined, LoginOutlined,
  ArrowLeftOutlined, SendOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, RadialLinearScale, Title as ChartTitle, Tooltip as ChartTooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Radar as RadarChart, PolarArea } from 'react-chartjs-2';
import api from '../lib/api';
import type { Report, ChartType } from '../lib/types';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

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

interface ChartApiData { labels: string[]; values: number[] }
interface PublicChart { id: number; title: string; chart_type: ChartType; config: any; dataset_name?: string; }

function PublicChartCard({ chart, chartData }: { chart: PublicChart; chartData?: ChartApiData }) {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  function renderChart(type: ChartType, data: ChartApiData) {
    const chartJsData = {
      labels: data.labels,
      datasets: [{
        label: chart.title,
        data: data.values,
        backgroundColor: PALETTE.slice(0, data.labels.length),
        borderColor: PALETTE.map((c) => c.replace('0.7', '1')).slice(0, data.labels.length),
        borderWidth: 1,
        fill: type === 'radar' || type === 'polarArea',
      }],
    };
    const opts = {
      responsive: true,
      maintainAspectRatio: false,
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
    <Card style={{ border: `1px solid ${token.colorBorder}`, borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Text strong style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {chart.title}
        </Text>
        <Tag color={token.colorPrimary}>{chart.chart_type}</Tag>
      </div>
      <div style={{ height: 220 }}>
        {chartData && chartData.labels.length > 0 ? renderChart(chart.chart_type, chartData) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            {chartData ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.noData')} /> : <Spin />}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function PublicDashboardPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const navigate = useNavigate();
  const { id: dashboardId } = useParams<{ id?: string }>();

  const [dashboards, setDashboards] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [publicSurveys, setPublicSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeDashboard, setActiveDashboard] = useState<any | null>(null);
  const [activeCharts, setActiveCharts] = useState<PublicChart[]>([]);
  const [chartDataMap, setChartDataMap] = useState<Record<number, ChartApiData>>({});
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const isSingleView = !!dashboardId;

  useEffect(() => {
    if (isSingleView) return;
    async function fetchPublic() {
      setLoading(true);
      setError(null);
      try {
        const [dashRes, repRes, surveyRes] = await Promise.all([
          api.get('/public/dashboards'),
          api.get('/public/reports'),
          api.get('/public/surveys'),
        ]);
        setDashboards(dashRes.data.data || []);
        setReports(repRes.data.data || []);
        setPublicSurveys(surveyRes.data.data || []);
      } catch {
        setError(t('public.fetchFailed'));
      } finally {
        setLoading(false);
      }
    }
    fetchPublic();
  }, [isSingleView]);

  useEffect(() => {
    if (!isSingleView || !dashboardId) return;
    let cancelled = false;
    async function fetchDashboard() {
      setDashboardLoading(true);
      setError(null);
      try {
        const dashRes = await api.get(`/public/dashboards/${dashboardId}`);
        if (cancelled) return;
        setActiveDashboard(dashRes.data.data);

        const chartsRes = await api.get(`/public/dashboards/${dashboardId}/charts`);
        if (cancelled) return;
        const charts: PublicChart[] = chartsRes.data.data || [];
        setActiveCharts(charts);

        const layout: any[] = Array.isArray(dashRes.data.data.layout) ? dashRes.data.data.layout : [];
        const chartIds = layout.map((it: any) => it.chartId);
        const results: Record<number, ChartApiData> = {};
        await Promise.all(chartIds.map(async (cId: number) => {
          try {
            const res = await api.get(`/public/charts/${cId}/data`);
            results[cId] = res.data.data;
          } catch {
            results[cId] = { labels: [], values: [] };
          }
        }));
        if (!cancelled) setChartDataMap(results);
      } catch {
        if (!cancelled) setError(t('public.fetchFailed'));
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    }
    fetchDashboard();
    return () => { cancelled = true; };
  }, [isSingleView, dashboardId]);

  const handleViewReport = useCallback(async (reportId: number) => {
    try {
      const res = await api.get(`/public/reports/${reportId}`);
      setViewReport(res.data.data);
      setReportModalOpen(true);
    } catch {
      message.error(t('public.reportViewFailed'));
    }
  }, []);

  function renderHeader() {
    return (
      <div style={{
        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
        padding: isMobile ? '32px 16px' : '48px 24px',
        color: '#fff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)',
            marginBottom: 16,
          }}>
            <ThunderboltOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: 8 }}>
            {isSingleView ? (activeDashboard?.title || t('public.title')) : t('public.title')}
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 20 }}>
            {isSingleView ? (activeDashboard?.description || t('public.subtitle')) : t('public.subtitle')}
          </Paragraph>
          <Space>
            <Button ghost icon={<LoginOutlined />} onClick={() => navigate('/login')} style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}>
              {t('public.signIn')}
            </Button>
          </Space>
        </div>
      </div>
    );
  }

  if (isSingleView) {
    if (dashboardLoading) {
      return (
        <div style={{ minHeight: '100vh', background: token.colorBgLayout, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      );
    }
    if (error) {
      return (
        <div style={{ minHeight: '100vh', background: token.colorBgLayout }}>
          {renderHeader()}
          <div style={{ maxWidth: 500, margin: '48px auto', padding: '0 16px' }}>
            <Alert type="error" message={error} showIcon />
            <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate('/public')} icon={<ArrowLeftOutlined />}>
              {t('common.back')}
            </Button>
          </div>
        </div>
      );
    }

    const layout: any[] = Array.isArray(activeDashboard?.layout) ? activeDashboard.layout : [];

    return (
      <div style={{ minHeight: '100vh', background: token.colorBgLayout, display: 'flex', flexDirection: 'column' }}>
        {renderHeader()}
        <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', padding: isMobile ? '24px 16px' : '32px 24px', flex: 1 }}>
          <div style={{ marginBottom: 24 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/public')} style={{ marginBottom: 16 }}>
              {t('public.allDashboards')}
            </Button>
          </div>
          {layout.length === 0 ? (
            <Empty description={t('public.noChartsInDashboard')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Row gutter={[16, 16]}>
              {layout.map((item: any) => {
                const chart = activeCharts.find((c) => c.id === item.chartId);
                if (!chart) return null;
                return (
                  <Col xs={24} md={12} lg={8} key={item.chartId}>
                    <PublicChartCard chart={chart} chartData={chartDataMap[item.chartId]} />
                  </Col>
                );
              })}
            </Row>
          )}
        </div>
        <div style={{ padding: '20px 24px', textAlign: 'center', borderTop: `1px solid ${token.colorBorderSecondary}`, background: token.colorBgContainer }}>
          <Text type="secondary" style={{ fontSize: 12 }}>ISET Tozeur — Adaptive Digital Observatory</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: token.colorBgLayout, display: 'flex', flexDirection: 'column' }}>
      {renderHeader()}

      <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', padding: isMobile ? '24px 16px' : '32px 24px', flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <div style={{ maxWidth: 500, margin: '48px auto' }}>
            <Alert type="error" message={error} showIcon />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <Space style={{ marginBottom: 16 }}>
                <AppstoreOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                <Title level={4} style={{ margin: 0 }}>{t('public.dashboards')}</Title>
                <Tag color="blue">{dashboards.length}</Tag>
              </Space>
              {dashboards.length === 0 ? (
                <Card><Empty description={t('public.noDashboards')} image={Empty.PRESENTED_IMAGE_SIMPLE} /></Card>
              ) : (
                <Row gutter={[16, 16]}>
                  {dashboards.map((db) => {
                    const chartCount = Array.isArray(db.layout) ? db.layout.length : 0;
                    return (
                      <Col xs={24} sm={12} lg={8} key={db.id}>
                        <Card
                          hoverable
                          style={{ height: '100%', cursor: 'pointer' }}
                          styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' } }}
                          onClick={() => navigate(`/public/dashboards/${db.id}`)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <Avatar
                              size={36}
                              style={{ background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorInfo})`, borderRadius: 8, flexShrink: 0 }}
                            >
                              <BarChartOutlined style={{ fontSize: 16 }} />
                            </Avatar>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <Text strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {db.title}
                              </Text>
                              <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
                                {chartCount} chart{chartCount !== 1 ? 's' : ''}
                              </Tag>
                            </div>
                          </div>
                          {db.description && (
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                              {db.description}
                            </Text>
                          )}
                          <div style={{ marginTop: 'auto', borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {new Date(db.created_at).toLocaleDateString()}
                              {db.created_by_name && ` · by ${db.created_by_name}`}
                            </Text>
                            <Button type="link" size="small" icon={<EyeOutlined />}>
                              {t('common.view')}
                            </Button>
                          </div>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </div>

            <div>
              <Space style={{ marginBottom: 16 }}>
                <FileTextOutlined style={{ fontSize: 20, color: token.colorSuccess }} />
                <Title level={4} style={{ margin: 0 }}>{t('public.reports')}</Title>
                <Tag color="green">{reports.length}</Tag>
              </Space>
              {reports.length === 0 ? (
                <Card><Empty description={t('public.noReports')} image={Empty.PRESENTED_IMAGE_SIMPLE} /></Card>
              ) : (
                <List
                  dataSource={reports}
                  renderItem={(report) => (
                    <List.Item
                      style={{ padding: '12px 16px', borderRadius: token.borderRadius, border: `1px solid ${token.colorBorderSecondary}`, marginBottom: 8 }}
                      actions={[
                        <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => handleViewReport(report.id)}>
                          {t('public.viewReport')}
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar size={36} style={{ background: `linear-gradient(135deg, ${token.colorSuccess}, ${token.colorSuccessActive})`, borderRadius: 8 }}>
                            <FileTextOutlined style={{ fontSize: 16 }} />
                          </Avatar>
                        }
                        title={
                          <Space>
                            <Text strong>{report.title}</Text>
                            <Tag style={{ fontSize: 10 }}>{report.report_type}</Tag>
                          </Space>
                        }
                        description={
                          <Space size={8}>
                            {report.client_name && <Text type="secondary" style={{ fontSize: 12 }}>Client: {report.client_name}</Text>}
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {new Date(report.created_at).toLocaleDateString()}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>

            <div>
              <Space style={{ marginBottom: 16 }}>
                <FileTextOutlined style={{ fontSize: 20, color: token.colorWarning }} />
                <Title level={4} style={{ margin: 0 }}>{t('public.surveys')}</Title>
                <Tag color="orange">{publicSurveys.length}</Tag>
              </Space>
              {publicSurveys.length === 0 ? (
                <Card><Empty description={t('public.noSurveys')} image={Empty.PRESENTED_IMAGE_SIMPLE} /></Card>
              ) : (
                <Row gutter={[16, 16]}>
                  {publicSurveys.map((survey: any) => (
                    <Col xs={24} sm={12} lg={8} key={survey.id}>
                      <Card
                        hoverable
                        style={{ height: '100%', cursor: 'pointer' }}
                        styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' } }}
                        onClick={() => navigate(`/public/surveys/${survey.id}`)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <Avatar
                            size={36}
                            style={{ background: `linear-gradient(135deg, ${token.colorWarning}, ${token.colorWarningActive})`, borderRadius: 8, flexShrink: 0 }}
                          >
                            <FileTextOutlined style={{ fontSize: 16 }} />
                          </Avatar>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <Text strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {survey.title}
                            </Text>
                            <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>
                              {t('public.survey')}
                            </Tag>
                          </div>
                        </div>
                        {survey.description && (
                          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                            {survey.description.length > 100 ? survey.description.slice(0, 100) + '…' : survey.description}
                          </Text>
                        )}
                        <div style={{ marginTop: 'auto', borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(survey.created_at).toLocaleDateString()}
                            {survey.responses_count > 0 && ` · ${survey.responses_count} ${t('surveys.responsesLabel')}`}
                          </Text>
                          <Button type="link" size="small" icon={<SendOutlined />}>
                            {t('public.takeSurvey')}
                          </Button>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '20px 24px', textAlign: 'center', borderTop: `1px solid ${token.colorBorderSecondary}`, background: token.colorBgContainer }}>
        <Text type="secondary" style={{ fontSize: 12 }}>ISET Tozeur — Adaptive Digital Observatory</Text>
      </div>

      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: token.colorPrimary }} />
            <span>{viewReport?.title}</span>
          </Space>
        }
        open={reportModalOpen}
        onCancel={() => { setReportModalOpen(false); setViewReport(null); }}
        footer={<Button onClick={() => { setReportModalOpen(false); setViewReport(null); }}>Close</Button>}
        width={720}
      >
        {viewReport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Space wrap>
              <Tag color="blue">{viewReport.report_type}</Tag>
              {viewReport.client_name && <Tag>Client: {viewReport.client_name}</Tag>}
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(viewReport.created_at).toLocaleDateString()}
              </Text>
            </Space>
            <Divider style={{ margin: 0 }} />
            <div style={{ maxHeight: 500, overflow: 'auto', padding: '8px 4px', lineHeight: 1.7, fontSize: 14 }}>
              {viewReport.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <Title key={i} level={3} style={{ marginTop: 16 }}>{line.replace('# ', '')}</Title>;
                if (line.startsWith('## ')) return <Title key={i} level={4} style={{ marginTop: 12 }}>{line.replace('## ', '')}</Title>;
                if (line.startsWith('### ')) return <Title key={i} level={5} style={{ marginTop: 8 }}>{line.replace('### ', '')}</Title>;
                if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} style={{ paddingLeft: 16 }}>&bull; {line.replace(/^[-*] /, '')}</div>;
                if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
                return <div key={i}>{line}</div>;
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
