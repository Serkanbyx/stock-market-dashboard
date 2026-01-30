import axios, { AxiosInstance, AxiosError } from 'axios';
import type { 
  StockQuote, 
  HistoricalDataPoint, 
  SearchResult, 
  MarketIndex,
  TimeRange 
} from '../types';

// API configuration
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'demo';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 300; // 300ms between requests (allows ~200 req/min, Finnhub allows 60/min)
const CACHE_TTL = 60000; // 60 seconds cache TTL (longer cache for dashboard)
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY = 500; // 500ms base delay for retries

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * In-memory cache for API responses
 */
class ApiCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const apiCache = new ApiCache();

/**
 * Request queue for rate limiting
 */
class RequestQueue {
  private queue: Array<() => void> = [];
  private isProcessing = false;
  private lastRequestTime = 0;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
        await new Promise((resolve) => 
          setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest)
        );
      }
      
      this.lastRequestTime = Date.now();
      const request = this.queue.shift();
      if (request) {
        await request();
      }
    }
    
    this.isProcessing = false;
  }
}

const requestQueue = new RequestQueue();

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable (rate limit or server error)
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const isRetryable = status === 429 || (status && status >= 500);
      
      if (!isRetryable || attempt === retries - 1) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = RETRY_BASE_DELAY * Math.pow(2, attempt);
      console.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Create axios instance with base configuration
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: FINNHUB_BASE_URL,
    timeout: 10000,
    params: {
      token: FINNHUB_API_KEY,
    },
  });

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 429) {
        console.warn('Rate limit exceeded. Request will be retried.');
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();

/**
 * Rate limited request with caching and retry support
 */
const cachedRequest = async <T>(
  cacheKey: string,
  request: () => Promise<T>,
  skipCache = false
): Promise<T> => {
  // Check cache first (unless skipped)
  if (!skipCache) {
    const cached = apiCache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }
  
  // Add to queue and execute with retry
  const result = await requestQueue.add(() => retryWithBackoff(request));
  
  // Cache the result
  apiCache.set(cacheKey, result);
  
  return result;
};

/**
 * Stock API Service
 * Handles all stock-related API calls with caching, rate limiting, and retry
 */
export const stockApi = {
  /**
   * Get real-time quote for a stock symbol
   * @param symbol - Stock symbol (e.g., AAPL)
   * @param skipCache - Skip cache and fetch fresh data
   */
  async getQuote(symbol: string, skipCache = false): Promise<StockQuote> {
    const upperSymbol = symbol.toUpperCase();
    const cacheKey = `quote:${upperSymbol}`;
    
    return cachedRequest(cacheKey, async () => {
      // Get quote data
      const quoteResponse = await apiClient.get('/quote', {
        params: { symbol: upperSymbol },
      });

      // Get company profile for name
      const profileResponse = await apiClient.get('/stock/profile2', {
        params: { symbol: upperSymbol },
      });

      const quote = quoteResponse.data;
      const profile = profileResponse.data;

      return {
        symbol: upperSymbol,
        name: profile.name || upperSymbol,
        price: quote.c || 0,
        change: quote.d || 0,
        changePercent: quote.dp || 0,
        high: quote.h || 0,
        low: quote.l || 0,
        open: quote.o || 0,
        previousClose: quote.pc || 0,
        volume: 0, // Finnhub free tier doesn't provide volume in quote
        timestamp: quote.t || Date.now() / 1000,
      };
    }, skipCache);
  },

  /**
   * Search for stock symbols
   */
  async searchSymbols(query: string): Promise<SearchResult[]> {
    const cacheKey = `search:${query.toLowerCase()}`;
    
    return cachedRequest(cacheKey, async () => {
      const response = await apiClient.get('/search', {
        params: { q: query },
      });

      return (response.data.result || [])
        .slice(0, 10)
        .map((item: { symbol: string; description: string; type: string }) => ({
          symbol: item.symbol,
          name: item.description,
          type: item.type,
          region: 'US',
          currency: 'USD',
        }));
    });
  },

  /**
   * Get historical candle data for charts
   */
  async getHistoricalData(
    symbol: string,
    timeRange: TimeRange
  ): Promise<HistoricalDataPoint[]> {
    const upperSymbol = symbol.toUpperCase();
    const cacheKey = `historical:${upperSymbol}:${timeRange}`;
    
    return cachedRequest(cacheKey, async () => {
      const now = Math.floor(Date.now() / 1000);
      const resolution = getResolution(timeRange);
      const from = getFromTimestamp(timeRange, now);

      const response = await apiClient.get('/stock/candle', {
        params: {
          symbol: upperSymbol,
          resolution,
          from,
          to: now,
        },
      });

      const data = response.data;
      
      if (data.s === 'no_data' || !data.c) {
        return generateMockHistoricalData(timeRange);
      }

      return data.c.map((close: number, index: number) => ({
        date: new Date(data.t[index] * 1000).toISOString().split('T')[0],
        open: data.o[index],
        high: data.h[index],
        low: data.l[index],
        close: close,
        volume: data.v[index],
      }));
    });
  },
  
  /**
   * Get only the price for a symbol (lightweight call)
   * Useful for portfolio updates
   */
  async getPrice(symbol: string, skipCache = false): Promise<number> {
    const upperSymbol = symbol.toUpperCase();
    const cacheKey = `price:${upperSymbol}`;
    
    return cachedRequest(cacheKey, async () => {
      const response = await apiClient.get('/quote', {
        params: { symbol: upperSymbol },
      });
      return response.data.c || 0;
    }, skipCache);
  },

  /**
   * Get multiple stock prices at once
   * @param symbols - Array of stock symbols
   */
  async getMultiplePrices(symbols: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    
    for (const symbol of symbols) {
      try {
        prices[symbol.toUpperCase()] = await this.getPrice(symbol);
      } catch (error) {
        console.warn(`Failed to fetch price for ${symbol}:`, error);
        prices[symbol.toUpperCase()] = 0;
      }
    }
    
    return prices;
  },

  /**
   * Clear API cache
   */
  clearCache(): void {
    apiCache.clear();
  },

  /**
   * Invalidate cache for a specific symbol
   */
  invalidateSymbol(symbol: string): void {
    const upperSymbol = symbol.toUpperCase();
    apiCache.invalidate(`quote:${upperSymbol}`);
    apiCache.invalidate(`price:${upperSymbol}`);
  },

  /**
   * Get market indices data (optimized - parallel fetching)
   */
  async getMarketIndices(): Promise<MarketIndex[]> {
    const cacheKey = 'market:indices';
    
    return cachedRequest(cacheKey, async () => {
      // Using popular ETFs as proxies for indices (free tier limitation)
      const indices = [
        { symbol: 'SPY', name: 'S&P 500' },
        { symbol: 'QQQ', name: 'NASDAQ 100' },
        { symbol: 'DIA', name: 'Dow Jones' },
      ];

      // Fetch all quotes in parallel
      const quotePromises = indices.map(async (index) => {
        try {
          const response = await apiClient.get('/quote', {
            params: { symbol: index.symbol },
          });
          return { index, data: response.data };
        } catch {
          return { index, data: null };
        }
      });

      const quoteResults = await Promise.all(quotePromises);
      const results: MarketIndex[] = [];

      for (const { index, data } of quoteResults) {
        if (data && data.c > 0) {
          results.push({
            symbol: index.symbol,
            name: index.name,
            price: data.c,
            change: data.d || 0,
            changePercent: data.dp || 0,
          });
        } else {
          // If API fails, use mock data
          results.push({
            symbol: index.symbol,
            name: index.name,
            price: 450 + Math.random() * 50,
            change: (Math.random() - 0.5) * 10,
            changePercent: (Math.random() - 0.5) * 2,
          });
        }
      }

      return results;
    });
  },

  /**
   * Get top gaining stocks
   */
  async getTopGainers(): Promise<StockQuote[]> {
    const cacheKey = 'market:topGainers';
    
    return cachedRequest(cacheKey, async () => {
      // Finnhub free tier doesn't have market movers endpoint
      // Return curated list of popular stocks with simulated gains
      const stocks = [
        { symbol: 'AAPL', name: 'Apple Inc' },
        { symbol: 'MSFT', name: 'Microsoft Corporation' },
        { symbol: 'GOOGL', name: 'Alphabet Inc' },
        { symbol: 'AMZN', name: 'Amazon.com Inc' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation' },
      ];
      return this.getStocksWithMockChanges(stocks, true);
    });
  },

  /**
   * Get top losing stocks
   */
  async getTopLosers(): Promise<StockQuote[]> {
    const cacheKey = 'market:topLosers';
    
    return cachedRequest(cacheKey, async () => {
      const stocks = [
        { symbol: 'META', name: 'Meta Platforms Inc' },
        { symbol: 'TSLA', name: 'Tesla Inc' },
        { symbol: 'NFLX', name: 'Netflix Inc' },
        { symbol: 'AMD', name: 'Advanced Micro Devices' },
        { symbol: 'INTC', name: 'Intel Corporation' },
      ];
      return this.getStocksWithMockChanges(stocks, false);
    });
  },

  /**
   * Helper to get stocks with simulated changes (optimized - single API call per stock)
   */
  async getStocksWithMockChanges(
    stocks: Array<{ symbol: string; name: string }>,
    positive: boolean
  ): Promise<StockQuote[]> {
    const results: StockQuote[] = [];

    // Fetch prices in parallel
    const pricePromises = stocks.map(async (stock) => {
      try {
        const response = await apiClient.get('/quote', {
          params: { symbol: stock.symbol },
        });
        return { stock, data: response.data };
      } catch {
        return { stock, data: null };
      }
    });

    const priceResults = await Promise.all(pricePromises);

    for (const { stock, data } of priceResults) {
      if (data && data.c > 0) {
        // Generate mock change for demo purposes
        const changePercent = positive
          ? Math.random() * 5 + 1
          : -(Math.random() * 5 + 1);
        const price = data.c;
        
        results.push({
          symbol: stock.symbol,
          name: stock.name,
          price,
          change: (price * changePercent) / 100,
          changePercent,
          high: data.h || price,
          low: data.l || price,
          open: data.o || price,
          previousClose: data.pc || price,
          volume: 0,
          timestamp: data.t || Date.now() / 1000,
        });
      }
    }

    // If no results, create mock data
    if (results.length === 0) {
      for (const stock of stocks) {
        const mockPrice = 100 + Math.random() * 200;
        const changePercent = positive
          ? Math.random() * 5 + 1
          : -(Math.random() * 5 + 1);
        
        results.push({
          symbol: stock.symbol,
          name: stock.name,
          price: mockPrice,
          change: (mockPrice * changePercent) / 100,
          changePercent,
          high: mockPrice * 1.02,
          low: mockPrice * 0.98,
          open: mockPrice,
          previousClose: mockPrice,
          volume: 0,
          timestamp: Date.now() / 1000,
        });
      }
    }

    return results.sort((a, b) =>
      positive
        ? b.changePercent - a.changePercent
        : a.changePercent - b.changePercent
    );
  },
};

/**
 * Get chart resolution based on time range
 */
function getResolution(timeRange: TimeRange): string {
  const resolutions: Record<TimeRange, string> = {
    '1D': '5',      // 5 minutes
    '1W': '15',     // 15 minutes
    '1M': 'D',      // Daily
    '3M': 'D',      // Daily
    '6M': 'D',      // Daily
    '1Y': 'W',      // Weekly
    '5Y': 'M',      // Monthly
  };
  return resolutions[timeRange];
}

/**
 * Get from timestamp based on time range
 */
function getFromTimestamp(timeRange: TimeRange, now: number): number {
  const durations: Record<TimeRange, number> = {
    '1D': 24 * 60 * 60,
    '1W': 7 * 24 * 60 * 60,
    '1M': 30 * 24 * 60 * 60,
    '3M': 90 * 24 * 60 * 60,
    '6M': 180 * 24 * 60 * 60,
    '1Y': 365 * 24 * 60 * 60,
    '5Y': 5 * 365 * 24 * 60 * 60,
  };
  return now - durations[timeRange];
}

/**
 * Generate mock historical data when API doesn't return data
 */
function generateMockHistoricalData(timeRange: TimeRange): HistoricalDataPoint[] {
  const points: Record<TimeRange, number> = {
    '1D': 78,
    '1W': 35,
    '1M': 22,
    '3M': 65,
    '6M': 130,
    '1Y': 52,
    '5Y': 60,
  };

  const numPoints = points[timeRange];
  const data: HistoricalDataPoint[] = [];
  let basePrice = 150;
  const now = new Date();

  for (let i = numPoints - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * 2 * volatility * basePrice;
    basePrice = Math.max(basePrice + change, 50);

    const open = basePrice;
    const close = basePrice + (Math.random() - 0.5) * 5;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;

    data.push({
      date: date.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });
  }

  return data;
}

export default stockApi;
