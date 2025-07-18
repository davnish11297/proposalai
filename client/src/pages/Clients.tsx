import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { clientsAPI } from '../services/api';
import ClientProposals from '../components/ClientProposals';

interface Client {
  id: string;
  name: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientsAPI.getAll();
      if (response.data.success) {
        setClients(response.data.data);
      } else {
        setError('Failed to fetch clients');
      }
    } catch (error) {
      console.error('Fetch clients error:', error);
      setError('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await clientsAPI.create(formData);
      if (response.data.success) {
        toast.success('Client added successfully!');
        setShowAddModal(false);
        setFormData({ name: '', email: '' });
        fetchClients();
      } else {
        toast.error('Failed to add client');
      }
    } catch (error) {
      console.error('Add client error:', error);
      toast.error('Failed to add client');
    }
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    
    try {
      const response = await clientsAPI.update(selectedClient.id, formData);
      if (response.data.success) {
        toast.success('Client updated successfully!');
        setShowEditModal(false);
        setSelectedClient(null);
        setFormData({ name: '', email: '' });
        fetchClients();
      } else {
        toast.error('Failed to update client');
      }
    } catch (error) {
      console.error('Update client error:', error);
      toast.error('Failed to update client');
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    
    try {
      const response = await clientsAPI.delete(selectedClient.id);
      if (response.data.success) {
        toast.success('Client deleted successfully!');
        setShowDeleteModal(false);
        setSelectedClient(null);
        fetchClients();
      } else {
        toast.error('Failed to delete client');
      }
    } catch (error) {
      console.error('Delete client error:', error);
      toast.error('Failed to delete client');
    }
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      email: client.email || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const handleUseInProposal = (client: Client) => {
    // Navigate to proposal editor with client data
    navigate('/proposals/new', {
      state: {
        selectedClient: {
          id: client.id,
          name: client.name,
          email: client.email || ''
        }
      }
    });
    toast.success(`Selected ${client.name} for new proposal`);
  };

  const toggleExpanded = (clientId: string) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
              <p className="mt-2 text-gray-600">Manage your client relationships and view their proposals</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <span>➕</span>
              Add Client
            </button>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>📊 Total: {clients.length} clients</span>
              <span>🔍 Showing: {filteredClients.length} results</span>
            </div>
          </div>
        </div>

        {/* Clients List */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first client'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Add Your First Client
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <div key={client.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Client Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{client.name}</h3>
                        <button
                          onClick={() => toggleExpanded(client.id)}
                          className={`p-2 rounded-full transition-colors duration-200 ${
                            expandedClient === client.id 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={expandedClient === client.id ? 'Hide proposals' : 'View proposals'}
                        >
                          {expandedClient === client.id ? '🔽' : '▶️'}
                        </button>
                      </div>
                      
                      {client.email && (
                        <p className="text-gray-600 text-sm mb-2">📧 {client.email}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📅 Added: {new Date(client.createdAt).toLocaleDateString()}</span>
                        <span>🔄 Updated: {new Date(client.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUseInProposal(client)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center gap-2"
                        title="Create new proposal for this client"
                      >
                        <span>📄</span>
                        New Proposal
                      </button>
                      <button
                        onClick={() => openEditModal(client)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors duration-200"
                        title="Edit client"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => openDeleteModal(client)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors duration-200"
                        title="Delete client"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>

                {/* Proposals Section */}
                <ClientProposals 
                  clientName={client.name} 
                  isExpanded={expandedClient === client.id} 
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Client</h2>
            <form onSubmit={handleAddClient}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter client name"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
                >
                  Add Client
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', email: '' });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Client</h2>
            <form onSubmit={handleEditClient}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter client name"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
                >
                  Update Client
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedClient(null);
                    setFormData({ name: '', email: '' });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Delete Client</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{selectedClient.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteClient}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
              >
                Delete Client
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedClient(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md font-medium transition-colors duration-200"
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

export default Clients; 