// Backend session notification interface
interface SessionNotification {
  session_id: number;
  therapist_id: number;
  student_name: string;
  notification_type: string;
  message: string;
  scheduled_time: string;
  session_start_time: string;
  session_end_time: string;
}

// Frontend notification interface
export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'session';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  sessionId?: string;
  duration?: number; // Auto-dismiss after duration (ms)
}

// Notification service class
class NotificationService {
  private notifications: AppNotification[] = [];
  private listeners: Array<(notifications: AppNotification[]) => void> = [];

  // Subscribe to notification updates
  subscribe(callback: (notifications: AppNotification[]) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Add a new notification
  addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: AppNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(newNotification);
    this.notifyListeners();

    // Auto-dismiss if duration is specified
    if (notification.duration) {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, notification.duration);
    }

    return newNotification.id;
  }

  // Remove notification
  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  // Mark notification as read
  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  // Mark all as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  // Get all notifications
  getNotifications(): AppNotification[] {
    return this.notifications;
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Success notification helper
  success(title: string, message: string, duration = 5000) {
    return this.addNotification({
      type: 'success',
      title,
      message,
      duration
    });
  }

  // Error notification helper
  error(title: string, message: string, duration?: number) {
    return this.addNotification({
      type: 'error',
      title,
      message,
      duration
    });
  }

  // Warning notification helper
  warning(title: string, message: string, duration = 8000) {
    return this.addNotification({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  // Info notification helper
  info(title: string, message: string, duration = 6000) {
    return this.addNotification({
      type: 'info',
      title,
      message,
      duration
    });
  }

  // Session notification helper
  sessionNotification(sessionNotification: SessionNotification) {
    return this.addNotification({
      type: 'session',
      title: 'Session Alert',
      message: sessionNotification.message,
      sessionId: sessionNotification.session_id.toString(),
      duration: 10000 // Keep session notifications longer
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Default export
export default notificationService;