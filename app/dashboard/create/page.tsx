'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CreateProposal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const mode = searchParams.get('mode'); // 'template', 'upload', or null
  const clientId = searchParams.get('client');

  useEffect(() => {
    // Build the redirect URL with parameters
    const params = new URLSearchParams();
    params.set('create', 'true');
    
    if (mode) {
      params.set('mode', mode);
    }
    
    if (clientId) {
      params.set('client', clientId);
    }
    
    router.push(`/dashboard?${params.toString()}`);
  }, [router, mode, clientId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">
          {mode === 'template' && 'Loading template library...'}
          {mode === 'upload' && 'Loading document upload...'}
          {!mode && 'Loading proposal creator...'}
        </p>
      </div>
    </div>
  );
}