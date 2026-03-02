import { Activity } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Activity className="w-10 h-10 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">
            ISET Observatory
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          Adaptive Digital Observatory &amp; Data Engine
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Phase 1 — Foundation &amp; Secure Perimeter
        </p>
      </div>
    </div>
  );
}

export default App;
