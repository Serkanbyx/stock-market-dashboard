import { z } from 'zod';

/**
 * Zod Validation Schemas
 * Used for form validation and data integrity
 */

/**
 * Stock symbol validation schema
 * - Must be 1-5 uppercase letters
 * - Common stock symbol format (e.g., AAPL, MSFT, GOOGL)
 */
export const symbolSchema = z
  .string()
  .min(1, 'Symbol is required')
  .max(5, 'Symbol must be 5 characters or less')
  .regex(
    /^[A-Z]{1,5}$/,
    'Symbol must contain only uppercase letters (1-5 characters)'
  )
  .transform((val) => val.toUpperCase());

/**
 * Search form validation schema
 */
export const searchFormSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Please enter a stock symbol')
    .max(10, 'Symbol is too long')
    .regex(
      /^[A-Za-z]{1,10}$/,
      'Symbol must contain only letters'
    )
    .transform((val) => val.toUpperCase()),
});

/**
 * Watchlist item validation schema
 */
export const watchlistItemSchema = z.object({
  symbol: symbolSchema,
  name: z.string().min(1, 'Name is required'),
});

/**
 * Time range validation schema
 */
export const timeRangeSchema = z.enum(['1D', '1W', '1M', '3M', '6M', '1Y', '5Y']);

/**
 * Stock quote validation schema (for API response validation)
 */
export const stockQuoteSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  change: z.number(),
  changePercent: z.number(),
  high: z.number(),
  low: z.number(),
  open: z.number(),
  previousClose: z.number(),
  volume: z.number(),
  timestamp: z.number(),
});

/**
 * Historical data point validation schema
 */
export const historicalDataPointSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});

// Type exports inferred from schemas
export type SearchFormData = z.infer<typeof searchFormSchema>;
export type WatchlistItemData = z.infer<typeof watchlistItemSchema>;
export type TimeRangeData = z.infer<typeof timeRangeSchema>;
