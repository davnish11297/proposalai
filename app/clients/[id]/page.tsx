'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { EnhancedSendHistory } from '@/components/ui/EnhancedSendHistory';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatRelativeTime } from '@/lib/utils';

// Simple date formatter
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// 12-hour time formatter with AM/PM
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

interface ProposalGroup {
  proposalId: string;
  title: string;
  description?: string;
  version: number;
  sends: Array<{
    sendId: string;
    sentAt: string;
    sentTo: string;
    status: string;
    subject?: string;
    version: number;
  }>;
  latestSend: {
    sentAt: string;
    sentTo: string;
    status: string;
  };
  sendCount: number;
}

interface Client {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  industry?: string;
  status: string;
  lastContactDate?: string;
  firstContactDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  proposalStats?: {
    totalProposals: number;
    totalSends: number;
    acceptedProposals: number;
    rejectedProposals: number;
    sentProposals: number;
    draftProposals: number;
    viewedProposals: number;
    totalValue: number;
    acceptedValue: number;
  };
}

export default function ClientDetailPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [proposalGroups, setProposalGroups] = useState<ProposalGroup[]>([]);
  const [enhancedSendHistory, setEnhancedSendHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showEnhancedHistory, setShowEnhancedHistory] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  // Toggle group expansion
  const toggleGroup = (proposalId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(proposalId)) {
      newExpanded.delete(proposalId);
    } else {
      newExpanded.add(proposalId);
    }
    setExpandedGroups(newExpanded);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (!authLoading && user && clientId) {
      fetchClient();
      fetchClientProposalSends();
    }
  }, [user, authLoading, clientId, router]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      console.log('Fetching client with ID:', clientId);
      
      if (!clientId || clientId === 'undefined') {
        console.error('Invalid client ID:', clientId);
        toast.error('Invalid client ID');
        router.push('/clients');
        return;
      }
      
      const response = await fetch(`/api/clients/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }

      const data = await response.json();
      setClient(data.data);
    } catch (error) {
      console.error('Error fetching client:', error);
      toast.error('Failed to fetch client details');
      router.push('/clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientProposalSends = async () => {
    try {
      setProposalsLoading(true);
      
      const response = await fetch(`/api/clients/${clientId}/proposal-sends`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch client proposal sends');
      }

      const data = await response.json();
      setProposalGroups(data.data || []);
    } catch (error) {
      console.error('Error fetching client proposal sends:', error);
      toast.error('Failed to fetch proposal sends');
      setProposalGroups([]);
    } finally {
      setProposalsLoading(false);
    }
  };

  // Fetch enhanced send history for a specific proposal
  const fetchEnhancedSendHistory = async (proposalId: string) => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/send-history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch enhanced send history');
      }

      const data = await response.json();
      setEnhancedSendHistory(data.data || []);
      setSelectedProposalId(proposalId);
      setShowEnhancedHistory(true);
    } catch (error) {
      console.error('Error fetching enhanced send history:', error);
      toast.error('Failed to load enhanced send history');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'VIEWED': return 'bg-green-100 text-green-800';
      case 'ACCEPTED': return 'bg-emerald-100 text-emerald-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading client details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Client Not Found</h1>
            <p className="text-gray-600 mb-6">The client you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link href="/clients" className="btn btn-primary">
              Back to Clients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Top Navigation */}
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
              <Link href="/dashboard" className="nav-link">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Dashboard</span>
              </Link>
              <Link href="/clients" className="nav-link active">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>Clients</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Back Button */}
        <Link
          href="/clients"
          className="btn btn-secondary inline-flex items-center gap-2 mb-6"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Clients
        </Link>

        {/* Client Header */}
        <div className="card-elevated p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-4 mr-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{client.name}</h1>
                <div className="space-y-1">
                  <p className="text-blue-600 font-medium">{client.email}</p>
                  <p className="text-gray-600">{client.company}</p>
                  {client.phone && <p className="text-gray-600">{client.phone}</p>}
                  {client.industry && <p className="text-gray-500 text-sm">{client.industry}</p>}
                </div>
              </div>
            </div>
            <span className="badge badge-info">
              {client.status}
            </span>
          </div>

          {/* Client Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-6 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-600">Member Since</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(client.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Last Contact</p>
              <p className="text-lg font-semibold text-gray-900">
                {client.lastContactDate ? formatDate(client.lastContactDate) : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Proposals</p>
              <p className="text-lg font-semibold text-gray-900">{client.proposalStats?.totalProposals || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sends</p>
              <p className="text-lg font-semibold text-gray-900">{client.proposalStats?.totalSends || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-lg font-semibold text-gray-900">
                {client.proposalStats?.totalProposals 
                  ? Math.round((client.proposalStats.acceptedProposals / client.proposalStats.totalProposals) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {client.proposalStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sent</p>
                  <p className="text-2xl font-bold text-gray-900">{client.proposalStats.totalSends || client.proposalStats.sentProposals}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold text-gray-900">{client.proposalStats.acceptedProposals}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{client.proposalStats.rejectedProposals}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(client.proposalStats.totalValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Proposals Section */}
        <div className="card-elevated p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Proposal Sends</h2>
            <Link
              href="/dashboard"
              className="btn btn-primary"
            >
              Create New Proposal
            </Link>
          </div>

          {proposalsLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="md" />
              <p className="mt-4 text-gray-600">Loading proposal sends...</p>
            </div>
          ) : proposalGroups.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals sent yet</h3>
              <p className="mt-1 text-sm text-gray-500">Create your first proposal for this client.</p>
              <div className="mt-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Proposal
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {proposalGroups.map((group) => {
                const isExpanded = expandedGroups.has(group.proposalId);
                
                return (
                  <div key={group.proposalId} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    {/* Main Group Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{group.title}</h3>
                            <span className="badge badge-info text-xs">
                              v{group.version}
                            </span>
                            {group.sendCount > 1 && (
                              <span className="badge badge-warning text-xs">
                                📧 {group.sendCount}x
                              </span>
                            )}
                          </div>
                          {group.description && (
                            <p className="text-gray-600 mb-3">{group.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Latest: {formatDate(group.latestSend.sentAt)}</span>
                            <span>• To: {group.latestSend.sentTo}</span>
                            {group.sendCount > 1 && (
                              <span>• {group.sendCount} total sends</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 ml-4">
                          <span className={`badge ${
                            group.latestSend.status === 'SENT' ? 'badge-info' :
                            group.latestSend.status === 'VIEWED' ? 'badge-success' :
                            group.latestSend.status === 'ACCEPTED' ? 'badge-success' :
                            group.latestSend.status === 'REJECTED' ? 'badge-danger' :
                            'badge-gray'
                          }`}>
                            {group.latestSend.status}
                          </span>
                          <div className="flex space-x-2">
                            <Link
                              href={`/proposals/${group.proposalId}/view`}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View
                            </Link>
                            <Link
                              href={`/proposals/${group.proposalId}`}
                              className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 mt-4">
                        <button
                          onClick={() => fetchEnhancedSendHistory(group.proposalId)}
                          className="btn btn-primary btn-sm"
                        >
                          🔍 View Version History
                        </button>
                        
                        {/* Expand/Collapse Button */}
                        {group.sendCount > 1 && (
                          <button
                            onClick={() => toggleGroup(group.proposalId)}
                            className="btn btn-outline btn-sm"
                          >
                            {isExpanded ? (
                              <>🔼 Hide {group.sendCount} sends</>
                            ) : (
                              <>🔽 Show {group.sendCount} sends</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Send History */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Send History</h4>
                        <div className="space-y-3">
                          {group.sends.map((send, index) => (
                            <div key={send.sendId} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium text-gray-900">#{group.sendCount - index}</span>
                                  <span className="text-gray-600">{formatDateTime(send.sentAt)}</span>
                                  <span className="text-gray-500">→ {send.sentTo}</span>
                                  {send.version && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      v{send.version}
                                    </span>
                                  )}
                                </div>
                                {send.subject && (
                                  <p className="text-xs text-gray-500 mt-1 italic">{send.subject}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  ⚠️ Note: This shows current version. Use "View Version History" for actual content sent.
                                </p>
                              </div>
                              <span className={`badge text-xs ${
                                send.status === 'SENT' ? 'badge-info' :
                                send.status === 'VIEWED' ? 'badge-success' :
                                send.status === 'ACCEPTED' ? 'badge-success' :
                                send.status === 'REJECTED' ? 'badge-danger' :
                                'badge-gray'
                              }`}>
                                {send.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Enhanced Send History Modal */}
      {showEnhancedHistory && selectedProposalId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Enhanced Send History</h2>
                <p className="text-gray-600 mt-1">View exact content sent in each version</p>
              </div>
              <button
                onClick={() => {
                  setShowEnhancedHistory(false);
                  setSelectedProposalId(null);
                  setEnhancedSendHistory([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-hidden p-6">
              <EnhancedSendHistory
                proposalId={selectedProposalId}
                sendHistory={enhancedSendHistory}
                onRefresh={() => fetchEnhancedSendHistory(selectedProposalId)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}