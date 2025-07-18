import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { teamsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface TeamMember {
  id: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

interface Team {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
  _count: {
    members: number;
    proposals: number;
  };
}

// Add this type for user options
interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role?: string;
}

// Add a simple ConfirmDialog component at the top of the file
function ConfirmDialog({ open, title, message, onConfirm, onCancel }: { open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "#fff", borderRadius: 8, padding: 24, minWidth: 320, boxShadow: "0 2px 16px rgba(0,0,0,0.15)" }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onCancel} style={{ padding: "6px 16px", borderRadius: 4, border: "none", background: "#eee" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: "6px 16px", borderRadius: 4, border: "none", background: "#d32f2f", color: "#fff" }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

const Teams: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
  });

  const [addMemberForm, setAddMemberForm] = useState<{ userId: string; role: 'ADMIN' | 'EDITOR' | 'VIEWER' | 'MEMBER' }>({
    userId: '',
    role: 'MEMBER',
  });

  // Add state for dialog
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  // Add state for user options
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [userOptionsLoading, setUserOptionsLoading] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchTeams();
  }, [user, navigate]);

  // Add debounced search
  useEffect(() => {
    if (!user) return;
    
    const timeoutId = setTimeout(() => {
      fetchTeams();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, user]);

  // Fetch users for dropdown when Add Member modal opens
  useEffect(() => {
    if (showAddMemberModal && selectedTeam) {
      setUserOptionsLoading(true);
      fetch(`/api/users?teamId=${selectedTeam.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.data)) {
            setUserOptions(data.data);
          } else {
            setUserOptions([]);
          }
        })
        .catch(() => setUserOptions([]))
        .finally(() => setUserOptionsLoading(false));
    }
  }, [showAddMemberModal, selectedTeam]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await teamsAPI.getAll({ search: searchTerm });
      setTeams(response.data.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Failed to fetch teams');
      toast.error('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await teamsAPI.create(createForm);
      setTeams(prev => [response.data.data, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '' });
      toast.success('Team created successfully');
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    try {
      const response = await teamsAPI.addMember(selectedTeam.id, { userId: addMemberForm.userId, role: addMemberForm.role });
      // Refresh the team data
      const updatedTeam = await teamsAPI.getById(selectedTeam.id);
      setTeams(prev => prev.map(team => 
        team.id === selectedTeam.id ? updatedTeam.data.data : team
      ));
      setShowAddMemberModal(false);
      setAddMemberForm({ userId: '', role: 'MEMBER' });
      toast.success('Team member added successfully');
    } catch (error: any) {
      console.error('Error adding team member:', error);
      toast.error(error.response?.data?.message || 'Failed to add team member');
    }
  };

  const handleUpdateMemberRole = async (teamId: string, memberId: string, newRole: string) => {
    try {
      await teamsAPI.updateMember(teamId, memberId, { role: newRole });
      // Refresh the team data
      const updatedTeam = await teamsAPI.getById(teamId);
      setTeams(prev => prev.map(team => 
        team.id === teamId ? updatedTeam.data.data : team
      ));
      toast.success('Member role updated successfully');
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    setConfirmDialog({
      open: true,
      title: "Remove Member?",
      message: "Are you sure you want to remove this member from the team?",
      onConfirm: async () => {
        setConfirmDialog(null);
        await teamsAPI.removeMember(teamId, memberId);
        // Refresh the team data
        const updatedTeam = await teamsAPI.getById(teamId);
        setTeams(prev => prev.map(team => 
          team.id === teamId ? updatedTeam.data.data : team
        ));
        toast.success('Team member removed successfully');
      },
    });
  };

  const handleDeleteTeam = async (teamId: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Team?",
      message: "Are you sure you want to delete this team? This action cannot be undone.",
      onConfirm: async () => {
        setConfirmDialog(null);
        await teamsAPI.delete(teamId);
        setTeams(prev => prev.filter(team => team.id !== teamId));
        toast.success('Team deleted successfully');
      },
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'EDITOR': return 'bg-blue-100 text-blue-800';
      case 'VIEWER': return 'bg-gray-100 text-gray-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return '👑';
      case 'EDITOR': return '✏️';
      case 'VIEWER': return '👁️';
      default: return '👤';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
              <p className="text-gray-600 mt-2">Manage your teams and collaborate on proposals</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              + Create Team
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              🔍
            </div>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div key={team.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Team Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{team.name}</h3>
                    {team.description && (
                      <p className="text-gray-600 mt-1">{team.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedTeam === team.id ? '🔽' : '▶️'}
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Team Stats */}
                <div className="flex space-x-4 text-sm text-gray-500">
                  <span>👥 {team._count.members} members</span>
                  <span>📄 {team._count.proposals} proposals</span>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedTeam === team.id && (
                <div className="p-6">
                  {/* Members Section */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-900">Team Members</h4>
                      <button
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowAddMemberModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        + Add Member
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {team.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                              {member.user.avatar ? (
                                <img src={member.user.avatar} alt="" className="w-8 h-8 rounded-full" />
                              ) : (
                                `${member.user.firstName[0]}${member.user.lastName[0]}`
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {member.user.firstName} {member.user.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{member.user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                              {getRoleIcon(member.role)} {member.role}
                            </span>
                            {member.role !== 'ADMIN' && (
                              <select
                                value={member.role}
                                onChange={(e) => handleUpdateMemberRole(team.id, member.id, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="MEMBER">Member</option>
                                <option value="EDITOR">Editor</option>
                                <option value="VIEWER">Viewer</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                            )}
                            {member.role !== 'ADMIN' && (
                              <button
                                onClick={() => handleRemoveMember(team.id, member.id)}
                                className="text-red-400 hover:text-red-600 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => navigate(`/teams/${team.id}/proposals`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      View Proposals
                    </button>
                    <button
                      onClick={() => navigate('/proposals/new', { state: { teamId: team.id } })}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Create Proposal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {teams.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-600 mb-6">Create your first team to start collaborating on proposals</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Your First Team
            </button>
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Team</h2>
            <form onSubmit={handleCreateTeam}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter team name"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter team description"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Add Team Member</h2>
            <form onSubmit={handleAddMember}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User
                </label>
                <select
                  value={addMemberForm.userId || ''}
                  onChange={e => setAddMemberForm(f => ({ ...f, userId: e.target.value }))}
                  required
                  disabled={userOptionsLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value='' disabled>Select a user</option>
                  {(Array.isArray(userOptions) ? userOptions : []).map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={addMemberForm.role}
                  onChange={(e) => setAddMemberForm(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="MEMBER">Member</option>
                  <option value="EDITOR">Editor</option>
                  <option value="VIEWER">Viewer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          open={!!confirmDialog}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
};

export default Teams; 