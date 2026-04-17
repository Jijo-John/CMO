import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      selectedBusinessId: null,
      
      setAuth: (user, token) => set({ user, token }),
      setSelectedBusiness: (businessId) => set({ selectedBusinessId: businessId }),
      logout: () => set({ user: null, token: null, selectedBusinessId: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useBusinessStore = create((set) => ({
  businesses: [],
  currentBusiness: null,
  
  setBusinesses: (businesses) => set({ businesses }),
  setCurrentBusiness: (business) => set({ currentBusiness: business }),
}));

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  isLoading: false,
  error: null,
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
