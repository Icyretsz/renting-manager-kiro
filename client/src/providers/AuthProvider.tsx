import { useEffect } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { useAuthStore } from '@/stores/authStore';
import { auth0Config } from '@/config/auth0';
import { User } from '@/types';

interface AuthProviderProps {
  children: React.ReactNode;
}

// Auth0 integration component to sync tokens
const Auth0Integration = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const { login, logout } = useAuthStore();

  useEffect(() => {
    const syncAuthState = async () => {
      if (isAuthenticated && user) {
        try {
          console.log('Auth0Integration: Syncing authenticated user to store');
          const token = await getAccessTokenSilently();
          
          const appUser: User = {
            id: user.sub || '',
            auth0Id: user.sub || '',
            email: user.email || '',
            name: user.name || user.nickname || '',
            role: (user['https://rental-app.com/role'] as 'admin' | 'user') || 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          login(token, appUser);
        } catch (error) {
          console.error('Error getting access token:', error);
        }
      } else if (!isAuthenticated) {
        console.log('Auth0Integration: User not authenticated, clearing store');
        logout();
      }
    };

    syncAuthState();
  }, [isAuthenticated, user, getAccessTokenSilently, login, logout]);

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
    >
      <Auth0Integration>{children}</Auth0Integration>
    </Auth0Provider>
  );
};