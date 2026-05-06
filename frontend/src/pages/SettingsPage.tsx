import { useState } from 'react';
import {
  Card, Form, Input, Button, Switch, Select, Typography, Alert,
  Avatar, Row, Col, Tooltip, Divider, Space, message, Radio, Segmented,
} from 'antd';
import {
  UserOutlined, LockOutlined, BgColorsOutlined, BellOutlined,
  DatabaseOutlined, ExclamationCircleOutlined, InfoCircleOutlined,
  LogoutOutlined, CheckOutlined, FormatPainterOutlined,
} from '@ant-design/icons';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { theme as antTheme } from 'antd';

const { Title, Text } = Typography;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function ProfileCard() {
  const { token } = antTheme.useToken();
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const initials = getInitials(user?.fullName || user?.email || '?');

  async function handleSave(values: { fullName: string; email: string }) {
    setSaving(true);
    setAlert(null);
    try {
      const { data } = await api.put('/auth/me', { fullName: values.fullName, email: values.email });
      updateUser({ fullName: data.user.fullName, email: data.user.email });
      setAlert({ type: 'success', msg: 'Profile updated successfully.' });
    } catch (err: any) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title={<Space><UserOutlined style={{ color: token.colorPrimary }} /> Profile</Space>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
        <Avatar
          size={72}
          style={{
            background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryActive})`,
            fontSize: 28,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials}
        </Avatar>
        <div>
          <Text strong style={{ fontSize: 18 }}>{user?.fullName || 'User'}</Text>
          <br />
          <Text type="secondary">{user?.email}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12, textTransform: 'capitalize' }}>
            {user?.role?.replace('_', ' ')}
          </Text>
        </div>
      </div>
      <Divider style={{ margin: '0 0 24px' }} />
      <Form
        layout="vertical"
        onFinish={handleSave}
        initialValues={{ fullName: user?.fullName ?? '', email: user?.email ?? '' }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Please enter your name' }]}>
              <Input placeholder="Your display name" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Email Address" name="email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
              <Input placeholder="you@example.com" />
            </Form.Item>
          </Col>
        </Row>
        {alert && <Alert type={alert.type} message={alert.msg} showIcon style={{ marginBottom: 16 }} />}
        <div style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" icon={<CheckOutlined />} loading={saving}>
            Save Profile
          </Button>
        </div>
      </Form>
    </Card>
  );
}

function PasswordCard() {
  const { token } = antTheme.useToken();
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  async function handleSave(values: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    setAlert(null);
    if (values.newPassword.length < 6) {
      setAlert({ type: 'error', msg: 'Password must be at least 6 characters.' });
      return;
    }
    if (values.newPassword !== values.confirmPassword) {
      setAlert({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/me/password', { currentPassword: values.currentPassword, newPassword: values.newPassword });
      setAlert({ type: 'success', msg: 'Password changed successfully.' });
    } catch (err: any) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title={<Space><LockOutlined style={{ color: token.colorPrimary }} /> Change Password</Space>}>
      <Form layout="vertical" onFinish={handleSave}>
        <Form.Item label="Current Password" name="currentPassword" rules={[{ required: true, message: 'Enter your current password' }]}>
          <Input.Password />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="New Password" name="newPassword" rules={[{ required: true, message: 'Enter a new password' }]}>
              <Input.Password />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Confirm New Password" name="confirmPassword" rules={[{ required: true, message: 'Confirm your new password' }]}>
              <Input.Password />
            </Form.Item>
          </Col>
        </Row>
        {alert && <Alert type={alert.type} message={alert.msg} showIcon style={{ marginBottom: 16 }} />}
        <div style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" icon={<LockOutlined />} loading={saving}>
            Update Password
          </Button>
        </div>
      </Form>
    </Card>
  );
}

function ThemeAppearanceCard() {
  const { token } = antTheme.useToken();
  const { theme: currentTheme, colorScheme, toggleTheme, applyColorScheme, availableSchemes } = useTheme();
  const [toggling, setToggling] = useState(false);

  async function handleToggle(checked: boolean) {
    setToggling(true);
    toggleTheme();
    const next = checked ? 'dark' : 'light';
    try {
      await api.patch('/auth/me/preferences', { preferences: { theme: next } });
    } catch {
      /* non-critical */
    } finally {
      setToggling(false);
    }
  }

  async function handleSchemeChange(schemeName: string) {
    applyColorScheme(schemeName);
    try {
      await api.patch('/auth/me/preferences', { preferences: { colorScheme: schemeName } });
    } catch {
      /* non-critical */
    }
  }

  return (
    <Card title={<Space><FormatPainterOutlined style={{ color: token.colorPrimary }} /> Theme &amp; Appearance</Space>}>
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ fontSize: 15 }}>Mode</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>Switch between light and dark interface</Text>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, padding: '12px 16px', background: token.colorBgElevated, borderRadius: token.borderRadius }}>
          <Space>
            <span style={{ fontSize: 18 }}>{currentTheme === 'dark' ? '🌙' : '☀️'}</span>
            <div>
              <Text strong>{currentTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>Preference synced to your account</Text>
            </div>
          </Space>
          <Switch
            checked={currentTheme === 'dark'}
            onChange={handleToggle}
            loading={toggling}
            checkedChildren="Dark"
            unCheckedChildren="Light"
          />
        </div>
      </div>

      <Divider style={{ margin: '0 0 24px' }} />

      <div>
        <Text strong style={{ fontSize: 15 }}>Color Scheme</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>Choose the primary accent color for the interface</Text>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 12,
            marginTop: 16,
          }}
        >
          {availableSchemes.map((scheme) => {
            const isActive = colorScheme === scheme.name;
            return (
              <div
                key={scheme.name}
                onClick={() => handleSchemeChange(scheme.name)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: '16px 8px 12px',
                  borderRadius: token.borderRadius,
                  border: isActive
                    ? `2px solid ${scheme.color}`
                    : `2px solid ${token.colorBorderSecondary}`,
                  background: isActive
                    ? `${scheme.color}08`
                    : token.colorBgElevated,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${scheme.color}, ${scheme.color}cc)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive
                      ? `0 4px 12px ${scheme.color}40`
                      : '0 2px 6px rgba(0,0,0,0.1)',
                  }}
                >
                  {isActive && (
                    <CheckOutlined style={{ color: '#fff', fontSize: 20 }} />
                  )}
                </div>
                <Text
                  strong
                  style={{
                    fontSize: 13,
                    color: isActive ? scheme.color : token.colorText,
                  }}
                >
                  {scheme.label}
                </Text>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function NotificationPreferencesCard() {
  const { token } = antTheme.useToken();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [aiAlerts, setAiAlerts] = useState(false);

  const items: { key: string; label: string; description: string; value: boolean; onChange: (v: boolean) => void }[] = [
    { key: 'email', label: 'Email Notifications', description: 'Receive important updates via email', value: emailNotifs, onChange: setEmailNotifs },
    { key: 'inapp', label: 'In-App Notifications', description: 'Show notifications within the app', value: inAppNotifs, onChange: setInAppNotifs },
    { key: 'ai', label: 'AI Query Alerts', description: 'Get notified when AI analysis completes', value: aiAlerts, onChange: setAiAlerts },
  ];

  return (
    <Card title={<Space><BellOutlined style={{ color: token.colorPrimary }} /> Notification Preferences</Space>}>
      <Alert
        type="info"
        message="Notification preferences will be synced to your account soon"
        showIcon
        style={{ marginBottom: 20 }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item) => (
          <div
            key={item.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: token.colorBgElevated,
              borderRadius: token.borderRadius,
            }}
          >
            <div>
              <Text strong>{item.label}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>{item.description}</Text>
            </div>
            <Switch checked={item.value} onChange={item.onChange} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function DataPreferencesCard() {
  const { token } = antTheme.useToken();
  const [pageSize, setPageSize] = useState<number>(25);
  const [refreshInterval, setRefreshInterval] = useState<string>('off');
  const [dateFormat, setDateFormat] = useState<string>('DD/MM/YYYY');

  return (
    <Card title={<Space><DatabaseOutlined style={{ color: token.colorPrimary }} /> Data Preferences</Space>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <Text strong>Default Table Page Size</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>Number of rows shown per page in data tables</Text>
          <Segmented
            options={[
              { label: '25', value: 25 },
              { label: '50', value: 50 },
              { label: '100', value: 100 },
            ]}
            value={pageSize}
            onChange={(v) => setPageSize(v as number)}
            style={{ marginTop: 8 }}
            block
          />
        </div>

        <div>
          <Text strong>Auto-Refresh Interval</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>Automatically refresh dashboard data</Text>
          <Select
            value={refreshInterval}
            onChange={setRefreshInterval}
            style={{ width: '100%', marginTop: 8 }}
            options={[
              { label: 'Off', value: 'off' },
              { label: 'Every 30 seconds', value: '30s' },
              { label: 'Every 1 minute', value: '1min' },
              { label: 'Every 5 minutes', value: '5min' },
            ]}
          />
        </div>

        <div>
          <Text strong>Date Format</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>Preferred date display format across the app</Text>
          <Radio.Group
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            style={{ marginTop: 8 }}
          >
            <Space direction="vertical">
              <Radio value="DD/MM/YYYY">DD/MM/YYYY</Radio>
              <Radio value="MM/DD/YYYY">MM/DD/YYYY</Radio>
              <Radio value="YYYY-MM-DD">YYYY-MM-DD</Radio>
            </Space>
          </Radio.Group>
        </div>
      </div>
    </Card>
  );
}

function DangerZoneCard() {
  const { token } = antTheme.useToken();

  return (
    <Card
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: token.colorError }} />
          <span style={{ color: token.colorError }}>Danger Zone</span>
        </Space>
      }
      style={{ borderColor: token.colorError, borderWidth: 1 }}
      styles={{ header: { borderColor: token.colorError } }}
    >
      <Alert
        type="warning"
        message="These actions are irreversible. Proceed with caution."
        showIcon
        style={{ marginBottom: 20 }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <Text strong>Delete All My Data</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>Permanently remove all your data from the platform</Text>
          </div>
          <Tooltip title="Contact administrator">
            <Button danger disabled>Delete All My Data</Button>
          </Tooltip>
        </div>
        <Divider style={{ margin: '4px 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <Text strong>Export My Data</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>Download a copy of all your data</Text>
          </div>
          <Button icon={<DatabaseOutlined />}>Export My Data</Button>
        </div>
      </div>
    </Card>
  );
}

function AppInfoCard() {
  const { token } = antTheme.useToken();
  const { user, logout } = useAuth();

  const infoItems: { label: string; value: string }[] = [
    { label: 'Application', value: 'ISET Observatory' },
    { label: 'Version', value: '1.0.0' },
    { label: 'Your Role', value: (user?.role || '—').replace('_', ' ') },
  ];

  if (user?.createdAt || user?.created_at) {
    infoItems.push({
      label: 'Member Since',
      value: new Date(user.createdAt || user.created_at!).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    });
  }

  return (
    <Card title={<Space><InfoCircleOutlined style={{ color: token.colorPrimary }} /> App Info</Space>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {infoItems.map((item) => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary">{item.label}</Text>
            <Text strong style={{ textTransform: item.label === 'Your Role' ? 'capitalize' : undefined }}>
              {item.value}
            </Text>
          </div>
        ))}
      </div>
      <Divider />
      <Button danger icon={<LogoutOutlined />} onClick={logout} block>
        Sign out
      </Button>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Settings</Title>
        <Text type="secondary">Manage your profile, security, and preferences.</Text>
      </div>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <ProfileCard />
            <PasswordCard />
            <ThemeAppearanceCard />
            <NotificationPreferencesCard />
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DataPreferencesCard />
            <DangerZoneCard />
            <AppInfoCard />
          </div>
        </Col>
      </Row>
    </div>
  );
}
