'use client';

import { useAuthStore, useBusinessStore } from '@/context/store';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { businesses, currentBusiness, setCurrentBusiness } = useBusinessStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        {/* Business Selector Dropdown */}
        {businesses.length > 1 && (
          <select
            value={currentBusiness?.id || ''}
            onChange={(e) => {
              const business = businesses.find((b) => b.id === e.target.value);
              if (business) {
                setCurrentBusiness(business);
              }
            }}
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* User Menu */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-600 font-semibold text-sm">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
