import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface DropdownProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  align?: 'left' | 'right';
  side?: 'top' | 'bottom';
  className?: string;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export const Dropdown: React.FC<DropdownProps> = ({ 
  children, 
  trigger, 
  align = 'right',
  side = 'bottom',
  className,
  isOpen: controlledIsOpen,
  onToggle
}) => {
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = (open: boolean) => {
    if (!isControlled) {
      setInternalIsOpen(open);
    }
    onToggle?.(open);
  };
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleToggle(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleToggle(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => handleToggle(!isOpen)}>
        {trigger}
      </div>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => handleToggle(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0.95, 
                y: side === 'top' ? 10 : -10,
                filter: "blur(4px)"
              }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                filter: "blur(0px)"
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.95, 
                y: side === 'top' ? 10 : -10,
                filter: "blur(4px)"
              }}
              transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.8
              }}
              className={cn(
                'absolute min-w-[240px] z-50',
                side === 'bottom' ? 'top-full mt-3' : 'bottom-full mb-3',
                'rounded-2xl glass-card border border-white/20 dark:border-slate-700/50 shadow-2xl',
                'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl',
                'overflow-hidden',
                align === 'right' ? 'right-0' : 'left-0',
                className
              )}
            >
              {/* Gradient border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-violet-500/10 animate-gradient" />
              
              <div className="relative z-10">
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'danger';
  delay?: number;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({ 
  children, 
  onClick, 
  icon, 
  className,
  variant = 'default',
  delay = 0
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.2 }}
      whileHover={{ 
        backgroundColor: variant === 'danger' 
          ? 'rgba(239, 68, 68, 0.1)' 
          : 'rgba(139, 92, 246, 0.1)',
        x: 4
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-all duration-200',
        'hover:bg-violet-50 dark:hover:bg-violet-900/20',
        'first:rounded-t-2xl last:rounded-b-2xl',
        'border-b border-slate-100/50 dark:border-slate-700/30 last:border-b-0',
        variant === 'danger' && 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
        className
      )}
    >
      {icon && (
        <motion.span 
          className="flex-shrink-0"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.2 }}
        >
          {icon}
        </motion.span>
      )}
      <span className="text-slate-700 dark:text-slate-200 font-medium">{children}</span>
    </motion.button>
  );
};

export const DropdownSeparator: React.FC = () => {
  return <div className="h-px bg-border/50 mx-2" />;
};
