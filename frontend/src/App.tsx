import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';
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
import ForeignKeyManagerPage from './pages/ForeignKeyManagerPage';
import SavedQueriesPage from './pages/SavedQueriesPage';
import ClientsPage from './pages/ClientsPage';
import ReportsPage from './pages/ReportsPage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import PublicDashboardPage from './pages/PublicDashboardPage';
import PublicSurveyPage from './pages/PublicSurveyPage';

export default function App() {
  return (
    <BrowserRouter>
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/public" element={<PublicDashboardPage />} />
        <Route path="/public/dashboards/:id" element={<PublicDashboardPage />} />
        <Route path="/public/surveys/:id" element={<PublicSurveyPage />} />

        {/* Protected — all nested routes share the Sidebar layout */}
        <Route
          element={
            <ProtectedRoute>
              <NotificationProvider>
                <AppLayout />
              </NotificationProvider>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<RoleRoute roles={['super_admin', 'admin']}><UsersPage /></RoleRoute>} />
          <Route path="roles" element={<RoleRoute roles={['super_admin', 'admin']}><RolesPage /></RoleRoute>} />
          <Route path="clients" element={<RoleRoute roles={['super_admin', 'admin', 'teacher']}><ClientsPage /></RoleRoute>} />
          <Route path="reports" element={<RoleRoute roles={['super_admin', 'admin', 'teacher']}><ReportsPage /></RoleRoute>} />
          <Route path="import" element={<DataImportPage />} />
          <Route path="ai" element={<AIAnalysisPage />} />
          <Route path="charts" element={<ChartBuilderPage />} />
          <Route path="dashboards" element={<DashboardCanvasPage />} />
          <Route path="surveys" element={<SurveyGeneratorPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="explore" element={<DatabaseExplorerPage />} />
          <Route path="explore/:id" element={<TableEditorPage />} />
          <Route path="relations" element={<ForeignKeyManagerPage />} />
          <Route path="queries" element={<SavedQueriesPage />} />
          <Route path="portal" element={<ClientDashboardPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
    </BrowserRouter>
  );
}
