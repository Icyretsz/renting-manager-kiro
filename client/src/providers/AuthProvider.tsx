import { useEffect, useRef } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { useAuthStore } from '@/stores/authStore';
import { auth0Config } from '@/config/auth0';
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging';
import { User } from '@/types';

interface AuthProviderProps {
  children: React.ReactNode;
}

// Helper to decode JWT and check expiry
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const bufferTime = 5 * 60 * 1000; // 5 minute buffer before actual expiry
    return Date.now() >= (expiryTime - bufferTime);
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // Treat as expired if we can't decode
  }
};

// Auth0 integration component to sync tokens
const Auth0Integration = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, getAccessTokenSilently, isLoading } = useAuth0();
  const { login, logout, setToken, token: storedToken } = useAuthStore();
  const syncInProgressRef = useRef(false);
  const hasInitializedRef = useRef(false);
  
  // Initialize Firebase messaging when user is authenticated
  useFirebaseMessaging();

  // Expose token refresh function globally for API interceptor
  useEffect(() => {
    (window as any).__getAccessTokenSilently = getAccessTokenSilently;
    return () => {
      delete (window as any).__getAccessTokenSilently;
    };
  }, [getAccessTokenSilently]);

  // Main auth sync effect - handles both fresh logins and session restoration
  useEffect(() => {
    const syncAuthState = async () => {
      // Prevent concurrent syncs
      if (syncInProgressRef.current) {
        return;
      }

      // Wait for Auth0 to finish loading
      if (isLoading) {
        console.log('Auth0Integration: Auth0 loading...');
        return;
      }

      if (isAuthenticated && user) {
        syncInProgressRef.current = true;
        
        try {
          // Check if we have a stored token and if it's still valid
          const hasValidStoredToken = storedToken && !isTokenExpired(storedToken);
          
          if (hasValidStoredToken && hasInitializedRef.current) {
            // We already have a valid token, just ensure user is synced
            console.log('Auth0Integration: Using valid cached token');
            
            const appUser: User = {
              id: user.sub || '',
              auth0Id: user.sub || '',
              email: user.email || '',
              name: user.name || user.nickname || '',
              role: (user.roleType?.[0] === 'ADMIN' ? 'ADMIN' : 'USER') as 'ADMIN' | 'USER',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            login(storedToken, appUser);
          } else {
            // Need to fetch a fresh token
            console.log('Auth0Integration: Fetching fresh token...', {
              hasStoredToken: !!storedToken,
              isExpired: storedToken ? isTokenExpired(storedToken) : 'N/A',
              hasInitialized: hasInitializedRef.current
            });
            
            const token = await getAccessTokenSilently({
              cacheMode: 'cache-only', // Try cache first for PWA performance
            }).catch(async (cacheError) => {
              // If cache fails, force a fresh token
              console.log('Auth0Integration: Cache miss, fetching from network', cacheError);
              return await getAccessTokenSilently({
                cacheMode: 'off',
              });
            });
            
            if (!token) {
              console.error('Auth0Integration: No token received');
              logout();
              syncInProgressRef.current = false;
              return;
            }
            
            console.log('Auth0Integration: Token fetched successfully');
            
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
            hasInitializedRef.current = true;
          }
        } catch (error) {
          console.error('Error during auth sync:', error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Only logout on definitive auth failures
          if (errorMessage.includes('login_required') || 
              errorMessage.includes('consent_required') ||
              errorMessage.includes('invalid_grant')) {
            console.log('Auth session expired, logging out:', errorMessage);
            logout();
            hasInitializedRef.current = false;
          } else {
            console.log('Temporary error, keeping session:', errorMessage);
          }
        } finally {
          syncInProgressRef.current = false;
        }
      } else if (!isAuthenticated) {
        console.log('Auth0Integration: User not authenticated');
        logout();
        hasInitializedRef.current = false;
      }
    };

    syncAuthState();
  }, [isAuthenticated, user, getAccessTokenSilently, login, logout, isLoading, storedToken]);

  // Token refresh before expiry
  useEffect(() => {
    if (!isAuthenticated || isLoading || !storedToken) return;

    const refreshToken = async () => {
      // Check if token needs refresh
      if (isTokenExpired(storedToken)) {
        console.log('Auth0Integration: Token expired/expiring soon, refreshing...');
        try {
          const freshToken = await getAccessTokenSilently({ 
            cacheMode: 'off' 
          });
          setToken(freshToken);
          console.log('Auth0Integration: Token refreshed successfully');
        } catch (error) {
          console.error('Auth0Integration: Token refresh failed:', error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          if (errorMessage.includes('invalid_grant') || 
              errorMessage.includes('login_required')) {
            console.log('Refresh token invalid, logging out');
            logout();
          }
        }
      }
    };

    // Check immediately
    refreshToken();

    // Then check every 5 minutes
    const refreshInterval = setInterval(refreshToken, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, isLoading, storedToken, getAccessTokenSilently, setToken, logout]);

  // Proactive token refresh at 45 minutes (before 1-hour expiry)
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const proactiveRefresh = setInterval(async () => {
      console.log('Auth0Integration: Proactive token refresh');
      try {
        const token = await getAccessTokenSilently({ 
          cacheMode: 'off' 
        });
        setToken(token);
        console.log('Auth0Integration: Proactive refresh successful');
      } catch (error) {
        console.error('Proactive refresh error:', error);
        // Don't logout on proactive refresh errors - let the expiry check handle it
      }
    }, 45 * 60 * 1000); // 45 minutes

    return () => clearInterval(proactiveRefresh);
  }, [isAuthenticated, isLoading, getAccessTokenSilently, setToken]);

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
      useRefreshTokens={true}
      cacheLocation="localstorage" // Critical for PWA
      // Skip redirect on callback URLs to prevent loops
      skipRedirectCallback={window.location.pathname === '/login'}
    >
      <Auth0Integration>{children}</Auth0Integration>
    </Auth0Provider>
  );
};