import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { proposalsAPI, commentsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { 
  UserIcon, 
  CalendarIcon, 
  EyeIcon, 
  TrashIcon, 
  ArrowLeftIcon, 
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Comments from '../components/Comments';
import NotificationBell from '../components/NotificationBell';

export default function SentProposals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resending, setResending] = useState<string | null>(null);

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchSent();
  }, []);

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

  const fetchSent = async () => {
    try {
      setLoading(true);
      const response = await proposalsAPI.getAll();
      const sentProposals = response.data.data.filter((p: any) => p.status === 'SENT');
      setSent(sentProposals);
      await fetchUnreadCounts(sentProposals);
    } catch (err) {
      setError('Failed to load sent proposals');
    } finally {
      setLoading(false);
    }
  };

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading sent proposals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-400 shadow-lg fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-extrabold text-white tracking-wider drop-shadow">ProposalAI</h1>
            </div>
            <div className="flex items-center space-x-8">
              <a href="/dashboard" className="text-white/80 hover:text-white transition-colors">Dashboard</a>
              <a href="/drafts" className="text-white/80 hover:text-white transition-colors">Drafts</a>
              <a href="/sent-proposals" className="text-white font-semibold border-b-2 border-white/80 pb-1 transition-colors">Sent Proposals</a>
              <a href="/profile" className="text-white/80 hover:text-white transition-colors">Profile</a>
              <NotificationBell />
              <button 
                onClick={handleLogout}
                className="text-white/80 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-500 transition shadow"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sent Proposals</h1>
          <p className="text-gray-600">Track the engagement of your sent proposals and respond to client feedback</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {sent.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-blue-200">
              <PaperAirplaneIcon className="h-16 w-16 mb-4" />
              <div className="text-xl font-medium">No sent proposals found</div>
              <div className="text-sm mt-2">Send a proposal to see it here!</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {sent.map((proposal) => (
                <div key={proposal.id} className="bg-white rounded-2xl shadow-xl border-2 border-blue-200 p-6 flex flex-col justify-between hover:shadow-2xl transition-all duration-200">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <PaperAirplaneIcon className="h-7 w-7 text-blue-500" />
                      <span className="text-lg font-bold text-blue-900 truncate" title={proposal.title}>{proposal.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                      <UserIcon className="h-4 w-4" />
                      <span>{proposal.clientName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-400 mb-2">
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
                    
                    <div className="text-blue-800 text-sm line-clamp-3 mb-4">{proposal.description}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-gradient-to-r from-green-400 to-green-300 text-white text-sm font-semibold hover:from-green-500 hover:to-green-400 transition"
                      onClick={() => handleView(proposal.id)}
                    >
                      <EyeIcon className="h-3 w-3" /> View
                    </button>
                                        <button
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-gradient-to-r from-purple-400 to-purple-300 text-white text-sm font-semibold hover:from-purple-500 hover:to-purple-400 transition relative"
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
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-300 text-white text-sm font-semibold hover:from-yellow-500 hover:to-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-gradient-to-r from-red-400 to-red-300 text-white text-sm font-semibold hover:from-red-500 hover:to-red-400 transition"
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
      </div>
    </div>
  );
} 