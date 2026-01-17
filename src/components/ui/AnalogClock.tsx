import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AnalogClockProps {
  value?: string; // Time in HH:MM format
  onChange?: (time: string) => void;
  className?: string;
  size?: number;
}

export const AnalogClock: React.FC<AnalogClockProps> = ({
  value = "12:00",
  onChange,
  className = "",
  size = 280
}) => {
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isSelectingHour, setIsSelectingHour] = useState(true);
  const [isAM, setIsAM] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const clockRef = useRef<SVGSVGElement>(null);

  // Parse initial value
  useEffect(() => {
    if (value) {    
      const [hours, minutes] = value.split(':').map(Number);
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      setSelectedHour(displayHour);
      setSelectedMinute(minutes);
      setIsAM(hours < 12);
    }
  }, [value]);

  // Check for dark mode and listen for changes
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  // Convert 12-hour time to 24-hour format
  const formatTime24Hour = (hour: number, minute: number, isAMPeriod: boolean) => {
    let hour24 = hour;
    if (isAMPeriod && hour === 12) {
      hour24 = 0;
    } else if (!isAMPeriod && hour !== 12) {
      hour24 = hour + 12;
    }
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Handle clock interaction
  const handleClockClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!clockRef.current) return;

    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = event.clientX - centerX;
    const y = event.clientY - centerY;
    
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360; // Adjust to start from 12 o'clock

    if (isSelectingHour) {
      const hour = Math.round(angle / 30);
      const adjustedHour = hour === 0 ? 12 : hour;
      setSelectedHour(adjustedHour);
      setIsSelectingHour(false);
    } else {
      const minute = Math.round(angle / 6) * 1; // 6 degrees per minute, but snap to 5-minute intervals
      const adjustedMinute = minute === 60 ? 0 : minute;
      setSelectedMinute(adjustedMinute);
      
      // Update parent component
      const timeString = formatTime24Hour(selectedHour, adjustedMinute, isAM);
      onChange?.(timeString);
    }
  };

  // Generate hour markers
  const hourMarkers = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 1;
    const angle = (hour * 30 - 90) * (Math.PI / 180);
    const outerRadius = size / 2 - 30;
    const innerRadius = size / 2 - 45;
    
    return {
      hour,
      x1: size / 2 + Math.cos(angle) * innerRadius,
      y1: size / 2 + Math.sin(angle) * innerRadius,
      x2: size / 2 + Math.cos(angle) * outerRadius,
      y2: size / 2 + Math.sin(angle) * outerRadius,
      textX: size / 2 + Math.cos(angle) * (outerRadius - 25),
      textY: size / 2 + Math.sin(angle) * (outerRadius - 25),
    };
  });

  // Generate minute markers (every 5 minutes)
  const minuteMarkers = Array.from({ length: 12 }, (_, i) => {
    const minute = i * 5;
    const angle = (minute * 6 - 90) * (Math.PI / 180);
    const outerRadius = size / 2 - 30;
    const innerRadius = size / 2 - 45;
    
    return {
      minute,
      x1: size / 2 + Math.cos(angle) * innerRadius,
      y1: size / 2 + Math.sin(angle) * innerRadius,
      x2: size / 2 + Math.cos(angle) * outerRadius,
      y2: size / 2 + Math.sin(angle) * outerRadius,
      textX: size / 2 + Math.cos(angle) * (outerRadius - 25),
      textY: size / 2 + Math.sin(angle) * (outerRadius - 25),
    };
  });

  // Calculate hand positions
  const hourAngle = (selectedHour * 30 - 90) * (Math.PI / 180);
  const minuteAngle = (selectedMinute * 6 - 90) * (Math.PI / 180);
  
  const hourHandLength = size / 2 - 90;
  const minuteHandLength = size / 2 - 70;

  const hourHandX = size / 2 + Math.cos(hourAngle) * hourHandLength;
  const hourHandY = size / 2 + Math.sin(hourAngle) * hourHandLength;
  
  const minuteHandX = size / 2 + Math.cos(minuteAngle) * minuteHandLength;
  const minuteHandY = size / 2 + Math.sin(minuteAngle) * minuteHandLength;

  return (
    <div className={`flex flex-col items-center space-y-6 ${className}`}>
      {/* Mode Selection */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 shadow-sm">
        <button
          onClick={() => setIsSelectingHour(true)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            isSelectingHour
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400'
          }`}
        >
          Hour
        </button>
        <button
          onClick={() => setIsSelectingHour(false)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            !isSelectingHour
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400'
          }`}
        >
          Minute
        </button>
      </div>

      {/* Analog Clock */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        <svg
          ref={clockRef}
          width={size}
          height={size}
          className="cursor-pointer drop-shadow-sm"
          onClick={handleClockClick}
          key={`clock-${isDarkMode ? 'dark' : 'light'}`}
        >
          {/* Gradient Definition */}
          <defs>
            <radialGradient id={`clockGradient-${isDarkMode ? 'dark' : 'light'}`} cx="0.3" cy="0.3">
              {isDarkMode ? (
                <>
                  <stop offset="0%" stopColor="rgb(55 65 81)" />
                  <stop offset="70%" stopColor="rgb(45 55 72)" />
                  <stop offset="100%" stopColor="rgb(31 41 55)" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="rgb(255 255 255)" />
                  <stop offset="70%" stopColor="rgb(249 250 251)" />
                  <stop offset="100%" stopColor="rgb(243 244 246)" />
                </>
              )}
            </radialGradient>
            <filter id="clockShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
            </filter>
          </defs>

          {/* Clock Face */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 20}
            fill={`url(#clockGradient-${isDarkMode ? 'dark' : 'light'})`}
            stroke={isDarkMode ? "rgb(75 85 99)" : "rgb(156 163 175)"}
            strokeWidth="1.5"
            filter="url(#clockShadow)"
          />
          
          {/* Inner decoration ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 50}
            fill="none"
            stroke={isDarkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(156, 163, 175, 0.4)"}
            strokeWidth="0.5"
          />

          {/* Hour/Minute Markers */}
          {isSelectingHour ? (
            // Hour markers
            hourMarkers.map(({ hour, x1, y1, x2, y2, textX, textY }) => (
              <g key={hour}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isDarkMode ? "rgb(156 163 175)" : "rgb(107 114 128)"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <motion.text
                  x={textX}
                  y={textY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isDarkMode ? "rgb(229 231 235)" : "rgb(75 85 99)"}
                  fontSize="15"
                  fontWeight="600"
                  fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                  className="cursor-pointer select-none"
                  initial={{ scale: selectedHour === hour ? 1.1 : 1 }}
                  animate={{ 
                    scale: selectedHour === hour ? 1.1 : 1,
                    fill: selectedHour === hour 
                      ? (isDarkMode ? "rgb(255 255 255)" : "rgb(99 102 241)")
                      : (isDarkMode ? "rgb(229 231 235)" : "rgb(75 85 99)")
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedHour(hour);
                    const timeString = formatTime24Hour(hour, selectedMinute, isAM);
                    onChange?.(timeString);
                    setIsSelectingHour(false);
                  }}
                >
                  {hour}
                </motion.text>
                {selectedHour === hour && (
                  <motion.circle
                    cx={textX}
                    cy={textY}
                    r="18"
                    fill={isDarkMode ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.15)"}
                    stroke={isDarkMode ? "rgb(129 140 248)" : "rgb(99 102 241)"}
                    strokeWidth="1.5"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                )}
              </g>
            ))
          ) : (
            // Minute markers
            minuteMarkers.map(({ minute, x1, y1, x2, y2, textX, textY }) => (
              <g key={minute}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isDarkMode ? "rgb(156 163 175)" : "rgb(107 114 128)"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <motion.text
                  x={textX}
                  y={textY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isDarkMode ? "rgb(229 231 235)" : "rgb(75 85 99)"}
                  fontSize="13"
                  fontWeight="600"
                  fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                  className="cursor-pointer select-none"
                  initial={{ scale: selectedMinute === minute ? 1.1 : 1 }}
                  animate={{ 
                    scale: selectedMinute === minute ? 1.1 : 1,
                    fill: selectedMinute === minute 
                      ? (isDarkMode ? "rgb(255 255 255)" : "rgb(99 102 241)")
                      : (isDarkMode ? "rgb(229 231 235)" : "rgb(75 85 99)")
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMinute(minute);
                    const timeString = formatTime24Hour(selectedHour, minute, isAM);
                    onChange?.(timeString);
                  }}
                >
                  {minute.toString().padStart(2, '0')}
                </motion.text>
                {selectedMinute === minute && (
                  <motion.circle
                    cx={textX}
                    cy={textY}
                    r="18"
                    fill={isDarkMode ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.15)"}
                    stroke={isDarkMode ? "rgb(129 140 248)" : "rgb(99 102 241)"}
                    strokeWidth="1.5"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                )}
              </g>
            ))
          )}

          {/* Clock Hands */}
          {isSelectingHour ? (
            // Hour hand
            <motion.line
              x1={size / 2}
              y1={size / 2}
              x2={hourHandX}
              y2={hourHandY}
              stroke={isDarkMode ? 'rgb(129 140 248)' : 'rgb(79 70 229)'}
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#clockShadow)"
              animate={{ x2: hourHandX, y2: hourHandY }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          ) : (
            // Minute hand
            <motion.line
              x1={size / 2}
              y1={size / 2}
              x2={minuteHandX}
              y2={minuteHandY}
              stroke={isDarkMode ? 'rgb(129 140 248)' : 'rgb(79 70 229)'}
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#clockShadow)"
              animate={{ x2: minuteHandX, y2: minuteHandY }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          )}

          {/* Center dot */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r="6"
            fill={isDarkMode ? "rgb(229 231 235)" : "rgb(79 70 229)"}
            filter="url(#clockShadow)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          />
        </svg>
      </motion.div>

      {/* Selected Time Display with AM/PM Toggle */}
      <div className="flex items-center space-x-3">
        <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600">
          <p className="text-lg font-semibold text-slate-800 dark:text-white text-center">
            {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
          </p>
        </div>
        
        {/* AM/PM Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-600">
          <button
            onClick={() => {
              setIsAM(true);
              const timeString = formatTime24Hour(selectedHour, selectedMinute, true);
              onChange?.(timeString);
            }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              isAM
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400'
            }`}
          >
            AM
          </button>
          <button
            onClick={() => {
              setIsAM(false);
              const timeString = formatTime24Hour(selectedHour, selectedMinute, false);
              onChange?.(timeString);
            }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              !isAM
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400'
            }`}
          >
            PM
          </button>
        </div>
      </div>

      {/* Instructions */}
      <p className={`
        text-sm text-center max-w-xs transition-colors duration-500
        ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
      `}>
        {isSelectingHour 
          ? "Click on the clock to select the hour" 
          : "Click on the clock to select the minute"
        }
      </p>
    </div>
  );
};

export default AnalogClock;
