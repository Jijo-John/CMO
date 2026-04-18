'use client';

import { useAuthStore } from '@/lib/store';
import { businessApi, contentApi } from '@/lib/services';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, setBusinesses, selectBusiness, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        // Get current user
        const userResponse = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          router.push('/auth/login');
          return;
        }

        const userData = await userResponse.json();
        
        // Get businesses
        const businessesResponse = await fetch('/api/businesses', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (businessesResponse.ok) {
          const businessesData = await businessesResponse.json();
          setBusinesses(businessesData.businesses);
          
          if (businessesData.businesses.length > 0) {
            // Select first business or restore previous selection
            const storedBusiness = JSON.parse(localStorage.getItem('persist:auth') || '{}')?.selectedBusiness;
            const selectedBiz = storedBusiness 
              ? businessesData.businesses.find((b: any) => b.id === storedBusiness.id)
              : businessesData.businesses[0];
            
            if (selectedBiz) {
              selectBusiness(selectedBiz);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      }
    };

    initAuth();
  }, [setBusinesses, selectBusiness, router]);

  return <>{children}</>;
}

// Business Provider Component
export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { selectedBusiness, selectBusiness, businesses } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!selectedBusiness && businesses.length > 0) {
      selectBusiness(businesses[0]);
    }
  }, [selectedBusiness, businesses, selectBusiness]);

  return <>{children}</>;
}
