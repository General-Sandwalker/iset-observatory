import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Welcome card */}
        <div className="col-span-full bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Welcome back, {user?.fullName}
          </h2>
          <p className="text-sm text-gray-500">
            Role: <span className="font-medium text-gray-700">{user?.role}</span>
          </p>
        </div>

        {/* Placeholder stat cards */}
        {[
          { label: 'Dynamic Tables', value: '—' },
          { label: 'Total Records', value: '—' },
          { label: 'Active Users', value: '—' },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
