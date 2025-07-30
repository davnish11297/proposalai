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
  
  // Check URL parameters
  const createMode = searchParams.get('create');
  const templateMode = searchParams.get('mode');
  const clientId = searchParams.get('client');
  
  // Load dashboard mode preference from localStorage
  const [isSmartMode, setIsSmartMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem('dashboardMode');
    if (savedMode === 'original') {
      setIsSmartMode(false);
    }
  }, []);

  // Handle authentication loading
  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <LoadingSpinner size="lg" />
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
  return <SmartDashboard />;
}