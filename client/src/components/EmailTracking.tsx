import React, { useState, useEffect, useCallback } from 'react';
import { proposalsAPI } from '../services/api';
import { 
  EnvelopeIcon, 
  EyeIcon, 
  ChatBubbleLeftRightIcon, 
  CursorArrowRaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface EmailTrackingStats {
  emailSentAt?: string;
  emailRecipient?: string;
  emailOpenedAt?: string;
  emailRepliedAt?: string;
  emailClickedAt?: string;
  emailStatus?: string;
  timeToOpen?: number;
  timeToReply?: number;
  timeToClick?: number;
}

interface EmailTrackingProps {
  proposalId: string;
}

const EmailTracking: React.FC<EmailTrackingProps> = ({ proposalId }) => {
  const [stats, setStats] = useState<EmailTrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEmailStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await proposalsAPI.getEmailTrackingStats(proposalId);
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError('Failed to load email tracking data');
      }
    } catch (error) {
      console.error('Fetch email stats error:', error);
      setError('Failed to load email tracking data');
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    fetchEmailStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchEmailStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchEmailStats]);

  // Add a refresh function that can be called externally
  const refresh = useCallback(() => {
    fetchEmailStats();
  }, [fetchEmailStats]);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'REPLIED':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'OPENED':
        return <EyeIcon className="h-5 w-5 text-blue-600" />;
      case 'CLICKED':
        return <CursorArrowRaysIcon className="h-5 w-5 text-purple-600" />;
      case 'SENT':
        return <EnvelopeIcon className="h-5 w-5 text-gray-600" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'REPLIED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'OPENED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CLICKED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SENT':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'REPLIED':
        return 'Client Replied';
      case 'OPENED':
        return 'Email Opened';
      case 'CLICKED':
        return 'Link Clicked';
      case 'SENT':
        return 'Email Sent';
      default:
        return 'Unknown Status';
    }
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats || !stats.emailSentAt) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <EnvelopeIcon className="h-8 w-8 mx-auto mb-2" />
          <p>No email tracking data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <EnvelopeIcon className="h-5 w-5 text-blue-600" />
          Email Tracking
        </h3>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status Overview */}
      <div className="mb-6">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(stats.emailStatus)}`}>
          {getStatusIcon(stats.emailStatus)}
          {getStatusText(stats.emailStatus)}
        </div>
      </div>

      {/* Email Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Recipient</label>
            <p className="text-sm text-gray-900">{stats.emailRecipient || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Sent At</label>
            <p className="text-sm text-gray-900">{formatDate(stats.emailSentAt)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Opened At</label>
            <p className="text-sm text-gray-900">{formatDate(stats.emailOpenedAt)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Replied At</label>
            <p className="text-sm text-gray-900">{formatDate(stats.emailRepliedAt)}</p>
          </div>
        </div>
      </div>

      {/* Response Times */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <ClockIcon className="h-4 w-4" />
          Response Times
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{formatTime(stats.timeToOpen)}</div>
            <div className="text-xs text-gray-500">Time to Open</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">{formatTime(stats.timeToClick)}</div>
            <div className="text-xs text-gray-500">Time to Click</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{formatTime(stats.timeToReply)}</div>
            <div className="text-xs text-gray-500">Time to Reply</div>
          </div>
        </div>
      </div>

      {/* Engagement Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <EyeIcon className="h-6 w-6 text-blue-600 mx-auto mb-1" />
          <div className="text-sm font-medium text-blue-900">
            {stats.emailOpenedAt ? 'Opened' : 'Not Opened'}
          </div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <CursorArrowRaysIcon className="h-6 w-6 text-purple-600 mx-auto mb-1" />
          <div className="text-sm font-medium text-purple-900">
            {stats.emailClickedAt ? 'Clicked' : 'Not Clicked'}
          </div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600 mx-auto mb-1" />
          <div className="text-sm font-medium text-green-900">
            {stats.emailRepliedAt ? 'Replied' : 'No Reply'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTracking; 