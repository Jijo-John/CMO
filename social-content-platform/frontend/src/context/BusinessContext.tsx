'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Business } from '@/types';
import { useAuth } from './AuthContext';

interface BusinessContextType {
  currentBusiness: Business | null;
  setCurrentBusiness: (business: Business) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { businesses } = useAuth();
  const [currentBusiness, setCurrentBusinessState] = useState<Business | null>(null);

  useEffect(() => {
    // Load saved business selection
    const savedId = localStorage.getItem('currentBusinessId');
    if (savedId && businesses.length > 0) {
      const saved = businesses.find(b => b.id === savedId);
      if (saved) {
        setCurrentBusinessState(saved);
      } else {
        // Default to first business
        setCurrentBusinessState(businesses[0]);
      }
    } else if (businesses.length > 0) {
      setCurrentBusinessState(businesses[0]);
    }
  }, [businesses]);

  const setCurrentBusiness = (business: Business) => {
    setCurrentBusinessState(business);
    localStorage.setItem('currentBusinessId', business.id);
  };

  return (
    <BusinessContext.Provider value={{ currentBusiness, setCurrentBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
