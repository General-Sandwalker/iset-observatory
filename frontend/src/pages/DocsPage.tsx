import { useEffect, useRef, useState } from 'react';
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
  ApiOutlined, CodeOutlined, RocketOutlined,
} from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';

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
  { id: 'login', step: 1, icon: LoginOutlined, color: '#2563eb', title: 'Sign In', subtitle: 'Access the platform' },
  { id: 'import', step: 2, icon: DatabaseOutlined, color: '#0891b2', title: 'Import Data', subtitle: 'Upload your CSV' },
  { id: 'ai', step: 3, icon: RobotOutlined, color: '#7c3aed', title: 'AI Analysis', subtitle: 'Chat with your data' },
  { id: 'charts', step: 4, icon: BarChartOutlined, color: '#059669', title: 'Chart Builder', subtitle: 'Visualise your data' },
  { id: 'dashboards', step: 5, icon: AppstoreOutlined, color: '#d97706', title: 'Dashboards', subtitle: 'Build & export reports' },
  { id: 'surveys', step: 6, icon: FileTextOutlined, color: '#db2777', title: 'Survey Generator', subtitle: 'Create field studies' },
  { id: 'settings', step: 7, icon: SettingOutlined, color: '#64748b', title: 'Settings', subtitle: 'Customise your account' },
];

const API_ENDPOINTS = [
  { method: 'POST', path: '/api/auth/login', description: 'Authenticate user and receive JWT token', auth: 'No' },
  { method: 'GET', path: '/api/auth/me', description: 'Get current authenticated user profile', auth: 'Yes' },
  { method: 'GET', path: '/api/users', description: 'List all users (admin only)', auth: 'Yes' },
  { method: 'POST', path: '/api/users', description: 'Create a new user', auth: 'Yes' },
  { method: 'PUT', path: '/api/users/:id', description: 'Update a user by ID', auth: 'Yes' },
  { method: 'DELETE', path: '/api/users/:id', description: 'Delete a user by ID', auth: 'Yes' },
  { method: 'GET', path: '/api/roles', description: 'List all roles', auth: 'Yes' },
  { method: 'POST', path: '/api/roles', description: 'Create a new role', auth: 'Yes' },
  { method: 'PUT', path: '/api/roles/:id', description: 'Update a role and its permissions', auth: 'Yes' },
  { method: 'DELETE', path: '/api/roles/:id', description: 'Delete a non-system role', auth: 'Yes' },
  { method: 'GET', path: '/api/roles/permissions', description: 'List all available permissions', auth: 'Yes' },
  { method: 'POST', path: '/api/datasets/upload', description: 'Upload and parse a CSV file', auth: 'Yes' },
  { method: 'GET', path: '/api/datasets', description: 'List all imported datasets', auth: 'Yes' },
  { method: 'GET', path: '/api/datasets/:id/preview', description: 'Preview parsed dataset rows', auth: 'Yes' },
  { method: 'POST', path: '/api/ai/ask', description: 'Send a natural-language query to AI', auth: 'Yes' },
  { method: 'GET', path: '/api/charts', description: 'List saved charts', auth: 'Yes' },
  { method: 'POST', path: '/api/charts', description: 'Create and save a new chart', auth: 'Yes' },
  { method: 'GET', path: '/api/dashboards', description: 'List all dashboards', auth: 'Yes' },
  { method: 'POST', path: '/api/dashboards', description: 'Create a new dashboard', auth: 'Yes' },
  { method: 'POST', path: '/api/dashboards/:id/export', description: 'Export dashboard as PDF', auth: 'Yes' },
  { method: 'POST', path: '/api/surveys/generate', description: 'Generate AI survey from dataset', auth: 'Yes' },
  { method: 'GET', path: '/api/surveys', description: 'List saved surveys', auth: 'Yes' },
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

  switch (id) {
    case 'login':
      return (
        <>
          <Paragraph style={{ color: token.colorTextSecondary }}>
            Open the Observatory in your browser and enter your institutional email and password. Your system
            administrator will have created your account and assigned you a role.
          </Paragraph>
          <VisualCard label="Login form fields">
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {['Email address', 'Password'].map((f) => (
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
                Sign In
              </Button>
            </Space>
          </VisualCard>
          <Tip>If you see a 401 error, your token has expired. Logging out and back in will refresh it.</Tip>
        </>
      );
    case 'import':
      return (
        <>
          <Paragraph style={{ color: token.colorTextSecondary }}>
            Navigate to <Text strong>Data Import</Text> in the sidebar. Drop a
            CSV file onto the upload zone or click to browse. The backend will parse the file, detect column
            types, and store the data in a dynamic table.
          </Paragraph>
          <Step n={1} color={color}>
            Drag your <Text code>.csv</Text> file onto the upload area.
          </Step>
          <Step n={2} color={color}>The parser validates headers and infers data types (number, text, date).</Step>
          <Step n={3} color={color}>Once imported, the dataset appears in the datasets list with row/column counts.</Step>
          <VisualCard label="Supported formats">
            <Space wrap>
              {['UTF-8 CSV', 'Comma-separated', 'Header row required', 'Max 50 MB'].map((t) => (
                <Tag key={t} color={color}>{t}</Tag>
              ))}
            </Space>
          </VisualCard>
          <Tip>Keep the first row as a clean header — no spaces in column names works best with the AI queries.</Tip>
        </>
      );
    case 'ai':
      return (
        <>
          <Paragraph style={{ color: token.colorTextSecondary }}>
            Go to <Text strong>AI Analysis</Text>. Select a dataset, then
            type a natural-language question. The Groq LLM interprets your question, generates a structured
            JSON response with a summary, key insights, and chart suggestions.
          </Paragraph>
          <Step n={1} color={color}>Choose the dataset from the dropdown.</Step>
          <Step n={2} color={color}>Type your question in plain language.</Step>
          <Step n={3} color={color}>The AI returns a summary, bullet insights, and chart recommendations.</Step>
          <VisualCard label="Example AI queries">
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {[
                'What is the average employment rate by major?',
                'Which course has the highest failure rate?',
                'Show me trends in student enrollment over time.',
                'Summarise the key findings from this dataset.',
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
          <Tip>The AI reads the first 100 rows as a sample. If your dataset has patterns in later rows, mention that in your query.</Tip>
        </>
      );
    case 'charts':
      return (
        <>
          <Paragraph style={{ color: token.colorTextSecondary }}>
            Open <Text strong>Chart Builder</Text>. Choose a dataset, pick
            chart type, then select which columns to use as the label and value axes. Save the chart — it will
            be available for placement on a Dashboard.
          </Paragraph>
          <VisualCard label="Available chart types">
            <Row gutter={[8, 8]}>
              {[
                { type: 'Bar', icon: '▬' },
                { type: 'Line', icon: '╱' },
                { type: 'Pie', icon: '◕' },
                { type: 'Doughnut', icon: '◎' },
                { type: 'Radar', icon: '✦' },
                { type: 'Polar Area', icon: '◑' },
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
          <Step n={1} color={color}>Select your dataset and give the chart a descriptive title.</Step>
          <Step n={2} color={color}>Choose the chart type that best represents your data relationship.</Step>
          <Step n={3} color={color}>Map columns to Label (X-axis) and Value (Y-axis).</Step>
          <Step n={4} color={color}>Click <Text italic>Save Chart</Text>. The chart is stored and ready for dashboards.</Step>
          <Tip>For categorical comparisons (e.g. grades by department), Bar charts work best. For proportions, use Pie or Doughnut.</Tip>
        </>
      );
    case 'dashboards':
      return (
        <>
          <Paragraph style={{ color: token.colorTextSecondary }}>
            Go to <Text strong>Dashboards</Text>. Create a new dashboard,
            then add saved charts from the <Text italic>Add Chart</Text> panel. Drag them to rearrange and resize
            freely. When ready, export to PDF.
          </Paragraph>
          <Step n={1} color={color}>Click <Text italic>New Dashboard</Text> and give it a name.</Step>
          <Step n={2} color={color}>Use the panel on the right to add charts to the canvas.</Step>
          <Step n={3} color={color}>Drag cards to rearrange and use the resize handle at the bottom-right.</Step>
          <Step n={4} color={color}>Click <Text italic>Export PDF</Text> to download a formatted A4 landscape report.</Step>
          <VisualCard label="PDF export includes">
            <Space direction="vertical" style={{ width: '100%' }} size={4}>
              {['Dashboard title & export timestamp', 'Data table for each chart (up to 30 rows)', 'Striped formatting & column headers'].map((i) => (
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
          <Tip>Give charts short, descriptive titles — they appear as headings in the exported PDF.</Tip>
        </>
      );
    case 'surveys':
      return (
        <>
          <Paragraph style={{ color: token.colorTextSecondary }}>
            The <Text strong>Survey Generator</Text> uses your imported data
            to draft targeted survey questions via AI. Use these to collect follow-up data from students,
            alumni, or staff.
          </Paragraph>
          <Step n={1} color={color}>Open Survey Generator and select a dataset as the context.</Step>
          <Step n={2} color={color}>Describe what you want to learn (e.g. "alumni career satisfaction").</Step>
          <Step n={3} color={color}>The AI generates 5–10 structured survey questions.</Step>
          <Step n={4} color={color}>Copy the generated questions into your preferred survey tool.</Step>
          <Tip>The AI tailors questions to the columns in your dataset. A dataset with employment data will generate job-related questions automatically.</Tip>
        </>
      );
    case 'settings':
      return (
        <>
          <Paragraph style={{ color: token.colorTextSecondary }}>
            In <Text strong>Settings</Text>, you can update your display
            name, email, change your password, and toggle between the dark and light themes. Your
            preferences are saved to your account.
          </Paragraph>
          <VisualCard label="Settings sections">
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {[
                { label: 'Profile', desc: 'Update your name and email' },
                { label: 'Password', desc: 'Change your login password' },
                { label: 'Theme', desc: 'Switch between Dark and Light modes' },
                { label: 'App Info', desc: 'Version and support details' },
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
          <Tip>Theme preference is stored in your account, so it follows you across devices when you log in.</Tip>
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
    title: <Text style={{ fontWeight: active === id ? 600 : 400 }}>{title}</Text>,
  }));

  const mobileTabItems = SECTIONS.map(({ id, step, icon: Icon, title }) => ({
    key: id,
    label: (
      <Space size={4} align="center">
        <Icon style={{ fontSize: 14 }} />
        <span style={{ fontSize: 12 }}>{title}</span>
      </Space>
    ),
  }));

  const apiColumns = [
    {
      title: 'Method',
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
      title: 'Endpoint',
      dataIndex: 'path',
      key: 'path',
      render: (path: string) => (
        <Text code style={{ fontSize: 12, fontFamily: "'Fira Code', Consolas, monospace" }}>{path}</Text>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      responsive: ['md' as const],
      render: (desc: string) => <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>{desc}</Text>,
    },
    {
      title: 'Auth',
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
            <Icon style={{ fontSize: 24, color }} />
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
              <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>{subtitle}</Text>
            </Space>
            <Title level={3} style={{ margin: 0 }}>{title}</Title>
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
            Sign In
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
              Documentation
            </Tag>
            <Title level={2} style={{ marginTop: 0, marginBottom: 8 }}>Getting Started</Title>
            <Paragraph style={{ color: token.colorTextSecondary, fontSize: 14 }}>
              Follow the step-by-step guide to master ISET Observatory.
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
                You're all set!
              </Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 20 }}>
                Sign in to start importing data and running AI-powered analyses.
              </Paragraph>
              <Button
                size="large"
                onClick={() => navigate('/login')}
                style={{ fontWeight: 600 }}
              >
                Go to Sign In
              </Button>
            </div>
          </Card>

          <div style={{ marginTop: 32 }}>
            <Space align="center" size={8} style={{ marginBottom: 16 }}>
              <ApiOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
              <Title level={3} style={{ margin: 0 }}>API Reference</Title>
            </Space>
            <Paragraph style={{ color: token.colorTextSecondary, marginBottom: 16 }}>
              All REST endpoints available in the ISET Observatory backend.
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
                Tutorial
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
                Documentation
              </Tag>
              <Title level={1} style={{ marginTop: 0, marginBottom: 12 }}>Getting Started</Title>
              <Paragraph style={{ color: token.colorTextSecondary, maxWidth: 640, fontSize: 16 }}>
                This guide walks you through every feature of ISET Observatory — from logging in to exporting
                polished PDF reports. Follow the steps in order for the best experience.
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
                      Reference
                    </Tag>
                    <Title level={3} style={{ margin: 0 }}>API Endpoints</Title>
                  </div>
                </Space>
                <Card style={{ borderRadius: 16, padding: 8 }}>
                  <Paragraph style={{ color: token.colorTextSecondary, marginBottom: 16 }}>
                    All REST endpoints available in the ISET Observatory backend. Endpoints marked with 🔒 require
                    a valid JWT token in the <Text code>Authorization</Text> header.
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
                    Quick Start
                    </Tag>
                    <Title level={3} style={{ margin: 0 }}>Getting Started in 5 Minutes</Title>
                  </div>
                </Space>
                <Card style={{ borderRadius: 16, padding: 8 }}>
                  <Row gutter={[16, 16]}>
                    {[
                      { step: 1, title: 'Sign In', desc: 'Log in with your institutional credentials provided by your admin.', icon: LoginOutlined, color: '#2563eb' },
                      { step: 2, title: 'Upload Data', desc: 'Drag & drop a CSV file. The system auto-detects column types.', icon: DatabaseOutlined, color: '#0891b2' },
                      { step: 3, title: 'Ask AI', desc: 'Query your data in plain language. Get instant insights and chart suggestions.', icon: RobotOutlined, color: '#7c3aed' },
                      { step: 4, title: 'Build Charts', desc: 'Create visualizations and arrange them on a dashboard canvas.', icon: BarChartOutlined, color: '#059669' },
                      { step: 5, title: 'Export & Share', desc: 'Download your dashboard as a formatted PDF report.', icon: AppstoreOutlined, color: '#d97706' },
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
                    You're all set!
                  </Title>
                  <Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 20 }}>
                    Sign in to start importing data and running AI-powered analyses.
                  </Paragraph>
                  <Button
                    size="large"
                    onClick={() => navigate('/login')}
                    style={{ fontWeight: 600 }}
                  >
                    Go to Sign In
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
