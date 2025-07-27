import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  PhoneIcon, 
  HomeIcon, 
  BriefcaseIcon, 
  DocumentTextIcon, 
  CalendarIcon,
  UsersIcon
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
  _count?: {
    proposals: number;
  };
}

const Clients: React.FC = () => {
  const navigate = useNavigate();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12 animate-fade-in-up">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg mr-4">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Clients</h1>
              <p className="mt-2 text-xl text-gray-600">Manage your client relationships and view their proposal history</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm focus:shadow-md transition-all duration-200"
            />
            <UserIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Client Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="card-elevated p-6 animate-fade-in-up">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900">{clients.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card-elevated p-6 animate-fade-in-up">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                <p className="text-3xl font-bold text-gray-900">
                  {clients.reduce((sum, client) => sum + (client._count?.proposals || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card-elevated p-6 animate-fade-in-up">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active This Month</p>
                <p className="text-3xl font-bold text-gray-900">
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
          <div className="text-center py-16 animate-fade-in-up">
            <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <UserIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No clients found</h3>
            <p className="text-lg text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by sending your first proposal to a client.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="card-elevated p-6 flex flex-col justify-between cursor-pointer animate-fade-in-up"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-primary-600" />
                    </div>
                    <span className="text-lg font-bold text-gray-900 truncate" title={client.name}>{client.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <span className="font-medium">{client.email}</span>
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