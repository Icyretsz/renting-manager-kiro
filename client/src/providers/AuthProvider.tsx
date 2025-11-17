import React, { useEffect, useRef } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { useAuthStore } from '@/stores/authStore';
import { auth0Config } from '@/config/auth0';
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging';
import { User } from '@/types';

interface AuthProviderProps {
  children: React.ReactNode;
}

// Helper to decode JWT and check expiry
const isTokenExpired = (token: string, bufferMinutes: number = 5): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const bufferTime = bufferMinutes * 60 * 1000;
    return Date.now() >= (expiryTime - bufferTime);
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // Treat as expired if we can't decode
  }
};

// Auth0 integration component to sync tokens
const Auth0Integration = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, getAccessTokenSilently, isLoading } = useAuth0();
  const { login, logout, setToken } = useAuthStore();
  const syncInProgressRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const lastRefreshTimeRef = useRef(0);

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
  // REMOVED storedToken from dependencies to prevent loop
  useEffect(() => {
    const syncAuthState = async () => {
      // Prevent concurrent syncs
      if (syncInProgressRef.current) {
        console.log('Auth0Integration: Sync already in progress, skipping...');
        return;
      }

      // Wait for Auth0 to finish loading
      if (isLoading) {
        console.log('Auth0Integration: Auth0 loading...');
        return;
      }

      // Skip if already initialized and authenticated
      if (hasInitializedRef.current && isAuthenticated) {
        console.log('Auth0Integration: Already initialized, skipping sync');
        return;
      }

      if (isAuthenticated && user) {
        syncInProgressRef.current = true;

        try {
          console.log('Auth0Integration: Syncing auth state...');

          // Always fetch a fresh token on initial auth sync
          const token = await getAccessTokenSilently({
            cacheMode: 'cache-only', // Try cache first for PWA performance
          }).catch(async (cacheError) => {
            console.log('Auth0Integration: Cache miss, fetching from network', cacheError);
            return await getAccessTokenSilently({
              cacheMode: 'off',
            });
          });

          if (!token) {
            console.error('Auth0Integration: No token received');
            logout();
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
          lastRefreshTimeRef.current = Date.now();
          hasInitializedRef.current = true;

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
        syncInProgressRef.current = false;
      }
    };

    syncAuthState();
  }, [isAuthenticated, user, getAccessTokenSilently, login, logout, isLoading]); // REMOVED storedToken

  // Single unified token refresh mechanism
  useEffect(() => {
    if (!isAuthenticated || isLoading || !hasInitializedRef.current) {
      return;
    }

    const checkAndRefreshToken = async () => {
      // Prevent too frequent refresh attempts (minimum 1 minute between refreshes)
      const timeSinceLastRefresh = Date.now() - lastRefreshTimeRef.current;
      if (timeSinceLastRefresh < 60 * 1000) {
        console.log('Auth0Integration: Skipping refresh, too soon since last refresh');
        return;
      }

      // Get current token from store
      const currentToken = useAuthStore.getState().token;
      if (!currentToken) {
        console.log('Auth0Integration: No token in store');
        return;
      }

      // Check if token needs refresh (10 minutes before expiry)
      if (isTokenExpired(currentToken, 10)) {
        console.log('Auth0Integration: Token expiring soon, refreshing...');

        if (syncInProgressRef.current) {
          console.log('Auth0Integration: Refresh already in progress');
          return;
        }

        syncInProgressRef.current = true;

        try {
          const freshToken = await getAccessTokenSilently({
            cacheMode: 'off'
          });

          setToken(freshToken);
          lastRefreshTimeRef.current = Date.now();
          console.log('Auth0Integration: Token refreshed successfully');

        } catch (error) {
          console.error('Auth0Integration: Token refresh failed:', error);
          const errorMessage = error instanceof Error ? error.message : String(error);

          if (errorMessage.includes('invalid_grant') ||
            errorMessage.includes('login_required')) {
            console.log('Refresh token invalid, logging out');
            logout();
            hasInitializedRef.current = false;
          }
        } finally {
          syncInProgressRef.current = false;
        }
      } else {
        console.log('Auth0Integration: Token still valid, no refresh needed');
      }
    };

    // Check immediately
    checkAndRefreshToken();

    // Then check every 5 minutes
    const refreshInterval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, isLoading, getAccessTokenSilently, setToken, logout]);

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