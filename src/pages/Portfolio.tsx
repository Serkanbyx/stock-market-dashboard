import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchPortfolioPrices, resetPortfolio } from '../store/slices/portfolioSlice';
import { PortfolioSummary } from '../components/PortfolioSummary';
import { HoldingsTable } from '../components/HoldingsTable';
import { TransactionForm } from '../components/TransactionForm';
import { TransactionHistory } from '../components/TransactionHistory';
import { AllocationChart } from '../components/AllocationChart';
import type { PortfolioHolding } from '../types';

/**
 * Portfolio Page
 * Main page for virtual portfolio management
 */
export default function Portfolio() {
  const dispatch = useAppDispatch();
  const { holdings, status } = useAppSelector((state) => state.portfolio);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'buy' | 'sell'>('buy');
  const [selectedHolding, setSelectedHolding] = useState<PortfolioHolding | null>(null);

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Fetch portfolio prices on mount and when holdings change
  useEffect(() => {
    if (holdings.length > 0) {
      dispatch(fetchPortfolioPrices());
    }
  }, [dispatch, holdings.length]);

  // Refresh prices periodically (every 30 seconds)
  useEffect(() => {
    if (holdings.length === 0) return;

    const interval = setInterval(() => {
      dispatch(fetchPortfolioPrices());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch, holdings.length]);

  // Handle buy button click
  const handleBuyClick = useCallback(() => {
    setSelectedHolding(null);
    setModalMode('buy');
    setIsModalOpen(true);
  }, []);

  // Handle sell button click (from holdings table)
  const handleSellClick = useCallback((holding: PortfolioHolding) => {
    setSelectedHolding(holding);
    setModalMode('sell');
    setIsModalOpen(true);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedHolding(null);
  }, []);

  // Handle reset portfolio
  const handleResetPortfolio = useCallback(() => {
    dispatch(resetPortfolio());
    setShowResetConfirm(false);
  }, [dispatch]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    dispatch(fetchPortfolioPrices());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Portfolio</h1>
          <p className="text-slate-400 mt-1">
            Manage your virtual stock portfolio
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={status === 'loading'}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
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
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-300 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Buy Button */}
          <button
            onClick={handleBuyClick}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Buy Stock
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <PortfolioSummary />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings Table - Takes 2 columns */}
        <div className="lg:col-span-2">
          <HoldingsTable onSellClick={handleSellClick} />
        </div>

        {/* Allocation Chart */}
        <div className="lg:col-span-1">
          <AllocationChart />
        </div>
      </div>

      {/* Transaction History */}
      <TransactionHistory limit={10} />

      {/* Virtual Portfolio Info Card */}
      <div className="bg-card rounded-xl p-6 border border-blue-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <svg
              className="w-6 h-6 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">Virtual Portfolio</h3>
            <p className="text-slate-400 text-sm">
              This is a simulated portfolio for practice and learning purposes. 
              You start with $100,000 virtual cash to buy and sell stocks. 
              All trades are simulated using real-time market prices from Finnhub API.
              Your portfolio data is stored locally in your browser.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={isModalOpen}
        onClose={handleModalClose}
        mode={modalMode}
        prefilledHolding={selectedHolding}
      />

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
          />
          <div className="relative bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6 border border-slate-700">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Reset Portfolio?</h3>
              <p className="text-slate-400 mb-6">
                This will delete all your holdings and transaction history. 
                You will start fresh with $100,000 virtual cash.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPortfolio}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Reset Portfolio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
