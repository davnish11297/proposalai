import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { proposalsAPI } from '../services/api';
import { DocumentTextIcon, UserIcon, CalendarIcon, EyeIcon, TrashIcon, ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

export default function SentProposals() {
  const navigate = useNavigate();
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSent();
  }, []);

  const fetchSent = async () => {
    try {
      setLoading(true);
      const response = await proposalsAPI.getAll();
      setSent(response.data.data.filter((p: any) => p.status === 'SENT'));
    } catch (err) {
      setError('Failed to load sent proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: string) => navigate(`/proposals/${id}/view`);
  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this sent proposal?')) {
      await proposalsAPI.delete(id);
      fetchSent();
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-12">
      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-400 shadow-lg fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-extrabold text-white tracking-wider drop-shadow">ProposalAI</h1>
            </div>
            <div className="flex items-center space-x-8">
              <a href="/dashboard" className="text-white/80 hover:text-white transition-colors">Dashboard</a>
              <a href="/drafts" className="text-white/80 hover:text-white transition-colors">Drafts</a>
              <a href="/sent-proposals" className="text-white font-semibold border-b-2 border-white/80 pb-1 transition-colors">Sent Proposals</a>
              <a href="/profile" className="text-white/80 hover:text-white transition-colors">Profile</a>
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
          <ArrowLeftIcon className="h-5 w-5" /> Back to Dashboard
        </button>
        <h2 className="text-4xl font-extrabold text-blue-800 mb-8 text-center tracking-tight drop-shadow-lg">Sent Proposals</h2>
        {loading ? (
          <div className="flex justify-center items-center h-40 text-lg text-blue-600 font-semibold animate-pulse">Loading sent proposals...</div>
        ) : error ? (
          <div className="flex justify-center items-center h-40 text-lg text-red-500 font-semibold">{error}</div>
        ) : sent.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-blue-200">
            <PaperAirplaneIcon className="h-16 w-16 mb-4" />
            <div className="text-xl font-medium">No sent proposals found</div>
            <div className="text-sm mt-2">Send a proposal to see it here!</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sent.map((proposal) => (
              <div key={proposal.id} className="bg-white rounded-2xl shadow-xl border-2 border-blue-200 p-6 flex flex-col justify-between hover:shadow-2xl transition-all duration-200">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <PaperAirplaneIcon className="h-7 w-7 text-blue-500" />
                    <span className="text-lg font-bold text-blue-900 truncate" title={proposal.title}>{proposal.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                    <UserIcon className="h-4 w-4" />
                    <span>{proposal.clientName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-400 mb-4">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{new Date(proposal.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-blue-800 text-sm line-clamp-3 mb-4">{proposal.description}</div>
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-green-400 to-green-300 text-white font-semibold hover:from-green-500 hover:to-green-400 transition"
                    onClick={() => handleView(proposal.id)}
                  >
                    <EyeIcon className="h-4 w-4" /> View
                  </button>
                  <button
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-red-400 to-red-300 text-white font-semibold hover:from-red-500 hover:to-red-400 transition"
                    onClick={() => handleDelete(proposal.id)}
                  >
                    <TrashIcon className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 