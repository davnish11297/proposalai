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
  ArrowLeftIcon, 
  PaperAirplaneIcon,
  HomeIcon,
  UsersIcon,
  ChevronDownIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import NotificationBell from '../components/NotificationBell';

export default function Drafts() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  
  // Client selection states
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);

  useEffect(() => {
    fetchDrafts();
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

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const response = await proposalsAPI.getAll();
      setDrafts(response.data.data.filter((p: any) => p.status === 'DRAFT'));
    } catch (err) {
      setError('Failed to load drafts');
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
      fetchDrafts();
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
      
      // Refresh the drafts list (the sent proposal will no longer appear here)
      fetchDrafts();
    } catch (err: any) {
      setSendError(err.response?.data?.error || 'Failed to send proposal');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <span className="text-xl font-bold text-gray-900">ProposalAI</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition flex items-center gap-2"
              >
                <HomeIcon className="w-4 h-4" />
                Dashboard
              </button>
              <button 
                onClick={() => navigate('/drafts')}
                className="text-orange-600 font-medium flex items-center gap-2"
              >
                <DocumentTextIcon className="w-4 h-4" />
                Drafts
              </button>
              <button 
                onClick={() => navigate('/clients')}
                className="text-gray-600 hover:text-gray-900 transition flex items-center gap-2"
              >
                <UsersIcon className="w-4 h-4" />
                Clients
              </button>
            </nav>
          </div>
          
          {/* Right side - User actions */}
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="relative">
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
                <UserIcon className="w-5 h-5" />
                <span className="hidden md:block">Account</span>
                <ChevronDownIcon className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-500 transition shadow"
        >
          <ArrowLeftIcon className="h-5 w-5" /> Back to Dashboard
        </button>
        <h2 className="text-4xl font-extrabold text-blue-800 mb-8 text-center tracking-tight drop-shadow-lg">Your Draft Proposals</h2>
        {loading ? (
          <div className="flex justify-center items-center h-40 text-lg text-blue-600 font-semibold animate-pulse">Loading drafts...</div>
        ) : error ? (
          <div className="flex justify-center items-center h-40 text-lg text-red-500 font-semibold">{error}</div>
        ) : drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-blue-200">
            <DocumentTextIcon className="h-16 w-16 mb-4" />
            <div className="text-xl font-medium">No drafts found</div>
            <div className="text-sm mt-2">Start by generating a new proposal!</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {drafts.map((draft) => (
              <div key={draft.id} className="bg-white rounded-2xl shadow-xl border-2 border-blue-200 p-6 flex flex-col justify-between hover:shadow-2xl transition-all duration-200">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <DocumentTextIcon className="h-7 w-7 text-blue-500" />
                    <span className="text-lg font-bold text-blue-900 truncate" title={draft.title}>{draft.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                    <UserIcon className="h-4 w-4" />
                    <span>{draft.clientName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-400 mb-4">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{new Date(draft.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-blue-800 text-sm line-clamp-3 mb-4">{draft.description}</div>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-400 text-white font-semibold hover:from-blue-600 hover:to-blue-500 transition text-sm"
                    onClick={() => handleEdit(draft.id)}
                  >
                    <PencilSquareIcon className="h-4 w-4" /> Edit
                  </button>
                  <button
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-green-400 to-green-300 text-white font-semibold hover:from-green-500 hover:to-green-400 transition text-sm"
                    onClick={() => handleView(draft.id)}
                  >
                    <EyeIcon className="h-4 w-4" /> View
                  </button>
                  <button
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-400 text-white font-semibold hover:from-purple-600 hover:to-purple-500 transition text-sm"
                    onClick={() => handleSend(draft)}
                  >
                    <PaperAirplaneIcon className="h-4 w-4" /> Send
                  </button>
                  <button
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-red-400 to-red-300 text-white font-semibold hover:from-red-500 hover:to-red-400 transition text-sm"
                    onClick={() => handleDelete(draft.id)}
                  >
                    <TrashIcon className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send Proposal Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
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
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-400 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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