import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import AnalyticsChart from '../components/AnalyticsChart';

interface AnalyticsData {
  overview: {
    totalProposals: number;
    winRate: string;
    averageValue: string;
    pipelineValue: string;
    monthOverMonthChange: string;
    averageResponseTime: string;
    timeSaved: string;
    timeSavedThisMonth: string;
  };
  proposalsByStatus: Record<string, number>;
  proposalsByType: Record<string, number>;
  recentActivity: Array<{
    id: string;
    type: string;
    details: any;
    createdAt: string;
    user: { firstName: string; lastName: string };
    proposal: { title: string; clientName: string };
  }>;
  topPerformers: Array<{
    name: string;
    totalProposals: number;
    wonProposals: number;
    winRate: number;
  }>;
  trends: {
    currentMonth: number;
    previousMonth: number;
    change: number;
  };
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getDashboard();
      setData(response.data.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WON': return 'bg-green-100 text-green-800';
      case 'LOST': return 'bg-red-100 text-red-800';
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'APPROVED': return 'bg-purple-100 text-purple-800';
      case 'EXPIRED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CREATED': return '📄';
      case 'UPDATED': return '✏️';
      case 'PUBLISHED': return '📤';
      case 'SHARED': return '🔗';
      case 'VIEWED': return '👁️';
      case 'COMMENTED': return '💬';
      case 'EXPORTED': return '📥';
      default: return '📋';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-2">Failed to load analytics</div>
          <button 
            onClick={fetchAnalytics}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Proposals</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.totalProposals}</p>
            </div>
            <div className="text-sm font-medium text-green-600">
              {data.overview.monthOverMonthChange}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Win Rate</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.winRate}</p>
            </div>
            <div className="text-sm font-medium text-green-600">
              +5.2% vs last month
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.pipelineValue}</p>
            </div>
            <div className="text-sm font-medium text-green-600">
              +18% this quarter
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Time Saved</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.timeSaved}</p>
            </div>
            <div className="text-sm font-medium text-green-600">
              {data.overview.timeSavedThisMonth} this month
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Proposals by Status */}
        <AnalyticsChart
          title="Proposals by Status"
          data={Object.entries(data.proposalsByStatus).map(([status, count]) => ({
            label: status.replace('_', ' '),
            value: count,
            color: status === 'WON' ? '#10B981' : 
                   status === 'LOST' ? '#EF4444' : 
                   status === 'IN_REVIEW' ? '#F59E0B' : 
                   status === 'SENT' ? '#3B82F6' : 
                   status === 'DRAFT' ? '#6B7280' : 
                   status === 'APPROVED' ? '#8B5CF6' : '#F97316'
          }))}
          type="bar"
        />

        {/* Proposals by Type */}
        <AnalyticsChart
          title="Proposals by Type"
          data={Object.entries(data.proposalsByType).map(([type, count]) => ({
            label: type.replace('_', ' '),
            value: count,
            color: '#3B82F6'
          }))}
          type="pie"
        />
      </div>

      {/* Top Performers and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
          <div className="space-y-4">
            {data.topPerformers.map((performer, index) => (
              <div key={performer.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{performer.name}</p>
                    <p className="text-sm text-gray-500">{performer.totalProposals} proposals</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{performer.wonProposals} won</p>
                  <p className="text-sm text-green-600">{performer.winRate}% win rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="text-lg">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.user.firstName} {activity.user.lastName} {activity.type.toLowerCase()}d
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {activity.proposal.title} - {activity.proposal.clientName}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(activity.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Response Time</h3>
          <p className="text-3xl font-bold text-blue-600">{data.overview.averageResponseTime}</p>
          <p className="text-sm text-gray-500">From creation to first activity</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Proposal Value</h3>
          <p className="text-3xl font-bold text-green-600">{data.overview.averageValue}</p>
          <p className="text-sm text-gray-500">Per proposal</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Monthly Growth</h3>
          <p className="text-3xl font-bold text-purple-600">{data.trends.currentMonth}</p>
          <p className="text-sm text-gray-500">vs {data.trends.previousMonth} last month</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 