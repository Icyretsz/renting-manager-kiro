import { create } from 'zustand';

interface UIStore {
  sidebarCollapsed: boolean;
  activeModal: string | null;
  loading: Record<string, boolean>;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
}

export const useUIStore = create<UIStore>((set, get) => ({
  sidebarCollapsed: false,
  activeModal: null,
  loading: {},

  toggleSidebar: () => {
    set((state) => ({
      sidebarCollapsed: !state.sidebarCollapsed,
    }));
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
  },

  openModal: (modalId: string) => {
    set({ activeModal: modalId });
  },

  closeModal: () => {
    set({ activeModal: null });
  },

  setLoading: (key: string, loading: boolean) => {
    set((state) => ({
      loading: {
        ...state.loading,
        [key]: loading,
      },
    }));
  },

  isLoading: (key: string) => {
    return get().loading[key] || false;
  },
}));