import { ConfigProvider } from 'antd';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { MainLayout } from '@/components/Layout';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { RoomsPage } from '@/pages/RoomsPage';
import { TenantsPage } from '@/pages/TenantsPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { UserRoomsPage } from './pages/UserRoomsPage';
import { MeterReadingsPage } from '@/pages/MeterReadingsPage';
import { ApprovalsPage } from '@/pages/ApprovalsPage';
import { LoginPage } from '@/pages/LoginPage';
import UnlinkedErrorPage from '@/pages/UnlinkedErrorPage';
import BillingPage from '@/pages/BillingPage';
import FinancialDashboardPage from '@/pages/FinancialDashboardPage';
import UserManagementPage from '@/pages/UserManagementPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from './stores';
import { useWebSocketNotifications } from './hooks/useWebSocketNotifications';
import './styles/notifications.css';
import { SettingsPage } from './pages/SettingsPage';

// Main app content that requires authentication
const AppContent = () => {
  const { isLoading, isAuthenticated } = useAuth0();
  const { user: appUser, isAuthenticated: storeAuthenticated, token } = useAuthStore()
  const navigate = useNavigate()

  // Initialize WebSocket notifications (this handles the connection internally)
  const { contextHolder } = useWebSocketNotifications(navigate);

  // console.log('AppContent - Auth0 state:', { isLoading, isAuthenticated, hasAppUser: !!appUser, storeAuthenticated, token});

  // Show loading while Auth0 is initializing
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading application..." />;
  }

  // Check both Auth0 and store authentication state
  if (!isAuthenticated || !storeAuthenticated) {
    return <LoginPage />;
  }

  // Show loading while app user is being set up
  if (!appUser) {
    return <LoadingSpinner fullScreen message="Setting up user..." />;
  }

  // Get user role from app user
  const userRole = appUser.role;

  return (
    <>
      {contextHolder}
      {/* <InvalidateQueriesButton /> */}
      <Routes>
        {/* Public routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/unlinked-error" element={<UnlinkedErrorPage />} />

        {/* Protected routes - require authentication and tenant link */}
        <Route
          path="/"
          element={
            userRole === 'ADMIN' ? (
              <ProtectedRoute requireTenantLink={userRole !== 'ADMIN'}>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            ) : (
              <ProtectedRoute requireTenantLink={true}>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            )
          }
        />
        <Route
          path="/admin"
          element={
            userRole === 'ADMIN' ? (
              <ProtectedRoute requireTenantLink={false}>
                <MainLayout>
                  <AdminDashboardPage />
                </MainLayout>
              </ProtectedRoute>
            ) : (
              <Navigate to="/unauthorized" replace />
            )
          }
        />
        <Route
          path="/rooms"
          element={
            <ProtectedRoute requireTenantLink={userRole !== 'ADMIN'}>
              <MainLayout>
                <RoomsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-rooms"
          element={
            <ProtectedRoute requireTenantLink={true}>
              <MainLayout>
                <UserRoomsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenants"
          element={
            userRole === 'ADMIN' ? (
              <ProtectedRoute requireTenantLink={false}>
                <MainLayout>
                  <TenantsPage />
                </MainLayout>
              </ProtectedRoute>
            ) : (
              <Navigate to="/unauthorized" replace />
            )
          }
        />
        <Route
          path="/meter-readings"
          element={
            <ProtectedRoute requireTenantLink={userRole !== 'ADMIN'}>
              <MainLayout>
                <MeterReadingsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals"
          element={
            userRole === 'ADMIN' ? (
              <ProtectedRoute requireTenantLink={false}>
                <MainLayout>
                  <ApprovalsPage />
                </MainLayout>
              </ProtectedRoute>
            ) : (
              <Navigate to="/unauthorized" replace />
            )
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute requireTenantLink={userRole !== 'ADMIN'}>
              <MainLayout>
                <BillingPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/financial-dashboard"
          element={
            userRole === 'ADMIN' ? (
              <ProtectedRoute requireTenantLink={false}>
                <MainLayout>
                  <FinancialDashboardPage />
                </MainLayout>
              </ProtectedRoute>
            ) : (
              <Navigate to="/unauthorized" replace />
            )
          }
        />
        <Route
          path="/user-management"
          element={
            userRole === 'ADMIN' ? (
              <ProtectedRoute requireTenantLink={false}>
                <MainLayout>
                  <UserManagementPage />
                </MainLayout>
              </ProtectedRoute>
            ) : (
              <Navigate to="/unauthorized" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            userRole === 'ADMIN' ? (
              <ProtectedRoute requireTenantLink={false}>
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
              </ProtectedRoute>
            ) : (
              <Navigate to="/unauthorized" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#3b82f6',
              borderRadius: 8,
            },
          }}
        >
            <AppContent />
        </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;