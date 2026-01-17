import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CustomDatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  const formatDate = (date: Date) => {
    // Use local date formatting to avoid timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateString: string) => {
    // Create date with explicit time to avoid timezone issues
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Ensure we're working with a clean date without time components
    newDate.setHours(0, 0, 0, 0);
    onChange(formatDate(newDate));
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(monthIndex);
      return newDate;
    });
    setShowMonthPicker(false);
  };

  const handleYearSelect = (year: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(year);
      return newDate;
    });
    setShowYearPicker(false);
  };

  const generateYearRange = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 50; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10 w-10" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      dayDate.setHours(0, 0, 0, 0);
      
      const isSelected = selectedDate && 
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentDate.getMonth() &&
        selectedDate.getFullYear() === currentDate.getFullYear();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isToday = dayDate.getTime() === today.getTime();

      days.push(
        <motion.button
          key={day}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleDateSelect(day)}
          className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
            isSelected
              ? 'bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg'
              : isToday
              ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {day}
        </motion.button>
      );
    }

    return days;
  };

  return (
    <div className="relative" ref={containerRef}>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all flex items-center justify-between ${className}`}
      >
        <span className={value ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <Calendar className="h-5 w-5 text-slate-400" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to ensure proper layering and handle outside clicks */}
            <div 
              className="fixed inset-0 z-[100] bg-transparent" 
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed z-[101] p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl min-w-[320px]"
              style={{
                top: containerRef.current ? 
                  `${containerRef.current.getBoundingClientRect().bottom + 8}px` : 
                  '50px',
                left: containerRef.current ? 
                  `${containerRef.current.getBoundingClientRect().left}px` : 
                  '50px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                disabled={showMonthPicker || showYearPicker}
              >
                <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </motion.button>

              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowMonthPicker(true);
                    setShowYearPicker(false);
                  }}
                  className="px-3 py-1 text-lg font-semibold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {months[currentDate.getMonth()]}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowYearPicker(true);
                    setShowMonthPicker(false);
                  }}
                  className="px-3 py-1 text-lg font-semibold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {currentDate.getFullYear()}
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                disabled={showMonthPicker || showYearPicker}
              >
                <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </motion.button>
            </div>

            {/* Month Picker */}
            {showMonthPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-3 gap-2 mb-4"
              >
                {months.map((month, index) => (
                  <motion.button
                    key={month}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMonthSelect(index)}
                    className={`p-2 rounded-lg text-sm font-medium transition-all ${
                      currentDate.getMonth() === index
                        ? 'bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-md'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {month.slice(0, 3)}
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Year Picker */}
            {showYearPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-h-48 overflow-y-auto mb-4 calendar-scrollbar"
                >
                <div className="grid grid-cols-4 gap-2">
                  {generateYearRange().map((year) => (
                    <motion.button
                      key={year}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleYearSelect(year)}
                      className={`p-2 rounded-lg text-sm font-medium transition-all ${
                        currentDate.getFullYear() === year
                          ? 'bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-md'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {year}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Back to Calendar Button */}
            {(showMonthPicker || showYearPicker) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowMonthPicker(false);
                    setShowYearPicker(false);
                  }}
                  className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                >
                  ← Back to Calendar
                </motion.button>
              </motion.div>
            )}

            {/* Days of Week Header */}
            {!showMonthPicker && !showYearPicker && (
              <>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {daysOfWeek.map(day => (
                    <div key={day} className="h-10 flex items-center justify-center">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {day}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {renderCalendarDays()}
                </div>
              </>
            )}

            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onChange(formatDate(new Date()));
                  setIsOpen(false);
                }}
                className="px-3 py-1.5 text-sm bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
              >
                Today
              </motion.button>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
