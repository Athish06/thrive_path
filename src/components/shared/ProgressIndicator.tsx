import React from 'react';

interface ProgressIndicatorProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'circular' | 'linear';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  showLabel?: boolean;
  label?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'linear',
  color = 'blue',
  showLabel = true,
  label
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    red: 'text-red-600 bg-red-100',
    purple: 'text-purple-600 bg-purple-100',
  };

  const sizeClasses = {
    sm: { height: 'h-1', text: 'text-xs', circle: 'w-12 h-12' },
    md: { height: 'h-2', text: 'text-sm', circle: 'w-16 h-16' },
    lg: { height: 'h-3', text: 'text-base', circle: 'w-20 h-20' },
  };

  if (variant === 'circular') {
    const circumference = 2 * Math.PI * 20;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center space-y-2">
        <div className={`relative ${sizeClasses[size].circle}`}>
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 50 50">
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-gray-200"
            />
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={colorClasses[color].split(' ')[0]}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-semibold ${sizeClasses[size].text} ${colorClasses[color].split(' ')[0]}`}>
              {Math.round(percentage)}%
            </span>
          </div>
        </div>
        {showLabel && label && (
          <span className={`${sizeClasses[size].text} text-gray-600 text-center`}>
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className={`${sizeClasses[size].text} font-medium text-gray-700`}>
            {label || 'Progress'}
          </span>
          <span className={`${sizeClasses[size].text} font-semibold ${colorClasses[color].split(' ')[0]}`}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size].height}`}>
        <div
          className={`${sizeClasses[size].height} rounded-full bg-gradient-to-r transition-all duration-500 ease-out ${
            color === 'blue' ? 'from-blue-400 to-blue-600' :
            color === 'green' ? 'from-green-400 to-green-600' :
            color === 'yellow' ? 'from-yellow-400 to-yellow-600' :
            color === 'red' ? 'from-red-400 to-red-600' :
            'from-purple-400 to-purple-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};