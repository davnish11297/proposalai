import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import NotificationBell from '../components/NotificationBell';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  PaperAirplaneIcon, 
  UsersIcon, 
  UserIcon 
} from '@heroicons/react/24/outline';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    password: '',
    confirmPassword: ''
  });

  const handleSave = () => {
    if (profile.password && profile.password !== profile.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    toast.success('Profile saved successfully!');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

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
              <a href="/clients" className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors">
                <UsersIcon className="w-5 h-5" />
                <span>Clients</span>
              </a>
              <a href="/profile" className="flex items-center space-x-1 text-white font-semibold border-b-2 border-white/80 pb-1 transition-colors">
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
      
      <div className="max-w-2xl mx-auto p-6 pt-24">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile</h1>
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={e => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={profile.password}
              onChange={e => setProfile({ ...profile, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Leave blank to keep current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={profile.confirmPassword}
              onChange={e => setProfile({ ...profile, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm new password"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 