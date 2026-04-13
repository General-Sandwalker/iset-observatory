import { NavLink } from 'react-router-dom';
import {
  ChartBar,
  ChartPieSlice,
  ChartLine,
  Database,
  Gauge,
  Brain,
  SquaresFour,
  ClipboardText,
  Users,
  ShieldCheck,
  Gear,
  SignOut,
  List,
  X,
  RocketLaunch,
} from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

const navGroups = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: Gauge }],
  },
  {
    label: 'Data',
    items: [
      { to: '/import', label: 'Data Import', icon: Database },
      { to: '/explore', label: 'Explorer', icon: SquaresFour },
      { to: '/ai', label: 'AI Analysis', icon: Brain },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/charts', label: 'Charts', icon: ChartBar },
      { to: '/dashboards', label: 'Dashboards', icon: ChartPieSlice },
      { to: '/surveys', label: 'Survey Manager', icon: ClipboardText },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/users', label: 'Users', icon: Users },
      { to: '/roles', label: 'Roles', icon: ShieldCheck },
      { to: '/settings', label: 'Settings', icon: Gear },
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

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`ag-sidebar flex h-screen shrink-0 flex-col transition-all duration-300 ${
        collapsed ? 'w-[84px]' : 'w-[278px]'
      }`}
    >
      <div className="px-3 pt-4 pb-3 border-b border-white/10">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-900/35">
              <ChartLine size={22} weight="duotone" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-white font-semibold tracking-tight text-sm truncate">ISET Observatory</p>
                <p className="text-slate-300 text-xs truncate">Analytics Workspace</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="btn btn-ghost btn-square btn-sm text-slate-300 hover:text-white"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <List size={18} /> : <X size={18} />}
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && <p className="px-3 pb-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">{group.label}</p>}
            <div className="space-y-1.5">
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    `group flex items-center rounded-xl transition-all duration-150 ${
                      collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-400/30 to-cyan-400/25 text-white shadow-[inset_0_0_0_1px_rgba(45,212,191,0.35)]'
                        : 'text-slate-200 hover:bg-white/8 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} weight="duotone" className="shrink-0" />
                  {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-2.5">
        {user && (
          <div className={`rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 ${collapsed ? 'text-center' : ''}`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-300 to-cyan-400 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0">
                {initials(user.fullName || user.full_name || user.email)}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-sm text-white font-semibold truncate">{user.fullName || user.full_name}</p>
                  <div className="inline-flex items-center gap-1 text-xs text-slate-300 capitalize truncate">
                    <RocketLaunch size={12} weight="fill" />
                    {user.role}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={`btn btn-ghost w-full text-red-300 hover:bg-red-500/15 hover:text-red-200 ${collapsed ? 'btn-square mx-auto' : 'justify-start'}`}
          title="Sign out"
        >
          <SignOut size={18} weight="duotone" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
