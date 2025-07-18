import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { proposalsAPI } from '../services/api';

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
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  _count: {
    comments: number;
    activities: number;
  };
}

interface ClientProposalsProps {
  clientName: string;
  isExpanded: boolean;
}

const ClientProposals: React.FC<ClientProposalsProps> = ({ clientName, isExpanded }) => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isExpanded && clientName) {
      fetchProposals();
    }
  }, [isExpanded, clientName]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await proposalsAPI.getByClient(clientName);
      if (response.data.success) {
        setProposals(response.data.data);
      } else {
        setError('Failed to fetch proposals');
      }
    } catch (error) {
      console.error('Fetch proposals error:', error);
      setError('Failed to fetch proposals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WON': return 'bg-green-100 text-green-800 border-green-200';
      case 'LOST': return 'bg-red-100 text-red-800 border-red-200';
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SENT': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getBudgetDisplay = (content: any) => {
    if (content?.budgetDetails?.total) {
      return `$${content.budgetDetails.total.toLocaleString()}`;
    }
    if (content?.budget?.total) {
      return `$${content.budget.total.toLocaleString()}`;
    }
    if (content?.pricing?.total) {
      return `$${content.pricing.total.toLocaleString()}`;
    }
    return 'N/A';
  };

  if (!isExpanded) return null;

  if (loading) {
    return (
      <div className="bg-gray-50 border-t border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading proposals...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 border-t border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-gray-50 border-t border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals found</h3>
          <p className="text-gray-600 mb-4">No proposals have been created for this client yet.</p>
          <button
            onClick={() => navigate('/proposals/new', {
              state: { selectedClient: { name: clientName } }
            })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
          >
            Create First Proposal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border-t border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Proposals for {clientName}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>📊 {proposals.length} proposal{proposals.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="grid gap-4">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {proposal.title}
                      </h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(proposal.status)}`}>
                        <span>{getStatusIcon(proposal.status)}</span>
                        {proposal.status.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>
                    
                    {proposal.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {proposal.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Budget:</span>
                        <div className="font-medium text-gray-900">
                          {getBudgetDisplay(proposal.content)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <div className="font-medium text-gray-900">
                          {formatDate(proposal.createdAt)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Updated:</span>
                        <div className="font-medium text-gray-900">
                          {formatDate(proposal.updatedAt)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Version:</span>
                        <div className="font-medium text-gray-900">
                          v{proposal.version}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>👤 {proposal.user.firstName} {proposal.user.lastName}</span>
                      <span>💬 {proposal._count.comments} comments</span>
                      <span>📈 {proposal._count.activities} activities</span>
                      {proposal.isPublic && (
                        <span className="text-green-600">🌐 Public</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => navigate(`/proposals/${proposal.id}/view`)}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors duration-200"
                      title="View proposal"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => navigate(`/proposals/${proposal.id}`)}
                      className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50 transition-colors duration-200"
                      title="Edit proposal"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => navigate(`/proposals/${proposal.id}/view`)}
                      className="text-purple-600 hover:text-purple-800 p-2 rounded-full hover:bg-purple-50 transition-colors duration-200"
                      title="Send proposal"
                    >
                      📤
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📋 {proposal.type.toLowerCase()}</span>
                    {proposal.metadata?.industry && (
                      <span>🏭 {proposal.metadata.industry}</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/proposals/${proposal.id}/view`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/proposals/${proposal.id}`)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/proposals/new', {
              state: { selectedClient: { name: clientName } }
            })}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
          >
            <span>➕</span>
            Create New Proposal for {clientName}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientProposals; 