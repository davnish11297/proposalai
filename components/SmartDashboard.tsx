'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatRelativeTime } from '@/lib/utils';

interface DashboardData {
  priorities: {
    needsFollowUp: number;
    recentViews: number;
    draftProposals: number;
    expiringProposals: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'viewed' | 'downloaded' | 'sent';
    title: string;
    clientName: string;
    company?: string;
    timestamp: string;
    proposalId: string;
  }>;
  metrics: {
    totalProposals: number;
    totalSent: number;
    conversionRate: number;
    totalValue: number;
    acceptedValue: number;
    responseRate: number;
  };
  notifications: Array<{
    id: string;
    type: 'follow-up' | 'activity';
    title: string;
    message: string;
    timestamp: string;
    actionable: boolean;
    proposalId: string;
  }>;
  insights: string[];
  quickActions: Array<{
    id: string;
    type: 'follow-up' | 'create';
    title: string;
    description: string;
    action: string;
    proposalId?: string;
    clientId?: string;
    urgent: boolean;
    icon: string;
  }>;
  recentProposals: Array<{
    id: string;
    title: string;
    status: string;
    clientName: string;
    company?: string;
    updatedAt: string;
    totalValue?: number;
  }>;
}

export default function SmartDashboard() {
  console.log('🔄 SmartDashboard: Component rendering');
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch dashboard data with robust error handling
  const fetchDashboardData = async () => {
    console.log('🔄 SmartDashboard: Starting to fetch dashboard data');
    try {
      const token = localStorage.getItem('token');
      console.log('🔄 SmartDashboard: Token found:', !!token);
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch dashboard data';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Could not parse error response
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('🔄 SmartDashboard: Dashboard data received:', data);
      
      if (data.fallback) {
        toast.error('Dashboard loaded with limited data');
      }
      
      setDashboardData(data.data);
    } catch (error) {
      console.error('❌ SmartDashboard: Dashboard fetch error:', error);
      
      // Set safe fallback data
      const fallbackData: DashboardData = {
        priorities: {
          needsFollowUp: 0,
          recentViews: 0,
          draftProposals: 0,
          expiringProposals: 0,
        },
        recentActivity: [],
        metrics: {
          totalProposals: 0,
          totalSent: 0,
          conversionRate: 0,
          totalValue: 0,
          acceptedValue: 0,
          responseRate: 0,
        },
        notifications: [],
        insights: ['Welcome to ProposalAI! Create your first proposal to get started.'],
        quickActions: [],
        recentProposals: [],
      };
      
      setDashboardData(fallbackData);
      toast.error('Dashboard temporarily unavailable. Basic features are still working.');
    } finally {
      console.log('🔄 SmartDashboard: Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Handle quick actions
  const handleQuickAction = async (action: any) => {
    setActionLoading(action.id);
    
    try {
      switch (action.action) {
        case 'send-follow-up':
          router.push(`/proposals/${action.proposalId}/follow-up`);
          break;
        case 'create-proposal':
          router.push(`/dashboard/create?client=${action.clientId}`);
          break;
        default:
          toast.error('Action not available yet');
      }
    } catch (error) {
      console.error('Action error:', error);
      toast.error('Failed to execute action');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle creation actions
  const handleCreateAction = (type: string) => {
    switch (type) {
      case 'new':
        router.push('/dashboard/create');
        break;
      case 'template':
        router.push('/dashboard/create?mode=template');
        break;
      case 'upload':
        router.push('/dashboard/create?mode=upload');
        break;
      default:
        router.push('/dashboard/create');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse mb-2 w-96"></div>
          <div className="h-6 bg-gray-200 rounded-lg animate-pulse mb-8 w-80"></div>
          <div className="text-center text-gray-600">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🔄 SmartDashboard: No user, redirecting to login');
    router.push('/login');
    return null;
  }

  if (!dashboardData) {
    console.log('🔄 SmartDashboard: No dashboard data, showing error state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Failed to load dashboard</p>
          <button 
            onClick={fetchDashboardData}
            className="btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  try {
    console.log('🔄 SmartDashboard: Rendering main dashboard content');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">PA</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">ProposalAI</h1>
            </div>
            <div className="flex items-center space-x-1">
              <Link href="/dashboard" className="nav-link active">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Dashboard</span>
              </Link>
              <Link href="/drafts" className="nav-link">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Drafts</span>
              </Link>
              <Link href="/sent-proposals" className="nav-link">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Sent</span>
              </Link>
              <Link href="/clients" className="nav-link">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>Clients</span>
              </Link>
              <Link href="/profile" className="nav-link">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile</span>
              </Link>
              <button 
                onClick={logout}
                className="nav-link text-gray-500 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section - Proposal Creation Focus */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user.firstName}!
          </h1>
          <p className="text-xl text-gray-600 mb-8">Ready to create your next winning proposal?</p>
          
          {/* Creation Hero Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-8 shadow-2xl">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">What would you like to create today?</h2>
              <p className="text-blue-100 mb-8 text-lg">Choose your path to proposal success</p>
              
              {/* Creation Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <button
                  onClick={() => handleCreateAction('new')}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-200 group"
                >
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Start Fresh</h3>
                  <p className="text-blue-100">Create a new proposal from scratch with AI assistance</p>
                </button>

                <button
                  onClick={() => handleCreateAction('template')}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-200 group"
                >
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Use Template</h3>
                  <p className="text-blue-100">Choose from proven templates with high success rates</p>
                </button>

                <button
                  onClick={() => handleCreateAction('upload')}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-200 group"
                >
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Upload & Improve</h3>
                  <p className="text-blue-100">Upload existing document and enhance with AI</p>
                </button>
              </div>

              {/* Smart Suggestions */}
              {dashboardData.quickActions.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">💡 Smart Suggestions</h3>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {dashboardData.quickActions.slice(0, 3).map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action)}
                        disabled={actionLoading === action.id}
                        className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors text-sm"
                      >
                        {actionLoading === action.id ? 'Loading...' : action.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compact Intelligence Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-green-600">{dashboardData.metrics.conversionRate}%</p>
                <p className="text-xs text-gray-500">Last 30 days</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Drafts Ready</p>
                <p className="text-2xl font-bold text-blue-600">{dashboardData.priorities.draftProposals}</p>
                <p className="text-xs text-gray-500">Ready to send</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Follow-ups</p>
                <p className="text-2xl font-bold text-orange-600">{dashboardData.priorities.needsFollowUp}</p>
                <p className="text-xs text-gray-500">Need attention</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Views</p>
                <p className="text-2xl font-bold text-purple-600">{dashboardData.priorities.recentViews}</p>
                <p className="text-xs text-gray-500">Last 24 hours</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Activity Section - Replaced Recent Activity & Recent Proposals */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Today's Proposal Activity - Unified Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">📋 Today's Proposal Activity</h3>
              <div className="flex items-center gap-3">
                <Link href="/sent-proposals" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View sent
                </Link>
                <Link href="/drafts" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View drafts
                </Link>
              </div>
            </div>
            
            {dashboardData.recentActivity.length > 0 || dashboardData.recentProposals.length > 0 ? (
              <div className="space-y-4">
                {/* Combine and process both recent activity and proposals */}
                {(() => {
                  // Merge recent activity and proposals into unified timeline
                  const unifiedActivities: any[] = [];
                  
                  // Add recent activity items
                  dashboardData.recentActivity.forEach(activity => {
                    unifiedActivities.push({
                      id: activity.id,
                      type: 'activity',
                      action: activity.type,
                      title: activity.title,
                      clientName: activity.clientName,
                      company: activity.company,
                      timestamp: new Date(activity.timestamp),
                      proposalId: activity.proposalId,
                      actionText: `${activity.type === 'viewed' ? '👁️ Viewed by' : activity.type === 'downloaded' ? '📥 Downloaded by' : '📤 Sent to'} ${activity.clientName}`,
                      status: activity.type === 'viewed' ? 'viewed' : activity.type === 'downloaded' ? 'downloaded' : 'sent'
                    });
                  });
                  
                  // Add recent proposals that aren't in activity
                  dashboardData.recentProposals.forEach(proposal => {
                    const existingActivity = unifiedActivities.find(a => a.proposalId === proposal.id);
                    if (!existingActivity) {
                      unifiedActivities.push({
                        id: proposal.id,
                        type: 'proposal',
                        action: 'status',
                        title: proposal.title,
                        clientName: proposal.clientName,
                        company: proposal.company,
                        timestamp: new Date(proposal.updatedAt),
                        proposalId: proposal.id,
                        actionText: proposal.status === 'DRAFT' ? '🔵 Draft ready' : proposal.status === 'SENT' ? '📤 Awaiting response' : `🟢 ${proposal.status.toLowerCase()}`,
                        status: proposal.status.toLowerCase(),
                        totalValue: proposal.totalValue
                      });
                    }
                  });
                  
                  // Sort by timestamp (newest first)
                  const sortedActivities = unifiedActivities
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .slice(0, 8); // Show top 8 items
                  
                  return sortedActivities.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                      {/* Status Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        item.status === 'viewed' ? 'bg-green-100' :
                        item.status === 'downloaded' ? 'bg-blue-100' :
                        item.status === 'sent' ? 'bg-blue-100' :
                        item.status === 'draft' ? 'bg-gray-100' :
                        item.status === 'accepted' ? 'bg-green-100' :
                        'bg-gray-100'
                      }`}>
                        {item.status === 'viewed' ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : item.status === 'downloaded' ? (
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          </svg>
                        ) : item.status === 'draft' ? (
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">"{item.title}"</h4>
                          {item.totalValue && (
                            <span className="text-sm font-medium text-green-600">
                              ${item.totalValue.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {item.actionText}
                          {item.company && ` • ${item.company}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(item.timestamp)}
                        </p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/proposals/${item.proposalId}`}
                          className="btn btn-outline btn-sm"
                        >
                          Edit
                        </Link>
                        
                        {item.status === 'viewed' && (
                          <button className="btn btn-primary btn-sm">
                            Follow up
                          </button>
                        )}
                        
                        {item.status === 'draft' && (
                          <button className="btn btn-primary btn-sm">
                            Send now
                          </button>
                        )}
                        
                        {(item.status === 'sent' || item.status === 'viewed') && (
                          <Link 
                            href={`/proposals/${item.proposalId}/view`}
                            className="btn btn-secondary btn-sm"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h4>
                <p className="text-gray-500 mb-6">Create and send proposals to see activity here</p>
                <button 
                  onClick={() => handleCreateAction('new')}
                  className="btn btn-primary"
                >
                  Create Your First Proposal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Smart Insights - Only show if there are insights */}
        {dashboardData.insights.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Smart Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    );
  } catch (error) {
    console.error('❌ SmartDashboard: Rendering error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Dashboard rendering error</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}