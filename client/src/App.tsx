import { ConfigProvider } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { queryClient } from '@/services/queryClient';
import { AuthProvider } from '@/providers/AuthProvider';
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

// Main app content that requires authentication
const AppContent = () => {
  const { isLoading, isAuthenticated } = useAuth0();
  const { user: appUser } = useAuthStore()
  
  // Initialize WebSocket notifications (this handles the connection internally)
  useWebSocketNotifications();

  // console.log('AppContent - Auth0 state:', { isLoading, isAuthenticated, hasAppUser: !!appUser });

  // useEffect(() => {
  //   console.log('Token:', token)
  //   console.log('App User:', appUser)
  // }, [token, appUser])
  
  // Show loading while Auth0 is initializing
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading application..." />;
  }

  // If not authenticated, show login page instead of redirecting
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show loading while app user is being set up
  if (!appUser) {
    return <LoadingSpinner fullScreen message="Setting up user..." />;
  }

  // Get user role from app user
  const userRole = appUser.role;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/unlinked-error" element={<UnlinkedErrorPage />} />
        
        {/* Protected routes - require authentication and tenant link */}
        <Route
          path="/"
          element={
            <ProtectedRoute requireTenantLink={userRole !== 'ADMIN'}>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#3b82f6',
              borderRadius: 8,
            },
          }}
        >
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ConfigProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;