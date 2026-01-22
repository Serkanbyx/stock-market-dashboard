import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { stockApi } from '../../services/api';
import type { 
  StockState, 
  StockQuote, 
  HistoricalDataPoint, 
  SearchResult, 
  TimeRange 
} from '../../types';

// Initial state
const initialState: StockState = {
  selectedStock: null,
  historicalData: [],
  searchResults: [],
  status: 'idle',
  error: null,
  timeRange: '1M',
};

/**
 * Async thunk to fetch stock quote by symbol
 */
export const fetchStockQuote = createAsyncThunk<StockQuote, string>(
  'stock/fetchQuote',
  async (symbol, { rejectWithValue }) => {
    try {
      const quote = await stockApi.getQuote(symbol);
      return quote;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch stock quote'
      );
    }
  }
);

/**
 * Async thunk to fetch historical data for charts
 */
export const fetchHistoricalData = createAsyncThunk<
  HistoricalDataPoint[],
  { symbol: string; timeRange: TimeRange }
>(
  'stock/fetchHistoricalData',
  async ({ symbol, timeRange }, { rejectWithValue }) => {
    try {
      const data = await stockApi.getHistoricalData(symbol, timeRange);
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch historical data'
      );
    }
  }
);

/**
 * Async thunk to search stocks by query
 */
export const searchStocks = createAsyncThunk<SearchResult[], string>(
  'stock/search',
  async (query, { rejectWithValue }) => {
    try {
      const results = await stockApi.searchSymbols(query);
      return results;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to search stocks'
      );
    }
  }
);

/**
 * Stock slice with reducers and extra reducers for async actions
 */
const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    // Clear selected stock
    clearSelectedStock: (state) => {
      state.selectedStock = null;
      state.historicalData = [];
    },
    // Clear search results
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    // Set time range for charts
    setTimeRange: (state, action: PayloadAction<TimeRange>) => {
      state.timeRange = action.payload;
    },
    // Clear any errors
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch quote
      .addCase(fetchStockQuote.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchStockQuote.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selectedStock = action.payload;
      })
      .addCase(fetchStockQuote.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Fetch historical data
      .addCase(fetchHistoricalData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchHistoricalData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.historicalData = action.payload;
      })
      .addCase(fetchHistoricalData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Search stocks
      .addCase(searchStocks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(searchStocks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.searchResults = action.payload;
      })
      .addCase(searchStocks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearSelectedStock, 
  clearSearchResults, 
  setTimeRange, 
  clearError 
} = stockSlice.actions;

export default stockSlice.reducer;
