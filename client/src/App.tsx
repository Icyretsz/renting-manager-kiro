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
import { LoginPage } from '@/pages/LoginPage';
import { useEffect } from 'react';
import { useAuthStore } from './stores';

// Main app content that requires authentication
const AppContent = () => {
  const { isLoading, isAuthenticated, user } = useAuth0();
  const { token } = useAuthStore()

  console.log('AppContent - Auth0 state:', { isLoading, isAuthenticated, hasUser: !!user });

  useEffect(() => {
    console.log(token)
  }, [token])
  // Show loading while Auth0 is initializing
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading application..." />;
  }

  // If not authenticated, show login page instead of redirecting
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Get user role
  const userRole = user?.roleType[0];

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route
          path="/"
          element={
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          }
        />
        <Route
          path="/admin"
          element={
            userRole === 'ADMIN' ? (
              <MainLayout>
                <AdminDashboardPage />
              </MainLayout>
            ) : (
              <Navigate to="/unauthorized" replace />
            )
          }
        />
        <Route
          path="/rooms"
          element={
            <MainLayout>
              <RoomsPage />
            </MainLayout>
          }
        />
        <Route
          path="/my-rooms"
          element={
            <MainLayout>
              <UserRoomsPage />
            </MainLayout>
          }
        />
        <Route
          path="/tenants"
          element={
            userRole === 'ADMIN' ? (
              <MainLayout>
                <TenantsPage />
              </MainLayout>
            ) : (
              <Navigate to="/unauthorized" replace />
            )
          }
        />
        <Route
          path="/meter-readings"
          element={
            <MainLayout>
              <MeterReadingsPage />
            </MainLayout>
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