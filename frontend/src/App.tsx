import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import DataImportPage from './pages/DataImportPage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import SurveyGeneratorPage from './pages/SurveyGeneratorPage';
import ChartBuilderPage from './pages/ChartBuilderPage';
import DashboardCanvasPage from './pages/DashboardCanvasPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — all nested routes share the Sidebar layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="import" element={<DataImportPage />} />
            <Route path="ai" element={<AIAnalysisPage />} />
            <Route path="charts" element={<ChartBuilderPage />} />
            <Route path="dashboards" element={<DashboardCanvasPage />} />
            <Route path="surveys" element={<SurveyGeneratorPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
