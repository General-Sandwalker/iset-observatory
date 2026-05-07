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

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ key: '/dashboard', label: 'Dashboard', icon: DashboardOutlined, roles: ['super_admin', 'admin', 'editor', 'viewer', 'teacher'] }],
  },
  {
    label: 'Data',
    items: [
      { key: '/import', label: 'Data Import', icon: ImportOutlined },
      { key: '/explore', label: 'DB Explorer', icon: DatabaseOutlined },
      { key: '/ai', label: 'AI Analysis', icon: RobotOutlined },
      { key: '/queries', label: 'Saved Queries', icon: CodeOutlined },
    ],
  },
  {
    label: 'Visualize',
    items: [
      { key: '/charts', label: 'Charts', icon: BarChartOutlined },
      { key: '/dashboards', label: 'Dashboards', icon: AppstoreOutlined },
    ],
  },
  {
    label: 'Tools',
    items: [
      { key: '/surveys', label: 'Surveys', icon: FileTextOutlined },
      { key: '/relations', label: 'Relations', icon: ApartmentOutlined },
    ],
  },
  {
    label: 'Clients',
    roles: ['super_admin', 'admin', 'teacher'],
    items: [
      { key: '/clients', label: 'Clients', icon: UserOutlined, roles: ['super_admin', 'admin', 'teacher'] },
      { key: '/reports', label: 'Reports', icon: FileSearchOutlined, roles: ['super_admin', 'admin', 'teacher'] },
    ],
  },
  {
    label: 'Admin',
    roles: ['super_admin', 'admin'],
    items: [
      { key: '/users', label: 'Users', icon: TeamOutlined, roles: ['super_admin', 'admin'] },
      { key: '/roles', label: 'Roles', icon: SafetyOutlined, roles: ['super_admin', 'admin'] },
    ],
  },
  {
    label: 'My Portal',
    roles: ['student', 'alumni'],
    items: [
      { key: '/portal', label: 'My Portal', icon: UserOutlined, roles: ['student', 'alumni'] },
    ],
  },
];

const settingsItem: NavItem = {
  key: '/settings',
  label: 'Settings',
  icon: SettingOutlined,
};

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

  const userRole = user?.role;

  const menuItems = useMemo(() => {
    const groups = navGroups
      .filter((group) => isAllowed(group.roles, userRole))
      .map((group) => ({
        type: 'group' as const,
        label: collapsed ? null : group.label,
        children: group.items
          .filter((item) => isAllowed(item.roles, userRole))
          .map(({ key, label, icon: Icon }) => ({
            key,
            icon: <Icon />,
            label,
          })),
      }))
      .filter((group) => group.children.length > 0);

    groups.push({
      type: 'group' as const,
      label: null,
      children: [
        {
          key: settingsItem.key,
          icon: <settingsItem.icon />,
          label: settingsItem.label,
        },
      ],
    });

    return groups;
  }, [collapsed, userRole]);

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
        <Tooltip title="Sign out" placement="right">
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
            {!collapsed && 'Sign out'}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
