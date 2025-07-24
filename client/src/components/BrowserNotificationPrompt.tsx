import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import browserNotificationService from '../services/browserNotifications';

interface BrowserNotificationPromptProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  showPrompt?: boolean;
  onClose?: () => void;
}

export default function BrowserNotificationPrompt({ 
  onPermissionGranted, 
  onPermissionDenied, 
  showPrompt = false,
  onClose 
}: BrowserNotificationPromptProps) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Initialize the service
    browserNotificationService.initialize();
    
    // Check current permission status
    const status = browserNotificationService.getPermissionStatus();
    setPermissionStatus(status);
    
    // Show banner if permission is default and we should show prompt
    if (status === 'default' && showPrompt) {
      setShowBanner(true);
    }
  }, [showPrompt]);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    
    try {
      const permission = await browserNotificationService.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        setShowBanner(false);
        onPermissionGranted?.();
        // Show success message
        console.log('Browser notifications enabled!');
      } else {
        onPermissionDenied?.();
        // Show message about manual enabling
        console.log('Browser notifications denied. You can enable them manually in your browser settings.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      onPermissionDenied?.();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleClose = () => {
    setShowBanner(false);
    onClose?.();
  };

  // Don't show anything if notifications are not supported
  if (!browserNotificationService.isNotificationSupported()) {
    return null;
  }

  // Don't show banner if permission is already granted or denied
  if (permissionStatus !== 'default' || !showBanner) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <BellIcon className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900">
              Enable Browser Notifications
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Get notified about new comments, proposal updates, and client activity even when you're not on the dashboard.
            </p>
            
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRequesting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Enabling...
                  </>
                ) : (
                  'Enable Notifications'
                )}
              </button>
              
              <button
                onClick={handleClose}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Component to show permission status
export function NotificationPermissionStatus() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    const status = browserNotificationService.getPermissionStatus();
    setPermissionStatus(status);
  }, []);

  if (!browserNotificationService.isNotificationSupported()) {
    return null;
  }

  if (permissionStatus === 'granted') {
    return (
      <div className="flex items-center text-xs text-green-600">
        <CheckCircleIcon className="w-3 h-3 mr-1" />
        Notifications enabled
      </div>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <div className="flex items-center text-xs text-amber-600">
        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
        Notifications blocked
      </div>
    );
  }

  return null;
} 