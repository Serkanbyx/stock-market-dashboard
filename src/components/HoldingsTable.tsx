import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import type { PortfolioHolding } from '../types';

interface HoldingsTableProps {
  onSellClick?: (holding: PortfolioHolding) => void;
}

/**
 * Holdings Table Component
 * Displays all portfolio holdings with current values and P&L
 */
export const HoldingsTable = memo(function HoldingsTable({ onSellClick }: HoldingsTableProps) {
  const navigate = useNavigate();
  const { holdings, currentPrices, status } = useAppSelector((state) => state.portfolio);

  // Calculate extended holdings data with current values and P&L
  const extendedHoldings = useMemo(() => {
    return holdings.map((holding) => {
      const currentPrice = currentPrices[holding.symbol] || holding.averageCost;
      const marketValue = currentPrice * holding.shares;
      const unrealizedPnL = marketValue - holding.totalCost;
      const unrealizedPnLPercent = holding.totalCost > 0 
        ? (unrealizedPnL / holding.totalCost) * 100 
        : 0;

      return {
        ...holding,
        currentPrice,
        marketValue,
        unrealizedPnL,
        unrealizedPnLPercent,
      };
    });
  }, [holdings, currentPrices]);

  const isLoading = status === 'loading';

  if (holdings.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Holdings</h3>
        <div className="text-center py-8">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p className="text-slate-400 mb-2">No holdings yet</p>
          <p className="text-slate-500 text-sm">
            Start by buying some stocks to build your portfolio
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Holdings ({holdings.length})
        </h3>
        {isLoading && (
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700/50">
              <th className="text-left py-3 px-2">Symbol</th>
              <th className="text-right py-3 px-2">Shares</th>
              <th className="text-right py-3 px-2 hidden sm:table-cell">Avg Cost</th>
              <th className="text-right py-3 px-2">Current</th>
              <th className="text-right py-3 px-2">Market Value</th>
              <th className="text-right py-3 px-2">P&L</th>
              <th className="text-center py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {extendedHoldings.map((holding) => (
              <tr
                key={holding.symbol}
                className="hover:bg-slate-700/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/stock/${holding.symbol}`)}
              >
                <td className="py-4 px-2">
                  <div>
                    <p className="font-semibold text-white">{holding.symbol}</p>
                    <p className="text-slate-400 text-xs truncate max-w-[150px]">
                      {holding.name}
                    </p>
                  </div>
                </td>
                <td className="text-right py-4 px-2 text-white">
                  {holding.shares.toLocaleString()}
                </td>
                <td className="text-right py-4 px-2 text-slate-300 hidden sm:table-cell">
                  ${holding.averageCost.toFixed(2)}
                </td>
                <td className="text-right py-4 px-2 text-white">
                  ${holding.currentPrice.toFixed(2)}
                </td>
                <td className="text-right py-4 px-2 text-white font-medium">
                  ${holding.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="text-right py-4 px-2">
                  <div
                    className={`${
                      holding.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    <p className="font-medium">
                      {holding.unrealizedPnL >= 0 ? '+' : ''}
                      ${holding.unrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs opacity-70">
                      {holding.unrealizedPnLPercent >= 0 ? '+' : ''}
                      {holding.unrealizedPnLPercent.toFixed(2)}%
                    </p>
                  </div>
                </td>
                <td className="text-center py-4 px-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSellClick?.(holding);
                    }}
                    className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
                  >
                    Sell
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total Row */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">Total Market Value</span>
          <span className="text-white font-semibold">
            $
            {extendedHoldings
              .reduce((sum, h) => sum + h.marketValue, 0)
              .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
});
