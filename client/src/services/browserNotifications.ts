export interface BrowserNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
}

class BrowserNotificationService {
  private permission: NotificationPermission = 'default';
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'Notification' in window;
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Check if browser notifications are supported
   */
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) return 'denied';
    return Notification.permission;
  }

  /**
   * Request permission to send notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn('Browser notifications are not supported');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        console.log('Browser notification permission granted');
        // Store permission status in localStorage
        localStorage.setItem('browserNotificationPermission', 'granted');
      } else {
        console.log('Browser notification permission denied');
        localStorage.setItem('browserNotificationPermission', 'denied');
      }
      
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check if we have permission to send notifications
   */
  canSendNotifications(): boolean {
    return this.isSupported && this.permission === 'granted';
  }

  /**
   * Send a browser notification
   */
  sendNotification(data: BrowserNotificationData): boolean {
    if (!this.canSendNotifications()) {
      console.warn('Cannot send notifications - permission not granted');
      return false;
    }

    try {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: data.badge || '/favicon.ico',
        tag: data.tag || 'proposalai-notification',
        data: data.data,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate to the relevant page if data contains navigation info
        if (data.data?.navigateTo) {
          window.location.href = data.data.navigateTo;
        }
      };

      // Auto-close notification after 5 seconds (unless requireInteraction is true)
      if (!data.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return true;
    } catch (error) {
      console.error('Error sending browser notification:', error);
      return false;
    }
  }

  /**
   * Send notification for new proposal activity
   */
  sendProposalNotification(notification: {
    type: string;
    title: string;
    message: string;
    proposalId?: string;
    proposalTitle?: string;
    clientName?: string;
  }): boolean {
    const notificationData: BrowserNotificationData = {
      title: notification.title,
      body: notification.message,
      icon: '/favicon.ico',
      tag: `proposal-${notification.proposalId || 'general'}`,
      data: {
        type: notification.type,
        proposalId: notification.proposalId,
        navigateTo: notification.proposalId ? `/proposals/${notification.proposalId}` : '/dashboard'
      },
      requireInteraction: false,
      silent: false,
    };

    return this.sendNotification(notificationData);
  }

  /**
   * Initialize the service and check for stored permission
   */
  initialize(): void {
    if (!this.isSupported) return;

    // Check if we have stored permission status
    const storedPermission = localStorage.getItem('browserNotificationPermission');
    if (storedPermission === 'granted' && this.permission === 'default') {
      // If we previously had permission but it's now default, request again
      this.requestPermission();
    }
  }
}

// Create singleton instance
const browserNotificationService = new BrowserNotificationService();

export default browserNotificationService; 