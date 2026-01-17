import * as React from 'react';
import { motion } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Calendar as CalendarIcon, FileText } from 'lucide-react';

interface CalendarProps {
  onNotesToggle?: (enabled: boolean, selectedDate?: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ onNotesToggle }) => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [notesMode, setNotesMode] = React.useState(false);

  const handleNotesToggle = () => {
    const newNotesMode = !notesMode;
    setNotesMode(newNotesMode);
    // Only pass mode change, don't open notes immediately
    if (!newNotesMode) {
      // If exiting notes mode, notify with false
      onNotesToggle?.(false);
    }
    // If entering notes mode, don't call onNotesToggle yet - wait for date selection
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (notesMode && selectedDate) {
      onNotesToggle?.(true, selectedDate);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <CardTitle>Calendar</CardTitle>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNotesToggle}
              className={`p-2 rounded-lg transition-all duration-200 ${
                notesMode 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-md' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
              title={notesMode ? 'Exit notes mode' : 'Enter notes mode - then click a date to view notes'}
            >
              <FileText className="h-5 w-5" />
            </motion.button>
          </div>
        </CardHeader>
        <CardContent>
          <DayPicker
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            className="rounded-md"
            classNames={{
              months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              month: 'space-y-4',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-sm font-medium',
              nav: 'space-x-1 flex items-center',
              nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
              row: 'flex w-full mt-2',
              cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
              day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
              day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
              day_today: 'bg-accent text-accent-foreground',
              day_outside: 'text-muted-foreground opacity-50',
              day_disabled: 'text-muted-foreground opacity-50',
              day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
              day_hidden: 'invisible',
            }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};
