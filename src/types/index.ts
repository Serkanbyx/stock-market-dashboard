/**
 * Stock Market Dashboard - Type Definitions
 */

// Stock quote data from API
export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  timestamp: number;
}

// Historical data point for charts
export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Watchlist item
export interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: number;
}

// Search result from API
export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

// Company profile/info
export interface CompanyProfile {
  symbol: string;
  name: string;
  exchange: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  employees: number;
  marketCap: number;
  logo: string;
}

// Market overview data
export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

// Time range options for charts
export type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y';

// API response status
export type ApiStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

// Redux store state types
export interface StockState {
  selectedStock: StockQuote | null;
  historicalData: HistoricalDataPoint[];
  searchResults: SearchResult[];
  status: ApiStatus;
  error: string | null;
  timeRange: TimeRange;
}

export interface WatchlistState {
  items: WatchlistItem[];
  quotes: Record<string, StockQuote>;
  status: ApiStatus;
  error: string | null;
}

export interface MarketState {
  indices: MarketIndex[];
  topGainers: StockQuote[];
  topLosers: StockQuote[];
  status: ApiStatus;
  error: string | null;
}

// Form types
export interface SearchFormData {
  symbol: string;
}

// Chart data type for Recharts
export interface ChartDataPoint {
  date: string;
  price: number;
  volume: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}
