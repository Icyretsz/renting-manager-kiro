import { useEffect } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { useAuthStore } from '@/stores/authStore';
import { auth0Config } from '@/config/auth0';
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging';
import { User } from '@/types';

interface AuthProviderProps {
  children: React.ReactNode;
}

// Auth0 integration component to sync tokens
const Auth0Integration = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, getAccessTokenSilently, isLoading } = useAuth0();
  const { login, logout, setToken } = useAuthStore();
  
  // Initialize Firebase messaging when user is authenticated
  useFirebaseMessaging();

  // Sync auth state on mount and when authentication changes
  useEffect(() => {
    const syncAuthState = async () => {
      // Don't sync while Auth0 is still loading
      if (isLoading) {
        console.log('Auth0Integration: Auth0 still loading, waiting...');
        return;
      }

      if (isAuthenticated && user) {
        try {
          console.log('Auth0Integration: Syncing authenticated user to store');
          const token = await getAccessTokenSilently({
            // Use cache-first for better mobile performance
            cacheMode: 'on'
          });
          console.log('Auth0Integration: Got access token:', token ? 'Token received' : 'No token');
          
          const appUser: User = {
            id: user.sub || '',
            auth0Id: user.sub || '',
            email: user.email || '',
            name: user.name || user.nickname || '',
            role: (user.roleType?.[0] === 'ADMIN' ? 'ADMIN' : 'USER') as 'ADMIN' | 'USER',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          login(token, appUser);
        } catch (error) {
          console.error('Error getting access token:', error);
          // Be more conservative - logout on token errors to avoid auth issues
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('login_required') || 
              errorMessage.includes('consent_required') ||
              errorMessage.includes('access_denied') ||
              errorMessage.includes('unauthorized') ||
              errorMessage.includes('invalid_grant')) {
            console.log('Auth error, logging out:', errorMessage);
            logout();
          } else {
            console.log('Network error getting token, will retry');
            // For network errors, don't logout but don't login either
            // Let the next sync attempt handle it
          }
        }
      } else if (!isAuthenticated) {
        console.log('Auth0Integration: User not authenticated, clearing store');
        logout();
      }
    };

    syncAuthState();
  }, [isAuthenticated, user, getAccessTokenSilently, login, logout, isLoading]);

  // Periodic token refresh (every 45 minutes for mobile reliability)
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        console.log('Auth0Integration: Refreshing access token');
        const token = await getAccessTokenSilently({ 
          cacheMode: 'off' // Force fresh token
        });
        setToken(token);
        console.log('Auth0Integration: Token refreshed successfully');
      } catch (error) {
        console.error('Error refreshing token:', error);
        // For permanent sessions, be very conservative about logging out
        // Only logout if refresh token is actually invalid/revoked
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('invalid_grant') && 
            errorMessage.includes('refresh_token')) {
          console.log('Refresh token revoked, logging out');
          logout();
        } else if (errorMessage.includes('login_required') || 
                   errorMessage.includes('consent_required')) {
          console.log('Auth explicitly revoked, logging out');
          logout();
        } else {
          console.log('Temporary refresh error, keeping session alive');
          // Could implement exponential backoff here for retries
        }
      }
    }, 45 * 60 * 1000); // 45 minutes (more frequent for mobile reliability)

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, getAccessTokenSilently, setToken, logout]);

  return <>{children}</>;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
        audience: auth0Config.audience,
        scope: auth0Config.scope,
      }}
      // Enable refresh tokens for silent token renewal
      useRefreshTokens={true}
      // Use localStorage for mobile UX - tokens persist across app restarts
      cacheLocation="localstorage"
    >
      <Auth0Integration>{children}</Auth0Integration>
    </Auth0Provider>
  );
};