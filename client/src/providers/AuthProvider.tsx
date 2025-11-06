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
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const { login, logout, setToken } = useAuthStore();
  
  // Initialize Firebase messaging when user is authenticated
  useFirebaseMessaging();

  // Sync auth state on mount and when authentication changes
  useEffect(() => {
    const syncAuthState = async () => {
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
          // For permanent sessions, only logout on explicit auth revocation
          // Don't logout on network errors or temporary issues
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('login_required') || 
              errorMessage.includes('consent_required') ||
              errorMessage.includes('access_denied') ||
              errorMessage.includes('unauthorized')) {
            console.log('Auth revoked or consent withdrawn, logging out');
            logout();
          } else {
            console.log('Temporary error getting token, keeping user logged in');
            // Keep the persisted user data even if token fetch fails temporarily
            const persistedUser = useAuthStore.getState().user;
            if (persistedUser) {
              console.log('Using persisted user data while token is unavailable');
              // Don't call login() to avoid overwriting with null token
            }
          }
        }
      } else if (!isAuthenticated) {
        // Only clear store if we're sure the user isn't authenticated
        // Check if we have persisted session that might be recoverable
        const persistedUser = useAuthStore.getState().user;
        if (!persistedUser) {
          console.log('Auth0Integration: No persisted session, clearing store');
          logout();
        } else {
          console.log('Auth0Integration: Have persisted session, attempting recovery');
          // Auth0 might still be initializing, don't clear immediately
        }
      }
    };

    syncAuthState();
  }, [isAuthenticated, user, getAccessTokenSilently, login, logout]);

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