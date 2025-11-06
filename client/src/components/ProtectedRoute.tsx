import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useTenantStatus } from '@/hooks/useTenants';
import {LoadingSpinner} from './Loading/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireTenantLink?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireTenantLink = true 
}) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth0();
  const { data: tenantStatus, isLoading: tenantLoading, error } = useTenantStatus();

  // console.log('ProtectedRoute:', { 
  //   isAuthenticated, 
  //   authLoading, 
  //   tenantLoading, 
  //   tenantStatus, 
  //   error: error?.message,
  //   requireTenantLink 
  // });

  // Show loading while Auth0 is initializing
  if (authLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If tenant link is required, check tenant status
  if (requireTenantLink) {
    // Show loading while checking tenant status
    if (tenantLoading) {
      return <LoadingSpinner fullScreen />;
    }

    // If there's an error checking tenant status, log it and show error details
    if (error) {
      console.error('Error checking tenant status:', error);
      // For debugging, let's show the error instead of allowing access
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
            <h3 className="text-red-800 font-medium">Error checking tenant status</h3>
            <p className="text-red-600 text-sm mt-2">{error.message}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-sm"
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