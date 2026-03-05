import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--ag-bg)' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="p-6 max-w-screen-2xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
