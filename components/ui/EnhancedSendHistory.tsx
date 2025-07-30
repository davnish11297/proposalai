import React, { useState } from 'react';
import { formatRelativeTime } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface SendHistoryItem {
  sendId: string;
  version: number;
  sentAt: string;
  sentTo: string;
  clientName: string;
  subject?: string;
  status: string;
  viewedAt?: string;
  respondedAt?: string;
  sentBy?: {
    firstName: string;
    lastName: string;
  };
  sendMethod: string;
  versionSnapshot?: {
    content: string;
    title: string;
    description?: string;
    wordCount: number;
    snapshotTakenAt: string;
  };
  hasContent: boolean;
  wordCount?: number;
  isLocked: boolean;
}

interface EnhancedSendHistoryProps {
  proposalId: string;
  sendHistory: SendHistoryItem[];
  onRefresh?: () => void;
}

export const EnhancedSendHistory: React.FC<EnhancedSendHistoryProps> = ({
  proposalId,
  sendHistory,
  onRefresh
}) => {
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const [versionContent, setVersionContent] = useState<any>(null);
  const [loadingVersion, setLoadingVersion] = useState(false);

  const handleViewVersion = async (version: number, sendItem: SendHistoryItem) => {
    if (viewingVersion === version) {
      setViewingVersion(null);
      setVersionContent(null);
      return;
    }

    setLoadingVersion(true);
    try {
      // Try to use the snapshot from send history first
      if (sendItem.versionSnapshot?.content) {
        setVersionContent({
          version: version,
          content: sendItem.versionSnapshot.content,
          title: sendItem.versionSnapshot.title,
          description: sendItem.versionSnapshot.description,
          wordCount: sendItem.versionSnapshot.wordCount,
          snapshotTakenAt: sendItem.versionSnapshot.snapshotTakenAt
        });
        setViewingVersion(version);
      } else {
        // Fallback to API call
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`/api/proposals/${proposalId}/versions/${version}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch version content');
        }

        const data = await response.json();
        setVersionContent(data.data);
        setViewingVersion(version);
      }
    } catch (error) {
      console.error('Error fetching version:', error);
      toast.error('Failed to load version content');
    } finally {
      setLoadingVersion(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'VIEWED': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'EXPIRED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSendMethodIcon = (method: string) => {
    switch (method) {
      case 'EMAIL':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.2a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'LINK':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        );
    }
  };

  if (!sendHistory || sendHistory.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Send History</h3>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <p className="text-gray-500">No sends yet</p>
          <p className="text-sm text-gray-400 mt-1">This proposal hasn't been sent to anyone</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Send History</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Refresh
          </button>
        )}
      </div>

      <div className="space-y-4">
        {sendHistory.map((send, index) => (
          <div key={send.sendId} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Send Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      #{sendHistory.length - index}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(send.sentAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500">
                      {getSendMethodIcon(send.sendMethod)}
                      <span className="text-xs">{send.sendMethod}</span>
                    </div>
                  </div>
                  
                  {/* Version Badge */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      v{send.version}
                      {send.isLocked && (
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </span>
                    
                    {/* Status Badge */}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(send.status)}`}>
                      {send.status}
                    </span>
                  </div>
                </div>

                {/* View Content Button */}
                {send.hasContent && (
                  <button
                    onClick={() => handleViewVersion(send.version, send)}
                    disabled={loadingVersion}
                    className="btn btn-outline btn-sm"
                  >
                    {loadingVersion ? (
                      <LoadingSpinner size="sm" />
                    ) : viewingVersion === send.version ? (
                      'Hide Content'
                    ) : (
                      '👁️ View v' + send.version
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Send Details */}
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>To:</strong> {send.sentTo}</p>
                  <p><strong>Client:</strong> {send.clientName}</p>
                  {send.subject && <p><strong>Subject:</strong> {send.subject}</p>}
                </div>
                <div>
                  <p><strong>Sent:</strong> {formatRelativeTime(new Date(send.sentAt))}</p>
                  {send.viewedAt && (
                    <p><strong>Viewed:</strong> {formatRelativeTime(new Date(send.viewedAt))}</p>
                  )}
                  {send.sentBy && (
                    <p><strong>Sent by:</strong> {send.sentBy.firstName} {send.sentBy.lastName}</p>
                  )}
                  {send.wordCount && (
                    <p><strong>Content:</strong> {send.wordCount} words</p>
                  )}
                </div>
              </div>
            </div>

            {/* Version Content Viewer */}
            {viewingVersion === send.version && versionContent && (
              <div className="border-t border-gray-200 bg-gray-50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">
                      Content Sent (v{versionContent.version})
                    </h4>
                    <div className="text-xs text-gray-500">
                      {versionContent.wordCount} words • Snapshot taken {formatRelativeTime(new Date(versionContent.snapshotTakenAt))}
                    </div>
                  </div>
                  
                  {versionContent.title && (
                    <div className="mb-3">
                      <h5 className="font-medium text-gray-700">Title:</h5>
                      <p className="text-gray-900">{versionContent.title}</p>
                    </div>
                  )}
                  
                  {versionContent.description && (
                    <div className="mb-3">
                      <h5 className="font-medium text-gray-700">Description:</h5>
                      <p className="text-gray-900">{versionContent.description}</p>
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <h5 className="font-medium text-gray-700">Content:</h5>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-gray-900">
                          {versionContent.content}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{sendHistory.length}</p>
            <p className="text-xs text-gray-500">Total Sends</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {sendHistory.filter(s => s.status === 'VIEWED').length}
            </p>
            <p className="text-xs text-gray-500">Viewed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {new Set(sendHistory.map(s => s.version)).size}
            </p>
            <p className="text-xs text-gray-500">Versions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">
              {new Set(sendHistory.map(s => s.sentTo)).size}
            </p>
            <p className="text-xs text-gray-500">Recipients</p>
          </div>
        </div>
      </div>
    </div>
  );
};