import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellRing, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  X, 
  MoreVertical,
  Trash2,
  Check
} from 'lucide-react';
import { useNotifications, SessionNotification } from '../../context/NotificationContext';
import { cn } from '../../lib/utils';

// ==================== TYPES ====================

interface NotificationIconProps {
  className?: string;
}

interface NotificationItemProps {
  notification: SessionNotification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
}

// ==================== NOTIFICATION ITEM COMPONENT ====================

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onMarkAsRead, 
  onRemove 
}) => {
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'upcoming':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'starting':
        return <BellRing className="w-4 h-4 text-green-500" />;
      case 'ending':
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      case 'status_change':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } catch (error) {
      return 'Recently';
    }
  };

  const formatSessionTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return timeString;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={cn(
        "relative group p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0",
        "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150",
        !notification.is_read && "bg-blue-50/50 dark:bg-blue-950/20"
      )}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute top-3 left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}

      <div className="flex items-start gap-3 pl-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.notification_type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1">
              <h4 className={cn(
                "text-sm leading-tight",
                notification.is_read 
                  ? "text-gray-600 dark:text-gray-400 font-normal" 
                  : "text-gray-900 dark:text-gray-100 font-semibold"
              )}>
                {notification.student_name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                Session #{notification.session_id} • {formatTimeAgo(notification.created_at)}
              </p>
            </div>
            
            {/* Actions menu */}
            <div className="relative" ref={actionsRef}>
              <button
                onClick={() => setShowActions(!showActions)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity duration-150"
                aria-label="Notification actions"
              >
                <MoreVertical className="w-3 h-3 text-gray-500" />
              </button>

              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-6 z-50 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
                  >
                    {!notification.is_read && (
                      <button
                        onClick={() => {
                          onMarkAsRead(notification.id);
                          setShowActions(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <Check className="w-3 h-3" />
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onRemove(notification.id);
                        setShowActions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Message */}
          <p className={cn(
            "text-sm leading-relaxed mb-2",
            notification.is_read 
              ? "text-gray-600 dark:text-gray-400" 
              : "text-gray-800 dark:text-gray-200"
          )}>
            {notification.message}
          </p>

          {/* Footer */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatSessionTime(notification.session_start_time)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span className="capitalize">{notification.notification_type.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ==================== NOTIFICATION ICON COMPONENT ====================

export const NotificationIcon: React.FC<NotificationIconProps> = ({ className }) => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearNotifications,
    isLoading,
    refreshNotifications 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Today's notifications
  const todaysNotifications = notifications.filter(notification => {
    const today = new Date().toDateString();
    const notificationDate = new Date(notification.created_at).toDateString();
    return today === notificationDate;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification icon click
  const handleIconClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Refresh notifications when opening
      refreshNotifications();
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // Handle clear all notifications
  const handleClearAll = () => {
    clearNotifications();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Icon */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleIconClick}
        className={cn(
          "relative p-2 rounded-full transition-colors duration-200",
          "hover:bg-accent/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          unreadCount > 0 
            ? "text-blue-600 dark:text-blue-400" 
            : "text-gray-600 dark:text-gray-400",
          className
        )}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        
        {/* Notification badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full px-1"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Notifications
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {todaysNotifications.length === 0 
                      ? 'No notifications today' 
                      : `${todaysNotifications.length} notification${todaysNotifications.length === 1 ? '' : 's'} today`
                    }
                  </p>
                </div>
                
                <div className="flex items-center gap-1">
                  {isLoading && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                    />
                  )}
                  
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      Mark all read
                    </button>
                  )}
                  
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    aria-label="Close notifications"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {todaysNotifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 py-8 text-center"
                  >
                    <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No notifications today
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      Session notifications will appear here
                    </p>
                  </motion.div>
                ) : (
                  todaysNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onRemove={removeNotification}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {todaysNotifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => refreshNotifications()}
                    disabled={isLoading}
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Refresh
                  </button>
                  
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};