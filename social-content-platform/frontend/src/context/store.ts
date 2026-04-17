'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Business } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },
      
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentBusinessId');
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface BusinessState {
  businesses: Business[];
  currentBusiness: Business | null;
  setBusinesses: (businesses: Business[]) => void;
  setCurrentBusiness: (business: Business | null) => void;
}

export const useBusinessStore = create<BusinessState>((set) => ({
  businesses: [],
  currentBusiness: null,
  
  setBusinesses: (businesses) => set({ businesses }),
  
  setCurrentBusiness: (business) => {
    if (business) {
      localStorage.setItem('currentBusinessId', business.id);
    } else {
      localStorage.removeItem('currentBusinessId');
    }
    set({ currentBusiness: business });
  },
}));
