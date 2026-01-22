import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing a value
 * Useful for search inputs to prevent excessive API calls
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer on value or delay change
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
