import { useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchStockQuote,
  fetchHistoricalData,
  setTimeRange,
  clearSelectedStock,
} from '../store/slices/stockSlice';
import {
  addToWatchlist,
  removeFromWatchlist,
} from '../store/slices/watchlistSlice';
import { StockCard } from '../components/StockCard';
import { StockChart } from '../components/StockChart';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import type { TimeRange } from '../types';

/**
 * Stock Detail Page
 * Displays detailed information and charts for a specific stock
 */
export const StockDetail = memo(function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    selectedStock,
    historicalData,
    status,
    error,
    timeRange,
  } = useAppSelector((state) => state.stock);

  const { items: watchlistItems } = useAppSelector((state) => state.watchlist);

  // Check if stock is in watchlist
  const isInWatchlist = watchlistItems.some(
    (item) => item.symbol === symbol?.toUpperCase()
  );

  // Fetch stock data on mount and symbol change
  useEffect(() => {
    if (symbol) {
      const upperSymbol = symbol.toUpperCase();
      dispatch(fetchStockQuote(upperSymbol));
      dispatch(fetchHistoricalData({ symbol: upperSymbol, timeRange }));
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearSelectedStock());
    };
  }, [symbol, dispatch]);

  // Fetch new historical data when time range changes
  useEffect(() => {
    if (symbol && selectedStock) {
      dispatch(fetchHistoricalData({ symbol: symbol.toUpperCase(), timeRange }));
    }
  }, [timeRange, symbol, selectedStock, dispatch]);

  // Handle time range change
  const handleTimeRangeChange = useCallback(
    (range: TimeRange) => {
      dispatch(setTimeRange(range));
    },
    [dispatch]
  );

  // Handle watchlist toggle
  const handleWatchlistToggle = useCallback(() => {
    if (!selectedStock) return;

    if (isInWatchlist) {
      dispatch(removeFromWatchlist(selectedStock.symbol));
    } else {
      dispatch(
        addToWatchlist({
          symbol: selectedStock.symbol,
          name: selectedStock.name,
        })
      );
    }
  }, [dispatch, selectedStock, isInWatchlist]);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    if (symbol) {
      const upperSymbol = symbol.toUpperCase();
      dispatch(fetchStockQuote(upperSymbol));
      dispatch(fetchHistoricalData({ symbol: upperSymbol, timeRange }));
    }
  }, [symbol, timeRange, dispatch]);

  // Loading state
  if (status === 'loading' && !selectedStock) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" message={`Loading ${symbol?.toUpperCase()}...`} />
      </div>
    );
  }

  // Error state
  if (status === 'failed' && error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-card rounded-xl p-8 max-w-md w-full">
          <ErrorMessage
            title="Failed to load stock"
            message={error}
            onRetry={handleRetry}
          />
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No stock data
  if (!selectedStock) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-card rounded-xl p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            Stock not found
          </h2>
          <p className="text-slate-400 mb-6">
            We couldn't find any data for "{symbol?.toUpperCase()}"
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          to="/"
          className="text-slate-400 hover:text-white transition-colors"
        >
          Dashboard
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-white font-medium">{selectedStock.symbol}</span>
      </nav>

      {/* Stock Header Card */}
      <StockCard
        stock={selectedStock}
        onAddToWatchlist={handleWatchlistToggle}
        isInWatchlist={isInWatchlist}
      />

      {/* Price Chart */}
      <StockChart
        data={historicalData}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        isLoading={status === 'loading'}
      />

      {/* Additional Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Statistics */}
        <div className="bg-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Key Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <StatRow
              label="Open"
              value={`$${selectedStock.open.toFixed(2)}`}
            />
            <StatRow
              label="Previous Close"
              value={`$${selectedStock.previousClose.toFixed(2)}`}
            />
            <StatRow
              label="Day High"
              value={`$${selectedStock.high.toFixed(2)}`}
            />
            <StatRow
              label="Day Low"
              value={`$${selectedStock.low.toFixed(2)}`}
            />
            <StatRow
              label="52 Week High"
              value={`$${(selectedStock.price * 1.3).toFixed(2)}`}
            />
            <StatRow
              label="52 Week Low"
              value={`$${(selectedStock.price * 0.7).toFixed(2)}`}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={handleWatchlistToggle}
              className={`
                w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors
                ${
                  isInWatchlist
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }
              `}
            >
              <svg
                className="w-5 h-5"
                fill={isInWatchlist ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            </button>

            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh Data
            </button>

            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-center">
        <p className="text-sm text-slate-500">
          Stock data is provided for informational purposes only and should not
          be considered as financial advice. Data may be delayed up to 15 minutes.
        </p>
      </div>
    </div>
  );
});

/**
 * Stat Row Component
 */
interface StatRowProps {
  label: string;
  value: string;
}

const StatRow = memo(function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
});
