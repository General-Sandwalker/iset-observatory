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
  ChevronLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/roles', label: 'Roles', icon: Shield },
  { to: '/import', label: 'Data Import', icon: FileSpreadsheet },
  { to: '/ai', label: 'AI Analysis', icon: BrainCircuit },
  { to: '/charts', label: 'Visualizations', icon: BarChart3 },
  { to: '/dashboards', label: 'Dashboards', icon: Columns3 },
  { to: '/surveys', label: 'Surveys', icon: ClipboardList },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`ag-sidebar flex flex-col h-screen shrink-0 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2 px-4 py-5"
        style={{ borderBottom: '1px solid var(--ag-side-border)' }}
      >
        <Activity className="w-6 h-6 shrink-0" style={{ color: 'var(--ag-accent)' }} />
        {!collapsed && (
          <span className="text-sm font-semibold tracking-wide whitespace-nowrap text-white/90">
            ISET Observatory
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`ml-auto transition-transform duration-300 hover:text-white ${
            collapsed ? 'rotate-180' : ''
          }`}
          style={{ color: 'var(--ag-text3)' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'text-white'
                  : 'hover:text-white/90'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: 'var(--ag-accent-lo)',
                    color: 'var(--ag-accent)',
                    boxShadow: 'inset 0 0 0 1px var(--ag-accent)',
                  }
                : { color: 'var(--ag-text3)' }
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4.5 h-4.5 shrink-0" style={{ width: '1.125rem', height: '1.125rem' }} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom controls */}
      <div style={{ borderTop: '1px solid var(--ag-side-border)' }} className="px-3 py-3 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:text-white"
          style={{ color: 'var(--ag-text3)' }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 shrink-0" />
          )}
          {!collapsed && (
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          )}
        </button>

        {/* User info */}
        {!collapsed && user && (
          <div className="px-3 py-1.5">
            <p className="text-xs font-medium text-white/80 truncate">{user.fullName}</p>
            <p className="text-xs truncate" style={{ color: 'var(--ag-text3)' }}>{user.email}</p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:text-red-400"
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
