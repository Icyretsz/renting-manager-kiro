import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  manualLogout: () => void; // Explicit user logout
  updateUser: (user: Partial<User>) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      login: (token: string, user: User) => {
        // Store user email in localStorage for unlinked error page
        if (user.email) {
          localStorage.setItem('userEmail', user.email);
        }
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        // Internal logout - only clear app state, keep Auth0 session
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      manualLogout: () => {
        // Explicit user logout - clear everything including Auth0 session
        localStorage.removeItem('userEmail');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        // Clear Auth0 cache as well
        localStorage.removeItem(`@@auth0spajs@@::${import.meta.env.VITE_AUTH0_CLIENT_ID}::${import.meta.env.VITE_AUTH0_AUDIENCE}::openid profile email`);
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      setToken: (token: string) => {
        set({ token });
      },
    }),
    {
      name: 'auth-storage',
      // Only persist user and auth state, not the token (Auth0 handles token persistence)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // Don't persist token - let Auth0 handle it via localStorage
        // token: state.token, 
      }),
    }
  )
);