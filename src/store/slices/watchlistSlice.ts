import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { stockApi } from '../../services/api';
import type { WatchlistState, WatchlistItem, StockQuote } from '../../types';

// Load watchlist from localStorage
const loadWatchlistFromStorage = (): WatchlistItem[] => {
  try {
    const stored = localStorage.getItem('watchlist');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save watchlist to localStorage
const saveWatchlistToStorage = (items: WatchlistItem[]) => {
  localStorage.setItem('watchlist', JSON.stringify(items));
};

// Initial state
const initialState: WatchlistState = {
  items: loadWatchlistFromStorage(),
  quotes: {},
  status: 'idle',
  error: null,
};

/**
 * Async thunk to fetch quotes for all watchlist items
 */
export const fetchWatchlistQuotes = createAsyncThunk<
  Record<string, StockQuote>,
  void,
  { state: { watchlist: WatchlistState } }
>(
  'watchlist/fetchQuotes',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { items } = getState().watchlist;
      if (items.length === 0) return {};

      const quotes: Record<string, StockQuote> = {};
      
      // Fetch quotes in parallel with rate limiting
      const symbols = items.map((item) => item.symbol);
      const results = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const quote = await stockApi.getQuote(symbol);
            return { symbol, quote };
          } catch {
            return { symbol, quote: null };
          }
        })
      );

      results.forEach(({ symbol, quote }) => {
        if (quote) {
          quotes[symbol] = quote;
        }
      });

      return quotes;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch watchlist quotes'
      );
    }
  }
);

/**
 * Watchlist slice for managing user's saved stocks
 */
const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    // Add stock to watchlist
    addToWatchlist: (state, action: PayloadAction<{ symbol: string; name: string }>) => {
      const { symbol, name } = action.payload;
      const exists = state.items.some((item) => item.symbol === symbol);
      
      if (!exists) {
        const newItem: WatchlistItem = {
          symbol,
          name,
          addedAt: Date.now(),
        };
        state.items.push(newItem);
        saveWatchlistToStorage(state.items);
      }
    },
    // Remove stock from watchlist
    removeFromWatchlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.symbol !== action.payload);
      delete state.quotes[action.payload];
      saveWatchlistToStorage(state.items);
    },
    // Clear entire watchlist
    clearWatchlist: (state) => {
      state.items = [];
      state.quotes = {};
      saveWatchlistToStorage([]);
    },
    // Update a single quote
    updateQuote: (state, action: PayloadAction<StockQuote>) => {
      state.quotes[action.payload.symbol] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWatchlistQuotes.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchWatchlistQuotes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.quotes = action.payload;
      })
      .addCase(fetchWatchlistQuotes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { 
  addToWatchlist, 
  removeFromWatchlist, 
  clearWatchlist,
  updateQuote 
} = watchlistSlice.actions;

export default watchlistSlice.reducer;
