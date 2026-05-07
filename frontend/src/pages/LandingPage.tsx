import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Card, Typography, Space, Tag, Row, Col, Switch,
  Drawer, List, Divider,
} from 'antd';
import {
  ThunderboltOutlined, RobotOutlined, BarChartOutlined,
  DatabaseOutlined, AppstoreOutlined, FileTextOutlined,
  SafetyOutlined, ArrowRightOutlined, BookOutlined,
  MenuOutlined, CheckCircleOutlined, StarOutlined,
  GlobalOutlined, TeamOutlined, CodeOutlined,
  GithubOutlined, CopyrightOutlined,
} from '@ant-design/icons';
import { Grid, theme } from 'antd';
import { useTheme } from '../contexts/ThemeContext';

const { useBreakpoint } = Grid;
const { Title, Text, Paragraph } = Typography;

const FEATURES = [
  {
    icon: DatabaseOutlined,
    title: 'CSV Data Import',
    desc: 'Upload and parse any CSV dataset instantly. The system auto-detects column types and prepares your data for analysis.',
    color: '#2563eb',
  },
  {
    icon: RobotOutlined,
    title: 'AI Analysis',
    desc: 'Ask questions about your data in plain language. Powered by Groq LLMs, the AI returns structured insights and summaries.',
    color: '#7c3aed',
  },
  {
    icon: BarChartOutlined,
    title: 'Chart Builder',
    desc: 'Create bar, line, pie, radar, polar-area, and doughnut charts from any imported dataset with a few clicks.',
    color: '#0891b2',
  },
  {
    icon: AppstoreOutlined,
    title: 'Dashboard Canvas',
    desc: 'Drag, resize, and arrange charts on a free-form canvas. Export the whole dashboard to a PDF report in one click.',
    color: '#059669',
  },
  {
    icon: FileTextOutlined,
    title: 'Survey Generator',
    desc: 'AI drafts targeted surveys based on your dataset. Copy, share, or embed questions to collect follow-up field data.',
    color: '#d97706',
  },
  {
    icon: SafetyOutlined,
    title: 'Role-Based Access',
    desc: 'Assign granular permissions to users via custom roles. Keep sensitive data restricted to the right people.',
    color: '#dc2626',
  },
];

const TECH = ['React 19', 'TypeScript', 'Vite', 'Express.js', 'PostgreSQL', 'Groq LLM', 'Chart.js', 'jsPDF'];

const STATS = [
  { value: '500+', label: 'Datasets Analyzed', icon: DatabaseOutlined },
  { value: '50+', label: 'Organizations', icon: GlobalOutlined },
  { value: '99.9%', label: 'Uptime', icon: CheckCircleOutlined },
];

const TESTIMONIALS = [
  {
    name: 'Dr. Amira Bensalah',
    role: 'Research Director, University of Tunis',
    text: 'ISET Observatory transformed how our team analyzes institutional data. The AI-powered queries saved us weeks of manual work.',
    initials: 'AB',
    color: '#2563eb',
  },
  {
    name: 'Prof. Karim Mehdi',
    role: 'Dean of Sciences, ENIT',
    text: 'The dashboard builder is remarkably intuitive. We went from raw CSVs to presentation-ready PDFs in under an hour.',
    initials: 'KM',
    color: '#7c3aed',
  },
  {
    name: 'Sana Trabelsi',
    role: 'Data Analyst, Ministry of Education',
    text: 'Role-based access gives us confidence that sensitive student data stays protected while still enabling collaboration.',
    initials: 'ST',
    color: '#059669',
  },
];

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Docs', href: '/docs' },
  { label: 'Sign In', href: '/login' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme: mode, toggleTheme } = useTheme();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = !screens.md;

  const scrollToDocs = () => {
    if (window.location.pathname !== '/docs') {
      navigate('/docs');
    } else {
      document.getElementById('docs-top')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navTo = (href: string) => {
    setDrawerOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(href);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: token.colorBgLayout, color: token.colorText }}>
      {/* Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '12px 20px' : '16px 48px',
          backdropFilter: 'blur(16px)',
          background: `${token.colorBgContainer}cc`,
          borderBottom: `1px solid ${token.colorBorder}`,
        }}
      >
        <Space size={8} align="center">
          <ThunderboltOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
          <Text strong style={{ letterSpacing: '0.04em', color: token.colorText }}>
            ISET Observatory
          </Text>
        </Space>

        {isMobile ? (
          <Space size={8} align="center">
            <Switch
              checked={mode === 'dark'}
              onChange={toggleTheme}
              checkedChildren="🌙"
              unCheckedChildren="☀️"
            />
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
              style={{ fontSize: 18 }}
            />
          </Space>
        ) : (
          <Space size={12} align="center">
            <Button type="text" onClick={() => navTo('#features')} style={{ color: token.colorTextSecondary }}>
              Features
            </Button>
            <Button type="text" onClick={() => navigate('/public')} style={{ color: token.colorTextSecondary }}>
              Public Dashboards
            </Button>
            <Button onClick={() => navigate('/docs')} style={{ borderColor: token.colorBorder }}>
              Docs
            </Button>
            <Switch
              checked={mode === 'dark'}
              onChange={toggleTheme}
              checkedChildren="🌙"
              unCheckedChildren="☀️"
            />
            <Button type="primary" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </Space>
        )}
      </header>

      {/* Mobile Drawer */}
      <Drawer
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={260}
        styles={{ body: { padding: 0 } }}
      >
        <List
          dataSource={NAV_LINKS}
          renderItem={(item) => (
            <List.Item
              style={{ cursor: 'pointer', padding: '16px 24px' }}
              onClick={() => navTo(item.href)}
            >
              <Text strong style={{ fontSize: 16 }}>{item.label}</Text>
            </List.Item>
          )}
        />
      </Drawer>

      {/* Hero */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: isMobile ? '64px 20px 48px' : '112px 48px 96px',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              top: -128,
              left: -128,
              width: 500,
              height: 500,
              borderRadius: '50%',
              opacity: 0.2,
              filter: 'blur(64px)',
              background: `radial-gradient(circle, ${token.colorPrimary}, transparent)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 40,
              right: 0,
              width: 400,
              height: 400,
              borderRadius: '50%',
              opacity: 0.15,
              filter: 'blur(64px)',
              background: 'radial-gradient(circle, #7c3aed, transparent)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '33%',
              width: 300,
              height: 300,
              borderRadius: '50%',
              opacity: 0.1,
              filter: 'blur(64px)',
              background: 'radial-gradient(circle, #0891b2, transparent)',
            }}
          />
        </div>

        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Row gutter={[24, 24]} align="middle" style={{ minHeight: isMobile ? undefined : 200 }}>
            <Col xs={24} md={24}>
              <Space
                size={6}
                align="center"
                style={{
                  display: 'inline-flex',
                  padding: '4px 12px',
                  borderRadius: 20,
                  marginBottom: 32,
                  background: `${token.colorPrimary}22`,
                  border: `1px solid ${token.colorPrimary}44`,
                }}
              >
                <ThunderboltOutlined style={{ color: token.colorPrimary, fontSize: 12 }} />
                <Text style={{ fontSize: 12, color: token.colorPrimary, fontWeight: 500 }}>
                  Institutional Data Observatory
                </Text>
              </Space>

              <Title
                level={1}
                style={{
                  fontSize: isMobile ? '2.2rem' : '3.5rem',
                  fontWeight: 900,
                  lineHeight: 1.15,
                  marginBottom: 24,
                  color: token.colorText,
                }}
              >
                Understand your data
                <br />
                <span style={{ color: token.colorPrimary }}>intelligently.</span>
              </Title>

              <Paragraph
                style={{
                  fontSize: isMobile ? 15 : 18,
                  lineHeight: 1.7,
                  maxWidth: 560,
                  margin: '0 auto 40px',
                  color: token.colorTextSecondary,
                }}
              >
                Import CSVs, query with AI, build beautiful charts, and generate shareable dashboards
                — all in one open-source academic analytics platform.
              </Paragraph>

              <Space size={12} wrap style={{ justifyContent: 'center' }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => navigate('/login')}
                  icon={<ArrowRightOutlined />}
                  iconPosition="end"
                  style={{ height: 48, paddingInline: 28, borderRadius: 12, fontWeight: 600 }}
                >
                  Get Started
                </Button>
                <Button
                  size="large"
                  onClick={scrollToDocs}
                  icon={<BookOutlined />}
                  style={{ height: 48, paddingInline: 28, borderRadius: 12, fontWeight: 600 }}
                >
                  View Docs
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
      </section>

      {/* Stats Bar */}
      <section
        style={{
          padding: isMobile ? '32px 20px' : '32px 48px',
          background: token.colorBgContainer,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Row gutter={[16, 24]} justify="center" align="middle">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <Col xs={24} sm={8} key={stat.label} style={{ textAlign: 'center' }}>
                <Space size={12} align="center">
                  <Icon style={{ fontSize: 22, color: token.colorPrimary }} />
                  <div>
                    <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: token.colorText, lineHeight: 1.2 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 12, color: token.colorTextSecondary, fontWeight: 500 }}>
                      {stat.label}
                    </div>
                  </div>
                </Space>
              </Col>
            );
          })}
        </Row>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: isMobile ? '48px 20px' : '64px 48px 80px' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto' }}>
          <Title
            level={2}
            style={{ textAlign: 'center', marginBottom: 8, color: token.colorText, fontSize: isMobile ? 24 : undefined }}
          >
            Everything you need
          </Title>
          <Paragraph
            style={{ textAlign: 'center', marginBottom: 40, color: token.colorTextSecondary }}
          >
            A complete analytics toolkit built for academic institutions.
          </Paragraph>

          <Row gutter={[20, 20]}>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Col xs={24} sm={12} lg={8} key={f.title}>
                  <Card
                    bordered
                    style={{
                      borderRadius: token.borderRadiusLG,
                      background: token.colorBgContainer,
                      borderColor: token.colorBorder,
                      overflow: 'hidden',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'default',
                    }}
                    styles={{
                      body: {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        padding: 0,
                      },
                    }}
                    hoverable
                  >
                    <div
                      style={{
                        height: 4,
                        background: `linear-gradient(90deg, ${f.color}, ${f.color}88)`,
                      }}
                    />
                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${f.color}1a`,
                        }}
                      >
                        <Icon style={{ color: f.color, fontSize: 20 }} />
                      </div>
                      <Text strong style={{ color: token.colorText }}>
                        {f.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          lineHeight: 1.7,
                          color: token.colorTextSecondary,
                        }}
                      >
                        {f.desc}
                      </Text>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      </section>

      {/* Testimonials */}
      <section
        style={{
          padding: isMobile ? '48px 20px' : '64px 48px 80px',
          background: token.colorBgContainer,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div style={{ maxWidth: 1024, margin: '0 auto' }}>
          <Title
            level={2}
            style={{ textAlign: 'center', marginBottom: 8, color: token.colorText, fontSize: isMobile ? 24 : undefined }}
          >
            Trusted by researchers
          </Title>
          <Paragraph
            style={{ textAlign: 'center', marginBottom: 40, color: token.colorTextSecondary }}
          >
            Hear from institutions already using ISET Observatory.
          </Paragraph>

          <Row gutter={[20, 20]}>
            {TESTIMONIALS.map((t) => (
              <Col xs={24} md={8} key={t.name}>
                <Card
                  style={{
                    borderRadius: token.borderRadiusLG,
                    background: token.colorBgLayout,
                    borderColor: token.colorBorder,
                    height: '100%',
                  }}
                  styles={{ body: { display: 'flex', flexDirection: 'column', gap: 16, padding: 24 } }}
                >
                  <Space align="center" size={12}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(135deg, ${t.color}, ${t.color}88)`,
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <Text strong style={{ display: 'block', fontSize: 13 }}>{t.name}</Text>
                      <Text style={{ fontSize: 11, color: token.colorTextTertiary }}>{t.role}</Text>
                    </div>
                  </Space>
                  <Paragraph
                    style={{
                      margin: 0,
                      fontSize: 13,
                      lineHeight: 1.7,
                      color: token.colorTextSecondary,
                      fontStyle: 'italic',
                    }}
                  >
                    "{t.text}"
                  </Paragraph>
                  <Space size={4} style={{ marginTop: 'auto' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <StarOutlined key={s} style={{ color: '#f59e0b', fontSize: 12 }} />
                    ))}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: isMobile ? '48px 20px' : '80px 48px' }}>
        <div
          style={{
            maxWidth: 896,
            margin: '0 auto',
            borderRadius: 16,
            padding: isMobile ? '48px 24px' : '64px 40px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${token.colorPrimary}, #7c3aed, #0891b2)`,
            color: '#fff',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div
              style={{
                position: 'absolute',
                top: -80,
                right: -80,
                width: 256,
                height: 256,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                filter: 'blur(48px)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -40,
                left: -40,
                width: 192,
                height: 192,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                filter: 'blur(48px)',
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Title level={2} style={{ color: '#fff', fontWeight: 900, marginBottom: 12, fontSize: isMobile ? 22 : undefined }}>
              Ready to unlock the power of your institutional data?
            </Title>
            <Paragraph
              style={{
                color: 'rgba(255,255,255,0.85)',
                marginBottom: 24,
                fontSize: isMobile ? 14 : 16,
                maxWidth: 520,
                margin: '0 auto 24px',
              }}
            >
              Join dozens of research teams already using AI-driven analytics to make smarter, faster decisions.
              Sign in with your institutional account or request access today.
            </Paragraph>
            <Space size={12} wrap>
              <Button
                size="large"
                onClick={() => navigate('/login')}
                style={{
                  height: 48,
                  paddingInline: 32,
                  borderRadius: 12,
                  fontWeight: 600,
                  background: '#fff',
                  color: token.colorPrimary,
                  border: 'none',
                }}
              >
                Sign In Now
              </Button>
              <Button
                size="large"
                ghost
                onClick={scrollToDocs}
                icon={<BookOutlined />}
                style={{
                  height: 48,
                  paddingInline: 28,
                  borderRadius: 12,
                  fontWeight: 600,
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.4)',
                }}
              >
                Read the Docs
              </Button>
            </Space>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: isMobile ? '32px 20px' : '32px 48px',
          borderTop: `1px solid ${token.colorBorder}`,
        }}
      >
        <Row gutter={[16, 24]} align="middle" justify="space-between" style={{ maxWidth: 1152, margin: '0 auto' }}>
          <Col xs={24} sm={8} style={{ textAlign: isMobile ? 'center' : 'left' }}>
            <Space size={8} align="center">
              <ThunderboltOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
              <Text strong style={{ color: token.colorText, letterSpacing: '0.04em' }}>
                ISET Observatory
              </Text>
            </Space>
            <div style={{ marginTop: 12 }}>
              <Space size={12}>
                <Button type="text" size="small" icon={<GithubOutlined />} style={{ color: token.colorTextSecondary }}>
                  GitHub
                </Button>
                <Button type="text" size="small" icon={<BookOutlined />} onClick={() => navigate('/docs')} style={{ color: token.colorTextSecondary }}>
                  Docs
                </Button>
                <Button type="text" size="small" icon={<TeamOutlined />} style={{ color: token.colorTextSecondary }}>
                  Team
                </Button>
              </Space>
            </div>
          </Col>

          <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
            <Space size={[6, 6]} wrap style={{ justifyContent: 'center' }}>
              {TECH.map((t) => (
                <Tag
                  key={t}
                  style={{
                    margin: 0,
                    borderColor: token.colorBorder,
                    color: token.colorTextSecondary,
                    background: token.colorBgContainer,
                  }}
                >
                  <CodeOutlined style={{ marginRight: 4 }} />
                  {t}
                </Tag>
              ))}
            </Space>
          </Col>

          <Col xs={24} sm={8} style={{ textAlign: isMobile ? 'center' : 'right' }}>
            <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>
              <CopyrightOutlined /> {new Date().getFullYear()} ISET Observatory. All rights reserved.
            </Text>
          </Col>
        </Row>
      </footer>
    </div>
  );
}
