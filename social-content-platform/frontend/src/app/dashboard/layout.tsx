'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useBusinessStore } from '@/context/store';
import { businessApi } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { businesses, currentBusiness, setBusinesses, setCurrentBusiness } = useBusinessStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Load businesses on mount
    const loadBusinesses = async () => {
      try {
        const response = await businessApi.getAll();
        const businessList = response.data.data;
        setBusinesses(businessList);

        // Restore or set current business
        const savedId = localStorage.getItem('currentBusinessId');
        if (savedId) {
          const saved = businessList.find((b: any) => b.id === savedId);
          if (saved) {
            setCurrentBusiness(saved);
          } else if (businessList.length > 0) {
            setCurrentBusiness(businessList[0]);
          }
        } else if (businessList.length > 0) {
          setCurrentBusiness(businessList[0]);
        }
      } catch (error) {
        console.error('Failed to load businesses:', error);
      }
    };

    loadBusinesses();
  }, [isAuthenticated, router, setBusinesses, setCurrentBusiness]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
