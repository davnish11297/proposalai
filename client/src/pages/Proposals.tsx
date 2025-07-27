import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { proposalsAPI } from '../services/api';

interface Proposal {
  id: string;
  title: string;
  description: string;
  clientName: string;
  status: string;
  content: any;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

const draftStatuses = [
  { label: 'All Drafts', value: 'all' },
  { label: 'draft', value: 'draft' },
];

const sentStatuses = [
  { label: 'All Sent', value: 'all' },
  { label: 'sent', value: 'sent' },
  { label: 'in review', value: 'in review' },
  { label: 'won', value: 'won' },
  { label: 'lost', value: 'lost' },
];

// Removed unused proposals variable - now using real proposals from API

export default function Proposals() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'drafts' | 'sent'>('drafts');

  useEffect(() => {
    fetchProposals();
  }, []);

  // Reset status filter when switching view modes
  useEffect(() => {
    setSelectedStatus('all');
  }, [viewMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await proposalsAPI.getAll();
      setProposals(response.data.data);
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
      setError('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (e: React.MouseEvent, proposalId: string) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === proposalId ? null : proposalId);
  };

  const handleEdit = (proposalId: string) => {
    setOpenDropdown(null);
    navigate(`/proposals/${proposalId}`);
  };

  const handleView = (proposalId: string) => {
    setOpenDropdown(null);
    navigate(`/proposals/${proposalId}/view`);
  };

  const handleDelete = async (proposalId: string) => {
    setOpenDropdown(null);
    if (window.confirm('Are you sure you want to delete this proposal?')) {
      try {
        await proposalsAPI.delete(proposalId);
        // Refresh the proposals list
        fetchProposals();
        // Show success message (you can add a toast notification here)
        alert('Proposal deleted successfully');
      } catch (err) {
        console.error('Failed to delete proposal:', err);
        alert('Failed to delete proposal');
      }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredProposals = proposals.filter(proposal => {
    // Filter by view mode (drafts vs sent)
    const isDraft = proposal.status === 'DRAFT';
    const isSent = ['SENT', 'IN_REVIEW', 'WON', 'LOST'].includes(proposal.status);
    
    if (viewMode === 'drafts' && !isDraft) return false;
    if (viewMode === 'sent' && !isSent) return false;
    
    // Filter by status
    const matchesStatus = selectedStatus === 'all' || proposal.status.toLowerCase() === selectedStatus;
    
    // Filter by search
    const matchesSearch = search === '' || 
      proposal.title.toLowerCase().includes(search.toLowerCase()) ||
      proposal.clientName.toLowerCase().includes(search.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="pb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-3">
            <svg className="w-9 h-9 text-primary-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M16 3v4M8 3v4" /></svg>
            {viewMode === 'drafts' ? 'Draft Proposals' : 'Sent Proposals'}
          </h2>
          <p className="text-gray-500 text-lg">
            {viewMode === 'drafts' 
              ? 'Manage your draft proposals and continue editing them' 
              : 'Track your sent proposals and their current status'
            }
          </p>
        </div>
        <button className="btn btn-primary px-6 py-2 text-base font-semibold mt-4 md:mt-0" onClick={() => navigate('/proposals/new')}>+ New Proposal</button>
      </div>
      
      {/* View Mode Toggle - More Prominent */}
      <div className="flex items-center justify-center mb-8 bg-red-100 p-4">
        <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-300 p-2">
          <div className="flex">
            <button
              onClick={() => setViewMode('drafts')}
              className={`px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-3 ${
                viewMode === 'drafts'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Draft Proposals
            </button>
            <button
              onClick={() => setViewMode('sent')}
              className={`px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-3 ${
                viewMode === 'sent'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Sent Proposals
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
        <div className="flex-1 flex items-center bg-white rounded-lg shadow-soft px-4 py-2">
          <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <input
            className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
            placeholder="Search proposals or clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          {(viewMode === 'drafts' ? draftStatuses : sentStatuses).map(status => (
            <button
              key={status.value}
              className={`px-4 py-1.5 rounded-lg font-medium text-sm border transition ${selectedStatus === status.value ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              onClick={() => setSelectedStatus(status.value)}
            >
              <svg className="w-4 h-4 mr-1 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8" /><path d="M21 21H3V3" /></svg>
              {status.label}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-2xl p-0 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="text-xs text-gray-500 uppercase">
              <th className="px-6 py-4 text-left font-semibold">Proposal</th>
              <th className="px-6 py-4 text-left font-semibold">Client</th>
              <th className="px-6 py-4 text-left font-semibold">Status</th>
              <th className="px-6 py-4 text-left font-semibold">Value</th>
              <th className="px-6 py-4 text-left font-semibold">Created</th>
              <th className="px-6 py-4 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Loading proposals...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : filteredProposals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No proposals found
                </td>
              </tr>
            ) : (
              filteredProposals.map((proposal) => (
                <tr key={proposal.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {proposal.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{proposal.metadata?.industry || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M16 3v4M8 3v4" /></svg>
                      {proposal.clientName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusColor(proposal.status)} capitalize`}>{proposal.status.toLowerCase()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">{proposal.content?.budget || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4" /></svg>
                      {formatDate(proposal.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap relative">
                    <button 
                      className="text-gray-400 hover:text-gray-700 p-1 rounded"
                      onClick={(e) => handleActionClick(e, proposal.id)}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5" /><circle cx="19.5" cy="12" r="1.5" /><circle cx="4.5" cy="12" r="1.5" /></svg>
                    </button>
                    
                    {openDropdown === proposal.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <div className="py-1">
                          <button
                            onClick={() => handleView(proposal.id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(proposal.id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(proposal.id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 