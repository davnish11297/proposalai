import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon, 
  HomeIcon, 
  DocumentTextIcon, 
  PaperAirplaneIcon, 
  UsersIcon,
  MagnifyingGlassIcon,
  DocumentIcon,
  UserIcon,
  SparklesIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
}

interface SearchResult {
  id: string;
  type: 'proposal' | 'client';
  title: string;
  subtitle: string;
  href: string;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [stats, setStats] = useState({
    successRate: 0,
    activeProposals: 0
  });

  const handleLogout = () => {
    logout();
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };

      // Fetch all proposals to calculate stats
      const proposalsRes = await fetch('/api/proposals', { headers });
      if (proposalsRes.ok) {
        const proposalsData = await proposalsRes.json();
        const proposals = proposalsData.data || proposalsData;

        // Calculate active proposals (drafts + sent)
        const activeProposals = proposals.filter((proposal: any) => 
          proposal.status === 'DRAFT' || proposal.status === 'SENT'
        ).length;

        // Calculate success rate (sent proposals / total proposals)
        const totalProposals = proposals.length;
        const sentProposals = proposals.filter((proposal: any) => 
          proposal.status === 'SENT'
        ).length;
        
        const successRate = totalProposals > 0 ? Math.round((sentProposals / totalProposals) * 100) : 0;

        setStats({
          successRate,
          activeProposals
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, type: 'nav' },
    { name: 'Create Proposal', href: '/proposals/new', icon: PlusIcon, type: 'action' },
    { name: 'Proposals', href: '/drafts', icon: DocumentTextIcon, type: 'nav' },
    { name: 'Clients', href: '/clients', icon: UsersIcon, type: 'nav' },
  ];

  // Search functionality
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [proposalsRes, clientsRes] = await Promise.all([
        fetch(`/api/proposals?search=${encodeURIComponent(query)}`, { headers }),
        fetch(`/api/clients?search=${encodeURIComponent(query)}`, { headers })
      ]);

      const proposalsData = proposalsRes.ok ? await proposalsRes.json() : { data: [] };
      const clientsData = clientsRes.ok ? await clientsRes.json() : { data: [] };

      const proposals = proposalsData.data || proposalsData;
      const clients = clientsData.data || clientsData;

      const results: SearchResult[] = [
        ...proposals.map((proposal: any) => ({
          id: proposal.id,
          type: 'proposal' as const,
          title: proposal.title || 'Untitled Proposal',
          subtitle: proposal.client?.name || proposal.clientName || 'No client assigned',
          href: `/proposals/${proposal.id}`
        })),
        ...clients.map((client: any) => ({
          id: client.id,
          type: 'client' as const,
          title: client.name,
          subtitle: client.email,
          href: `/clients/${client.id}`
        }))
      ];

      console.log('Search results:', results);
      console.log('Search query:', query);
      console.log('Show search results:', showSearchResults);
      setSearchResults(results.slice(0, 8)); // Limit to 8 results
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearchResultClick = (result: SearchResult) => {
    navigate(result.href);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleSearchFocus = () => {
    if (searchResults.length > 0) {
      setShowSearchResults(true);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => setShowSearchResults(false), 200);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-gray-50 shadow-xl">
          {/* Logo and App Title */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">ProposalAI</h1>
                <p className="text-xs text-gray-500">Smart Proposal Engine</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors focus-ring"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Section */}
          <div className="px-6 py-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">NAVIGATION</h3>
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                if (item.type === 'action') {
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center px-4 py-3 bg-gray-900 text-white rounded-xl font-medium transition-all duration-200 hover:bg-gray-800 shadow-sm"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <SparklesIcon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                        : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick Stats Section */}
          <div className="px-6 py-6 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">QUICK STATS</h3>
            <div className="space-y-3">
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Active</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.activeProposals}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gray-50 shadow-xl">
          {/* Logo and App Title */}
          <div className="flex items-center px-6 py-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">ProposalAI</h1>
                <p className="text-xs text-gray-500">Smart Proposal Engine</p>
              </div>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="px-6 py-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">NAVIGATION</h3>
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                if (item.type === 'action') {
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center px-4 py-3 bg-gray-900 text-white rounded-xl font-medium transition-all duration-200 hover:bg-gray-800 shadow-sm"
                    >
                      <SparklesIcon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                        : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick Stats Section */}
          <div className="px-6 py-6 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">QUICK STATS</h3>
            <div className="space-y-3">
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Active</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.activeProposals}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area with left margin for sidebar */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white shadow-lg border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors focus-ring"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="flex items-center justify-between w-full">
              {/* Smaller, less prominent search bar */}
              <div className="flex-1 max-w-xs ml-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    className="block w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all duration-200 shadow-sm focus:shadow-md"
                    placeholder="Search proposals, clients..."
                    type="search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                  />
                  {isSearching && (
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                    </div>
                  )}
                </div>

                {/* Search results dropdown */}
                {showSearchResults && searchQuery.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto min-w-full">
                    {searchResults.length > 0 ? (
                      searchResults.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleSearchResultClick(result)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                        >
                          {result.type === 'proposal' ? (
                            <DocumentIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          ) : (
                            <UserIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {result.title}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {result.subtitle}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {isSearching ? 'Searching...' : 'No results found'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right side elements - notification bell, user info, and logout */}
              <div className="flex items-center space-x-4 ml-auto mr-4">
                <NotificationBell />
                
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
                        <span className="text-sm font-bold text-white">
                          {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <div className="text-sm font-semibold text-gray-900">
                        {user?.firstName && user?.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user?.firstName 
                          ? user.firstName
                          : user?.email || 'User'
                        }
                      </div>
                      <div className="text-xs text-gray-500 font-medium">{user?.email}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-all duration-200 focus-ring"
                >
                  <span className="sr-only">Logout</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
} 