import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import DocsPage from './pages/DocsPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import DataImportPage from './pages/DataImportPage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import SurveyGeneratorPage from './pages/SurveyGeneratorPage';
import ChartBuilderPage from './pages/ChartBuilderPage';
import DashboardCanvasPage from './pages/DashboardCanvasPage';
import SettingsPage from './pages/SettingsPage';
import DatabaseExplorerPage from './pages/DatabaseExplorerPage';
import TableEditorPage from './pages/TableEditorPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — all nested routes share the Sidebar layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="import" element={<DataImportPage />} />
            <Route path="ai" element={<AIAnalysisPage />} />
            <Route path="charts" element={<ChartBuilderPage />} />
            <Route path="dashboards" element={<DashboardCanvasPage />} />
            <Route path="surveys" element={<SurveyGeneratorPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="explore" element={<DatabaseExplorerPage />} />
            <Route path="explore/:id" element={<TableEditorPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
