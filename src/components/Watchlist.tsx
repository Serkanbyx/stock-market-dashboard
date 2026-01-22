import { memo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { removeFromWatchlist, fetchWatchlistQuotes } from '../store/slices/watchlistSlice';

/**
 * Watchlist Component
 * Displays user's saved stocks with real-time price updates
 */
export const Watchlist = memo(function Watchlist() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, quotes, status } = useAppSelector((state) => state.watchlist);

  // Fetch quotes for watchlist items
  useEffect(() => {
    if (items.length > 0) {
      dispatch(fetchWatchlistQuotes());
    }
  }, [items.length, dispatch]);

  // Handle removing item from watchlist
  const handleRemove = useCallback(
    (e: React.MouseEvent, symbol: string) => {
      e.stopPropagation();
      dispatch(removeFromWatchlist(symbol));
    },
    [dispatch]
  );

  // Handle navigating to stock detail
  const handleStockClick = useCallback(
    (symbol: string) => {
      navigate(`/stock/${symbol}`);
    },
    [navigate]
  );

  // Refresh watchlist quotes
  const handleRefresh = useCallback(() => {
    dispatch(fetchWatchlistQuotes());
  }, [dispatch]);

  if (items.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Watchlist</h3>
        </div>
        <div className="text-center py-8">
          <svg
            className="w-12 h-12 mx-auto text-slate-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <p className="text-slate-400 mb-2">Your watchlist is empty</p>
          <p className="text-sm text-slate-500">
            Click the star icon on any stock to add it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Watchlist</h3>
          <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded-full">
            {items.length}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={status === 'loading'}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh quotes"
        >
          <svg
            className={`w-5 h-5 ${status === 'loading' ? 'animate-spin' : ''}`}
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
        </button>
      </div>

      {/* Watchlist Items */}
      <div className="divide-y divide-slate-700/50">
        {items.map((item) => {
          const quote = quotes[item.symbol];
          const isPositive = quote?.changePercent >= 0;

          return (
            <div
              key={item.symbol}
              onClick={() => handleStockClick(item.symbol)}
              className="px-4 py-3 hover:bg-slate-700/30 cursor-pointer transition-colors flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">
                    {item.symbol}
                  </span>
                  {quote && (
                    <span
                      className={`
                        text-xs px-1.5 py-0.5 rounded
                        ${
                          isPositive
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }
                      `}
                    >
                      {isPositive ? '+' : ''}
                      {quote.changePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 truncate">{item.name}</p>
              </div>

              <div className="flex items-center gap-3">
                {quote ? (
                  <div className="text-right">
                    <p className="font-medium text-white">
                      ${quote.price.toFixed(2)}
                    </p>
                    <p
                      className={`text-sm ${
                        isPositive ? 'text-positive' : 'text-negative'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {quote.change.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <div className="w-16 h-8 bg-slate-700 rounded animate-pulse" />
                )}

                <button
                  onClick={(e) => handleRemove(e, item.symbol)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Remove from watchlist"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
