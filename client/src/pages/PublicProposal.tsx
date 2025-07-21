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
import PublicComments from '../components/PublicComments';

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

// Reusable Request Access Form Component
const RequestAccessForm: React.FC<{
  onSubmit: (e: React.FormEvent) => Promise<void>;
  requestAccessData: {
    name: string;
    email: string;
    company: string;
    reason: string;
  };
  setRequestAccessData: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    company: string;
    reason: string;
  }>>;
  submittingRequest: boolean;
  onCancel?: () => void;
  isFullPage?: boolean;
}> = ({ onSubmit, requestAccessData, setRequestAccessData, submittingRequest, onCancel, isFullPage = false }) => {
  const formContent = (
    <div className={`bg-white rounded-lg p-6 ${isFullPage ? 'max-w-md w-full' : 'max-w-md mx-auto'}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Access</h3>
      <p className="text-sm text-gray-600 mb-4">
        Need to review this proposal again? Request access from the proposal owner.
      </p>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Name *
          </label>
          <input
            type="text"
            required
            value={requestAccessData.name}
            onChange={(e) => setRequestAccessData({...requestAccessData, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your full name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={requestAccessData.email}
            onChange={(e) => setRequestAccessData({...requestAccessData, email: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email address"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <input
            type="text"
            value={requestAccessData.company}
            onChange={(e) => setRequestAccessData({...requestAccessData, company: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your company name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Access
          </label>
          <textarea
            value={requestAccessData.reason}
            onChange={(e) => setRequestAccessData({...requestAccessData, reason: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Why do you need access to this proposal?"
          />
        </div>
        
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={submittingRequest}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submittingRequest ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending Request...
              </span>
            ) : (
              'Request Access'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        The proposal owner will review your request and respond via email.
      </p>
    </div>
  );

  if (isFullPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Access</h1>
            <p className="text-gray-600">Fill out the form below to request access to this proposal.</p>
          </div>
          {formContent}
        </div>
      </div>
    );
  }

  return formContent;
};

const PublicProposal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(true); // Start with true to show access form by default
  const [accessCode, setAccessCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackAction, setFeedbackAction] = useState<'approve' | 'reject' | 'comment' | null>(null);
  const [comment, setComment] = useState('');
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [requestAccessData, setRequestAccessData] = useState({
    name: '',
    email: '',
    company: '',
    reason: ''
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

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
        if (response.status === 403) {
          // Proposal has been approved/rejected
          setProposal({ 
            id: id!, 
            title: 'Proposal Reviewed', 
            content: '{}', 
            clientName: '', 
            author: { name: '', email: '' }, 
            organization: { name: '' },
            createdAt: new Date().toISOString(),
            status: 'REVIEWED'
          });
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
        // For any other error, show the access code form
        setRequiresPassword(true);
        setLoading(false);
        return;
      }

      setProposal(data.data);
      setRequiresPassword(false); // We successfully got the proposal, so no password required
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
      if (error.response?.status === 403) {
        // Proposal has been approved/rejected
        setProposal({ 
          id: id!, 
          title: 'Proposal Reviewed', 
          content: '{}', 
          clientName: '', 
          author: { name: '', email: '' }, 
          organization: { name: '' },
          createdAt: new Date().toISOString(),
          status: 'REVIEWED'
        });
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }
      // For any other error, show the access code form
      setRequiresPassword(true);
      setLoading(false);
      return;
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

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestAccessData.name.trim() || !requestAccessData.email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmittingRequest(true);
      
      // Send request access email to the proposal author
      const response = await fetch(`http://localhost:3001/api/public/proposals/${id}/request-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: requestAccessData.name.trim(),
          email: requestAccessData.email.trim(),
          company: requestAccessData.company.trim(),
          reason: requestAccessData.reason.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Access request sent successfully! The proposal owner will review your request.');
        setShowRequestAccess(false);
        setRequestAccessData({ name: '', email: '', company: '', reason: '' });
      } else {
        throw new Error(data.error || 'Failed to send access request');
      }
    } catch (error) {
      console.error('Error requesting access:', error);
      toast.error('Failed to send access request. Please try again.');
    } finally {
      setSubmittingRequest(false);
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

  // Debug logging
  console.log('PublicProposal render state:', { 
    requiresPassword, 
    isAuthenticated, 
    loading, 
    showRequestAccess,
    proposal: proposal ? 'exists' : 'null'
  });

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
            <p className="text-sm text-gray-500 mb-4">
              Can't find your access code? Check your email or contact the sender.
            </p>
            <button
              type="button"
              onClick={() => setShowRequestAccess(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
            >
              Request Access to this Proposal
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showRequestAccess) {
    return (
      <RequestAccessForm
        onSubmit={handleRequestAccess}
        requestAccessData={requestAccessData}
        setRequestAccessData={setRequestAccessData}
        submittingRequest={submittingRequest}
        onCancel={() => setShowRequestAccess(false)}
        isFullPage={true}
      />
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
                <p className={`font-medium ${
                  proposal.status === 'APPROVED' ? 'text-green-600' :
                  proposal.status === 'REJECTED' ? 'text-red-600' :
                  proposal.status === 'IN_REVIEW' ? 'text-yellow-600' :
                  'text-gray-900'
                }`}>
                  {proposal.status === 'APPROVED' ? 'Approved' :
                   proposal.status === 'REJECTED' ? 'Rejected' :
                   proposal.status === 'IN_REVIEW' ? 'Under Review' :
                   'Ready for Review'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Proposal Content - Only show if there's actual content */}
        {(content.executiveSummary || content.approach || content.budgetDetails || content.timeline || content.budget) && (
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
        )}

        {/* Feedback Section */}
        {proposal.status === 'APPROVED' ? (
          <div className="bg-green-50 rounded-2xl shadow-lg p-8 mb-8 border border-green-200">
            <div className="text-center">
              <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">Proposal Approved!</h2>
              <p className="text-green-700 mb-6">Thank you for approving this proposal. The team will be in touch soon to discuss next steps.</p>
              
              {/* Request Access Form for Approved Proposals */}
              <RequestAccessForm
                onSubmit={handleRequestAccess}
                requestAccessData={requestAccessData}
                setRequestAccessData={setRequestAccessData}
                submittingRequest={submittingRequest}
              />
            </div>
          </div>
        ) : proposal.status === 'REJECTED' ? (
          <div className="bg-red-50 rounded-2xl shadow-lg p-8 mb-8 border border-red-200">
            <div className="text-center">
              <XCircleIcon className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-900 mb-2">Proposal Rejected</h2>
              <p className="text-red-700 mb-6">Thank you for your feedback. We appreciate you taking the time to review this proposal.</p>
              
              {/* Request Access Form for Rejected Proposals */}
              <RequestAccessForm
                onSubmit={handleRequestAccess}
                requestAccessData={requestAccessData}
                setRequestAccessData={setRequestAccessData}
                submittingRequest={submittingRequest}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
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
        )}

        {/* Comments Section - Only show if proposal is not reviewed */}
        {isAuthenticated && proposal.status !== 'APPROVED' && proposal.status !== 'REJECTED' && proposal.status !== 'REVIEWED' && (
          <PublicComments 
            proposalId={proposal.id} 
            accessCode={accessCode}
          />
        )}
      </div>
    </div>
  );
};

export default PublicProposal; 