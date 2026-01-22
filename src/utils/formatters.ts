/**
 * Utility functions for formatting values
 */

/**
 * Format a number as currency (USD)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a large number with abbreviations (K, M, B, T)
 */
export function formatLargeNumber(value: number): string {
  const tiers = [
    { threshold: 1e12, suffix: 'T' },
    { threshold: 1e9, suffix: 'B' },
    { threshold: 1e6, suffix: 'M' },
    { threshold: 1e3, suffix: 'K' },
  ];

  const tier = tiers.find((t) => Math.abs(value) >= t.threshold);

  if (tier) {
    const scaled = value / tier.threshold;
    return scaled.toFixed(2) + tier.suffix;
  }

  return value.toFixed(2);
}

/**
 * Format a percentage value
 */
export function formatPercentage(value: number, showSign = true): string {
  const formatted = Math.abs(value).toFixed(2) + '%';
  
  if (showSign) {
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  }
  
  return formatted;
}

/**
 * Format a date string
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return dateObj.toLocaleDateString('en-US', options || defaultOptions);
}

/**
 * Format a timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return formatDate(new Date(timestamp * 1000));
}

/**
 * Format volume with commas
 */
export function formatVolume(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
