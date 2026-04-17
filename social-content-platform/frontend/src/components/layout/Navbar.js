'use client';

import { Menu } from 'lucide-react';
import { useUIStore, useAuthStore, useBusinessStore } from '@/context/store';
import { useEffect, useState } from 'react';
import { businessAPI } from '@/lib/api';

export default function Navbar() {
  const { toggleSidebar } = useUIStore();
  const { user, selectedBusinessId, setSelectedBusiness } = useAuthStore();
  const { businesses, setBusinesses } = useBusinessStore();
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await businessAPI.getAll();
        setBusinesses(response.data.businesses);
        
        // Auto-select first business if none selected
        if (!selectedBusinessId && response.data.businesses.length > 0) {
          setSelectedBusiness(response.data.businesses[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch businesses:', error);
      }
    };

    fetchBusinesses();
  }, []);

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200 h-16">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-slate-100 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Business Selector */}
          <div className="relative">
            <button
              onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-sm">
                {selectedBusiness?.name?.[0]?.toUpperCase() || 'B'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-slate-900">
                  {selectedBusiness?.name || 'Select Business'}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {selectedBusiness?.role || 'Owner'}
                </p>
              </div>
            </button>

            {showBusinessDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowBusinessDropdown(false)}
                />
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                  {businesses.map((business) => (
                    <button
                      key={business.id}
                      onClick={() => {
                        setSelectedBusiness(business.id);
                        setShowBusinessDropdown(false);
                      }}
                      className={`
                        w-full text-left px-4 py-2 text-sm hover:bg-slate-100
                        ${selectedBusinessId === business.id ? 'bg-slate-50' : ''}
                      `}
                    >
                      <p className="font-medium">{business.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{business.role}</p>
                    </button>
                  ))}
                  <div className="border-t border-slate-200 mt-1 pt-1">
                    <a
                      href="/settings"
                      className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                    >
                      + Create New Business
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-sm font-medium text-slate-600">
                {user?.fullName?.[0]?.toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-slate-600">{user?.fullName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
