import { memo, useMemo } from 'react';
import { useAppSelector } from '../store/hooks';

/**
 * Portfolio Summary Component
 * Displays total portfolio value, P&L, and cash balance
 */
export const PortfolioSummary = memo(function PortfolioSummary() {
  const { holdings, cashBalance, initialBalance, currentPrices, status } = useAppSelector(
    (state) => state.portfolio
  );

  // Calculate portfolio metrics
  const metrics = useMemo(() => {
    // Calculate total market value of holdings
    const marketValue = holdings.reduce((total, holding) => {
      const currentPrice = currentPrices[holding.symbol] || holding.averageCost;
      return total + currentPrice * holding.shares;
    }, 0);

    // Calculate total cost basis
    const totalCostBasis = holdings.reduce((total, holding) => {
      return total + holding.totalCost;
    }, 0);

    // Calculate unrealized P&L
    const unrealizedPnL = marketValue - totalCostBasis;
    const unrealizedPnLPercent = totalCostBasis > 0 ? (unrealizedPnL / totalCostBasis) * 100 : 0;

    // Total portfolio value (holdings + cash)
    const totalValue = marketValue + cashBalance;

    // Total P&L (from initial balance)
    const totalPnL = totalValue - initialBalance;
    const totalPnLPercent = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;

    return {
      marketValue,
      totalCostBasis,
      unrealizedPnL,
      unrealizedPnLPercent,
      totalValue,
      totalPnL,
      totalPnLPercent,
    };
  }, [holdings, cashBalance, initialBalance, currentPrices]);

  const isLoading = status === 'loading';

  return (
    <div className="bg-card rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Portfolio Summary</h2>
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
            Updating...
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className="mb-6">
        <p className="text-slate-400 text-sm mb-1">Total Portfolio Value</p>
        <p className="text-4xl font-bold text-white">
          ${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div
          className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-lg text-sm font-medium ${
            metrics.totalPnL >= 0
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          <svg
            className={`w-4 h-4 ${metrics.totalPnL >= 0 ? '' : 'rotate-180'}`}
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
          {metrics.totalPnL >= 0 ? '+' : ''}
          ${metrics.totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          ({metrics.totalPnLPercent >= 0 ? '+' : ''}{metrics.totalPnLPercent.toFixed(2)}%)
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Cash Balance"
          value={`$${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <SummaryCard
          label="Market Value"
          value={`$${metrics.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
        />
        <SummaryCard
          label="Cost Basis"
          value={`$${metrics.totalCostBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          }
        />
        <SummaryCard
          label="Unrealized P&L"
          value={`${metrics.unrealizedPnL >= 0 ? '+' : ''}$${metrics.unrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subValue={`${metrics.unrealizedPnLPercent >= 0 ? '+' : ''}${metrics.unrealizedPnLPercent.toFixed(2)}%`}
          highlight={metrics.unrealizedPnL >= 0 ? 'positive' : 'negative'}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        />
      </div>

      {/* Holdings Count */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Holding {holdings.length} {holdings.length === 1 ? 'stock' : 'stocks'}
          </span>
          <span className="text-slate-400">
            Initial Balance: ${initialBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
});

/**
 * Summary Card Component
 */
interface SummaryCardProps {
  label: string;
  value: string;
  subValue?: string;
  highlight?: 'positive' | 'negative';
  icon: React.ReactNode;
}

const SummaryCard = memo(function SummaryCard({
  label,
  value,
  subValue,
  highlight,
  icon,
}: SummaryCardProps) {
  return (
    <div className="bg-slate-700/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-slate-400">{icon}</span>
        <span className="text-slate-400 text-xs">{label}</span>
      </div>
      <p
        className={`font-semibold text-lg ${
          highlight === 'positive'
            ? 'text-emerald-400'
            : highlight === 'negative'
            ? 'text-red-400'
            : 'text-white'
        }`}
      >
        {value}
      </p>
      {subValue && (
        <p
          className={`text-xs mt-1 ${
            highlight === 'positive'
              ? 'text-emerald-400/70'
              : highlight === 'negative'
              ? 'text-red-400/70'
              : 'text-slate-400'
          }`}
        >
          {subValue}
        </p>
      )}
    </div>
  );
});
