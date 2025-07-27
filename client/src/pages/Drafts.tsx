import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { proposalsAPI, clientsAPI } from '../services/api';
import { 
  DocumentTextIcon, 
  UserIcon, 
  CalendarIcon, 
  PencilSquareIcon, 
  EyeIcon, 
  TrashIcon, 
  PaperAirplaneIcon,
  ChevronDownIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function Drafts() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [sentProposals, setSentProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [viewMode, setViewMode] = useState<'drafts' | 'sent'>('drafts');
  
  // Client selection states
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);

  useEffect(() => {
    fetchProposals();
    fetchClients();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.client-dropdown')) {
        setShowClientDropdown(false);
      }
    };

    if (showClientDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClientDropdown]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await proposalsAPI.getAll();
      const allProposals = response.data.data;
      setDrafts(allProposals.filter((p: any) => p.status === 'DRAFT'));
      setSentProposals(allProposals.filter((p: any) => ['SENT', 'IN_REVIEW', 'WON', 'LOST'].includes(p.status)));
    } catch (err) {
      setError('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getClients();
      const clientsData = response.data?.data || [];
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleEdit = (id: string) => navigate(`/proposals/${id}`);
  const handleView = (id: string) => navigate(`/proposals/${id}/view`);
  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this draft?')) {
      await proposalsAPI.delete(id);
      fetchProposals();
    }
  };

  const handleSend = (draft: any) => {
    setSelectedDraft(draft);
    setRecipientEmail('');
    setClientName('');
    setSelectedClientId('');
    setShowClientDropdown(false);
    setShowNewClientForm(false);
    setNewClientName('');
    setNewClientEmail('');
    setSendError('');
    setShowSendModal(true);
  };

  const handleClientSelect = (client: any) => {
    setSelectedClientId(client.id);
    setClientName(client.name);
    setRecipientEmail(client.email);
    setShowClientDropdown(false);
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim() || !newClientEmail.trim()) {
      return;
    }

    try {
      setCreatingClient(true);
      const response = await clientsAPI.create({
        name: newClientName.trim(),
        email: newClientEmail.trim()
      });
      
      const newClient = response.data?.data;
      setClients([...clients, newClient]);
      
      // Select the newly created client
      setSelectedClientId(newClient.id);
      setClientName(newClient.name);
      setRecipientEmail(newClient.email);
      
      // Reset form
      setShowNewClientForm(false);
      setNewClientName('');
      setNewClientEmail('');
    } catch (error) {
      console.error('Error creating client:', error);
    } finally {
      setCreatingClient(false);
    }
  };

  const handleSendProposal = async () => {
    if (!recipientEmail.trim()) {
      setSendError('Please enter a recipient email');
      return;
    }

    if (!clientName.trim()) {
      setSendError('Please enter a client name');
      return;
    }

    if (!selectedDraft) return;

    try {
      setSending(true);
      setSendError('');
      
      await proposalsAPI.sendEmail(selectedDraft.id, { 
        recipientEmail: recipientEmail.trim(),
        clientName: clientName.trim()
      });
      
      // Close modal and refresh drafts
      setShowSendModal(false);
      setSelectedDraft(null);
      setRecipientEmail('');
      setClientName('');
      
      // Show success message
      alert('Proposal sent successfully! It has been moved to Sent Proposals.');
      
      // Refresh the proposals list (the sent proposal will no longer appear here)
      fetchProposals();
    } catch (err: any) {
      setSendError(err.response?.data?.error || 'Failed to send proposal');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12 animate-fade-in-up">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg mr-4">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                Proposals
              </h1>
              <p className="mt-2 text-xl text-gray-600">
                Manage all your proposals - from drafts to sent proposals
              </p>
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2">
              <div className="flex">
                <button
                  onClick={() => setViewMode('drafts')}
                  className={`px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-3 ${
                    viewMode === 'drafts'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <DocumentTextIcon className="w-5 h-5" />
                  Drafts
                </button>
                <button
                  onClick={() => setViewMode('sent')}
                  className={`px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-3 ${
                    viewMode === 'sent'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                  Sent
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40 text-lg text-gray-600 font-medium">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
            Loading drafts...
          </div>
        ) : error ? (
          <div className="status-error rounded-xl p-6 text-center animate-fade-in-up">
            <p className="text-lg font-medium">{error}</p>
          </div>
        ) : (viewMode === 'drafts' ? drafts.length === 0 : sentProposals.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-80 text-gray-400 animate-fade-in-up">
            <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
              {viewMode === 'drafts' ? <DocumentTextIcon className="h-10 w-10" /> : <PaperAirplaneIcon className="h-10 w-10" />}
            </div>
            <div className="text-2xl font-semibold mb-2">
              {viewMode === 'drafts' ? 'No drafts found' : 'No sent proposals found'}
            </div>
            <div className="text-lg">
              {viewMode === 'drafts' ? 'Start by generating a new proposal!' : 'Send some proposals to see them here!'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {(viewMode === 'drafts' ? drafts : sentProposals).map((proposal) => (
              <div key={proposal.id} className="card-elevated p-6 flex flex-col justify-between animate-fade-in-up">
                                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                        {viewMode === 'drafts' ? <DocumentTextIcon className="h-5 w-5 text-primary-600" /> : <PaperAirplaneIcon className="h-5 w-5 text-primary-600" />}
                      </div>
                      <span className="text-lg font-bold text-gray-900 truncate" title={proposal.title}>{proposal.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <UserIcon className="h-4 w-4" />
                      <span className="font-medium">{proposal.clientName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-gray-700 text-sm line-clamp-3 mb-4">{proposal.description}</div>
                    {viewMode === 'sent' && (
                      <div className="flex items-center gap-2 text-sm mb-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          proposal.status === 'WON' ? 'bg-green-100 text-green-800' :
                          proposal.status === 'LOST' ? 'bg-red-100 text-red-800' :
                          proposal.status === 'IN_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {proposal.status.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                <div className="flex gap-2 mt-4 flex-wrap">
                  {viewMode === 'drafts' ? (
                    <>
                      <button
                        className="btn-primary flex items-center gap-1 px-3 py-2 text-sm"
                        onClick={() => handleEdit(proposal.id)}
                      >
                        <PencilSquareIcon className="h-4 w-4" /> Edit
                      </button>
                      <button
                        className="btn-secondary flex items-center gap-1 px-3 py-2 text-sm"
                        onClick={() => handleView(proposal.id)}
                      >
                        <EyeIcon className="h-4 w-4" /> View
                      </button>
                      <button
                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium px-3 py-2 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 flex items-center gap-1 text-sm shadow-sm hover:shadow-md"
                        onClick={() => handleSend(proposal)}
                      >
                        <PaperAirplaneIcon className="h-4 w-4" /> Send
                      </button>
                      <button
                        className="bg-gradient-to-r from-rose-600 to-rose-700 text-white font-medium px-3 py-2 rounded-xl hover:from-rose-700 hover:to-rose-800 transition-all duration-200 flex items-center gap-1 text-sm shadow-sm hover:shadow-md"
                        onClick={() => handleDelete(proposal.id)}
                      >
                        <TrashIcon className="h-4 w-4" /> Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn-secondary flex items-center gap-1 px-3 py-2 text-sm"
                        onClick={() => handleView(proposal.id)}
                      >
                        <EyeIcon className="h-4 w-4" /> View
                      </button>
                      <button
                        className="btn-primary flex items-center gap-1 px-3 py-2 text-sm"
                        onClick={() => handleEdit(proposal.id)}
                      >
                        <PencilSquareIcon className="h-4 w-4" /> Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send Proposal Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <PaperAirplaneIcon className="h-6 w-6 text-purple-500" />
              <h3 className="text-xl font-bold text-gray-900">Send Proposal</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Send "{selectedDraft?.title}" to:</p>
              
              <div className="space-y-3">
                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Client <span className="text-red-500">*</span>
                  </label>
                  <div className="relative client-dropdown">
                    <button
                      type="button"
                      onClick={() => setShowClientDropdown(!showClientDropdown)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-left flex items-center justify-between"
                      disabled={sending}
                    >
                      <span className={selectedClientId ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedClientId ? clientName : 'Choose a client or add new...'}
                      </span>
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    </button>
                    
                    {showClientDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {/* Existing Clients */}
                        {clients.length > 0 ? (
                          <div className="p-2">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-2 py-1">
                              Existing Clients
                            </div>
                            {clients.map((client) => (
                              <button
                                key={client.id}
                                onClick={() => handleClientSelect(client)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center gap-2"
                              >
                                <UserIcon className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="font-medium text-gray-900">{client.name}</div>
                                  <div className="text-sm text-gray-500">{client.email}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-2">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-2 py-1">
                              No clients yet
                            </div>
                            <div className="px-3 py-2 text-sm text-gray-500">
                              Create your first client below
                            </div>
                          </div>
                        )}
                        
                        {/* Add New Client Button */}
                        <div className="border-t border-gray-200 p-2">
                          <button
                            onClick={() => {
                              setShowNewClientForm(true);
                              setShowClientDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center gap-2 text-purple-600"
                          >
                            <PlusIcon className="h-4 w-4" />
                            <span className="font-medium">Add New Client</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* New Client Form */}
                {showNewClientForm && (
                  <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-purple-900">Add New Client</h4>
                      <button
                        onClick={() => setShowNewClientForm(false)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Client Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter client's full name"
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          disabled={creatingClient}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="client@example.com"
                          value={newClientEmail}
                          onChange={(e) => setNewClientEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          disabled={creatingClient}
                        />
                      </div>
                      
                      <button
                        onClick={handleCreateClient}
                        disabled={creatingClient || !newClientName.trim() || !newClientEmail.trim()}
                        className="w-full px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {creatingClient ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <PlusIcon className="h-3 w-3" />
                            Create Client
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Manual Input Fields (when no client selected) */}
                {!selectedClientId && !showNewClientForm && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter client's full name"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={sending}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="recipient@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={sending}
                      />
                    </div>
                  </>
                )}
              </div>
              
              {sendError && (
                <p className="text-red-500 text-sm mt-2">{sendError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendProposal}
                disabled={sending || !recipientEmail.trim() || !clientName.trim()}
                className="flex-1 px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4" />
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 