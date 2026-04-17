'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBusinessStore } from '@/context/store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Content Library', href: '/content', icon: '📝' },
  { name: 'Calendar', href: '/calendar', icon: '📅' },
  { name: 'Media Library', href: '/media-library', icon: '🖼️' },
  { name: 'Team', href: '/users', icon: '👥' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { currentBusiness } = useBusinessStore();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/dashboard" className="text-xl font-bold text-primary-600">
          SocialFlow
        </Link>
      </div>

      {/* Business Selector */}
      {currentBusiness && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-semibold">
                {currentBusiness.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentBusiness.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">{currentBusiness.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          © 2024 SocialFlow
        </p>
      </div>
    </div>
  );
}
