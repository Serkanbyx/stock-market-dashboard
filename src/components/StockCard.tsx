import { memo } from 'react';
import type { StockQuote } from '../types';

interface StockCardProps {
  stock: StockQuote;
  onAddToWatchlist?: () => void;
  isInWatchlist?: boolean;
}

/**
 * Stock Card Component
 * Displays detailed stock information in a card format
 */
export const StockCard = memo(function StockCard({
  stock,
  onAddToWatchlist,
  isInWatchlist = false,
}: StockCardProps) {
  const isPositive = stock.changePercent >= 0;

  return (
    <div className="bg-card rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-white">{stock.symbol}</h2>
            {onAddToWatchlist && (
              <button
                onClick={onAddToWatchlist}
                className={`
                  p-2 rounded-lg transition-colors
                  ${
                    isInWatchlist
                      ? 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20'
                      : 'text-slate-400 hover:text-yellow-400 hover:bg-slate-700'
                  }
                `}
                title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
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
            )}
          </div>
          <p className="text-slate-400">{stock.name}</p>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold text-white">
            ${stock.price.toFixed(2)}
          </p>
          <div
            className={`
              inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium mt-1
              ${
                isPositive
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }
            `}
          >
            <svg
              className={`w-4 h-4 ${isPositive ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            {isPositive ? '+' : ''}
            {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatItem label="Open" value={`$${stock.open.toFixed(2)}`} />
        <StatItem label="Previous Close" value={`$${stock.previousClose.toFixed(2)}`} />
        <StatItem
          label="Day High"
          value={`$${stock.high.toFixed(2)}`}
          highlight="positive"
        />
        <StatItem
          label="Day Low"
          value={`$${stock.low.toFixed(2)}`}
          highlight="negative"
        />
      </div>

      {/* Day Range */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-400">Day Range</span>
          <span className="text-slate-400">
            ${stock.low.toFixed(2)} - ${stock.high.toFixed(2)}
          </span>
        </div>
        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 rounded-full"
            style={{ width: '100%' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-blue-500"
            style={{
              left: `${calculatePosition(stock.price, stock.low, stock.high)}%`,
            }}
          />
        </div>
      </div>

      {/* Last Updated */}
      <p className="mt-4 text-xs text-slate-500 text-right">
        Last updated: {new Date(stock.timestamp * 1000).toLocaleString()}
      </p>
    </div>
  );
});

/**
 * Stat Item Component
 */
interface StatItemProps {
  label: string;
  value: string;
  highlight?: 'positive' | 'negative';
}

const StatItem = memo(function StatItem({ label, value, highlight }: StatItemProps) {
  return (
    <div className="bg-slate-700/30 rounded-lg p-3">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p
        className={`font-semibold ${
          highlight === 'positive'
            ? 'text-emerald-400'
            : highlight === 'negative'
            ? 'text-red-400'
            : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
});

/**
 * Calculate position percentage for price indicator
 */
function calculatePosition(current: number, low: number, high: number): number {
  if (high === low) return 50;
  const position = ((current - low) / (high - low)) * 100;
  return Math.min(Math.max(position, 0), 100);
}
