import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Form, Input, Button, Switch, Select, Typography, Alert,
  Avatar, Row, Col, Tooltip, Divider, Space, message, Radio, Segmented,
} from 'antd';
import {
  UserOutlined, LockOutlined, BellOutlined,
  DatabaseOutlined, ExclamationCircleOutlined, InfoCircleOutlined,
  LogoutOutlined, CheckOutlined, FormatPainterOutlined,
} from '@ant-design/icons';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import i18n from '../i18n';
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
  const { t } = useTranslation();
  const { token } = antTheme.useToken();
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const initials = getInitials(user?.fullName || user?.email || '?');

  async function handleSave(values: { fullName: string; email: string }) {
    setSaving(true);
    try {
      const { data } = await api.put('/auth/me', { fullName: values.fullName, email: values.email });
      updateUser({ fullName: data.user.fullName, email: data.user.email });
      message.success(t('settings.updateSuccess'));
    } catch (err: any) {
      message.error(err.response?.data?.message || t('settings.updateFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title={<Space><UserOutlined style={{ color: token.colorPrimary }} /> {t('settings.profile')}</Space>}>
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
      <Form.Item label={t('settings.fullName')} name="fullName" rules={[{ required: true, message: t('settings.enterName') }]}>
        <Input placeholder={t('settings.enterDisplayName')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label={t('settings.email')} name="email" rules={[{ required: true, type: 'email', message: t('settings.enterValidEmail') }]}>
              <Input placeholder="you@example.com" />
            </Form.Item>
          </Col>
      </Row>
      <div style={{ textAlign: 'right' }}>
      <Button type="primary" htmlType="submit" icon={<CheckOutlined />} loading={saving}>
        {t('settings.updateProfile')}
      </Button>
      </div>
    </Form>
    </Card>
  );
}

function PasswordCard() {
  const { t } = useTranslation();
  const { token } = antTheme.useToken();
  const [saving, setSaving] = useState(false);

  async function handleSave(values: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    if (values.newPassword.length < 6) {
      message.error(t('settings.passwordTooShort'));
      return;
    }
    if (values.newPassword !== values.confirmPassword) {
      message.error(t('settings.passwordMismatch'));
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/me/password', { currentPassword: values.currentPassword, newPassword: values.newPassword });
      message.success(t('settings.passwordSuccess'));
    } catch (err: any) {
      message.error(err.response?.data?.message || t('settings.passwordFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title={<Space><LockOutlined style={{ color: token.colorPrimary }} /> {t('settings.changePassword')}</Space>}>
      <Form layout="vertical" onFinish={handleSave}>
        <Form.Item label={t('settings.currentPassword')} name="currentPassword" rules={[{ required: true, message: t('settings.enterCurrentPassword') }]}>
          <Input.Password />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label={t('settings.newPassword')} name="newPassword" rules={[{ required: true, message: t('settings.enterNewPassword') }]}>
              <Input.Password />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label={t('settings.confirmPassword')} name="confirmPassword" rules={[{ required: true, message: t('settings.confirmNewPassword') }]}>
              <Input.Password />
            </Form.Item>
          </Col>
    </Row>
    <div style={{ textAlign: 'right' }}>
      <Button type="primary" htmlType="submit" icon={<LockOutlined />} loading={saving}>
        {t('settings.updatePassword')}
      </Button>
    </div>
  </Form>
    </Card>
  );
}

function ThemeAppearanceCard() {
  const { t } = useTranslation();
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
    <Card title={<Space><FormatPainterOutlined style={{ color: token.colorPrimary }} /> {t('settings.theme')}</Space>}>
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ fontSize: 15 }}>{t('settings.mode')}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>{t('settings.switchLightDark')}</Text>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, padding: '12px 16px', background: token.colorBgElevated, borderRadius: token.borderRadius }}>
          <Space>
            <span style={{ fontSize: 18 }}>{currentTheme === 'dark' ? '🌙' : '☀️'}</span>
            <div>
              <Text strong>{currentTheme === 'dark' ? `${t('settings.dark')} ${t('settings.mode')}` : `${t('settings.light')} ${t('settings.mode')}`}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>{t('settings.preferenceSynced')}</Text>
            </div>
          </Space>
          <Switch
            checked={currentTheme === 'dark'}
            onChange={handleToggle}
            loading={toggling}
          checkedChildren={t('settings.dark')}
          unCheckedChildren={t('settings.light')}
          />
        </div>
      </div>

      <Divider style={{ margin: '0 0 24px' }} />

      <div>
        <Text strong style={{ fontSize: 15 }}>{t('settings.colorScheme')}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>{t('settings.chooseAccentColor')}</Text>
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
        {t(`settings.${scheme.name}`)}
        </Text>
        </div>
        );
        })}
        </div>
      </div>

      <Divider style={{ margin: '0 0 24px' }} />

      <div>
        <Text strong style={{ fontSize: 15 }}>{t('settings.language')}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>{t('settings.languageDesc')}</Text>
        <div style={{ marginTop: 12 }}>
          <Select
            value={i18n.language?.substring(0, 2) || 'fr'}
            onChange={(val) => i18n.changeLanguage(val)}
            style={{ width: 180 }}
            options={[
              { value: 'fr', label: 'Français' },
              { value: 'en', label: 'English' },
            ]}
          />
        </div>
      </div>
    </Card>
  );
}

function NotificationPreferencesCard() {
  const { t } = useTranslation();
  const { token } = antTheme.useToken();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [aiAlerts, setAiAlerts] = useState(false);

  const items: { key: string; label: string; description: string; value: boolean; onChange: (v: boolean) => void }[] = [
    { key: 'email', label: t('settings.emailNotifications'), description: t('settings.emailNotificationsDesc'), value: emailNotifs, onChange: setEmailNotifs },
    { key: 'inapp', label: t('settings.inAppNotifications'), description: t('settings.inAppNotificationsDesc'), value: inAppNotifs, onChange: setInAppNotifs },
    { key: 'ai', label: t('settings.aiQueryAlerts'), description: t('settings.aiQueryAlertsDesc'), value: aiAlerts, onChange: setAiAlerts },
  ];

  return (
    <Card title={<Space><BellOutlined style={{ color: token.colorPrimary }} /> {t('settings.notificationPreferences')}</Space>}>
      <Alert
        type="info"
        message={t('settings.notificationSyncInfo')}
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
  const { t } = useTranslation();
  const { token } = antTheme.useToken();
  const [pageSize, setPageSize] = useState<number>(25);
  const [refreshInterval, setRefreshInterval] = useState<string>('off');
  const [dateFormat, setDateFormat] = useState<string>('DD/MM/YYYY');

  return (
    <Card title={<Space><DatabaseOutlined style={{ color: token.colorPrimary }} /> {t('settings.dataPreferences')}</Space>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
        <Text strong>{t('settings.defaultTablePageSize')}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>{t('settings.defaultTablePageSizeDesc')}</Text>
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
        <Text strong>{t('settings.autoRefreshInterval')}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>{t('settings.autoRefreshIntervalDesc')}</Text>
          <Select
            value={refreshInterval}
            onChange={setRefreshInterval}
            style={{ width: '100%', marginTop: 8 }}
          options={[
            { label: t('settings.off'), value: 'off' },
            { label: t('settings.every30Seconds'), value: '30s' },
            { label: t('settings.every1Minute'), value: '1min' },
            { label: t('settings.every5Minutes'), value: '5min' },
          ]}
          />
        </div>

        <div>
        <Text strong>{t('settings.dateFormat')}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>{t('settings.dateFormatDesc')}</Text>
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
  const { t } = useTranslation();
  const { token } = antTheme.useToken();

  return (
    <Card
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: token.colorError }} />
          <span style={{ color: token.colorError }}>{t('settings.dangerZone')}</span>
        </Space>
      }
      style={{ borderColor: token.colorError, borderWidth: 1 }}
      styles={{ header: { borderColor: token.colorError } }}
    >
      <Alert
        type="warning"
        message={t('settings.dangerZoneWarning')}
        showIcon
        style={{ marginBottom: 20 }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
        <Text strong>{t('settings.deleteAllMyData')}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>{t('settings.deleteAllMyDataDesc')}</Text>
      </div>
      <Tooltip title={t('settings.contactAdministrator')}>
        <Button danger disabled>{t('settings.deleteAllMyData')}</Button>
          </Tooltip>
        </div>
        <Divider style={{ margin: '4px 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
        <Text strong>{t('settings.exportMyData')}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>{t('settings.exportMyDataDesc')}</Text>
      </div>
      <Button icon={<DatabaseOutlined />}>{t('settings.exportMyData')}</Button>
        </div>
      </div>
    </Card>
  );
}

function AppInfoCard() {
  const { t } = useTranslation();
  const { token } = antTheme.useToken();
  const { user, logout } = useAuth();

  const infoItems: { label: string; value: string; rawLabel?: string }[] = [
    { label: t('settings.application'), value: 'ISET Observatory', rawLabel: 'Application' },
    { label: t('settings.version'), value: '1.0.0', rawLabel: 'Version' },
    { label: t('settings.yourRole'), value: (user?.role || '—').replace('_', ' '), rawLabel: 'Your Role' },
  ];

  if (user?.createdAt || user?.created_at) {
    infoItems.push({
      label: t('settings.memberSince'),
      value: new Date(user.createdAt || user.created_at!).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      rawLabel: 'Member Since',
    });
  }

  return (
    <Card title={<Space><InfoCircleOutlined style={{ color: token.colorPrimary }} /> {t('settings.appInfo')}</Space>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {infoItems.map((item) => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary">{item.label}</Text>
            <Text strong style={{ textTransform: item.rawLabel === 'Your Role' ? 'capitalize' : undefined }}>
              {item.value}
            </Text>
          </div>
        ))}
      </div>
      <Divider />
      <Button danger icon={<LogoutOutlined />} onClick={logout} block>
        {t('settings.signOut')}
      </Button>
    </Card>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
      <Title level={3} style={{ margin: 0 }}>{t('settings.title')}</Title>
      <Text type="secondary">{t('settings.manageProfile')}</Text>
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
