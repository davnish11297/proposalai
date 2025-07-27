import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  HomeIcon, 
  BriefcaseIcon, 
  DocumentTextIcon, 
  CalendarIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  UserIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { clientsAPI } from '../services/api';

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
      fetchClient(); // Refresh client data
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
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SENT':
      case 'SENT_TO_CLIENT':
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading client details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <UserIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Client not found</h2>
          <p className="text-xl text-gray-600 mb-6">The client you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/clients')}
            className="btn-primary inline-flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12 animate-fade-in-up">
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center text-primary-600 hover:text-primary-700 mb-6 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Clients
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center mb-6 sm:mb-0">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg mr-4">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{client.name}</h1>
                <p className="mt-2 text-xl text-gray-600">Client details and proposal history</p>
              </div>
            </div>
          
          <div className="mt-4 sm:mt-0 flex gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Client Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{client.email}</p>
                    <p className="text-sm text-gray-500">Email</p>
                  </div>
                </div>
                
                {client.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.phone}</p>
                      <p className="text-sm text-gray-500">Phone</p>
                    </div>
                  </div>
                )}
                
                {client.company && (
                  <div className="flex items-center">
                    <HomeIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.company}</p>
                      <p className="text-sm text-gray-500">Company</p>
                    </div>
                  </div>
                )}
                
                {client.industry && (
                  <div className="flex items-center">
                    <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.industry}</p>
                      <p className="text-sm text-gray-500">Industry</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatDate(client.createdAt)}</p>
                    <p className="text-sm text-gray-500">Added</p>
                  </div>
                </div>
              </div>
              
              {client.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-sm text-gray-600">{client.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Proposals */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Proposals ({client.proposals?.length || 0})</h2>
              
              {!client.proposals || client.proposals.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals</h3>
                  <p className="mt-1 text-sm text-gray-500">This client hasn't received any proposals yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {client.proposals.map((proposal) => (
                    <div key={proposal.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{proposal.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{proposal.description}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                              {proposal.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDate(proposal.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/proposals/${proposal.id}/view`)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Client</h3>
            <form onSubmit={handleUpdateClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <input
                  type="text"
                  value={editForm.industry}
                  onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Client</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {client.name}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClient}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetail; 