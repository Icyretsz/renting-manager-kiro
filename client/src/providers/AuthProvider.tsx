import React, { useEffect } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { auth0Config } from '@/config/auth0';
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging';

interface AuthProviderProps {
  children: React.ReactNode;
}

// Auth0 integration component
const Auth0Integration = ({ children }: { children: React.ReactNode }) => {
  const { getAccessTokenSilently } = useAuth0();

  // Initialize Firebase messaging when user is authenticated
  useFirebaseMessaging();

  // Expose token refresh function globally for API interceptor
  useEffect(() => {
    (window as any).__getAccessTokenSilently = getAccessTokenSilently;
    return () => {
      delete (window as any).__getAccessTokenSilently;
    };
  }, [getAccessTokenSilently]);

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
      cacheLocation="localstorage"
    >
      <Auth0Integration>{children}</Auth0Integration>
    </Auth0Provider>
  );
};
