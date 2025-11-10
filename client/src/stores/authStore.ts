import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  manualLogout: () => void;
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
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      manualLogout: () => {
        localStorage.removeItem('userEmail');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        // Clear Auth0 cache
        const auth0Key = `@@auth0spajs@@::${import.meta.env.VITE_AUTH0_CLIENT_ID}::${import.meta.env.VITE_AUTH0_AUDIENCE}::openid profile email`;
        localStorage.removeItem(auth0Key);
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
      // CRITICAL FIX: Don't persist token - let Auth0 manage it
      // This prevents stale token issues
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // token: state.token, // REMOVED - don't persist token
      }),
    }
  )
);