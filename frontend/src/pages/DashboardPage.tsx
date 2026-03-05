import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="w-6 h-6" style={{ color: 'var(--ag-accent)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ag-text)' }}>
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Welcome card */}
        <div className="ag-card col-span-full p-6">
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--ag-text)' }}>
            Welcome back, {user?.fullName}
          </h2>
          <p className="text-sm" style={{ color: 'var(--ag-text2)' }}>
            Role:{' '}
            <span className="font-medium" style={{ color: 'var(--ag-accent)' }}>
              {user?.role}
            </span>
          </p>
        </div>

        {/* Stat cards */}
        {[
          { label: 'Dynamic Tables', value: '—' },
          { label: 'Total Records', value: '—' },
          { label: 'Active Users', value: '—' },
        ].map((card) => (
          <div key={card.label} className="ag-card p-6">
            <p className="text-sm mb-2" style={{ color: 'var(--ag-text2)' }}>
              {card.label}
            </p>
            <p className="text-3xl font-bold" style={{ color: 'var(--ag-text)' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
