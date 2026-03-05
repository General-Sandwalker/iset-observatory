import { NavLink } from 'react-router-dom';
import {
  Activity,
  LayoutDashboard,
  Users,
  Shield,
  FileSpreadsheet,
  BrainCircuit,
  BarChart3,
  Columns3,
  ClipboardList,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  DatabaseZap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useState } from 'react';

const navGroups = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Data',
    items: [
      { to: '/import', label: 'Data Import', icon: FileSpreadsheet },
      { to: '/explore', label: 'DB Explorer', icon: DatabaseZap },
      { to: '/ai', label: 'AI Analysis', icon: BrainCircuit },
    ],
  },
  {
    label: 'Visualize',
    items: [
      { to: '/charts', label: 'Charts', icon: BarChart3 },
      { to: '/dashboards', label: 'Dashboards', icon: Columns3 },
    ],
  },
  {
    label: 'Tools',
    items: [{ to: '/surveys', label: 'Surveys', icon: ClipboardList }],
  },
  {
    label: 'Admin',
    items: [
      { to: '/users', label: 'Users', icon: Users },
      { to: '/roles', label: 'Roles', icon: Shield },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`ag-sidebar flex flex-col h-screen shrink-0 transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[220px]'
      }`}
      style={{ borderRight: '1px solid var(--ag-side-border)' }}
    >
      {/* ── Brand ── */}
      {collapsed ? (
        <div className="flex items-center justify-center py-4 shrink-0">
          <button
            onClick={() => setCollapsed(false)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: 'var(--ag-text3)' }}
            title="Expand"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 px-3.5 py-4 shrink-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--ag-accent) 0%, var(--ag-accent2, var(--ag-accent)) 100%)',
              boxShadow: '0 2px 8px color-mix(in srgb, var(--ag-accent) 40%, transparent)',
            }}
          >
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold tracking-tight leading-none text-white truncate">
              Observatory
            </p>
            <p className="text-[10px] leading-none mt-0.5 truncate" style={{ color: 'var(--ag-text3)' }}>
              ISET Tozeur
            </p>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: 'var(--ag-text3)' }}
            title="Collapse"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-4 px-2">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p
                className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1"
                style={{ color: 'var(--ag-text3)', opacity: 0.5 }}
              >
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  title={collapsed ? label : undefined}
                  className="relative flex items-center rounded-xl text-[13px] font-medium transition-all duration-150 group"
                  style={({ isActive }) => ({
                    gap: '0.625rem',
                    padding: collapsed ? '0.5rem' : '0.45rem 0.625rem',
                    justifyContent: collapsed ? 'center' : undefined,
                    ...(isActive
                      ? {
                          background: 'var(--ag-accent-lo)',
                          color: 'var(--ag-accent)',
                          boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--ag-accent) 25%, transparent)',
                        }
                      : { color: 'var(--ag-text3)' }),
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && !collapsed && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full"
                          style={{ background: 'var(--ag-accent)' }}
                        />
                      )}
                      <Icon
                        className="shrink-0"
                        style={{
                          width: '1rem',
                          height: '1rem',
                          color: isActive ? 'var(--ag-accent)' : 'inherit',
                        }}
                      />
                      {!collapsed && (
                        <span className={isActive ? 'text-white' : 'group-hover:text-white/90 transition-colors'}>
                          {label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div
        className="shrink-0 px-2 py-3 space-y-0.5"
        style={{ borderTop: '1px solid var(--ag-side-border)' }}
      >
        {/* Theme */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-2.5 w-full rounded-xl text-[13px] transition-colors hover:bg-white/10 hover:text-white ${
            collapsed ? 'justify-center p-2' : 'px-2.5 py-2'
          }`}
          style={{ color: 'var(--ag-text3)' }}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {!collapsed && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
        </button>

        {/* User */}
        {user && (
          <div className={`flex items-center gap-2.5 rounded-xl py-2 ${collapsed ? 'justify-center px-2' : 'px-2.5'}`}>
            <div
              className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, var(--ag-accent), var(--ag-accent2, var(--ag-accent)))',
              }}
            >
              {initials(user.fullName || user.full_name || user.email)}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium leading-none text-white/80 truncate">
                  {user.fullName || user.full_name}
                </p>
                <p className="text-[10px] leading-none mt-0.5 truncate capitalize" style={{ color: 'var(--ag-text3)' }}>
                  {user.role}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className={`flex items-center gap-2.5 w-full rounded-xl text-[13px] transition-colors hover:bg-red-500/10 hover:text-red-400 ${
            collapsed ? 'justify-center p-2' : 'px-2.5 py-2'
          }`}
          style={{ color: 'var(--ag-text3)' }}
          title="Sign out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
