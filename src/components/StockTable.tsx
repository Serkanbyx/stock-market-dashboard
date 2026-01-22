import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StockQuote } from '../types';

interface StockTableProps {
  stocks: StockQuote[];
  title?: string;
  isLoading?: boolean;
  onAddToWatchlist?: (symbol: string, name: string) => void;
  watchlistSymbols?: string[];
}

/**
 * Stock Table Component
 * Displays a list of stocks with key metrics in a sortable table format
 */
export const StockTable = memo(function StockTable({
  stocks,
  title = 'Stocks',
  isLoading = false,
  onAddToWatchlist,
  watchlistSymbols = [],
}: StockTableProps) {
  const navigate = useNavigate();

  const handleRowClick = useCallback(
    (symbol: string) => {
      navigate(`/stock/${symbol}`);
    },
    [navigate]
  );

  const handleWatchlistClick = useCallback(
    (e: React.MouseEvent, symbol: string, name: string) => {
      e.stopPropagation();
      onAddToWatchlist?.(symbol, name);
    },
    [onAddToWatchlist]
  );

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <div className="p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400">Loading stocks...</p>
          </div>
        </div>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="bg-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-slate-400">No stocks to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl overflow-hidden">
      {/* Table Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="text-sm text-slate-400">{stocks.length} stocks</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="stock-table">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="w-12"></th>
              <th>Symbol</th>
              <th>Name</th>
              <th className="text-right">Price</th>
              <th className="text-right">Change</th>
              <th className="text-right">% Change</th>
              <th className="text-right hidden md:table-cell">High</th>
              <th className="text-right hidden md:table-cell">Low</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const isPositive = stock.changePercent >= 0;
              const isInWatchlist = watchlistSymbols.includes(stock.symbol);

              return (
                <tr
                  key={stock.symbol}
                  onClick={() => handleRowClick(stock.symbol)}
                  className="cursor-pointer"
                >
                  {/* Watchlist Button */}
                  <td className="w-12">
                    <button
                      onClick={(e) =>
                        handleWatchlistClick(e, stock.symbol, stock.name)
                      }
                      className={`
                        p-1.5 rounded-lg transition-colors
                        ${
                          isInWatchlist
                            ? 'text-yellow-400 hover:text-yellow-300'
                            : 'text-slate-500 hover:text-yellow-400'
                        }
                      `}
                      title={
                        isInWatchlist
                          ? 'Remove from watchlist'
                          : 'Add to watchlist'
                      }
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
                    </button>
                  </td>

                  {/* Symbol */}
                  <td>
                    <span className="font-semibold text-white">
                      {stock.symbol}
                    </span>
                  </td>

                  {/* Name */}
                  <td>
                    <span className="text-slate-300 truncate max-w-[150px] block">
                      {stock.name}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="text-right">
                    <span className="font-medium text-white">
                      ${stock.price.toFixed(2)}
                    </span>
                  </td>

                  {/* Change */}
                  <td className="text-right">
                    <span
                      className={isPositive ? 'text-positive' : 'text-negative'}
                    >
                      {isPositive ? '+' : ''}
                      {stock.change.toFixed(2)}
                    </span>
                  </td>

                  {/* % Change */}
                  <td className="text-right">
                    <span
                      className={`
                        inline-flex items-center px-2 py-0.5 rounded text-sm font-medium
                        ${
                          isPositive
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }
                      `}
                    >
                      {isPositive ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </td>

                  {/* High */}
                  <td className="text-right hidden md:table-cell">
                    <span className="text-slate-300">
                      ${stock.high.toFixed(2)}
                    </span>
                  </td>

                  {/* Low */}
                  <td className="text-right hidden md:table-cell">
                    <span className="text-slate-300">
                      ${stock.low.toFixed(2)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
