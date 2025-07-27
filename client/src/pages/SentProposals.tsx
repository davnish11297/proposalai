import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { proposalsAPI, commentsAPI } from '../services/api';
import { 
  UserIcon, 
  CalendarIcon, 
  EyeIcon, 
  TrashIcon, 
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import BrowserNotificationPrompt from '../components/BrowserNotificationPrompt';

export default function SentProposals() {
  const navigate = useNavigate();
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resending, setResending] = useState<string | null>(null);

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const fetchUnreadCounts = async (proposals: any[]) => {
    const counts: Record<string, number> = {};
    for (const proposal of proposals) {
      try {
        const response = await commentsAPI.getUnreadCount(proposal.id);
        counts[proposal.id] = response.data.data.unreadCount;
      } catch (error) {
        console.error(`Failed to fetch unread count for proposal ${proposal.id}:`, error);
        counts[proposal.id] = 0;
      }
    }
    setUnreadCounts(counts);
  };

  const fetchSent = useCallback(async () => {
    try {
      setLoading(true);
      const response = await proposalsAPI.getAll();
      const sentProposals = response.data.data.filter((p: any) => {
        const status = (p.status || '').toUpperCase();
        return status === 'SENT' || status === 'SENT_TO_CLIENT';
      });
      setSent(sentProposals);
      await fetchUnreadCounts(sentProposals);
    } catch (err) {
      setError('Failed to load sent proposals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSent();
  }, [fetchSent]);

  const handleView = (id: string) => navigate(`/proposals/${id}/view`);
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this sent proposal?')) {
      await proposalsAPI.delete(id);
      fetchSent();
    }
  };

  const handleResend = async (proposal: any) => {
    if (!proposal.emailRecipient) {
      toast.error('No recipient email found for this proposal');
      return;
    }

    if (window.confirm(`Resend this proposal to ${proposal.emailRecipient}?`)) {
      try {
        setResending(proposal.id);
        await proposalsAPI.sendEmail(proposal.id, {
          recipientEmail: proposal.emailRecipient,
          clientName: proposal.clientName || 'Client', // Use existing client name or fallback
          customMessage: `Hi there,\n\nI'm resending the proposal for ${proposal.title}.\n\nPlease let me know if you have any questions.\n\nBest regards`
        });
        toast.success('Proposal resent successfully!');
        fetchSent(); // Refresh the list to update timestamps
      } catch (err: any) {
        console.error('Resend error:', err);
        toast.error(err.response?.data?.error || 'Failed to resend proposal');
      } finally {
        setResending(null);
      }
    }
  };

  const handleViewComments = (proposalId: string) => {
    navigate(`/proposals/${proposalId}/view?tab=comments`);
  };

  const getEmailStatusIcon = (proposal: any) => {
    if (proposal.emailRepliedAt) {
      return <CheckCircleIcon className="h-4 w-4 text-green-600" title="Client Replied" />;
    } else if (proposal.emailOpenedAt) {
      return <EyeIcon className="h-4 w-4 text-blue-600" title="Email Opened" />;
    } else if (proposal.emailSentAt) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" title="Email Sent" />;
    }
    return null;
  };

  const getEmailStatusText = (proposal: any) => {
    if (proposal.emailRepliedAt) {
      return 'Replied';
    } else if (proposal.emailOpenedAt) {
      return 'Opened';
    } else if (proposal.emailSentAt) {
      return 'Sent';
    }
    return 'Unknown';
  };

  const getEmailStatusColor = (proposal: any) => {
    if (proposal.emailRepliedAt) {
      return 'text-green-600';
    } else if (proposal.emailOpenedAt) {
      return 'text-blue-600';
    } else if (proposal.emailSentAt) {
      return 'text-yellow-600';
    }
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading sent proposals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12 animate-fade-in-up">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg mr-4">
              <PaperAirplaneIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Sent Proposals</h1>
              <p className="mt-2 text-xl text-gray-600">Track the engagement of your sent proposals and respond to client feedback</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="status-error rounded-xl p-4 mb-8 animate-fade-in-up">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {sent.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-gray-400 animate-fade-in-up">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
                <PaperAirplaneIcon className="h-10 w-10" />
              </div>
              <div className="text-2xl font-semibold mb-2">No sent proposals found</div>
              <div className="text-lg">Send a proposal to see it here!</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {sent.map((proposal) => (
                <div key={proposal.id} className="card-elevated p-6 flex flex-col justify-between animate-fade-in-up">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                        <PaperAirplaneIcon className="h-5 w-5 text-primary-600" />
                      </div>
                      <span className="text-lg font-bold text-gray-900 truncate" title={proposal.title}>{proposal.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <UserIcon className="h-4 w-4" />
                      <span className="font-medium">{proposal.clientName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{new Date(proposal.updatedAt).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Email Status */}
                    {proposal.emailSentAt && (
                      <div className="flex items-center gap-2 text-sm mb-4">
                        {getEmailStatusIcon(proposal)}
                        <span className={getEmailStatusColor(proposal)}>
                          {getEmailStatusText(proposal)}
                        </span>
                        {proposal.emailRecipient && (
                          <span className="text-gray-500">• {proposal.emailRecipient}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="text-gray-700 text-sm line-clamp-3 mb-4">{proposal.description}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                      onClick={() => handleView(proposal.id)}
                    >
                      <EyeIcon className="h-3 w-3" /> View
                    </button>
                    <button
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors relative"
                      onClick={() => handleViewComments(proposal.id)}
                    >
                      <ChatBubbleLeftIcon className="h-3 w-3" /> 
                      Comments
                      {unreadCounts[proposal.id] > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCounts[proposal.id]}
                        </span>
                      )}
                    </button>
                    <button
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleResend(proposal)}
                      disabled={resending === proposal.id}
                    >
                      {resending === proposal.id ? (
                        <ArrowPathIcon className="h-3 w-3 animate-spin" />
                      ) : (
                        <ArrowPathIcon className="h-3 w-3" />
                      )}
                      {resending === proposal.id ? 'Resending...' : 'Resend'}
                    </button>
                    <button
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                      onClick={() => handleDelete(proposal.id)}
                    >
                      <TrashIcon className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Browser Notification Prompt */}
        <BrowserNotificationPrompt 
          showPrompt={false} // Don't show automatically on this page
          onClose={() => {}}
          onPermissionGranted={() => {
            toast.success('Browser notifications enabled!');
          }}
          onPermissionDenied={() => {
            toast('You can enable notifications manually in your browser settings');
          }}
        />
      </div>
    </div>
  );
} 