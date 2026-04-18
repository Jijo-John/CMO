'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/lib/store';
import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  PlusCircle,
  Users,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Content Library', href: '/content', icon: FolderOpen },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Create Content', href: '/content/new', icon: PlusCircle },
  { name: 'Team', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { selectedBusiness } = useAuthStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700">
            <Link href="/dashboard" className="text-xl font-bold">
              SocialFlow
            </Link>
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded-lg hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Business selector */}
          {selectedBusiness && (
            <div className="px-4 py-3 border-b border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                Business
              </p>
              <p className="font-medium truncate">{selectedBusiness.name}</p>
              <p className="text-xs text-slate-400 capitalize">
                {selectedBusiness.role}
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              © 2024 SocialFlow
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
