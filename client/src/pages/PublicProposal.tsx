import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ChatBubbleLeftIcon,
  LockClosedIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { publicAPI } from '../services/api';

interface Proposal {
  id: string;
  title: string;
  content: string;
  clientName: string;
  author: {
    name: string;
    email: string;
  };
  organization: {
    name: string;
    logo?: string;
    website?: string;
  };
  createdAt: string;
  emailSentAt?: string;
  emailRecipient?: string;
  status?: string;
}

const PublicProposal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackAction, setFeedbackAction] = useState<'approve' | 'reject' | 'comment' | null>(null);
  const [comment, setComment] = useState('');

  const fetchProposal = useCallback(async (code?: string) => {
    try {
      setLoading(true);
      const response = await publicAPI.getProposal(id!, code);
      const data = response.data;

      if (!data.success) {
        if (response.status === 401) {
          setRequiresPassword(true);
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'Failed to fetch proposal');
      }

      setProposal(data.data);
      if (code) {
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      console.error('Error fetching proposal:', error);
      if (error.response?.status === 401) {
        setRequiresPassword(true);
        setLoading(false);
        return;
      }
      toast.error('Failed to load proposal');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const code = searchParams.get('accessCode');
    if (code) {
      setAccessCode(code);
      fetchProposal(code);
    } else {
      fetchProposal();
    }
  }, [searchParams, fetchProposal]);

  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.length !== 6) {
      toast.error('Please enter a 6-character access code');
      return;
    }
    await fetchProposal(accessCode);
  };

  const handleFeedbackSubmit = async (action: 'approve' | 'reject' | 'comment') => {
    if (action === 'comment' && !comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setSubmittingFeedback(true);
      const response = await publicAPI.submitFeedback(id!, {
        accessCode,
        action,
        comment: action === 'comment' ? comment : undefined
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      toast.success(
        action === 'approve' ? 'Proposal approved!' :
        action === 'reject' ? 'Proposal rejected.' :
        'Comment submitted successfully!'
      );

      // Update local state to reflect the change
      if (proposal) {
        setProposal({
          ...proposal,
          status: action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'IN_REVIEW'
        });
      }

      setFeedbackAction(null);
      setComment('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const parseContent = (content: string) => {
    try {
      return JSON.parse(content);
    } catch {
      return { executiveSummary: content };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (requiresPassword && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <LockClosedIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure Proposal Access</h1>
            <p className="text-gray-600">Enter the 6-character access code from your email to view this proposal.</p>
          </div>

          <form onSubmit={handleAccessCodeSubmit} className="space-y-6">
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
                Access Code
              </label>
              <input
                type="text"
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono tracking-widest"
                placeholder="ABCD12"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              disabled={accessCode.length !== 6}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Access Proposal
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Can't find your access code? Check your email or contact the sender.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Proposal Not Found</h1>
          <p className="text-gray-600">The proposal you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const content = parseContent(proposal.content);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {proposal.organization?.logo ? (
                <img src={proposal.organization.logo} alt="Logo" className="h-10 w-auto" />
              ) : (
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{proposal.organization?.name || 'ProposalAI'}</h1>
                <p className="text-sm text-gray-500">Professional Proposal</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Sent on</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(proposal.emailSentAt || proposal.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Proposal Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{proposal.title}</h1>
            <p className="text-lg text-gray-600">Prepared for {proposal.clientName}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center space-x-3">
              <UserIcon className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Prepared by</p>
                <p className="font-medium text-gray-900">{proposal.author.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Created on</p>
                <p className="font-medium text-gray-900">
                  {new Date(proposal.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium text-gray-900">Ready for Review</p>
              </div>
            </div>
          </div>
        </div>

        {/* Proposal Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="prose max-w-none">
            {content.executiveSummary && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Executive Summary</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content.executiveSummary}</p>
                </div>
              </div>
            )}

            {content.approach && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Approach</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content.approach}</p>
                </div>
              </div>
            )}

            {content.budgetDetails && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Budget Details</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content.budgetDetails}</p>
                </div>
              </div>
            )}

            {content.timeline && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Timeline</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content.timeline}</p>
                </div>
              </div>
            )}

            {content.budget && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Investment</h2>
                <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
                  <p className="text-2xl font-bold text-blue-900">{content.budget}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Provide Your Feedback</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setFeedbackAction('approve')}
              className="flex items-center justify-center space-x-2 p-4 border-2 border-green-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition"
            >
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
              <span className="font-medium text-green-700">Approve</span>
            </button>
            
            <button
              onClick={() => setFeedbackAction('reject')}
              className="flex items-center justify-center space-x-2 p-4 border-2 border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition"
            >
              <XCircleIcon className="h-6 w-6 text-red-600" />
              <span className="font-medium text-red-700">Reject</span>
            </button>
            
            <button
              onClick={() => setFeedbackAction('comment')}
              className="flex items-center justify-center space-x-2 p-4 border-2 border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
            >
              <ChatBubbleLeftIcon className="h-6 w-6 text-blue-600" />
              <span className="font-medium text-blue-700">Comment</span>
            </button>
          </div>

          {feedbackAction === 'comment' && (
            <div className="mb-6">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Your Comments
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Share your thoughts, questions, or requested modifications..."
              />
            </div>
          )}

          {feedbackAction && (
            <div className="flex space-x-4">
              <button
                onClick={() => handleFeedbackSubmit(feedbackAction)}
                disabled={submittingFeedback}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition disabled:opacity-50"
              >
                {submittingFeedback ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <ArrowRightIcon className="h-5 w-5" />
                )}
                <span>
                  {feedbackAction === 'approve' ? 'Approve Proposal' :
                   feedbackAction === 'reject' ? 'Reject Proposal' :
                   'Submit Comment'}
                </span>
              </button>
              
              <button
                onClick={() => {
                  setFeedbackAction(null);
                  setComment('');
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProposal; 