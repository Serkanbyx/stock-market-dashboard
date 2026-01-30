import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { stockApi } from '../../services/api';
import type { PortfolioState, PortfolioHolding, Transaction } from '../../types';

// Default initial balance for virtual portfolio
const DEFAULT_INITIAL_BALANCE = 100000;

// LocalStorage keys
const STORAGE_KEYS = {
  holdings: 'portfolio_holdings',
  transactions: 'portfolio_transactions',
  cashBalance: 'portfolio_cash',
  initialBalance: 'portfolio_initial',
};

/**
 * Load portfolio data from localStorage
 */
const loadFromStorage = () => {
  try {
    const holdings = localStorage.getItem(STORAGE_KEYS.holdings);
    const transactions = localStorage.getItem(STORAGE_KEYS.transactions);
    const cashBalance = localStorage.getItem(STORAGE_KEYS.cashBalance);
    const initialBalance = localStorage.getItem(STORAGE_KEYS.initialBalance);

    return {
      holdings: holdings ? JSON.parse(holdings) : [],
      transactions: transactions ? JSON.parse(transactions) : [],
      cashBalance: cashBalance ? parseFloat(cashBalance) : DEFAULT_INITIAL_BALANCE,
      initialBalance: initialBalance ? parseFloat(initialBalance) : DEFAULT_INITIAL_BALANCE,
    };
  } catch {
    return {
      holdings: [],
      transactions: [],
      cashBalance: DEFAULT_INITIAL_BALANCE,
      initialBalance: DEFAULT_INITIAL_BALANCE,
    };
  }
};

/**
 * Save portfolio data to localStorage
 */
const saveToStorage = (state: Partial<PortfolioState>) => {
  if (state.holdings !== undefined) {
    localStorage.setItem(STORAGE_KEYS.holdings, JSON.stringify(state.holdings));
  }
  if (state.transactions !== undefined) {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(state.transactions));
  }
  if (state.cashBalance !== undefined) {
    localStorage.setItem(STORAGE_KEYS.cashBalance, state.cashBalance.toString());
  }
  if (state.initialBalance !== undefined) {
    localStorage.setItem(STORAGE_KEYS.initialBalance, state.initialBalance.toString());
  }
};

/**
 * Generate unique transaction ID
 */
const generateTransactionId = (): string => {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Load initial state from storage
const storedData = loadFromStorage();

const initialState: PortfolioState = {
  holdings: storedData.holdings,
  transactions: storedData.transactions,
  cashBalance: storedData.cashBalance,
  initialBalance: storedData.initialBalance,
  currentPrices: {},
  status: 'idle',
  error: null,
};

/**
 * Async thunk to fetch current prices for all holdings
 */
export const fetchPortfolioPrices = createAsyncThunk<
  Record<string, number>,
  void,
  { state: { portfolio: PortfolioState } }
>(
  'portfolio/fetchPrices',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { holdings } = getState().portfolio;
      if (holdings.length === 0) return {};

      const symbols = holdings.map((h) => h.symbol);
      const prices = await stockApi.getMultiplePrices(symbols);
      
      return prices;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch portfolio prices'
      );
    }
  }
);

/**
 * Async thunk to execute a buy transaction
 */
export const executeBuyOrder = createAsyncThunk<
  { holding: PortfolioHolding; transaction: Transaction; newCashBalance: number },
  { symbol: string; name: string; shares: number },
  { state: { portfolio: PortfolioState } }
>(
  'portfolio/executeBuy',
  async ({ symbol, name, shares }, { getState, rejectWithValue }) => {
    try {
      const { cashBalance, holdings } = getState().portfolio;
      
      // Fetch current price
      const price = await stockApi.getPrice(symbol, true);
      
      if (price === 0) {
        throw new Error('Unable to fetch current price for this stock');
      }
      
      const total = price * shares;
      
      // Check if user has enough cash
      if (total > cashBalance) {
        throw new Error(`Insufficient funds. Required: $${total.toFixed(2)}, Available: $${cashBalance.toFixed(2)}`);
      }
      
      // Find existing holding or create new
      const existingHolding = holdings.find((h) => h.symbol === symbol);
      let newHolding: PortfolioHolding;
      
      if (existingHolding) {
        // Calculate new average cost
        const totalShares = existingHolding.shares + shares;
        const totalCost = existingHolding.totalCost + total;
        const averageCost = totalCost / totalShares;
        
        newHolding = {
          symbol,
          name: existingHolding.name,
          shares: totalShares,
          averageCost,
          totalCost,
        };
      } else {
        newHolding = {
          symbol,
          name,
          shares,
          averageCost: price,
          totalCost: total,
        };
      }
      
      // Create transaction record
      const transaction: Transaction = {
        id: generateTransactionId(),
        type: 'buy',
        symbol,
        name,
        shares,
        price,
        total,
        timestamp: Date.now(),
      };
      
      return {
        holding: newHolding,
        transaction,
        newCashBalance: cashBalance - total,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to execute buy order'
      );
    }
  }
);

/**
 * Async thunk to execute a sell transaction
 */
export const executeSellOrder = createAsyncThunk<
  { holding: PortfolioHolding | null; transaction: Transaction; newCashBalance: number; realizedPnL: number },
  { symbol: string; shares: number },
  { state: { portfolio: PortfolioState } }
>(
  'portfolio/executeSell',
  async ({ symbol, shares }, { getState, rejectWithValue }) => {
    try {
      const { cashBalance, holdings } = getState().portfolio;
      
      // Find existing holding
      const existingHolding = holdings.find((h) => h.symbol === symbol);
      
      if (!existingHolding) {
        throw new Error(`You don't own any shares of ${symbol}`);
      }
      
      if (shares > existingHolding.shares) {
        throw new Error(`You only own ${existingHolding.shares} shares of ${symbol}`);
      }
      
      // Fetch current price
      const price = await stockApi.getPrice(symbol, true);
      
      if (price === 0) {
        throw new Error('Unable to fetch current price for this stock');
      }
      
      const total = price * shares;
      const costBasis = existingHolding.averageCost * shares;
      const realizedPnL = total - costBasis;
      
      // Calculate new holding (or null if selling all)
      let newHolding: PortfolioHolding | null = null;
      
      if (shares < existingHolding.shares) {
        const remainingShares = existingHolding.shares - shares;
        const remainingCost = existingHolding.averageCost * remainingShares;
        
        newHolding = {
          symbol: existingHolding.symbol,
          name: existingHolding.name,
          shares: remainingShares,
          averageCost: existingHolding.averageCost,
          totalCost: remainingCost,
        };
      }
      
      // Create transaction record
      const transaction: Transaction = {
        id: generateTransactionId(),
        type: 'sell',
        symbol,
        name: existingHolding.name,
        shares,
        price,
        total,
        timestamp: Date.now(),
      };
      
      return {
        holding: newHolding,
        transaction,
        newCashBalance: cashBalance + total,
        realizedPnL,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to execute sell order'
      );
    }
  }
);

/**
 * Portfolio slice for managing virtual portfolio
 */
const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    // Update current price for a symbol
    updatePrice: (state, action: PayloadAction<{ symbol: string; price: number }>) => {
      state.currentPrices[action.payload.symbol] = action.payload.price;
    },
    
    // Reset portfolio to initial state
    resetPortfolio: (state) => {
      state.holdings = [];
      state.transactions = [];
      state.cashBalance = DEFAULT_INITIAL_BALANCE;
      state.initialBalance = DEFAULT_INITIAL_BALANCE;
      state.currentPrices = {};
      state.error = null;
      
      // Clear localStorage
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      
      // Save new initial values
      saveToStorage({
        holdings: [],
        transactions: [],
        cashBalance: DEFAULT_INITIAL_BALANCE,
        initialBalance: DEFAULT_INITIAL_BALANCE,
      });
    },
    
    // Clear error state
    clearError: (state) => {
      state.error = null;
    },
    
    // Set custom initial balance (for resetting with different amount)
    setInitialBalance: (state, action: PayloadAction<number>) => {
      const newBalance = Math.max(0, action.payload);
      state.initialBalance = newBalance;
      state.cashBalance = newBalance;
      state.holdings = [];
      state.transactions = [];
      state.currentPrices = {};
      
      saveToStorage({
        holdings: [],
        transactions: [],
        cashBalance: newBalance,
        initialBalance: newBalance,
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch portfolio prices
      .addCase(fetchPortfolioPrices.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPortfolioPrices.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentPrices = action.payload;
      })
      .addCase(fetchPortfolioPrices.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      
      // Execute buy order
      .addCase(executeBuyOrder.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(executeBuyOrder.fulfilled, (state, action) => {
        const { holding, transaction, newCashBalance } = action.payload;
        
        // Update or add holding
        const existingIndex = state.holdings.findIndex((h) => h.symbol === holding.symbol);
        if (existingIndex >= 0) {
          state.holdings[existingIndex] = holding;
        } else {
          state.holdings.push(holding);
        }
        
        // Add transaction
        state.transactions.unshift(transaction);
        
        // Update cash balance
        state.cashBalance = newCashBalance;
        
        // Update current price
        state.currentPrices[holding.symbol] = transaction.price;
        
        state.status = 'succeeded';
        
        // Save to localStorage
        saveToStorage({
          holdings: state.holdings,
          transactions: state.transactions,
          cashBalance: state.cashBalance,
        });
      })
      .addCase(executeBuyOrder.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      
      // Execute sell order
      .addCase(executeSellOrder.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(executeSellOrder.fulfilled, (state, action) => {
        const { holding, transaction, newCashBalance } = action.payload;
        
        // Update or remove holding
        if (holding) {
          const existingIndex = state.holdings.findIndex((h) => h.symbol === holding.symbol);
          if (existingIndex >= 0) {
            state.holdings[existingIndex] = holding;
          }
        } else {
          // Remove holding if sold all shares
          state.holdings = state.holdings.filter((h) => h.symbol !== transaction.symbol);
          delete state.currentPrices[transaction.symbol];
        }
        
        // Add transaction
        state.transactions.unshift(transaction);
        
        // Update cash balance
        state.cashBalance = newCashBalance;
        
        state.status = 'succeeded';
        
        // Save to localStorage
        saveToStorage({
          holdings: state.holdings,
          transactions: state.transactions,
          cashBalance: state.cashBalance,
        });
      })
      .addCase(executeSellOrder.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { 
  updatePrice, 
  resetPortfolio, 
  clearError,
  setInitialBalance,
} = portfolioSlice.actions;

export default portfolioSlice.reducer;
