import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import type { Transaction } from '../types';

interface TransactionHistoryProps {
  limit?: number;
}

/**
 * Transaction History Component
 * Displays list of all buy/sell transactions
 */
export const TransactionHistory = memo(function TransactionHistory({
  limit,
}: TransactionHistoryProps) {
  const navigate = useNavigate();
  const { transactions } = useAppSelector((state) => state.portfolio);
  const [showAll, setShowAll] = useState(false);

  // Apply limit if specified
  const displayedTransactions = limit && !showAll
    ? transactions.slice(0, limit)
    : transactions;

  const hasMore = limit && transactions.length > limit;

  if (transactions.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-slate-400 mb-2">No transactions yet</p>
          <p className="text-slate-500 text-sm">
            Your buy and sell transactions will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Transaction History ({transactions.length})
        </h3>
      </div>

      <div className="space-y-3">
        {displayedTransactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            onClick={() => navigate(`/stock/${transaction.symbol}`)}
          />
        ))}
      </div>

      {/* Show More Button */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-4 py-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          Show All ({transactions.length - (limit || 0)} more)
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full mt-4 py-2 text-slate-400 hover:text-slate-300 text-sm font-medium transition-colors"
        >
          Show Less
        </button>
      )}
    </div>
  );
});

/**
 * Transaction Item Component
 */
interface TransactionItemProps {
  transaction: Transaction;
  onClick: () => void;
}

const TransactionItem = memo(function TransactionItem({
  transaction,
  onClick,
}: TransactionItemProps) {
  const isBuy = transaction.type === 'buy';

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className={`p-2 rounded-lg ${
            isBuy ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}
        >
          <svg
            className={`w-5 h-5 ${isBuy ? 'text-emerald-400' : 'text-red-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isBuy ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            )}
          </svg>
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{transaction.symbol}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                isBuy
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {isBuy ? 'BUY' : 'SELL'}
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            {transaction.shares} share{transaction.shares !== 1 ? 's' : ''} @ $
            {transaction.price.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Amount & Time */}
      <div className="text-right">
        <p
          className={`font-semibold ${
            isBuy ? 'text-red-400' : 'text-emerald-400'
          }`}
        >
          {isBuy ? '-' : '+'}$
          {transaction.total.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-slate-500 text-xs">
          {formatTransactionDate(transaction.timestamp)}
        </p>
      </div>
    </div>
  );
});

/**
 * Format transaction date
 */
function formatTransactionDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}
