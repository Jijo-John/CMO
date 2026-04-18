'use client';

import { useAuthStore, useUIStore } from '@/lib/store';
import { Menu, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { toggleSidebar } = useUIStore();
  const { user, logout, selectedBusiness } = useAuthStore();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Business selector dropdown could go here */}
          {selectedBusiness && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{selectedBusiness.name}</span>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100">
            <Bell className="h-5 w-5 text-gray-500" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
            >
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-medium text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
