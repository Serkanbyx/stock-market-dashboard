import { memo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMarketIndices } from '../store/slices/marketSlice';

/**
 * Market Overview Component
 * Displays major market indices (S&P 500, NASDAQ, DOW)
 */
export const MarketOverview = memo(function MarketOverview() {
  const dispatch = useAppDispatch();
  const { indices, status } = useAppSelector((state) => state.market);

  useEffect(() => {
    dispatch(fetchMarketIndices());
  }, [dispatch]);

  if (status === 'loading' && indices.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-card rounded-xl p-4 animate-pulse"
          >
            <div className="h-4 bg-slate-700 rounded w-20 mb-2" />
            <div className="h-8 bg-slate-700 rounded w-24 mb-1" />
            <div className="h-4 bg-slate-700 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {indices.map((index) => {
        const isPositive = index.changePercent >= 0;

        return (
          <div
            key={index.symbol}
            className="bg-card rounded-xl p-4 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">{index.name}</p>
                <p className="text-2xl font-bold text-white">
                  ${index.price.toFixed(2)}
                </p>
              </div>
              <div
                className={`
                  flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium
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
                {index.changePercent.toFixed(2)}%
              </div>
            </div>
            <p
              className={`mt-2 text-sm ${
                isPositive ? 'text-positive' : 'text-negative'
              }`}
            >
              {isPositive ? '+' : ''}
              {index.change.toFixed(2)} today
            </p>
          </div>
        );
      })}
    </div>
  );
});
