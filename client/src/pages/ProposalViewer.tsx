import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { proposalsAPI } from '../services/api';
import Comments from '../components/Comments';
import { useAuth } from '../hooks/useAuth';

interface Proposal {
  id: string;
  title: string;
  description?: string;
  clientName: string;
  clientEmail?: string;
  status: string;
  type: string;
  content: any;
  metadata?: any;
  version: number;
  isPublic: boolean;
  publicUrl?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: {
    name: string;
    email: string;
  };
  comments: any[];
  activities: any[];
  _count: {
    comments: number;
    activities: number;
  };
}

const ProposalViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'activity'>('overview');

  useEffect(() => {
    if (id) {
      fetchProposal();
    }
  }, [id]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const response = await proposalsAPI.getById(id!);
      if (response.data.success) {
        setProposal(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch proposal:', error);
      toast.error('Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WON': return 'bg-green-100 text-green-800';
      case 'LOST': return 'bg-red-100 text-red-800';
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WON': return '🏆';
      case 'LOST': return '❌';
      case 'IN_REVIEW': return '⏳';
      case 'SENT': return '📤';
      case 'DRAFT': return '📝';
      default: return '📄';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderBudgetDetails = (budgetDetails: any) => {
    if (!budgetDetails) return null;
    
    if (typeof budgetDetails === 'object' && budgetDetails.total) {
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Budget Breakdown</h4>
          <div className="text-2xl font-bold text-blue-600 mb-2">
            ${budgetDetails.total?.toLocaleString() || 'N/A'}
          </div>
          {budgetDetails.breakdown && (
            <div className="space-y-2">
              {Object.entries(budgetDetails.breakdown).map(([key, value]: [string, any]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="font-medium">${value?.toLocaleString() || 'N/A'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return <div className="text-gray-700">{JSON.stringify(budgetDetails)}</div>;
  };

  const renderContentSection = (title: string, content: any) => {
    if (!content) return null;
    
    let displayContent = content;
    if (typeof content === 'object') {
      if (content.total && content.breakdown) {
        return renderBudgetDetails(content);
      }
      displayContent = JSON.stringify(content);
    }
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-gray-700 whitespace-pre-wrap">{displayContent}</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Proposal Not Found</h1>
          <p className="text-gray-600 mb-6">The proposal you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/proposals')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Proposals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => navigate('/proposals')}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Back to Proposals
                </button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{proposal.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Client: {proposal.clientName}</span>
                <span>•</span>
                <span>Created by {proposal.author.name}</span>
                <span>•</span>
                <span>{formatDate(proposal.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}>
                {getStatusIcon(proposal.status)} {proposal.status.replace('_', ' ')}
              </span>
              <button
                onClick={() => navigate(`/proposals/${proposal.id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Proposal
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: '📋' },
                { id: 'comments', label: `Comments (${proposal._count?.comments || 0})`, icon: '💬' },
                { id: 'activity', label: 'Activity', icon: '📊' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {proposal.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{proposal.description}</p>
                    </div>
                  </div>
                )}

                {proposal.content?.executiveSummary && 
                  renderContentSection('Executive Summary', proposal.content.executiveSummary)}
                
                {proposal.content?.problemStatement && 
                  renderContentSection('Problem Statement', proposal.content.problemStatement)}
                
                {proposal.content?.solution && 
                  renderContentSection('Solution', proposal.content.solution)}
                
                {proposal.content?.approach && 
                  renderContentSection('Approach', proposal.content.approach)}
                
                {proposal.content?.timeline && 
                  renderContentSection('Timeline', proposal.content.timeline)}
                
                {proposal.content?.budgetDetails && 
                  renderContentSection('Budget Details', proposal.content.budgetDetails)}
                
                {proposal.content?.budget && 
                  renderContentSection('Budget', proposal.content.budget)}
                
                {proposal.content?.pricing && 
                  renderContentSection('Pricing', proposal.content.pricing)}
                
                {proposal.content?.nextSteps && 
                  renderContentSection('Next Steps', proposal.content.nextSteps)}
                
                {proposal.content?.findings && 
                  renderContentSection('Findings', proposal.content.findings)}
                
                {proposal.content?.recommendations && 
                  renderContentSection('Recommendations', proposal.content.recommendations)}

                {/* Metadata */}
                {proposal.metadata && Object.keys(proposal.metadata).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(proposal.metadata).map(([key, value]) => (
                          <div key={key}>
                            <dt className="text-sm font-medium text-gray-500 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </dt>
                            <dd className="text-sm text-gray-900 mt-1">{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <Comments 
                proposalId={proposal.id} 
                currentUser={{
                  firstName: user?.firstName || '',
                  lastName: user?.lastName || '',
                  email: user?.email || '',
                  avatar: user?.avatar
                }}
              />
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                {proposal.activities && proposal.activities.length > 0 ? (
                  <div className="space-y-3">
                    {proposal.activities.map((activity: any) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">
                            {activity.user?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{activity.user?.name || 'Unknown User'}</span>
                            {' '}{activity.type.toLowerCase().replace('_', ' ')} this proposal
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(activity.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No activity recorded yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalViewer; 