import { useEffect, useState, CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Typography,
  Spin,
  Alert,
  Tag,
  Skeleton,
  Avatar,
  Divider,
  Empty,
  message,
  theme,
} from 'antd';
import {
  DashboardOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  TeamOutlined,
  AppstoreOutlined,
  RobotOutlined,
  ImportOutlined,
  FileTextOutlined,
  TableOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import type { Chart } from '../lib/types';

const { Title, Text, Paragraph } = Typography;

interface Stats {
  datasets: number;
  totalRecords: number;
  activeUsers: number;
  charts: number;
  dashboards: number;
  aiQueriesThisMonth: number;
}

const STAT_CARDS_CONFIG = [
  { key: 'datasets', label: 'dashboard.datasets', icon: DatabaseOutlined, color: '#1677ff' },
  { key: 'totalRecords', label: 'dashboard.totalRecords', icon: TableOutlined, color: '#52c41a' },
  { key: 'activeUsers', label: 'dashboard.activeUsers', icon: TeamOutlined, color: '#722ed1' },
  { key: 'charts', label: 'dashboard.charts', icon: BarChartOutlined, color: '#fa8c16' },
  { key: 'dashboards', label: 'dashboard.dashboards', icon: AppstoreOutlined, color: '#13c2c2' },
  { key: 'aiQueriesThisMonth', label: 'dashboard.queries', icon: RobotOutlined, color: '#eb2f96' },
] as const;

const QUICK_ACTIONS = [
  {
    label: 'dashboard.importData',
    desc: 'dashboard.importDataDesc',
    icon: ImportOutlined,
    to: '/import',
    gradient: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
  },
  {
    label: 'dashboard.aiAnalysis',
    desc: 'dashboard.aiAnalysisDesc',
    icon: RobotOutlined,
    to: '/ai',
    gradient: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
  },
  {
    label: 'dashboard.newChart',
    desc: 'dashboard.newChartDesc',
    icon: BarChartOutlined,
    to: '/charts',
    gradient: 'linear-gradient(135deg, #fa8c16 0%, #ffc53d 100%)',
  },
  {
    label: 'dashboard.dashboards',
    desc: 'dashboard.dashboardsDesc',
    icon: AppstoreOutlined,
    to: '/dashboards',
    gradient: 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)',
  },
  {
    label: 'dashboard.surveyGenerator',
    desc: 'dashboard.surveyGeneratorDesc',
    icon: FileTextOutlined,
    to: '/surveys',
    gradient: 'linear-gradient(135deg, #eb2f96 0%, #f759ab 100%)',
  },
  {
    label: 'dashboard.dbExplorer',
    desc: 'dashboard.dbExplorerDesc',
    icon: DatabaseOutlined,
    to: '/explore',
    gradient: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
  },
];

const CHART_TYPE_COLORS: Record<string, string> = {
  bar: '#1677ff',
  horizontalBar: '#4096ff',
  line: '#52c41a',
  pie: '#eb2f96',
  doughnut: '#722ed1',
  radar: '#fa8c16',
  polarArea: '#13c2c2',
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [charts, setCharts] = useState<Chart[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchStats = async () => {
    setStatsLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ success: boolean; data: Stats }>('/stats');
      if (data.success) setStats(data.data);
    } catch {
      setError(t('dashboard.couldNotLoadStats'));
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchCharts = async () => {
    setChartsLoading(true);
    try {
      const { data } = await api.get<{ success: boolean; data: Chart[] }>('/charts');
      if (data.success) setCharts(data.data ?? []);
  } catch {
    setCharts([]);
      message.warning(t('dashboard.couldNotLoadCharts'));
  } finally {
      setChartsLoading(false);
    }
  };

  const fetchAiInsight = async () => {
    setAiLoading(true);
    setAiInsight(null);
    try {
      const { data } = await api.post<{ success: boolean; insights?: string; answer?: string }>('/ai/query', {
        question: 'Give me a brief summary of all data in the system',
      });
      const text = data.insights ?? data.answer ?? t('dashboard.noInsightsAvailable');
      setAiInsight(text);
    } catch {
      message.error(t('dashboard.failedAiInsights'));
      setAiInsight(null);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCharts();
  }, []);

  const getStatValue = (key: string): number | string => {
    if (!stats) return 0;
    const val = stats[key as keyof Stats];
    return typeof val === 'number' ? val.toLocaleString() : val;
  };

  const recentCharts = charts.slice(0, 3);

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Space size="middle">
          <DashboardOutlined style={{ fontSize: 22, color: token.colorPrimary }} />
        <Title level={3} style={{ margin: 0 }}>
          {t('dashboard.title')}
        </Title>
        </Space>
        <Button
          icon={<ReloadOutlined spin={statsLoading} />}
          onClick={() => {
            fetchStats();
            fetchCharts();
          }}
        disabled={statsLoading}
        size="small"
      >
        {t('dashboard.refresh')}
      </Button>
      </div>

      {/* ── Welcome Section ─────────────────────────────────────────── */}
      <Card
        style={{
          marginBottom: 24,
          overflow: 'hidden',
          position: 'relative',
        }}
        styles={{
          body: {
            background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${token.colorPrimaryBg || token.colorBgLayout} 100%)`,
            padding: '24px 28px',
          },
        }}
      >
        <Space size={20} align="center" wrap>
          <Avatar
            size={56}
            style={{
              backgroundColor: token.colorPrimary,
              fontSize: 22,
              fontWeight: 700,
              flexShrink: 0,
              boxShadow: `0 4px 12px ${token.colorPrimary}33`,
            }}
          >
            {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
          </Avatar>
          <div>
            <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
              {t('dashboard.welcome')}, {user?.fullName?.split(' ')[0] ?? 'User'}! 👋
            </Title>
            <Space size={8} align="center" wrap>
              <Text type="secondary" style={{ fontSize: 14 }}>
                {formatDate()}
              </Text>
              <Tag
                color={token.colorPrimary}
                style={{
                  margin: 0,
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 12,
                  letterSpacing: 0.5,
                }}
              >
                {user?.role?.toUpperCase() ?? 'USER'}
              </Tag>
            </Space>
          </div>
        </Space>
      </Card>

      {/* ── Stats Overview ──────────────────────────────────────────── */}
      {error ? (
        <Alert type="error" message={error} showIcon style={{ marginBottom: 24 }} />
      ) : (
        <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
          {STAT_CARDS_CONFIG.map((cfg) => {
            const IconComp = cfg.icon;
            return (
              <Col xs={12} sm={12} md={8} lg={4} key={cfg.key}>
                <Card
                  style={{
                    borderRadius: 12,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    overflow: 'hidden',
                  }}
                  styles={{ body: { padding: '20px 20px 16px' } }}
                  hoverable
                  className="stat-card-hover"
                >
                  {statsLoading ? (
                    <Space vertical style={{ width: '100%' }}>
                      <Skeleton.Avatar active size="small" shape="circle" />
                      <Skeleton active paragraph={{ rows: 1, width: '60%' }} title={{ width: '80%' }} />
                    </Space>
                  ) : (
                    <div>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${cfg.color}15`,
                          marginBottom: 12,
                        }}
                      >
                        <IconComp style={{ fontSize: 20, color: cfg.color }} />
                      </div>
                      <Statistic
                        value={getStatValue(cfg.key)}
                        valueStyle={{
                          fontSize: 26,
                          fontWeight: 700,
                          color: token.colorText,
                          lineHeight: 1.2,
                          marginBottom: 2,
                        }}
                        formatter={(val) => <span>{val as string}</span>}
                      />
                      <Text
                        type="secondary"
                        style={{ fontSize: 13, display: 'block', marginBottom: 6 }}
                      >
                        {t(cfg.label)}
                      </Text>
                      <Tag
                        style={{
                          margin: 0,
                          fontSize: 11,
                          borderRadius: 8,
                          padding: '0 6px',
                          color: token.colorTextSecondary,
                          border: 'none',
                          background: token.colorBgLayout,
                        }}
                      >
                        <span style={{ marginRight: 2 }}>—</span> {t('dashboard.vsLastMonth')}
                      </Tag>
                    </div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* ── Quick Actions ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 8 }}>
        <Space size={8}>
          <ThunderboltOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
        <Title level={5} style={{ margin: 0 }}>
          {t('dashboard.quickActions')}
        </Title>
        </Space>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        {QUICK_ACTIONS.map((action) => {
          const IconComp = action.icon;
          return (
            <Col xs={24} sm={12} md={8} key={action.to}>
              <Card
                hoverable
                onClick={() => navigate(action.to)}
                style={{
                  cursor: 'pointer',
                  borderRadius: 12,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                styles={{ body: { padding: 0 } }}
                className="action-card-hover"
              >
                <div style={{ display: 'flex', minHeight: 100 }}>
                  <div
                    style={{
                      width: 5,
                      flexShrink: 0,
                      background: action.gradient,
                      borderRadius: '12px 0 0 12px',
                    }}
                  />
                  <div
                    style={{
                      padding: '20px 20px 20px 20px',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: action.gradient,
                        flexShrink: 0,
                        boxShadow: `0 4px 12px ${action.gradient.match(/#[0-9a-fA-F]{6}/)?.[0]}40`,
                      }}
                    >
                      <IconComp style={{ fontSize: 22, color: '#fff' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        strong
                        style={{
                          display: 'block',
                          fontSize: 15,
                          marginBottom: 2,
                          color: token.colorText,
                        }}
                      >
                  {t(action.label)}
                </Text>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, lineHeight: 1.4, display: 'block' }}
                  ellipsis
                >
                  {t(action.desc)}
                      </Text>
                    </div>
                    <ArrowRightOutlined
                      style={{
                        color: token.colorTextQuaternary,
                        fontSize: 14,
                        flexShrink: 0,
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* ── Bottom Section: Recent Activity + AI Insights + Popular Charts ── */}
      <Row gutter={[16, 16]}>
        {/* ── Recent Activity ──────────────────────────────────────── */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space size={8}>
                <ClockCircleOutlined style={{ color: token.colorPrimary }} />
                <span>{t('dashboard.recentActivity')}</span>
              </Space>
            }
            style={{ borderRadius: 12, height: '100%' }}
            styles={{ body: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 } }}
          >
            <Empty
              image={<ClockCircleOutlined style={{ fontSize: 40, color: token.colorTextQuaternary }} />}
              description={
                <Space direction="vertical" size={4} align="center">
                <Text type="secondary">{t('dashboard.activityComingSoon')}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('dashboard.recentActionsHere')}
                </Text>
                </Space>
              }
            />
          </Card>
        </Col>

        {/* ── AI Insights ──────────────────────────────────────────── */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space size={8}>
                <BulbOutlined style={{ color: '#fa8c16' }} />
                <span>{t('dashboard.aiInsights')}</span>
              </Space>
            }
            style={{ borderRadius: 12, height: '100%' }}
            styles={{ body: { display: 'flex', flexDirection: 'column', minHeight: 200 } }}
          >
            {aiInsight ? (
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    borderLeft: `4px solid ${token.colorPrimary}`,
                    padding: '12px 16px',
                    background: token.colorBgLayout,
                    borderRadius: '0 8px 8px 0',
                    marginBottom: 16,
                  }}
                >
                  <Paragraph
                    style={{
                      margin: 0,
                      color: token.colorText,
                      fontSize: 14,
                      lineHeight: 1.7,
                      fontStyle: 'italic',
                    }}
                  >
                    "{aiInsight}"
                  </Paragraph>
                </div>
                <Button
                  icon={<ReloadOutlined spin={aiLoading} />}
                  onClick={fetchAiInsight}
                  loading={aiLoading}
                  size="small"
                  type="link"
                >
                  Refresh
                </Button>
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, #fa8c16 0%, #ffc53d 100%)`,
                    boxShadow: '0 4px 16px rgba(250, 140, 22, 0.25)',
                  }}
                >
                  <SmileOutlined style={{ fontSize: 28, color: '#fff' }} />
                </div>
                <Text type="secondary" style={{ textAlign: 'center', maxWidth: 240 }}>
                  {t('dashboard.noInsights')}
                </Text>
                <Button
                  type="primary"
                  icon={<BulbOutlined />}
                  onClick={fetchAiInsight}
                  loading={aiLoading}
                  style={{
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #fa8c16, #ffc53d)',
                    border: 'none',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(250, 140, 22, 0.35)',
                  }}
                >
                  {t('dashboard.getAiSummary')}
                </Button>
              </div>
            )}
            {aiLoading && (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Spin tip={t('dashboard.analysingData')} />
              </div>
            )}
          </Card>
        </Col>

        {/* ── Popular Charts ───────────────────────────────────────── */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space size={8}>
                <BarChartOutlined style={{ color: '#722ed1' }} />
                <span>{t('dashboard.popularCharts')}</span>
              </Space>
            }
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => navigate('/charts')}
                icon={<ArrowRightOutlined />}
                style={{ padding: 0 }}
              >
                  {t('dashboard.viewAll')}
                </Button>
            }
            style={{ borderRadius: 12, height: '100%' }}
            styles={{ body: { padding: '12px 24px 24px' } }}
          >
            {chartsLoading ? (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} active paragraph={{ rows: 1 }} title={{ width: '50%' }} />
                ))}
              </Space>
            ) : recentCharts.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size={4} align="center">
                    <Text type="secondary">{t('dashboard.noCharts')}</Text>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => navigate('/charts')}
                      style={{ padding: 0 }}
                    >
                  {t('dashboard.createFirstChart')}
                </Button>
                  </Space>
                }
              />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {recentCharts.map((chart) => (
                  <div
                    key={chart.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: token.colorBgLayout,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      gap: 12,
                    }}
                    onClick={() => navigate('/charts')}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        token.colorPrimaryBg || '#e6f4ff';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = token.colorBgLayout;
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${CHART_TYPE_COLORS[chart.chart_type] || token.colorPrimary}15`,
                          flexShrink: 0,
                        }}
                      >
                        <BarChartOutlined
                          style={{
                            fontSize: 16,
                            color: CHART_TYPE_COLORS[chart.chart_type] || token.colorPrimary,
                          }}
                        />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Text
                          strong
                          ellipsis
                          style={{ display: 'block', fontSize: 14, maxWidth: '100%' }}
                        >
                          {chart.title}
                        </Text>
                        <Tag
                          color={CHART_TYPE_COLORS[chart.chart_type] || 'blue'}
                          style={{ margin: 0, fontSize: 11, borderRadius: 6, lineHeight: '18px' }}
                        >
                          {chart.chart_type}
                        </Tag>
                      </div>
                    </div>
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      style={{ flexShrink: 0, padding: '0 4px' }}
                >
                  {t('dashboard.view')}
                </Button>
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Inline hover styles ────────────────────────────────────── */}
      <style>{`
        .stat-card-hover:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
        }
        .action-card-hover:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
        }
        .action-card-hover:hover .anticon-arrow-right {
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
}
