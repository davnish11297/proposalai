import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  PhoneIcon, 
  HomeIcon, 
  BriefcaseIcon, 
  DocumentTextIcon, 
  CalendarIcon,
  PaperAirplaneIcon,
  UsersIcon
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
  _count?: {
    proposals: number;
  };
}

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientsAPI.getClients();
      // The API returns { success: true, data: clients }
      const clientsData = response.data?.data || [];
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients');
      setClients([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = Array.isArray(clients) ? clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
            <p className="mt-4 text-gray-600">Loading clients...</p>
          </div>
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
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-500 transition shadow"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Clients</h1>
          <p className="text-gray-600">Manage your client relationships and view their proposal history</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <UserIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Client Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.reduce((sum, client) => sum + (client._count?.proposals || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(client => {
                    const lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    return new Date(client.updatedAt) > lastMonth;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Client List */}
        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by sending your first proposal to a client.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="bg-white rounded-2xl shadow-xl border-2 border-blue-200 p-6 flex flex-col justify-between hover:shadow-2xl transition-all duration-200 cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <UserIcon className="h-7 w-7 text-blue-500" />
                    <span className="text-lg font-bold text-blue-900 truncate" title={client.name}>{client.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                    <span>{client.email}</span>
                  </div>
                  
                  <div className="space-y-2 mt-3">
                    {client.company && (
                      <div className="flex items-center text-sm text-gray-600">
                        <HomeIcon className="mr-2 h-4 w-4" />
                        {client.company}
                      </div>
                    )}
                    
                    {client.industry && (
                      <div className="flex items-center text-sm text-gray-600">
                        <BriefcaseIcon className="mr-2 h-4 w-4" />
                        {client.industry}
                      </div>
                    )}
                    
                    {client.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="mr-2 h-4 w-4" />
                        {client.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Added {formatDate(client.createdAt)}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {client._count?.proposals || 0} proposals
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients; 