import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BellIcon, 
  ChatBubbleLeftIcon, 
  EyeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { notificationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import browserNotificationService from '../services/browserNotifications';

interface Notification {
  id: string;
  type: 'COMMENT' | 'PROPOSAL_OPENED' | 'PROPOSAL_APPROVED' | 'PROPOSAL_REJECTED' | 'CLIENT_REPLY' | 'ACCESS_REQUEST';
  message: string;
  read: boolean;
  createdAt: string;
  userId: string;
  proposalId?: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  // Rate limiting and backoff state
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const lastFetchTime = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      setIsRateLimited(false);
      setRetryCount(0);
      
      const response = await notificationAPI.getAll();
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      setError(true);
      
      // Handle rate limiting
      if (error.response?.status === 429 || error.message?.includes('Too many requests')) {
        setIsRateLimited(true);
        // Exponential backoff: wait 2^retryCount minutes
        const backoffTime = Math.min(Math.pow(2, retryCount) * 60000, 300000); // Max 5 minutes
        setTimeout(() => {
          setIsRateLimited(false);
          setRetryCount(prev => prev + 1);
        }, backoffTime);
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      // Skip if rate limited
      if (isRateLimited) {
        return;
      }
      
      const response = await notificationAPI.getUnreadCount();
      if (response.data.success) {
        const newUnreadCount = response.data.data.unreadCount;
        const previousUnreadCount = unreadCount;
        
        setUnreadCount(newUnreadCount);
        setIsRateLimited(false);
        setRetryCount(0);

        // Send browser notification if we have new unread notifications
        if (newUnreadCount > previousUnreadCount && browserNotificationService.canSendNotifications()) {
          const newNotificationsCount = newUnreadCount - previousUnreadCount;
          browserNotificationService.sendNotification({
            title: 'New Notifications',
            body: `You have ${newNotificationsCount} new notification${newNotificationsCount > 1 ? 's' : ''}`,
            icon: '/favicon.ico',
            tag: 'new-notifications',
            data: {
              navigateTo: '/dashboard'
            }
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch unread count:', error);
      
      // Handle rate limiting
      if (error.response?.status === 429 || error.message?.includes('Too many requests')) {
        setIsRateLimited(true);
        // Exponential backoff: wait 2^retryCount minutes
        const backoffTime = Math.min(Math.pow(2, retryCount) * 60000, 300000); // Max 5 minutes
        setTimeout(() => {
          setIsRateLimited(false);
          setRetryCount(prev => prev + 1);
        }, backoffTime);
      }
      // Don't set error here as we still want to show the bell
    }
  }, [isRateLimited, retryCount, unreadCount]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
      
      // Poll for new notifications every 2 minutes (120 seconds) instead of 30 seconds
      intervalRef.current = setInterval(() => {
        // Only fetch if not rate limited and enough time has passed
        const now = Date.now();
        if (!isRateLimited && (now - lastFetchTime.current) > 60000) { // 1 minute minimum between calls
          fetchUnreadCount();
          fetchNotifications(); // Also fetch the full notification list
          lastFetchTime.current = now;
        }
      }, 120000); // 2 minutes

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [user, isRateLimited, fetchNotifications, fetchUnreadCount]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      console.log('Notification clicked:', notification);
      
      // Mark as read first
      await markAsRead(notification.id);
      
      // Close the dropdown
      setIsOpen(false);
      
      // Navigate based on notification type
      switch (notification.type) {
        case 'COMMENT':
        case 'CLIENT_REPLY':
          if (notification.proposalId) {
            console.log('Navigating to proposal comments:', notification.proposalId);
            // Navigate to proposal with comments tab
            navigate(`/proposals/${notification.proposalId}/view?tab=comments`);
            toast.success('Navigating to comments...');
          } else {
            console.log('No proposalId found for comment notification');
            navigate('/sent-proposals');
            toast('Proposal not found, showing sent proposals');
          }
          break;
          
        case 'PROPOSAL_OPENED':
        case 'PROPOSAL_APPROVED':
        case 'PROPOSAL_REJECTED':
          if (notification.proposalId) {
            console.log('Navigating to proposal view:', notification.proposalId);
            // Navigate to proposal view
            navigate(`/proposals/${notification.proposalId}/view`);
            toast.success('Navigating to proposal...');
          } else {
            console.log('No proposalId found for proposal notification');
            navigate('/sent-proposals');
            toast('Proposal not found, showing sent proposals');
          }
          break;
          
        case 'ACCESS_REQUEST':
          if (notification.proposalId) {
            console.log('Navigating to proposal activity:', notification.proposalId);
            // Navigate to proposal with activity tab
            navigate(`/proposals/${notification.proposalId}/view?tab=activity`);
            toast.success('Navigating to proposal activity...');
          } else {
            console.log('No proposalId found for access request notification');
            navigate('/sent-proposals');
            toast('Proposal not found, showing sent proposals');
          }
          break;
          
        default:
          console.log('Unknown notification type:', notification.type);
          navigate('/dashboard');
          toast('Navigating to dashboard...');
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast.error('Failed to process notification');
    }
  };

  // Test browser notification function
  const testBrowserNotification = () => {
    if (browserNotificationService.canSendNotifications()) {
      browserNotificationService.sendNotification({
        title: 'Test Notification',
        body: 'This is a test browser notification from ProposalAI!',
        icon: '/favicon.ico',
        tag: 'test-notification',
        data: {
          navigateTo: '/dashboard'
        }
      });
      toast.success('Test notification sent!');
    } else {
      toast.error('Browser notifications not enabled');
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
              setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
              setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'COMMENT':
        return <ChatBubbleLeftIcon className="h-5 w-5 text-blue-500" />;
      case 'PROPOSAL_OPENED':
        return <EyeIcon className="h-5 w-5 text-green-500" />;
      case 'PROPOSAL_APPROVED':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'PROPOSAL_REJECTED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'CLIENT_REPLY':
        return <UserIcon className="h-5 w-5 text-purple-500" />;
      case 'ACCESS_REQUEST':
        return <UserIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell Button - Always show, even if API fails */}
      <button
        onClick={() => {
          const newIsOpen = !isOpen;
          setIsOpen(newIsOpen);
          
          // If opening the dropdown, refresh notifications immediately
          if (newIsOpen && user && !isRateLimited) {
            fetchNotifications();
            fetchUnreadCount();
          }
        }}
                className={`relative p-3 rounded-xl transition-all duration-200 focus-ring ${
          isRateLimited
            ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 shadow-sm'
            : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100 shadow-sm hover:shadow-md'
        }`}
        title={
          isRateLimited 
            ? "Rate limited - notifications temporarily unavailable" 
            : user 
              ? "Notifications" 
              : "Login to see notifications"
        }
      >
        <BellIcon className="h-6 w-6" />
        {user && unreadCount > 0 && !isRateLimited && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {/* Show rate limiting indicator */}
        {isRateLimited && (
          <span className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center">
            ⏱
          </span>
        )}
        {/* Show error indicator */}
        {error && !isRateLimited && (
          <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center">
            !
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {!isRateLimited && (
                <button
                  onClick={() => {
                    fetchNotifications();
                    fetchUnreadCount();
                  }}
                  disabled={loading}
                  className={`p-1 transition-colors ${
                    loading 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Refresh notifications"
                >
                  <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
              {unreadCount > 0 && !isRateLimited && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Rate Limiting Message */}
          {isRateLimited && (
            <div className="p-4 bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800">
                <ClockIcon className="h-4 w-4" />
                <p className="text-sm font-medium">Rate limited</p>
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                Too many requests. Notifications will resume automatically in a few minutes.
              </p>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>
                  {!user ? 'Please login to see notifications' : 
                   isRateLimited ? 'Notifications temporarily unavailable' :
                   error ? 'Unable to load notifications' : 'No notifications yet'}
                </p>
                {error && !isRateLimited && (
                  <p className="text-xs text-gray-400 mt-1">Check console for details</p>
                )}
                {isRateLimited && (
                  <p className="text-xs text-yellow-600 mt-1">Please wait a few minutes</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-blue-50 transition-colors cursor-pointer border-l-4 ${
                      !notification.read ? 'bg-blue-50 border-l-blue-500' : 'border-l-transparent'
                    } hover:border-l-blue-400`}
                    onClick={() => handleNotificationClick(notification)}
                    title={`Click to view ${notification.type.toLowerCase().replace('_', ' ')}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.type.replace('_', ' ')}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <ClockIcon className="h-3 w-3" />
                          {formatTimeAgo(notification.createdAt)}
                          <span className="text-blue-500 font-medium">Click to view →</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            {notifications.length > 0 && !isRateLimited && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/sent-proposals');
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium mb-2"
              >
                View all proposals
              </button>
            )}
            
            {/* Test Browser Notification Button */}
            <button
              onClick={testBrowserNotification}
              className="w-full text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Test Browser Notification
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 