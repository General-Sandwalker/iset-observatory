import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Button, Avatar, Tooltip, theme } from 'antd';
import {
  DashboardOutlined, ImportOutlined, DatabaseOutlined, RobotOutlined,
  BarChartOutlined, AppstoreOutlined, FileTextOutlined, TeamOutlined,
  SafetyOutlined, SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  SunOutlined, MoonOutlined, LogoutOutlined, ThunderboltOutlined,
  ApartmentOutlined, CodeOutlined, UserOutlined, FileSearchOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  isMobile: boolean;
}

type IconComponent = React.ComponentType;

interface NavItem {
  key: string;
  label: string;
  icon: IconComponent;
  roles?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
  roles?: string[];
}

const navGroupDefs = [
  {
    labelKey: 'nav.data',
    items: [
      { key: '/dashboard', labelKey: 'nav.dashboard', icon: DashboardOutlined, roles: ['super_admin', 'admin', 'editor', 'viewer', 'teacher'] },
      { key: '/import', labelKey: 'nav.import', icon: ImportOutlined },
      { key: '/explore', labelKey: 'nav.explore', icon: DatabaseOutlined },
      { key: '/ai', labelKey: 'nav.ai', icon: RobotOutlined },
      { key: '/queries', labelKey: 'nav.queries', icon: CodeOutlined },
    ],
  },
  {
    labelKey: 'nav.analytics',
    items: [
      { key: '/charts', labelKey: 'nav.charts', icon: BarChartOutlined },
      { key: '/dashboards', labelKey: 'nav.dashboards', icon: AppstoreOutlined },
      { key: '/surveys', labelKey: 'nav.surveys', icon: FileTextOutlined },
      { key: '/relations', labelKey: 'nav.relations', icon: ApartmentOutlined },
    ],
  },
  {
    labelKey: 'nav.admin',
    roles: ['super_admin', 'admin', 'teacher'],
    items: [
      { key: '/users', labelKey: 'nav.users', icon: TeamOutlined, roles: ['super_admin', 'admin'] },
      { key: '/roles', labelKey: 'nav.roles', icon: SafetyOutlined, roles: ['super_admin', 'admin'] },
      { key: '/clients', labelKey: 'nav.clients', icon: UserOutlined, roles: ['super_admin', 'admin', 'teacher'] },
      { key: '/reports', labelKey: 'nav.reports', icon: FileSearchOutlined, roles: ['super_admin', 'admin', 'teacher'] },
    ],
  },
  {
    labelKey: 'nav.portal',
    roles: ['student', 'alumni'],
    items: [
      { key: '/portal', labelKey: 'nav.portal', icon: UserOutlined, roles: ['student', 'alumni'] },
    ],
  },
];

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getSelectedKey(pathname: string): string {
  const firstSegment = '/' + pathname.split('/').filter(Boolean)[0];
  return firstSegment || '/dashboard';
}

function isAllowed(allowedRoles: string[] | undefined, userRole: string | undefined): boolean {
  if (!allowedRoles) return true;
  return !!userRole && allowedRoles.includes(userRole);
}

export default function Sidebar({ collapsed, onCollapse, isMobile }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme: currentTheme, toggleTheme, siderTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const { t } = useTranslation();

  const userRole = user?.role;

  const menuItems = useMemo(() => {
    const groups = navGroupDefs
      .filter((group) => isAllowed(group.roles, userRole))
      .map((group) => ({
        type: 'group' as const,
        label: collapsed ? null : t(group.labelKey),
        children: group.items
          .filter((item) => isAllowed(item.roles, userRole))
          .map(({ key, labelKey, icon: Icon }) => ({
            key,
            icon: <Icon />,
            label: t(labelKey),
          })),
      }))
      .filter((group) => group.children.length > 0);

    groups.push({
      type: 'group' as const,
      label: null,
      children: [
        {
          key: '/settings',
          icon: <SettingOutlined />,
          label: t('nav.settings'),
        },
      ],
    });

    return groups;
  }, [collapsed, userRole, t]);

  const selectedKeys = [getSelectedKey(location.pathname)];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Brand header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '16px 0' : '16px 14px',
          flexShrink: 0,
        }}
      >
        {collapsed ? (
          <Tooltip title="Expand" placement="right">
            <Button
              type="text"
              icon={<MenuUnfoldOutlined />}
              onClick={() => onCollapse(false)}
              style={{ color: siderTheme.colorTextTertiary }}
            />
          </Tooltip>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: `linear-gradient(135deg, ${siderTheme.colorPrimary} 0%, ${siderTheme.colorPrimary}cc 100%)`,
                  boxShadow: `0 2px 8px ${siderTheme.colorPrimary}40`,
                }}
              >
                <ThunderboltOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    lineHeight: 1,
                    color: siderTheme.colorText,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Observatory
                </div>
                <div
                  style={{
                    fontSize: 10,
                    lineHeight: 1,
                    marginTop: 4,
                    color: siderTheme.colorTextTertiary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ISET Tozeur
                </div>
              </div>
            </div>
            <Tooltip title="Collapse" placement="right">
              <Button
                type="text"
                size="small"
                icon={<MenuFoldOutlined />}
                onClick={() => onCollapse(true)}
                style={{ color: siderTheme.colorTextTertiary, flexShrink: 0 }}
              />
            </Tooltip>
          </>
        )}
      </div>

      {/* Navigation menu */}
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{
          flex: 1,
          borderInlineEnd: 'none',
          overflow: 'auto',
          overflowX: 'hidden',
        }}
      />

      {/* Bottom section */}
      <div
        style={{
          flexShrink: 0,
          padding: '8px 8px',
          borderTop: `1px solid ${siderTheme.colorBorderSecondary}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {/* Theme toggle */}
        <Tooltip title={currentTheme === 'dark' ? 'Light mode' : 'Dark mode'} placement="right">
          <Button
            type="text"
            block
            icon={currentTheme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            style={{
              color: siderTheme.colorTextTertiary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10,
              borderRadius: token.borderRadius,
            }}
          >
            {!collapsed && (currentTheme === 'dark' ? 'Light mode' : 'Dark mode')}
          </Button>
        </Tooltip>

        {/* User info */}
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: collapsed ? '8px 0' : '8px 10px',
              justifyContent: collapsed ? 'center' : undefined,
              borderRadius: token.borderRadius,
            }}
          >
            <Avatar
              size={28}
              style={{
                background: `linear-gradient(135deg, ${siderTheme.colorPrimary}, ${siderTheme.colorPrimary}cc)`,
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
                borderRadius: 8,
              }}
            >
              {initials(user.fullName || user.full_name || user.email)}
            </Avatar>
            {!collapsed && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    lineHeight: 1,
                    color: siderTheme.colorText,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.fullName || user.full_name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    lineHeight: 1,
                    marginTop: 4,
                    color: siderTheme.colorTextTertiary,
                    textTransform: 'capitalize',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.role}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sign out */}
      <Tooltip title={t('nav.logout')} placement="right">
        <Button
          type="text"
          block
          danger
          icon={<LogoutOutlined />}
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10,
            borderRadius: token.borderRadius,
          }}
        >
          {!collapsed && t('nav.logout')}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
