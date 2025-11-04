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
          // console.log('Auth0Integration: Syncing authenticated user to store', user);
          const token = await getAccessTokenSilently();
          // console.log('Auth0Integration: Got access token:', token ? 'Token received' : 'No token');
          
          const appUser: User = {
            id: user.sub || '',
            auth0Id: user.sub || '',
            email: user.email || '',
            name: user.name || user.nickname || '',
            role: (user.roleType?.[0] === 'ADMIN' ? 'ADMIN' : 'USER') as 'ADMIN' | 'USER',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // console.log('Auth0Integration: Created app user:', appUser);
          login(token, appUser);
        } catch (error) {
          console.error('Error getting access token:', error);
        }
      } else if (!isAuthenticated) {
        // console.log('Auth0Integration: User not authenticated, clearing store');
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