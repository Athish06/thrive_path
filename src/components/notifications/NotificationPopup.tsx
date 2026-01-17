import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { cn } from '../../lib/utils';

// ==================== TYPES ====================

interface NotificationPopupProps {
  className?: string;
}

// ==================== NOTIFICATION POPUP COMPONENT ====================

export const NotificationPopup: React.FC<NotificationPopupProps> = ({ className }) => {
  const { showPopup, currentPopup, hideNotificationPopup } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  // ==================== EFFECTS ====================

  useEffect(() => {
    console.log('🔔 NotificationPopup: showPopup changed to:', showPopup);
    console.log('🔔 NotificationPopup: currentPopup:', currentPopup);
    
    if (showPopup && currentPopup) {
      console.log('🔔 NotificationPopup: Setting visible to true');
      setIsVisible(true);
      setProgress(100);

      // Start progress countdown
      const duration = 4000; // 4 seconds
      const interval = 50; // Update every 50ms
      const decrement = (interval / duration) * 100;

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - decrement;
          if (newProgress <= 0) {
            clearInterval(progressInterval);
            handleClose();
            return 0;
          }
          return newProgress;
        });
      }, interval);

      return () => clearInterval(progressInterval);
    } else {
      console.log('🔔 NotificationPopup: Setting visible to false');
      setIsVisible(false);
    }
  }, [showPopup, currentPopup]);

  // ==================== HANDLERS ====================

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      hideNotificationPopup();
    }, 300); // Wait for exit animation
  };

  const handleMouseEnter = () => {
    setProgress(100); // Pause countdown on hover
  };

  const handleMouseLeave = () => {
    if (isVisible) {
      // Restart countdown when mouse leaves
      const duration = 2000; // Shorter duration after hover
      const interval = 50;
      const decrement = (interval / duration) * 100;

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - decrement;
          if (newProgress <= 0) {
            clearInterval(progressInterval);
            handleClose();
            return 0;
          }
          return newProgress;
        });
      }, interval);
    }
  };

  // ==================== NOTIFICATION ICON HELPER ====================

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'upcoming':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'starting':
        return <Bell className="w-5 h-5 text-green-500" />;
      case 'ending':
        return <CheckCircle className="w-5 h-5 text-purple-500" />;
      case 'status_change':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'upcoming':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      case 'starting':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'ending':
        return 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950';
      case 'status_change':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950';
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return timeString;
    }
  };

  // ==================== RENDER ====================

  if (!currentPopup) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 400, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ 
            opacity: 0, 
            x: 400, 
            scale: 0.8,
            transition: { duration: 0.3, ease: "easeInOut" }
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            duration: 0.4
          }}
          className={cn(
            // Positioning
            "fixed top-6 right-6 z-[9999]",
            // Size constraints
            "w-96 max-w-[calc(100vw-3rem)]",
            // Base styling
            "rounded-xl border shadow-2xl backdrop-blur-sm",
            // Color scheme
            getNotificationColor(currentPopup.notification_type),
            // Responsive adjustments
            "sm:w-96 xs:w-80",
            className
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-t-xl overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: "100%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>

          {/* Notification content */}
          <div className="p-4 pt-6">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(currentPopup.notification_type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                      Session Notification
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {currentPopup.student_name}
                    </p>
                  </div>
                  
                  {/* Close button */}
                  <button
                    onClick={handleClose}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Close notification"
                  >
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Message */}
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-3">
                  {currentPopup.message}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    <span>Session #{currentPopup.session_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(currentPopup.session_start_time)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action button (optional) */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-lg 
                    bg-white dark:bg-gray-800 
                    text-gray-700 dark:text-gray-300
                    border border-gray-200 dark:border-gray-600
                    hover:bg-gray-50 dark:hover:bg-gray-700
                    transition-colors duration-150"
                >
                  Dismiss
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // Navigate to sessions page or open session details
                    window.location.href = '/sessions';
                  }}
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-lg
                    bg-blue-600 hover:bg-blue-700 
                    text-white
                    transition-colors duration-150"
                >
                  View Session
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==================== NOTIFICATION TOAST VARIANTS ====================

// Lightweight toast for less critical notifications
export const NotificationToast: React.FC<{
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
}> = ({ message, type = 'info', onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "fixed top-20 right-6 z-[9998]",
            "px-4 py-3 rounded-lg border shadow-lg",
            "max-w-sm",
            getToastStyles()
          )}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm font-medium">{message}</p>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose?.(), 300);
              }}
              className="ml-auto flex-shrink-0 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==================== NOTIFICATION POPUP CONTAINER ====================

// Container component that manages multiple popup notifications
export const NotificationPopupContainer: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <div className="pointer-events-auto">
        <NotificationPopup />
      </div>
    </div>
  );
};