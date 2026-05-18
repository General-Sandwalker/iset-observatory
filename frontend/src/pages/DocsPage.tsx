import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor, Card, Typography, Button, Tag, Space, Row, Col, Alert,
  Table, Tabs, theme,
} from 'antd';
import { Grid } from 'antd';
import {
  LoginOutlined, DatabaseOutlined, RobotOutlined, BarChartOutlined,
  AppstoreOutlined, FileTextOutlined, SettingOutlined,
  DashboardOutlined, SunOutlined, MoonOutlined,
  ArrowRightOutlined, RightOutlined, BulbOutlined,
  ApiOutlined, RocketOutlined,
} from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const { useBreakpoint } = Grid;
const { Title, Paragraph, Text } = Typography;

interface SectionDef {
  id: string;
  step: number;
  icon: React.ComponentType;
  color: string;
  title: string;
  subtitle: string;
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <Alert
      type="info"
      showIcon
      icon={<BulbOutlined />}
      style={{ marginTop: 16 }}
      message={children}
    />
  );
}

function Code({ children }: { children: string }) {
  const { token } = theme.useToken();
  return (
    <pre
      style={{
        fontSize: 12,
        lineHeight: 1.7,
        padding: 16,
        borderRadius: token.borderRadius,
        overflowX: 'auto',
        marginTop: 12,
        background: token.colorBgElevated,
        color: '#7dd3fc',
        border: `1px solid ${token.colorBorder}`,
        fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
      }}
    >
      <code>{children}</code>
    </pre>
  );
}

function Step({ n, color, children }: { n: number; color: string; children: React.ReactNode }) {
  const { token } = theme.useToken();
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'start', marginTop: 16 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
          background: color + '22',
          color,
          marginTop: 2,
        }}
      >
        {n}
      </div>
      <Paragraph style={{ color: token.colorTextSecondary, margin: 0, paddingTop: 4 }}>
        {children}
      </Paragraph>
    </div>
  );
}

function VisualCard({ label, children }: { label: string; children: React.ReactNode }) {
  const { token } = theme.useToken();
  return (
    <Card
      size="small"
      style={{ marginTop: 16, borderRadius: token.borderRadius }}
      title={
        <Text
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 2,
            color: token.colorTextTertiary,
          }}
        >
          {label}
        </Text>
      }
    >
      {children}
    </Card>
  );
}

const SECTIONS: SectionDef[] = [
  { id: 'login', step: 1, icon: LoginOutlined, color: '#2563eb', title: 'docs.signIn', subtitle: 'docs.signIn.subtitle' },
  { id: 'import', step: 2, icon: DatabaseOutlined, color: '#0891b2', title: 'docs.importData', subtitle: 'docs.importData.subtitle' },
  { id: 'ai', step: 3, icon: RobotOutlined, color: '#7c3aed', title: 'docs.aiAnalysis', subtitle: 'docs.aiAnalysis.subtitle' },
  { id: 'charts', step: 4, icon: BarChartOutlined, color: '#059669', title: 'docs.chartBuilder', subtitle: 'docs.chartBuilder.subtitle' },
  { id: 'dashboards', step: 5, icon: AppstoreOutlined, color: '#d97706', title: 'docs.dashboards', subtitle: 'docs.dashboards.subtitle' },
  { id: 'surveys', step: 6, icon: FileTextOutlined, color: '#db2777', title: 'docs.surveyGenerator', subtitle: 'docs.surveyGenerator.subtitle' },
  { id: 'settings', step: 7, icon: SettingOutlined, color: '#64748b', title: 'docs.settings', subtitle: 'docs.settings.subtitle' },
];

const API_ENDPOINTS = [
  { method: 'POST', path: '/api/auth/login', descriptionKey: 'docs.api.authLogin', auth: 'No' },
  { method: 'GET', path: '/api/auth/me', descriptionKey: 'docs.api.authMe', auth: 'Yes' },
  { method: 'GET', path: '/api/users', descriptionKey: 'docs.api.usersList', auth: 'Yes' },
  { method: 'POST', path: '/api/users', descriptionKey: 'docs.api.usersCreate', auth: 'Yes' },
  { method: 'PUT', path: '/api/users/:id', descriptionKey: 'docs.api.usersUpdate', auth: 'Yes' },
  { method: 'DELETE', path: '/api/users/:id', descriptionKey: 'docs.api.usersDelete', auth: 'Yes' },
  { method: 'GET', path: '/api/roles', descriptionKey: 'docs.api.rolesList', auth: 'Yes' },
  { method: 'POST', path: '/api/roles', descriptionKey: 'docs.api.rolesCreate', auth: 'Yes' },
  { method: 'PUT', path: '/api/roles/:id', descriptionKey: 'docs.api.rolesUpdate', auth: 'Yes' },
  { method: 'DELETE', path: '/api/roles/:id', descriptionKey: 'docs.api.rolesDelete', auth: 'Yes' },
  { method: 'GET', path: '/api/roles/permissions', descriptionKey: 'docs.api.rolesPermissions', auth: 'Yes' },
  { method: 'POST', path: '/api/datasets/upload', descriptionKey: 'docs.api.datasetsUpload', auth: 'Yes' },
  { method: 'GET', path: '/api/datasets', descriptionKey: 'docs.api.datasetsList', auth: 'Yes' },
  { method: 'GET', path: '/api/datasets/:id/preview', descriptionKey: 'docs.api.datasetsPreview', auth: 'Yes' },
  { method: 'POST', path: '/api/ai/ask', descriptionKey: 'docs.api.aiAsk', auth: 'Yes' },
  { method: 'GET', path: '/api/charts', descriptionKey: 'docs.api.chartsList', auth: 'Yes' },
  { method: 'POST', path: '/api/charts', descriptionKey: 'docs.api.chartsCreate', auth: 'Yes' },
  { method: 'GET', path: '/api/dashboards', descriptionKey: 'docs.api.dashboardsList', auth: 'Yes' },
  { method: 'POST', path: '/api/dashboards', descriptionKey: 'docs.api.dashboardsCreate', auth: 'Yes' },
  { method: 'POST', path: '/api/dashboards/:id/export', descriptionKey: 'docs.api.dashboardsExport', auth: 'Yes' },
  { method: 'POST', path: '/api/surveys/generate', descriptionKey: 'docs.api.surveysGenerate', auth: 'Yes' },
  { method: 'GET', path: '/api/surveys', descriptionKey: 'docs.api.surveysList', auth: 'Yes' },
];

const METHOD_COLORS: Record<string, string> = {
  GET: '#059669',
  POST: '#2563eb',
  PUT: '#d97706',
  DELETE: '#dc2626',
  PATCH: '#7c3aed',
};

function SectionContent({ id, color }: { id: string; color: string }): React.ReactNode {
  const { token } = theme.useToken();
  const { t } = useTranslation();

  switch (id) {
  case 'login':
    return (
      <>
        <Paragraph style={{ color: token.colorTextSecondary }}>
          {t('docs.login.description')}
        </Paragraph>
        <VisualCard label={t('docs.login.formFields')}>
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {[t('docs.login.emailAddress'), t('docs.login.password')].map((f) => (
              <div
                key={f}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: token.borderRadius,
                  fontSize: 12,
                  background: token.colorBgLayout,
                  border: `1px solid ${token.colorBorder}`,
                  color: token.colorTextTertiary,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                {f}
              </div>
            ))}
            <Button type="primary" block style={{ marginTop: 8, fontWeight: 600 }}>
              {t('docs.signIn')}
            </Button>
          </Space>
        </VisualCard>
        <Tip>{t('docs.login.tip')}</Tip>
      </>
    );
  case 'import':
    return (
      <>
        <Paragraph style={{ color: token.colorTextSecondary }}>
          {t('docs.import.description')}
        </Paragraph>
        <Step n={1} color={color}>
          {t('docs.import.step1')}
        </Step>
        <Step n={2} color={color}>{t('docs.import.step2')}</Step>
        <Step n={3} color={color}>{t('docs.import.step3')}</Step>
        <VisualCard label={t('docs.import.supportedFormats')}>
          <Space wrap>
            {[t('docs.import.utf8Csv'), t('docs.import.commaSeparated'), t('docs.import.headerRowRequired'), t('docs.import.max50Mb')].map((fmt) => (
              <Tag key={fmt} color={color}>{fmt}</Tag>
            ))}
          </Space>
        </VisualCard>
        <Tip>{t('docs.import.tip')}</Tip>
      </>
    );
  case 'ai':
    return (
      <>
        <Paragraph style={{ color: token.colorTextSecondary }}>
          {t('docs.ai.description')}
        </Paragraph>
        <Step n={1} color={color}>{t('docs.ai.step1')}</Step>
        <Step n={2} color={color}>{t('docs.ai.step2')}</Step>
        <Step n={3} color={color}>{t('docs.ai.step3')}</Step>
        <VisualCard label={t('docs.ai.exampleQueries')}>
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {[
              t('docs.ai.query1'),
              t('docs.ai.query2'),
              t('docs.ai.query3'),
              t('docs.ai.query4'),
            ].map((q) => (
              <div
                key={q}
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: 8,
                  fontSize: 12,
                  padding: 8,
                  borderRadius: token.borderRadius,
                  background: token.colorBgLayout,
                  border: `1px solid ${token.colorBorder}`,
                }}
              >
                <RightOutlined style={{ fontSize: 10, color, marginTop: 3, flexShrink: 0 }} />
                <Text style={{ color: token.colorTextSecondary, fontSize: 12 }}>{q}</Text>
              </div>
            ))}
          </Space>
        </VisualCard>
        <Code>{`// The AI responds with structured JSON
{
  "summary": "The average employment rate across all majors is 72%…",
  "insights": [
    "Computer Science has the highest rate at 91%",
    "Liberal Arts shows a downward trend since 2021"
  ],
  "chartSuggestion": {
    "type": "bar",
    "xAxis": "major",
    "yAxis": "employment_rate"
  }
}`}</Code>
        <Tip>{t('docs.ai.tip')}</Tip>
      </>
    );
  case 'charts':
    return (
      <>
        <Paragraph style={{ color: token.colorTextSecondary }}>
          {t('docs.charts.description')}
        </Paragraph>
        <VisualCard label={t('docs.charts.availableTypes')}>
          <Row gutter={[8, 8]}>
            {[
              { type: t('docs.charts.bar'), icon: '▬' },
              { type: t('docs.charts.line'), icon: '╱' },
              { type: t('docs.charts.pie'), icon: '◕' },
              { type: t('docs.charts.doughnut'), icon: '◎' },
              { type: t('docs.charts.radar'), icon: '✦' },
              { type: t('docs.charts.polarArea'), icon: '◑' },
            ].map(({ type: chartType, icon }) => (
              <Col xs={8} sm={8} md={4} key={chartType}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: 8,
                    borderRadius: token.borderRadius,
                    background: token.colorBgLayout,
                    border: `1px solid ${token.colorBorder}`,
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <Text style={{ color: token.colorTextSecondary, fontSize: 12 }}>{chartType}</Text>
                </div>
              </Col>
            ))}
          </Row>
        </VisualCard>
        <Step n={1} color={color}>{t('docs.charts.step1')}</Step>
        <Step n={2} color={color}>{t('docs.charts.step2')}</Step>
        <Step n={3} color={color}>{t('docs.charts.step3')}</Step>
        <Step n={4} color={color}>{t('docs.charts.step4')}</Step>
        <Tip>{t('docs.charts.tip')}</Tip>
      </>
    );
  case 'dashboards':
    return (
      <>
        <Paragraph style={{ color: token.colorTextSecondary }}>
          {t('docs.dashboards.description')}
        </Paragraph>
        <Step n={1} color={color}>{t('docs.dashboards.step1')}</Step>
        <Step n={2} color={color}>{t('docs.dashboards.step2')}</Step>
        <Step n={3} color={color}>{t('docs.dashboards.step3')}</Step>
        <Step n={4} color={color}>{t('docs.dashboards.step4')}</Step>
        <VisualCard label={t('docs.dashboards.pdfExportIncludes')}>
          <Space direction="vertical" style={{ width: '100%' }} size={4}>
            {[t('docs.dashboards.pdfItem1'), t('docs.dashboards.pdfItem2'), t('docs.dashboards.pdfItem3')].map((i) => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <Text style={{ color: token.colorTextSecondary, fontSize: 12 }}>{i}</Text>
              </div>
            ))}
          </Space>
        </VisualCard>
        <Tip>{t('docs.dashboards.tip')}</Tip>
      </>
    );
  case 'surveys':
    return (
      <>
        <Paragraph style={{ color: token.colorTextSecondary }}>
          {t('docs.surveys.description')}
        </Paragraph>
        <Step n={1} color={color}>{t('docs.surveys.step1')}</Step>
        <Step n={2} color={color}>{t('docs.surveys.step2')}</Step>
        <Step n={3} color={color}>{t('docs.surveys.step3')}</Step>
        <Step n={4} color={color}>{t('docs.surveys.step4')}</Step>
        <Tip>{t('docs.surveys.tip')}</Tip>
      </>
    );
  case 'settings':
    return (
      <>
        <Paragraph style={{ color: token.colorTextSecondary }}>
          {t('docs.settings.description')}
        </Paragraph>
        <VisualCard label={t('docs.settings.sections')}>
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {[
              { label: t('docs.settings.profile'), desc: t('docs.settings.profileDesc') },
              { label: t('docs.settings.password'), desc: t('docs.settings.passwordDesc') },
              { label: t('docs.settings.theme'), desc: t('docs.settings.themeDesc') },
              { label: t('docs.settings.appInfo'), desc: t('docs.settings.appInfoDesc') },
            ].map(({ label, desc }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: token.borderRadius,
                  background: token.colorBgLayout,
                  border: `1px solid ${token.colorBorder}`,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <div>
                  <Text strong style={{ fontSize: 12, display: 'block' }}>{label}</Text>
                  <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>{desc}</Text>
                </div>
              </div>
            ))}
          </Space>
        </VisualCard>
        <Tip>{t('docs.settings.tip')}</Tip>
      </>
    );
    default:
      return null;
  }
}

export default function DocsPage() {
  const navigate = useNavigate();
  const { theme: appTheme, toggleTheme } = useTheme();
  const { token } = theme.useToken();
  const { t } = useTranslation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [active, setActive] = useState('login');
  const [mobileTab, setMobileTab] = useState('login');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const anchorItems = SECTIONS.map(({ id, title }) => ({
    key: id,
    href: `#${id}`,
    title: <Text style={{ fontWeight: active === id ? 600 : 400 }}>{t(title)}</Text>,
  }));

  const mobileTabItems = SECTIONS.map(({ id, step: _step, icon: Icon, title }) => ({
    key: id,
    label: (
      <Space size={4} align="center">
        {React.createElement(Icon as any, { style: { fontSize: 14 } })}
        <span style={{ fontSize: 12 }}>{t(title)}</span>
      </Space>
    ),
  }));

  const apiColumns = [
    {
      title: t('docs.apiColMethod'),
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => (
        <Tag
          color={METHOD_COLORS[method] || '#64748b'}
          style={{ margin: 0, fontWeight: 700, fontSize: 11, fontFamily: 'monospace' }}
        >
          {method}
        </Tag>
      ),
    },
    {
      title: t('docs.apiColEndpoint'),
      dataIndex: 'path',
      key: 'path',
      render: (path: string) => (
        <Text code style={{ fontSize: 12, fontFamily: "'Fira Code', Consolas, monospace" }}>{path}</Text>
      ),
    },
    {
  title: t('docs.apiColDescription'),
  dataIndex: 'descriptionKey',
  key: 'descriptionKey',
  responsive: ['md' as const],
  render: (key: string) => <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>{t(key)}</Text>,
    },
    {
      title: t('docs.apiColAuth'),
      dataIndex: 'auth',
      key: 'auth',
      width: 60,
      align: 'center' as const,
      render: (auth: string) => (
        <Tag
          color={auth === 'Yes' ? 'green' : 'default'}
          style={{ margin: 0, fontSize: 11 }}
        >
          {auth === 'Yes' ? '🔒' : '🌐'}
        </Tag>
      ),
    },
  ];

  const renderSection = (id: string) => {
    const section = SECTIONS.find((s) => s.id === id);
    if (!section) return null;
    const { step, icon: Icon, color, title, subtitle } = section;
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: color + '1a',
            }}
          >
            {React.createElement(Icon as any, { style: { fontSize: 24, color } })}
          </div>
          <div>
            <Space size={8} style={{ marginBottom: 2 }}>
              <Tag
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  margin: 0,
                  background: color + '1a',
                  color,
                  border: 'none',
                  borderRadius: 20,
                }}
              >
          Step {step}
        </Tag>
        <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>{t(subtitle)}</Text>
      </Space>
      <Title level={3} style={{ margin: 0 }}>{t(title)}</Title>
          </div>
        </div>
        <SectionContent id={id} color={color} />
      </>
    );
  };

  return (
    <div id="docs-top" style={{ minHeight: '100vh', background: token.colorBgLayout, color: token.colorText }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '12px 16px' : '16px 24px',
          backdropFilter: 'blur(16px)',
          background: `${token.colorBgElevated}cc`,
          borderBottom: `1px solid ${token.colorBorder}`,
        }}
      >
        <Button
          type="text"
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <DashboardOutlined style={{ fontSize: 18, color: token.colorPrimary }} />
          <Text strong style={{ letterSpacing: 1 }}>ISET Observatory</Text>
        </Button>
        <Space>
          <Button
            type="text"
            icon={appTheme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
          />
          <Button
            type="primary"
            onClick={() => navigate('/login')}
            icon={<ArrowRightOutlined />}
            iconPosition="end"
        >
          {t('docs.signIn')}
        </Button>
        </Space>
      </header>

      {isMobile ? (
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: 24 }}>
            <Tag
              color={token.colorPrimary}
              style={{ marginBottom: 12, fontSize: 12, padding: '4px 12px', borderRadius: 20 }}
        >
          {t('docs.documentation')}
        </Tag>
        <Title level={2} style={{ marginTop: 0, marginBottom: 8 }}>{t('docs.gettingStarted')}</Title>
        <Paragraph style={{ color: token.colorTextSecondary, fontSize: 14 }}>
          {t('docs.followGuide')}
        </Paragraph>
          </div>

          <Tabs
            activeKey={mobileTab}
            onChange={setMobileTab}
            items={mobileTabItems}
            type="card"
            style={{ marginBottom: 24 }}
          />

          <Card style={{ borderRadius: 16, padding: 8 }}>
            {renderSection(mobileTab)}
          </Card>

          <Card
            style={{
              borderRadius: 16,
              textAlign: 'center',
              background: token.colorPrimary,
              border: 'none',
              marginTop: 24,
            }}
          >
            <div style={{ padding: 24 }}>
              <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: 8 }}>
          {t('docs.youreAllSet')}
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 20 }}>
          {t('docs.signInToStart')}
        </Paragraph>
        <Button
          size="large"
          onClick={() => navigate('/login')}
          style={{ fontWeight: 600 }}
        >
          {t('docs.goToSignIn')}
        </Button>
      </div>
    </Card>

    <div style={{ marginTop: 32 }}>
      <Space align="center" size={8} style={{ marginBottom: 16 }}>
        <ApiOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
        <Title level={3} style={{ margin: 0 }}>{t('docs.apiReference')}</Title>
      </Space>
      <Paragraph style={{ color: token.colorTextSecondary, marginBottom: 16 }}>
        {t('docs.apiEndpointsDescription')}
      </Paragraph>
            <div style={{ overflowX: 'auto' }}>
              <Table
                dataSource={API_ENDPOINTS}
                columns={apiColumns}
                rowKey="path"
                pagination={{ pageSize: 10, size: 'small' }}
                size="small"
                style={{ minWidth: 320 }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '48px 32px', display: 'flex', gap: 32 }}>
          <aside style={{ display: 'flex', flexDirection: 'column', width: 224, flexShrink: 0 }}>
            <div style={{ position: 'sticky', top: 96 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  color: token.colorTextTertiary,
                  display: 'block',
                  marginBottom: 16,
                }}
        >
          {t('docs.tutorial')}
        </Text>
              <Anchor
                offsetTop={96}
                items={anchorItems}
                getCurrentAnchor={() => `#${active}`}
                onClick={(e, link) => {
                  e.preventDefault();
                  const id = link.href.replace('#', '');
                  sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </div>
          </aside>

          <main style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: 64 }}>
              <Tag
                color={token.colorPrimary}
                style={{ marginBottom: 16, fontSize: 12, padding: '4px 12px', borderRadius: 20 }}
        >
          {t('docs.documentation')}
        </Tag>
        <Title level={1} style={{ marginTop: 0, marginBottom: 12 }}>{t('docs.gettingStarted')}</Title>
        <Paragraph style={{ color: token.colorTextSecondary, maxWidth: 640, fontSize: 16 }}>
          {t('docs.guideDescription')}
        </Paragraph>
            </div>

            <Space direction="vertical" size={64} style={{ width: '100%' }}>
              {SECTIONS.map(({ id }) => (
                <section
                  key={id}
                  id={id}
                  ref={(el) => { sectionRefs.current[id] = el; }}
                  style={{ scrollMarginTop: 96 }}
                >
                  <Card style={{ borderRadius: 16, padding: 8 }}>
                    {renderSection(id)}
                  </Card>
                </section>
              ))}

              <section id="api-reference" style={{ scrollMarginTop: 96 }}>
                <Space align="center" size={12} style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: '#ea580c1a',
                    }}
                  >
                    <ApiOutlined style={{ fontSize: 24, color: '#ea580c' }} />
                  </div>
                  <div>
                    <Tag
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        margin: 0,
                        background: '#ea580c1a',
                        color: '#ea580c',
                        border: 'none',
                        borderRadius: 20,
                      }}
        >
          {t('docs.reference')}
        </Tag>
        <Title level={3} style={{ margin: 0 }}>{t('docs.apiEndpoints')}</Title>
                  </div>
                </Space>
                <Card style={{ borderRadius: 16, padding: 8 }}>
          <Paragraph style={{ color: token.colorTextSecondary, marginBottom: 16 }}>
          {t('docs.apiEndpointsDescription')}
          </Paragraph>
                  <Table
                    dataSource={API_ENDPOINTS}
                    columns={apiColumns}
                    rowKey="path"
                    pagination={{ pageSize: 10, size: 'small' }}
                    size="small"
                  />
                </Card>
              </section>

              <section id="quickstart" style={{ scrollMarginTop: 96 }}>
                <Space align="center" size={12} style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: '#0891b21a',
                    }}
                  >
                    <RocketOutlined style={{ fontSize: 24, color: '#0891b2' }} />
                  </div>
                  <div>
                    <Tag
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        margin: 0,
                        background: '#0891b21a',
                        color: '#0891b2',
                        border: 'none',
                        borderRadius: 20,
                      }}
        >
          {t('docs.quickStart')}
        </Tag>
        <Title level={3} style={{ margin: 0 }}>{t('docs.gettingStarted5Min')}</Title>
                  </div>
                </Space>
                <Card style={{ borderRadius: 16, padding: 8 }}>
                  <Row gutter={[16, 16]}>
                    {[
        { step: 1, title: t('docs.qs.signIn'), desc: t('docs.qs.signInDesc'), icon: LoginOutlined, color: '#2563eb' },
        { step: 2, title: t('docs.qs.uploadData'), desc: t('docs.qs.uploadDataDesc'), icon: DatabaseOutlined, color: '#0891b2' },
        { step: 3, title: t('docs.qs.askAI'), desc: t('docs.qs.askAIDesc'), icon: RobotOutlined, color: '#7c3aed' },
        { step: 4, title: t('docs.qs.buildCharts'), desc: t('docs.qs.buildChartsDesc'), icon: BarChartOutlined, color: '#059669' },
        { step: 5, title: t('docs.qs.exportShare'), desc: t('docs.qs.exportShareDesc'), icon: AppstoreOutlined, color: '#d97706' },
                    ].map((item) => {
                      const SIcon = item.icon;
                      return (
                        <Col xs={24} sm={12} md={8} lg={8} key={item.step}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'start' }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                background: item.color + '1a',
                              }}
                            >
                              <SIcon style={{ fontSize: 18, color: item.color }} />
                            </div>
                            <div>
                              <Text strong style={{ display: 'block', marginBottom: 2, color: token.colorText }}>
                                {item.step}. {item.title}
                              </Text>
                              <Text style={{ fontSize: 12, color: token.colorTextSecondary, lineHeight: 1.6 }}>
                                {item.desc}
                              </Text>
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </Card>
              </section>

              <Card
                style={{
                  borderRadius: 16,
                  textAlign: 'center',
                  background: token.colorPrimary,
                  border: 'none',
                }}
              >
                <div style={{ padding: 24 }}>
                  <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: 8 }}>
          {t('docs.youreAllSet')}
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 20 }}>
          {t('docs.signInToStart')}
        </Paragraph>
        <Button
          size="large"
          onClick={() => navigate('/login')}
          style={{ fontWeight: 600 }}
        >
          {t('docs.goToSignIn')}
                  </Button>
                </div>
              </Card>
            </Space>
          </main>
        </div>
      )}
    </div>
  );
}
