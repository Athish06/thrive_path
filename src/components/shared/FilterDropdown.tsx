import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select filter...",
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div ref={dropdownRef} className={cn("relative z-10", className)}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-3 bg-white/80 dark:bg-slate-900/80",
          "border border-slate-200/70 dark:border-slate-700/70 rounded-xl",
          "backdrop-blur-sm transition-all duration-200",
          "hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md",
          "focus:ring-2 focus:ring-violet-500 focus:border-transparent",
          "min-w-[180px] text-left"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedOption?.icon && (
            <div className="flex-shrink-0">
              {selectedOption.icon}
            </div>
          )}
          <span className={cn(
            "text-sm font-medium truncate",
            selectedOption ? "text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"
          )}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute top-full left-0 right-0 mt-2",
              "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
              "border border-slate-200/70 dark:border-slate-700/70 rounded-xl",
              "shadow-xl z-50 max-h-64 overflow-y-auto"
            )}
          >
            {options.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.15 }}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left",
                  "hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors",
                  "first:rounded-t-xl last:rounded-b-xl",
                  value === option.value && "bg-violet-100/70 dark:bg-violet-900/50"
                )}
              >
                {option.icon && (
                  <div className="flex-shrink-0">
                    {option.icon}
                  </div>
                )}
                <span className={cn(
                  "text-sm font-medium flex-1 truncate",
                  value === option.value
                    ? "text-violet-700 dark:text-violet-300"
                    : "text-slate-700 dark:text-slate-300"
                )}>
                  {option.label}
                </span>
                {value === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0"
                  >
                    <Check className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};