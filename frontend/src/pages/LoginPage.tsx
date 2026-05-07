import { useState } from 'react';
import {
  Card, Form, Input, Button, Alert, Spin, Checkbox, Typography,
  Row, Col, Divider, Tooltip, theme, Segmented, Space,
} from 'antd';
import {
  ThunderboltOutlined, MailOutlined, LockOutlined, LoginOutlined,
  RobotOutlined, DatabaseOutlined, BarChartOutlined, SafetyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const features = [
  { icon: <RobotOutlined />, label: 'AI Analysis', description: 'Intelligent data insights & analytics' },
  { icon: <DatabaseOutlined />, label: 'Data Import', description: 'Seamless multi-source data integration' },
  { icon: <BarChartOutlined />, label: 'Chart Builder', description: 'Interactive visualizations & dashboards' },
  { icon: <SafetyOutlined />, label: 'Role-Based Access', description: 'Secure permission management' },
];

type LoginMode = 'staff' | 'client';

export default function LoginPage() {
  const { login, clientLogin, isAuthenticated, isLoading, user } = useAuth();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('staff');
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isAuthenticated) {
    const dest = user?.userType === 'client' ? '/portal' : from;
    return <Navigate to={dest} replace />;
  }

  const handleStaffSubmit = async (values: { email: string; password: string }) => {
    setError('');
    setSubmitting(true);
    try {
      await login({ email: values.email, password: values.password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClientSubmit = async (values: { username: string; password: string }) => {
    setError('');
    setSubmitting(true);
    try {
      await clientLogin({ username: values.username, password: values.password });
      navigate('/portal', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const brandPanelGradient = `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 50%, ${token.colorInfo} 100%)`;

  const brandPanel = (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        background: brandPanelGradient,
        borderRadius: token.borderRadiusLG,
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-40px',
          left: '-40px',
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }}
      />
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.15)',
          border: '2px solid rgba(255,255,255,0.3)',
          marginBottom: 24,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <ThunderboltOutlined style={{ fontSize: 40, color: '#fff' }} />
      </div>

      <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: 8, position: 'relative', zIndex: 1 }}>
        ISET Observatory
      </Title>
      <Paragraph
        style={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: 15,
          maxWidth: 320,
          marginBottom: 40,
          position: 'relative',
          zIndex: 1,
        }}
      >
        Adaptive Digital Observatory for Data Management & AI Analytics
      </Paragraph>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 280, position: 'relative', zIndex: 1 }}>
        {features.map((f) => (
          <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, textAlign: 'left' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: token.borderRadius,
                backgroundColor: 'rgba(255,255,255,0.12)',
                flexShrink: 0,
                fontSize: 18,
              }}
            >
              {f.icon}
            </div>
            <div>
              <Text strong style={{ color: '#fff', fontSize: 14, display: 'block' }}>
                {f.label}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{f.description}</Text>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const mobileLogo = (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: token.colorPrimaryBg,
          border: `1px solid ${token.colorPrimary}`,
          marginBottom: 12,
        }}
      >
        <ThunderboltOutlined style={{ fontSize: 28, color: token.colorPrimary }} />
      </div>
      <Title level={4} style={{ margin: 0, color: token.colorText }}>
        ISET Observatory
      </Title>
    </div>
  );

  const loginForm = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '40px 32px' }}>
      <div style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <Title level={3} style={{ margin: 0, marginBottom: 4 }}>
            Welcome back
          </Title>
          <Text type="secondary">Sign in to your account to continue</Text>
        </div>

        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <Segmented
            value={loginMode}
            onChange={(v) => { setLoginMode(v as LoginMode); setError(''); }}
            options={[
              { label: <Space><MailOutlined /> Staff</Space>, value: 'staff' },
              { label: <Space><UserOutlined /> Client</Space>, value: 'client' },
            ]}
            block
          />
        </div>

        <Card
          style={{
            borderRadius: token.borderRadiusLG,
            boxShadow: token.boxShadowSecondary,
          }}
          styles={{ body: { padding: 0 } }}
        >
          <div style={{ padding: 24 }}>
            {error && (
              <Alert
                type="error"
                message={error}
                showIcon
                closable
                onClose={() => setError('')}
                style={{ marginBottom: 24 }}
              />
            )}

            {loginMode === 'staff' ? (
              <Form layout="vertical" onFinish={handleStaffSubmit} requiredMark={false} initialValues={{ remember: true }}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input prefix={<MailOutlined style={{ color: token.colorTextQuaternary }} />} placeholder="admin@iset-tozeur.tn" size="large" />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: 'Please enter your password' }]}
                >
                  <Input.Password prefix={<LockOutlined style={{ color: token.colorTextQuaternary }} />} placeholder="••••••••" size="large" />
                </Form.Item>

                <Form.Item>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Checkbox name="remember" defaultChecked>
                        Remember me
                      </Checkbox>
                    </Col>
                    <Col>
                      <Tooltip title="Contact your administrator">
                        <Typography.Link disabled style={{ fontSize: 13 }}>
                          Forgot password?
                        </Typography.Link>
                      </Tooltip>
                    </Col>
                  </Row>
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    icon={!submitting ? <LoginOutlined /> : undefined}
                    block
                    size="large"
                  >
                    {submitting ? 'Signing in…' : 'Sign in'}
                  </Button>
                </Form.Item>
              </Form>
            ) : (
              <Form layout="vertical" onFinish={handleClientSubmit} requiredMark={false}>
                <Form.Item
                  label="Username"
                  name="username"
                  rules={[{ required: true, message: 'Please enter your username' }]}
                >
                  <Input prefix={<UserOutlined style={{ color: token.colorTextQuaternary }} />} placeholder="Your username" size="large" />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: 'Please enter your password' }]}
                >
                  <Input.Password prefix={<LockOutlined style={{ color: token.colorTextQuaternary }} />} placeholder="••••••••" size="large" />
                </Form.Item>

                <Form.Item style={{ marginBottom: 8 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    icon={!submitting ? <LoginOutlined /> : undefined}
                    block
                    size="large"
                  >
                    {submitting ? 'Signing in…' : 'Sign in'}
                  </Button>
                </Form.Item>
                <Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: 11 }}>
                  Default password is your CIN number
                </Text>
              </Form>
            )}
          </div>
        </Card>

        <Divider style={{ margin: '24px 0 16px' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ISET Tozeur
          </Text>
        </Divider>
        <Text type="tertiary" style={{ display: 'block', textAlign: 'center', fontSize: 11 }}>
          Adaptive Digital Observatory
        </Text>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <Row style={{ minHeight: '100vh' }} align="stretch">
        <Col
          xs={0}
          lg={12}
          style={{
            padding: 24,
            display: 'flex',
          }}
        >
          {brandPanel}
        </Col>
        <Col
          xs={24}
          lg={12}
          style={{
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            className="lg-hidden"
            style={{
              display: 'block',
              width: '100%',
              maxWidth: 400,
            }}
          >
            <div className="show-on-mobile" style={{ display: 'none' }}>
              {mobileLogo}
            </div>
          </div>
          <div
            style={{
              display: 'block',
              width: '100%',
              maxWidth: 400,
            }}
          >
            <style>{`
              @media (max-width: 991px) {
                .show-on-mobile { display: block !important; }
              }
            `}</style>
            {mobileLogo}
            {loginForm}
          </div>
        </Col>
      </Row>
    </div>
  );
}
