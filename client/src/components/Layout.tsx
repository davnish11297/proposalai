import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  DocumentTextIcon,
  RectangleStackIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  BookOpenIcon,
  UsersIcon,
  InboxIcon,
  PaperAirplaneIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../utils/cn';
import NotificationBell from './NotificationBell';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Drafts', href: '/drafts', icon: InboxIcon },
  { name: 'Sent Proposals', href: '/sent-proposals', icon: PaperAirplaneIcon },
  { name: 'Profile', href: '/profile', icon: IdentificationIcon },
  { name: 'Proposals', href: '/proposals', icon: DocumentTextIcon },
  { name: 'Teams', href: '/teams', icon: UsersIcon },
  { name: 'Clients', href: '/clients', icon: UsersIcon },
  { name: 'Templates', href: '/templates', icon: RectangleStackIcon },
  { name: 'Snippets', href: '/snippets', icon: ClipboardDocumentListIcon },
  { name: 'Case Studies', href: '/case-studies', icon: AcademicCapIcon },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpenIcon },
  { name: 'Pricing', href: '/pricing', icon: CurrencyDollarIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e0e7ef]">
      {/* Mobile sidebar */}
      <div className={cn('sidebar', sidebarOpen ? 'sidebar-open' : 'sidebar-closed', 'lg:hidden') + ' fixed inset-0 z-50 bg-black/30 backdrop-blur-sm'}>
        <div className="flex h-full flex-col bg-white/90 shadow-2xl border-r border-gray-200 rounded-r-2xl">
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
            <div className="flex items-center">
              <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">PA</span>
              </div>
              <span className="ml-3 text-xl font-extrabold text-gray-900 tracking-tight">ProposalAI</span>
            </div>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-7 w-7" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-4 py-2.5 text-base font-semibold rounded-lg transition-all',
                    isActive
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={cn(
                      'mr-4 h-6 w-6 flex-shrink-0',
                      isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-500'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col z-40">
        <div className="flex flex-col flex-grow bg-white/90 shadow-2xl border-r border-gray-200 rounded-r-2xl">
          <div className="flex h-20 items-center px-8 border-b border-gray-100">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">PA</span>
              </div>
              <span className="ml-4 text-2xl font-extrabold text-gray-900 tracking-tight">ProposalAI</span>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-6 py-8">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-4 py-2.5 text-base font-semibold rounded-lg transition-all',
                    isActive
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-4 h-6 w-6 flex-shrink-0',
                      isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-500'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-20 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/80 px-8 shadow-sm backdrop-blur-md">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-7 w-7" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-6">
              {/* Notification Bell */}
              <div data-testid="notification-bell-container">
                <NotificationBell />
              </div>
              
              {/* User menu */}
              <div className="relative">
                <div className="flex items-center space-x-4">
                  <UserCircleIcon className="h-10 w-10 text-gray-400" />
                  <div className="hidden md:block">
                    <div className="text-base font-bold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-500 hover:text-blue-600 font-semibold px-3 py-1 rounded-lg border border-gray-200 bg-white shadow-sm transition"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Main content area */}
        <main className="p-8 min-h-[calc(100vh-5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
} 