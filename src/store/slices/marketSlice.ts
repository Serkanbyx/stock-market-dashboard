import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { stockApi } from '../../services/api';
import type { MarketState, MarketIndex, StockQuote } from '../../types';

// Initial state
const initialState: MarketState = {
  indices: [],
  topGainers: [],
  topLosers: [],
  status: 'idle',
  error: null,
};

/**
 * Async thunk to fetch market indices (S&P 500, NASDAQ, DOW)
 */
export const fetchMarketIndices = createAsyncThunk<MarketIndex[]>(
  'market/fetchIndices',
  async (_, { rejectWithValue }) => {
    try {
      const indices = await stockApi.getMarketIndices();
      return indices;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch market indices'
      );
    }
  }
);

/**
 * Async thunk to fetch top gainers
 */
export const fetchTopGainers = createAsyncThunk<StockQuote[]>(
  'market/fetchTopGainers',
  async (_, { rejectWithValue }) => {
    try {
      const gainers = await stockApi.getTopGainers();
      return gainers;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch top gainers'
      );
    }
  }
);

/**
 * Async thunk to fetch top losers
 */
export const fetchTopLosers = createAsyncThunk<StockQuote[]>(
  'market/fetchTopLosers',
  async (_, { rejectWithValue }) => {
    try {
      const losers = await stockApi.getTopLosers();
      return losers;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch top losers'
      );
    }
  }
);

/**
 * Market slice for overall market data
 */
const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    clearMarketError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch indices
      .addCase(fetchMarketIndices.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMarketIndices.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.indices = action.payload;
      })
      .addCase(fetchMarketIndices.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Fetch top gainers
      .addCase(fetchTopGainers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTopGainers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.topGainers = action.payload;
      })
      .addCase(fetchTopGainers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Fetch top losers
      .addCase(fetchTopLosers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTopLosers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.topLosers = action.payload;
      })
      .addCase(fetchTopLosers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { clearMarketError } = marketSlice.actions;

export default marketSlice.reducer;
