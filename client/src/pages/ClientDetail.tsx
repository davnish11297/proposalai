import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  HomeIcon, 
  BriefcaseIcon, 
  DocumentTextIcon, 
  CalendarIcon, 
  PencilIcon, 
  TrashIcon, 
  PaperAirplaneIcon, 
  EyeIcon,
  UsersIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { clientsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/NotificationBell';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  industry?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  proposals: Proposal[];
}

interface Proposal {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
  emailSentAt?: string;
  emailRecipient?: string;
}

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    notes: ''
  });

  const fetchClient = useCallback(async () => {
    try {
      setLoading(true);
      const response = await clientsAPI.getClient(id!);
      const clientData = response.data?.data || response.data;
      setClient(clientData);
      setEditForm({
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone || '',
        company: clientData.company || '',
        industry: clientData.industry || '',
        notes: clientData.notes || ''
      });
    } catch (error) {
      console.error('Error fetching client:', error);
      toast.error('Failed to fetch client details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchClient();
    }
  }, [id, fetchClient]);

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    try {
      await clientsAPI.updateClient(client.id, editForm);
      toast.success('Client updated successfully!');
      setShowEditModal(false);
      fetchClient();
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    }
  };

  const handleDeleteClient = async () => {
    if (!client) return;

    try {
      await clientsAPI.deleteClient(client.id);
      toast.success('Client deleted successfully!');
      // Redirect to clients list
      navigate('/clients');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading client details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Client not found</h2>
          <p className="text-gray-600 mb-4">The client you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/clients')}
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
            Back to Clients
          </button>
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
              <a href="/dashboard" className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors">
                <HomeIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              <a href="/drafts" className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors">
                <DocumentTextIcon className="w-5 h-5" />
                <span>Drafts</span>
              </a>
              <a href="/sent-proposals" className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors">
                <PaperAirplaneIcon className="w-5 h-5" />
                <span>Sent Proposals</span>
              </a>
              <a href="/clients" className="flex items-center space-x-1 text-white font-semibold border-b-2 border-white/80 pb-1 transition-colors">
                <UsersIcon className="w-5 h-5" />
                <span>Clients</span>
              </a>
              <a href="/profile" className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors">
                <UserIcon className="w-5 h-5" />
                <span>Profile</span>
              </a>
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
          onClick={() => navigate('/clients')}
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-500 transition shadow"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Clients
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="mt-2 text-gray-600">Client details and proposal history</p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{client.email}</p>
                  </div>
                </div>
                
                {client.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-gray-600">{client.phone}</p>
                    </div>
                  </div>
                )}
                
                {client.company && (
                  <div className="flex items-center">
                    <HomeIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Company</p>
                      <p className="text-sm text-gray-600">{client.company}</p>
                    </div>
                  </div>
                )}
                
                {client.industry && (
                  <div className="flex items-center">
                    <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Industry</p>
                      <p className="text-sm text-gray-600">{client.industry}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Added</p>
                    <p className="text-sm text-gray-600">{formatDate(client.createdAt)}</p>
                  </div>
                </div>
                
                {client.notes && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-2">Notes</p>
                    <p className="text-sm text-gray-600">{client.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Proposals */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Proposals ({client.proposals?.length || 0})</h2>
              </div>
              
              <div className="p-6">
                {!client.proposals || client.proposals.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This client hasn't received any proposals yet.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <PaperAirplaneIcon className="mr-2 h-4 w-4" />
                        Create Proposal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {client.proposals?.map((proposal) => (
                      <div key={proposal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{proposal.title}</h3>
                            {proposal.description && (
                              <p className="text-sm text-gray-600 mb-3">{proposal.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                              <span className="flex items-center">
                                <DocumentTextIcon className="mr-1 h-4 w-4" />
                                {proposal.type}
                              </span>
                              <span className="flex items-center">
                                <CalendarIcon className="mr-1 h-4 w-4" />
                                {formatDate(proposal.createdAt)}
                              </span>
                            </div>
                            
                            {proposal.emailSentAt && (
                              <p className="text-sm text-gray-500">
                                Sent to {proposal.emailRecipient} on {formatDate(proposal.emailSentAt)}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                              {proposal.status}
                            </span>
                            
                            <button
                              onClick={() => navigate(`/proposals/${proposal.id}`)}
                              className="inline-flex items-center p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                              title="View proposal"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Client</h2>
            <form onSubmit={handleUpdateClient}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={editForm.industry}
                    onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium"
                >
                  Update Client
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Delete Client</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{client.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteClient}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium"
              >
                Delete Client
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetail; 