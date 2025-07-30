'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Proposal {
  _id: string;
  title: string;
  description?: string;
  content: string;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  version?: number;
  clientInfo?: {
    name?: string;
    email?: string;
  };
  views?: Array<{
    viewedAt: string;
    viewerIP: string;
  }>;
  downloads?: Array<{
    downloadedAt: string;
    format: string;
  }>;
  versionHistory?: Array<{
    version: number;
    content?: string;
    changes: string;
    changeType: string;
    createdAt: string;
    isSnapshot?: boolean;
    isCurrent?: boolean;
  }>;
}

export default function ProposalViewPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<Array<{
    version: number;
    content?: string;
    changes: string;
    changeType: string;
    createdAt: string;
    isSnapshot?: boolean;
    isCurrent?: boolean;
  }>>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [versionContent, setVersionContent] = useState<string>('');

  // Close version dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showVersions) {
        setShowVersions(false);
      }
    };

    if (showVersions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVersions]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (!authLoading && user && proposalId) {
      fetchProposal();
      fetchVersions();
    }
  }, [user, authLoading, proposalId, router]);

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/versions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVersions(data.data?.versions || []);
      } else {
        console.warn('Failed to fetch versions:', response.status);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const viewVersion = async (version: number) => {
    try {
      setVersionContent('Loading...'); // Show loading state
      
      const response = await fetch(`/api/proposals/${proposalId}/versions/${version}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.data?.version?.content;
        
        if (content) {
          setVersionContent(content);
          setSelectedVersion(version);
        } else {
          setVersionContent('Version content not available');
          toast.error('Version content not found');
        }
      } else {
        setVersionContent('Failed to load version');
        toast.error('Failed to load version');
      }
    } catch (error) {
      console.error('Error fetching version:', error);
      setVersionContent('Error loading version');
      toast.error('Failed to load version');
    }
  };

  const fetchProposal = async () => {
    try {
      setLoading(true);
      console.log('Fetching proposal with ID:', proposalId);
      
      if (!proposalId || proposalId === 'undefined') {
        console.error('Invalid proposal ID:', proposalId);
        toast.error('Invalid proposal ID');
        router.push('/drafts');
        return;
      }
      
      const response = await fetch(`/api/proposals/${proposalId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch proposal');
      }

      const data = await response.json();
      const proposalData = data.data;
      setProposal(proposalData);
      
      // Pre-fill client info if available
      if (proposalData.clientInfo) {
        setClientName(proposalData.clientInfo.name || '');
        setEmail(proposalData.clientInfo.email || '');
      }
    } catch (error) {
      console.error('Error fetching proposal:', error);
      toast.error('Failed to fetch proposal');
      router.push('/drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/download-pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${proposal?.title || 'proposal'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch (error) {
      toast.error('Failed to download PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (!clientName) {
      toast.error('Please enter a client name.');
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          recipientEmail: email,
          clientName: clientName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast.success('Proposal sent via email!');
      setShowEmailModal(false);
      setEmail('');
      setClientName('');
    } catch (error) {
      toast.error('Failed to send email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // CONDITIONAL RENDERING MOVED TO END AFTER ALL HOOKS
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading proposal...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Proposal Not Found</h1>
            <p className="text-gray-600 mb-6">The proposal you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link href="/drafts" className="btn btn-primary">
              Back to Drafts
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
              <Link href="/drafts" className="nav-link active">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Drafts</span>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Back Button */}
        <Link
          href="/drafts"
          className="btn btn-secondary inline-flex items-center gap-2 mb-6"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Drafts
        </Link>

        <div className="card-elevated p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
                <span className="badge badge-info">
                  v{selectedVersion || proposal.version || 1}
                </span>
                {selectedVersion && selectedVersion !== (proposal.version || 1) && (
                  <span className="badge badge-warning text-xs">
                    Viewing old version
                  </span>
                )}
              </div>
              {proposal.description && (
                <p className="text-gray-600 mb-4">{proposal.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Created {formatDate(proposal.createdAt)}</span>
                <span>•</span>
                <span>Updated {formatDate(proposal.updatedAt)}</span>
                <span>•</span>
                <span>{proposal.views?.length || 0} views</span>
                <span>•</span>
                <span>{proposal.downloads?.length || 0} downloads</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {versions.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setShowVersions(!showVersions)}
                    className="btn btn-secondary text-sm flex items-center gap-2"
                    disabled={versions.length === 0}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Versions ({versions.length})
                  </button>
                  
                  {showVersions && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Version History</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {versions.map((version) => (
                            <div
                              key={version.version}
                              className={`p-3 rounded border cursor-pointer hover:bg-gray-50 ${
                                (selectedVersion || proposal.version || 1) === version.version 
                                  ? 'border-blue-300 bg-blue-50' 
                                  : 'border-gray-200'
                              }`}
                              onClick={() => {
                                if (version.isCurrent) {
                                  setSelectedVersion(null);
                                  setVersionContent('');
                                } else {
                                  viewVersion(version.version);
                                }
                                setShowVersions(false);
                              }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">
                                  Version {version.version}
                                  {version.isCurrent && ' (Current)'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(version.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">{version.changes || 'No description'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                proposal.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                proposal.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                proposal.status === 'VIEWED' ? 'bg-green-100 text-green-800' :
                proposal.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                proposal.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {proposal.status}
              </span>
            </div>
          </div>

          {/* Client Info */}
          {proposal.clientInfo?.name && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Client Information</h3>
              <div className="flex items-center text-sm text-blue-700">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {proposal.clientInfo.name}
                {proposal.clientInfo.email && (
                  <span className="ml-2 text-blue-600">({proposal.clientInfo.email})</span>
                )}
              </div>
            </div>
          )}

          {/* Version Warning Banner */}
          {selectedVersion && selectedVersion !== (proposal.version || 1) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-amber-800 font-medium">
                    You're viewing version {selectedVersion}. Current version is {proposal.version || 1}.
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedVersion(null);
                    setVersionContent('');
                  }}
                  className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                >
                  View Current
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-gray max-w-none mb-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="whitespace-pre-wrap text-gray-700 leading-7">
                {selectedVersion ? (versionContent || 'Loading version content...') : (proposal.content || 'No content available')}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <Link
              href={`/proposals/${proposalId}`}
              className="btn btn-primary flex-1 text-center"
            >
              Edit Proposal
            </Link>
            <button
              onClick={() => setShowEmailModal(true)}
              className="btn btn-secondary flex-1"
            >
              Send Email
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="btn btn-outline"
            >
              {downloadingPdf ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Send Proposal via Email</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter client's full name"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    disabled={sendingEmail}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="input"
                    placeholder="Recipient's email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={sendingEmail}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmail('');
                    setClientName('');
                  }}
                  className="btn btn-secondary"
                  disabled={sendingEmail}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  className="btn btn-primary"
                  disabled={sendingEmail || !email.trim() || !clientName.trim()}
                >
                  {sendingEmail ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}