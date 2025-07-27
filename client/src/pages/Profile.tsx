import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-12 animate-fade-in-up">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Profile</h1>
              <p className="mt-2 text-xl text-gray-600">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>
        
        <div className="card-elevated p-8 space-y-6 animate-fade-in-up">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={e => setProfile({ ...profile, email: e.target.value })}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={profile.password}
              onChange={e => setProfile({ ...profile, password: e.target.value })}
              className="form-input"
              placeholder="Leave blank to keep current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={profile.confirmPassword}
              onChange={e => setProfile({ ...profile, confirmPassword: e.target.value })}
              className="form-input"
              placeholder="Confirm new password"
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              className="btn-primary px-8 py-3 text-base font-semibold"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 