import { configureStore } from '@reduxjs/toolkit';
import stockReducer from './slices/stockSlice';
import watchlistReducer from './slices/watchlistSlice';
import marketReducer from './slices/marketSlice';
import portfolioReducer from './slices/portfolioSlice';

/**
 * Redux Store Configuration
 * Combines all slices: stock, watchlist, market, and portfolio data
 */
export const store = configureStore({
  reducer: {
    stock: stockReducer,
    watchlist: watchlistReducer,
    market: marketReducer,
    portfolio: portfolioReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
