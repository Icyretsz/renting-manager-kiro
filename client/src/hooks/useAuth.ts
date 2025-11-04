import { useAuth0 } from '@auth0/auth0-react';
import { useUserProfile } from './useUserProfile';

export const useAuth = () => {
  const { 
    loginWithRedirect, 
    logout: auth0Logout, 
    isAuthenticated,
    isLoading: auth0Loading,
  } = useAuth0();

  // Fetch complete user profile from API (includes tenant relationship)
  const { data: user, isLoading: profileLoading } = useUserProfile();

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

  const isAdmin = () => {
    return user?.role === 'ADMIN';
  };

  const isUser = () => {
    return user?.role === 'USER';
  };

  // Combined loading state
  const isLoading = auth0Loading || (isAuthenticated && profileLoading);

  return {
    user: user || null,
    isAuthenticated,
    isLoading,
    login,
    logout,
    isAdmin,
    isUser,
  };
};