import { memo } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

/**
 * Loading Spinner Component
 * Reusable loading indicator with optional message
 */
export const LoadingSpinner = memo(function LoadingSpinner({
  size = 'md',
  message = 'Loading...',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-14 h-14 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div
        className={`
          ${sizeClasses[size]}
          border-blue-500 border-t-transparent
          rounded-full animate-spin
        `}
      />
      {message && (
        <p className="text-slate-400 text-sm animate-pulse">{message}</p>
      )}
    </div>
  );
});
