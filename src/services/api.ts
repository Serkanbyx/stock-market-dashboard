import axios, { AxiosInstance } from 'axios';
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
const RATE_LIMIT_DELAY = 1000; // 1 second between requests for free tier

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
        console.warn('Rate limit exceeded. Please wait before making more requests.');
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();

// Simple rate limiter
let lastRequestTime = 0;
const rateLimitedRequest = async <T>(request: () => Promise<T>): Promise<T> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise((resolve) => 
      setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
  return request();
};

/**
 * Stock API Service
 * Handles all stock-related API calls with rate limiting
 */
export const stockApi = {
  /**
   * Get real-time quote for a stock symbol
   */
  async getQuote(symbol: string): Promise<StockQuote> {
    return rateLimitedRequest(async () => {
      // Get quote data
      const quoteResponse = await apiClient.get('/quote', {
        params: { symbol: symbol.toUpperCase() },
      });

      // Get company profile for name
      const profileResponse = await apiClient.get('/stock/profile2', {
        params: { symbol: symbol.toUpperCase() },
      });

      const quote = quoteResponse.data;
      const profile = profileResponse.data;

      return {
        symbol: symbol.toUpperCase(),
        name: profile.name || symbol.toUpperCase(),
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
    });
  },

  /**
   * Search for stock symbols
   */
  async searchSymbols(query: string): Promise<SearchResult[]> {
    return rateLimitedRequest(async () => {
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
    return rateLimitedRequest(async () => {
      const now = Math.floor(Date.now() / 1000);
      const resolution = getResolution(timeRange);
      const from = getFromTimestamp(timeRange, now);

      const response = await apiClient.get('/stock/candle', {
        params: {
          symbol: symbol.toUpperCase(),
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
   * Get market indices data
   */
  async getMarketIndices(): Promise<MarketIndex[]> {
    // Using popular ETFs as proxies for indices (free tier limitation)
    const indices = [
      { symbol: 'SPY', name: 'S&P 500' },
      { symbol: 'QQQ', name: 'NASDAQ 100' },
      { symbol: 'DIA', name: 'Dow Jones' },
    ];

    const results: MarketIndex[] = [];

    for (const index of indices) {
      try {
        const quote = await this.getQuote(index.symbol);
        results.push({
          symbol: index.symbol,
          name: index.name,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
        });
      } catch {
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
  },

  /**
   * Get top gaining stocks
   */
  async getTopGainers(): Promise<StockQuote[]> {
    // Finnhub free tier doesn't have market movers endpoint
    // Return curated list of popular stocks with mock change data
    const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];
    return this.getStocksWithMockChanges(popularStocks, true);
  },

  /**
   * Get top losing stocks
   */
  async getTopLosers(): Promise<StockQuote[]> {
    const popularStocks = ['META', 'TSLA', 'NFLX', 'AMD', 'INTC'];
    return this.getStocksWithMockChanges(popularStocks, false);
  },

  /**
   * Helper to get stocks with simulated changes
   */
  async getStocksWithMockChanges(
    symbols: string[],
    positive: boolean
  ): Promise<StockQuote[]> {
    const results: StockQuote[] = [];
    const errors: Error[] = [];

    for (const symbol of symbols.slice(0, 5)) {
      try {
        const quote = await this.getQuote(symbol);
        // Override with mock change for demo purposes
        const changePercent = positive
          ? Math.random() * 5 + 1
          : -(Math.random() * 5 + 1);
        results.push({
          ...quote,
          changePercent,
          change: (quote.price * changePercent) / 100,
        });
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
        console.warn(`Failed to fetch quote for ${symbol}:`, error);
      }
    }

    // If all requests failed, throw an error
    if (results.length === 0 && errors.length > 0) {
      throw new Error('Failed to fetch stock data. Please check your API key and try again.');
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
