import { memo } from 'react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

/**
 * Error Message Component
 * Displays error states with optional retry action
 */
export const ErrorMessage = memo(function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {/* Error Icon */}
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      {/* Error Content */}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-6 max-w-md">{message}</p>

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Try Again
        </button>
      )}
    </div>
  );
});
