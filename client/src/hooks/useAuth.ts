import { useAuth0 } from '@auth0/auth0-react';
import { User } from '@/types';

export const useAuth = () => {
  const { 
    loginWithRedirect, 
    logout: auth0Logout, 
    isAuthenticated,
    isLoading,
    user: auth0User
  } = useAuth0();

  const login = () => {
    loginWithRedirect();
  };

  const logout = () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  // Transform Auth0 user to our User type
  const user: User | null = auth0User ? {
    id: auth0User.sub || '',
    auth0Id: auth0User.sub || '',
    email: auth0User.email || '',
    name: auth0User.name || auth0User.nickname || '',
    role: (auth0User['https://rental-app.com/role'] as 'admin' | 'user') || 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  } : null;

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isUser = () => {
    return user?.role === 'user';
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    isAdmin,
    isUser,
  };
};