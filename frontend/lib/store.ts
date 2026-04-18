import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Business } from '@/types';

interface AuthState {
  user: User | null;
  businesses: Business[];
  selectedBusiness: Business | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  setBusinesses: (businesses: Business[]) => void;
  selectBusiness: (business: Business | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      businesses: [],
      selectedBusiness: null,
      token: null,
      isAuthenticated: false,

      login: (user, token, refreshToken) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          businesses: [],
          selectedBusiness: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setBusinesses: (businesses) => {
        set({ businesses });
        // Auto-select first business if none selected
        if (businesses.length > 0) {
          const currentSelected = JSON.parse(localStorage.getItem('persist:auth') || '{}')?.selectedBusiness;
          if (!currentSelected) {
            set({ selectedBusiness: businesses[0] });
          }
        }
      },

      selectBusiness: (business) => {
        set({ selectedBusiness: business });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        selectedBusiness: state.selectedBusiness,
      }),
    }
  )
);

// Content store
import { Content } from '@/types';

interface ContentState {
  contents: Content[];
  loading: boolean;
  error: string | null;
  setContents: (contents: Content[]) => void;
  addContent: (content: Content) => void;
  updateContent: (id: string, updates: Partial<Content>) => void;
  removeContent: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useContentStore = create<ContentState>((set) => ({
  contents: [],
  loading: false,
  error: null,

  setContents: (contents) => set({ contents }),
  
  addContent: (content) =>
    set((state) => ({ contents: [content, ...state.contents] })),
  
  updateContent: (id, updates) =>
    set((state) => ({
      contents: state.contents.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  
  removeContent: (id) =>
    set((state) => ({
      contents: state.contents.filter((c) => c.id !== id),
    })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

// UI Store
interface UIState {
  sidebarOpen: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  toggleSidebar: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toast: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  showToast: (message, type) => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000);
  },
  
  hideToast: () => set({ toast: null }),
}));
