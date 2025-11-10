import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useTenantStatus } from '@/hooks/useTenants';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from './Loading/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireTenantLink?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireTenantLink = true 
}) => {
  const { isAuthenticated, isLoading: authLoading, getAccessTokenSilently } = useAuth0();
  const { token, setToken } = useAuthStore();
  const [tokenReady, setTokenReady] = useState(false);
  const { data: tenantStatus, isLoading: tenantLoading, error } = useTenantStatus();

  // CRITICAL FIX: Ensure we have a valid token before making API calls
  useEffect(() => {
    const ensureToken = async () => {
      if (isAuthenticated && !authLoading) {
        // If no token in store, fetch it immediately
        if (!token) {
          console.log('ProtectedRoute: No token found, fetching...');
          try {
            const freshToken = await getAccessTokenSilently({
              cacheMode: 'off',
            });
            setToken(freshToken);
            console.log('ProtectedRoute: Token fetched and set');
            setTokenReady(true);
          } catch (error) {
            console.error('ProtectedRoute: Failed to get token:', error);
            setTokenReady(false);
          }
        } else {
          setTokenReady(true);
        }
      }
    };

    ensureToken();
  }, [isAuthenticated, authLoading, token, getAccessTokenSilently, setToken]);

  // Show loading while Auth0 is initializing
  if (authLoading) {
    return <LoadingSpinner fullScreen message="Authenticating..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Wait for token to be ready before making API calls
  if (!tokenReady || !token) {
    return <LoadingSpinner fullScreen message="Loading session..." />;
  }

  // If tenant link is required, check tenant status
  if (requireTenantLink) {
    // Show loading while checking tenant status
    if (tenantLoading) {
      return <LoadingSpinner fullScreen message="Checking access..." />;
    }

    // If there's an error checking tenant status
    if (error) {
      console.error('Error checking tenant status:', error);
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
            <h3 className="text-red-800 font-medium">Error checking tenant status</h3>
            <p className="text-red-600 text-sm mt-2">{error.message}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    // Redirect to unlinked error page if user is not linked to a tenant
    if (tenantStatus && !tenantStatus.isLinked) {
      return <Navigate to="/unlinked-error" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;