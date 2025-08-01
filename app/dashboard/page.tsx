'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SmartDashboard from '@/components/SmartDashboard';
import OriginalDashboard from './page-original';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  console.log('🔄 DashboardPage: Auth loading:', authLoading, 'User:', !!user);
  
  // Check URL parameters
  const createMode = searchParams.get('create');
  const templateMode = searchParams.get('mode');
  const clientId = searchParams.get('client');
  
  // Load dashboard mode preference from localStorage
  const [isSmartMode, setIsSmartMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('🔄 DashboardPage: Component mounting');
    setMounted(true);
    const savedMode = localStorage.getItem('dashboardMode');
    if (savedMode === 'original') {
      setIsSmartMode(false);
    }
  }, []);

  // Handle authentication loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show skeleton while component is mounting
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse mb-2 w-96"></div>
          <div className="h-6 bg-gray-200 rounded-lg animate-pulse mb-8 w-80"></div>
          <div className="text-center text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user wants to create a proposal or has specific parameters, show original interface
  if (createMode === 'true' || clientId || templateMode || !isSmartMode) {
    return <OriginalDashboard />;
  }

  // Default to smart dashboard
  console.log('🔄 DashboardPage: Rendering SmartDashboard');
  return <SmartDashboard />;
}