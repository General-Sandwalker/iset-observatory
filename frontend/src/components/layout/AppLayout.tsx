import { useState, useCallback, useMemo } from 'react';
import { Layout, ConfigProvider, theme as antTheme, Badge, Popover, Button, Avatar, Empty, Spin, Tooltip } from 'antd';
import {
  BellOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  CheckOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import type { Notification } from '../../lib/types';

const { Sider, Content } = Layout;

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/import': 'Data Import',
  '/explore': 'DB Explorer',
  '/ai': 'AI Analysis',
  '/charts': 'Chart Builder',
  '/dashboards': 'Dashboards',
  '/surveys': 'Surveys',
  '/users': 'Users',
  '/roles': 'Roles',
  '/settings': 'Settings',
};

function typeIcon(type: Notification['type']) {
  switch (type) {
    case 'info':
      return <InfoCircleOutlined style={{ color: '#2563eb' }} />;
    case 'success':
      return <CheckCircleOutlined style={{ color: '#10b981' }} />;
    case 'warning':
      return <WarningOutlined style={{ color: '#f59e0b' }} />;
    case 'error':
      return <CloseCircleOutlined style={{ color: '#ef4444' }} />;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AppLayout() {
  const { token } = antTheme.useToken();
  const { siderTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const location = useLocation();

  const handleCollapse = useCallback((next: boolean) => {
    setCollapsed(next);
  }, []);

  const handleBreakpoint = useCallback((broken: boolean) => {
    setIsMobile(broken);
    if (broken) {
      setCollapsed(true);
    }
  }, []);

  const pageTitle = useMemo(() => {
    const firstSegment = '/' + location.pathname.split('/').filter(Boolean)[0];
    return ROUTE_TITLES[firstSegment] || 'Observatory';
  }, [location.pathname]);

  const notifContent = (
    <div style={{ width: 340, maxHeight: 420, overflowY: 'auto' }}>
      {unreadCount > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
            paddingBottom: 8,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 13, color: token.colorText }}>
            {unreadCount} unread
          </span>
          <Button type="link" size="small" onClick={markAllRead} style={{ padding: 0 }}>
            Mark all as read
          </Button>
        </div>
      )}
      {loading && notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      ) : notifications.length === 0 ? (
        <Empty description="No notifications" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.read) markRead(n.id);
              }}
              style={{
                display: 'flex',
                gap: 10,
                padding: '10px 8px',
                borderRadius: token.borderRadius,
                cursor: n.read ? 'default' : 'pointer',
                background: n.read ? 'transparent' : `${token.colorPrimary}08`,
                borderLeft: n.read ? '3px solid transparent' : `3px solid ${token.colorPrimary}`,
                transition: 'background 0.15s',
              }}
            >
              <div style={{ flexShrink: 0, marginTop: 2 }}>{typeIcon(n.type)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: n.read ? 400 : 600,
                    fontSize: 13,
                    color: token.colorText,
                    lineHeight: 1.3,
                  }}
                >
                  {n.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: token.colorTextSecondary,
                    lineHeight: 1.4,
                    marginTop: 2,
                  }}
                >
                  {n.message}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: token.colorTextTertiary,
                    marginTop: 4,
                  }}
                >
                  {timeAgo(n.created_at)}
                </div>
              </div>
              {!n.read && (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: token.colorPrimary,
                    flexShrink: 0,
                    marginTop: 6,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Mobile overlay */}
      {isMobile && !collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            zIndex: 99,
          }}
        />
      )}

      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={handleCollapse}
        width={260}
        collapsedWidth={68}
        trigger={null}
        breakpoint="lg"
        onBreakpoint={handleBreakpoint}
        style={{
          position: isMobile ? 'fixed' : undefined,
          left: 0,
          top: 0,
          height: '100vh',
          zIndex: isMobile ? 100 : undefined,
          background: siderTheme.colorBg,
          ...(isMobile && !collapsed ? { boxShadow: '4px 0 24px rgba(0, 0, 0, 0.25)' } : {}),
        }}
      >
        <ConfigProvider
          theme={{
            algorithm: antTheme.darkAlgorithm,
            token: {
              colorPrimary: siderTheme.colorPrimary,
              colorBgContainer: siderTheme.colorBg,
              colorBgElevated: siderTheme.colorBg,
              colorBgLayout: siderTheme.colorBg,
              colorText: siderTheme.colorText,
              colorTextSecondary: siderTheme.colorTextSecondary,
              colorTextTertiary: siderTheme.colorTextTertiary,
              colorBorder: siderTheme.colorBorder,
              colorBorderSecondary: siderTheme.colorBorderSecondary,
            },
            components: {
              Menu: {
                darkItemBg: 'transparent',
                darkSubMenuItemBg: 'transparent',
                darkItemHoverBg: `${siderTheme.colorPrimary}18`,
                darkItemSelectedBg: `${siderTheme.colorPrimary}28`,
                darkItemActiveBg: `${siderTheme.colorPrimary}38`,
                itemBorderRadius: 8,
                darkItemColor: siderTheme.colorTextSecondary,
                darkItemSelectedColor: siderTheme.colorText,
                itemMarginInline: 4,
                groupMarginBottom: 0,
              },
              Button: {
                colorText: siderTheme.colorTextSecondary,
                colorTextHover: siderTheme.colorText,
                defaultBg: 'transparent',
                defaultBorderColor: siderTheme.colorBorder,
                colorBorder: siderTheme.colorBorder,
                colorPrimary: siderTheme.colorPrimary,
                algorithm: true,
              },
              Tooltip: {
                colorBgSpotlight: siderTheme.colorBg,
              },
              Avatar: {
                colorBgContainer: siderTheme.colorPrimary,
              },
            },
          }}
        >
          <Sidebar collapsed={collapsed} onCollapse={handleCollapse} isMobile={isMobile} />
        </ConfigProvider>
      </Sider>

      <Layout
        style={{
          marginLeft: isMobile ? 0 : undefined,
          transition: isMobile ? undefined : 'margin-left 0.2s',
        }}
      >
        {/* Sticky header bar */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            padding: '0 24px',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && collapsed && (
              <Button
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setCollapsed(false)}
                style={{ color: token.colorTextTertiary }}
              />
            )}
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: token.colorText,
                letterSpacing: '-0.01em',
              }}
            >
              {pageTitle}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Popover
              open={notifOpen}
              onOpenChange={setNotifOpen}
              trigger="click"
              placement="bottomRight"
              title="Notifications"
              content={notifContent}
            >
              <Tooltip title="Notifications">
                <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                  <Button
                    type="text"
                    icon={<BellOutlined style={{ fontSize: 18 }} />}
                    style={{ color: token.colorTextSecondary }}
                  />
                </Badge>
              </Tooltip>
            </Popover>

            {user && (
              <Tooltip title={user.fullName || user.full_name || user.email}>
                <Avatar
                  size={32}
                  style={{
                    background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorInfo})`,
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  {initials(user.fullName || user.full_name || user.email)}
                </Avatar>
              </Tooltip>
            )}
          </div>
        </div>

        <Content
          style={{
            padding: 24,
            overflow: 'auto',
            background: token.colorBgLayout,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
