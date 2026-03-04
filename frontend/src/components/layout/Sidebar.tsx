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
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col h-screen bg-gray-900 text-gray-300 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-800">
        <Activity className="w-7 h-7 text-blue-400 shrink-0" />
        {!collapsed && (
          <span className="text-lg font-semibold text-white whitespace-nowrap">
            ISET Observatory
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`ml-auto text-gray-500 hover:text-gray-300 transition-transform ${
            collapsed ? 'rotate-180' : ''
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg mx-2 transition-colors ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-gray-800 px-4 py-4">
        {!collapsed && user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors w-full"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
