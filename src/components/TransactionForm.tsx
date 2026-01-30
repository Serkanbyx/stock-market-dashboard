import { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { executeBuyOrder, executeSellOrder, clearError } from '../store/slices/portfolioSlice';
import { stockApi } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import type { PortfolioHolding, SearchResult } from '../types';

// Popular stocks for quick selection
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc' },
  { symbol: 'AMZN', name: 'Amazon.com Inc' },
  { symbol: 'TSLA', name: 'Tesla Inc' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'META', name: 'Meta Platforms Inc' },
  { symbol: 'NFLX', name: 'Netflix Inc' },
];

// Form validation schema
const transactionSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(10, 'Symbol too long'),
  shares: z.number().min(1, 'Minimum 1 share required').max(100000, 'Maximum 100,000 shares'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'buy' | 'sell';
  prefilledHolding?: PortfolioHolding | null;
}

/**
 * Transaction Form Modal Component
 * Modal for buying and selling stocks with quick-pick and auto-fetch features
 */
export const TransactionForm = memo(function TransactionForm({
  isOpen,
  onClose,
  mode,
  prefilledHolding,
}: TransactionFormProps) {
  const dispatch = useAppDispatch();
  const { cashBalance, holdings, status, error } = useAppSelector((state) => state.portfolio);
  
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [stockName, setStockName] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      symbol: prefilledHolding?.symbol || '',
      shares: 1,
    },
  });

  const watchedSymbol = watch('symbol');
  const watchedShares = watch('shares');

  // Debounce symbol input for auto-fetch
  const debouncedSymbol = useDebounce(watchedSymbol, 500);

  // Calculate total cost
  const totalCost = currentPrice ? currentPrice * (watchedShares || 0) : 0;

  // Get max shares for sell mode
  const maxShares = mode === 'sell' && prefilledHolding ? prefilledHolding.shares : 0;

  // Calculate max affordable shares for buy mode
  const maxAffordableShares = useMemo(() => {
    if (!currentPrice || currentPrice <= 0) return 0;
    return Math.floor(cashBalance / currentPrice);
  }, [cashBalance, currentPrice]);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      reset({
        symbol: prefilledHolding?.symbol || '',
        shares: 1,
      });
      setCurrentPrice(null);
      setStockName(prefilledHolding?.name || '');
      setPriceError(null);
      setSelectedSymbol(prefilledHolding?.symbol || '');
      dispatch(clearError());
      
      // If prefilled, fetch the current price
      if (prefilledHolding) {
        fetchPrice(prefilledHolding.symbol);
      }
    }
  }, [isOpen, mode, prefilledHolding, reset, dispatch]);

  // Fetch price for a symbol
  const fetchPrice = useCallback(async (symbol: string) => {
    if (!symbol || symbol.length < 1) {
      setCurrentPrice(null);
      setStockName('');
      return;
    }

    setIsLoadingPrice(true);
    setPriceError(null);

    try {
      const quote = await stockApi.getQuote(symbol.toUpperCase(), true);
      setCurrentPrice(quote.price);
      setStockName(quote.name);
      setSelectedSymbol(symbol.toUpperCase());
    } catch {
      // Try to get just the price
      try {
        const price = await stockApi.getPrice(symbol.toUpperCase(), true);
        if (price > 0) {
          setCurrentPrice(price);
          // Find name from popular stocks or use symbol
          const popular = POPULAR_STOCKS.find(s => s.symbol === symbol.toUpperCase());
          setStockName(popular?.name || symbol.toUpperCase());
          setSelectedSymbol(symbol.toUpperCase());
        } else {
          setPriceError('Invalid symbol');
          setCurrentPrice(null);
        }
      } catch {
        setPriceError('Failed to fetch price');
        setCurrentPrice(null);
      }
    } finally {
      setIsLoadingPrice(false);
    }
  }, []);

  // Auto-fetch price when debounced symbol changes
  useEffect(() => {
    if (mode === 'buy' && debouncedSymbol && debouncedSymbol !== selectedSymbol) {
      fetchPrice(debouncedSymbol);
    }
  }, [debouncedSymbol, mode, selectedSymbol, fetchPrice]);

  // Search symbols as user types + filter from popular stocks
  useEffect(() => {
    if (mode === 'sell') return;

    const searchSymbols = async () => {
      if (!watchedSymbol || watchedSymbol.length < 1) {
        setSearchResults([]);
        return;
      }

      const upperSymbol = watchedSymbol.toUpperCase();
      
      // Filter from popular stocks first (instant)
      const popularMatches = POPULAR_STOCKS
        .filter(s => 
          s.symbol.includes(upperSymbol) || 
          s.name.toLowerCase().includes(watchedSymbol.toLowerCase())
        )
        .map(s => ({
          symbol: s.symbol,
          name: s.name,
          type: 'Common Stock',
          region: 'US',
          currency: 'USD',
        }));

      // Show popular matches immediately
      if (popularMatches.length > 0) {
        setSearchResults(popularMatches);
      }

      // Then fetch from API
      try {
        const apiResults = await stockApi.searchSymbols(watchedSymbol);
        // Merge results, popular first, avoid duplicates
        const symbols = new Set(popularMatches.map(r => r.symbol));
        const merged = [
          ...popularMatches,
          ...apiResults.filter(r => !symbols.has(r.symbol)).slice(0, 5 - popularMatches.length),
        ];
        setSearchResults(merged.slice(0, 6));
      } catch {
        // Keep popular matches if API fails
        if (popularMatches.length === 0) {
          setSearchResults([]);
        }
      }
    };

    const debounce = setTimeout(searchSymbols, 200);
    return () => clearTimeout(debounce);
  }, [watchedSymbol, mode]);

  // Handle popular stock quick-pick
  const handleQuickPick = useCallback((stock: { symbol: string; name: string }) => {
    setValue('symbol', stock.symbol);
    setStockName(stock.name);
    setSelectedSymbol(stock.symbol);
    setShowDropdown(false);
    fetchPrice(stock.symbol);
  }, [setValue, fetchPrice]);

  // Handle symbol selection from dropdown
  const handleSelectSymbol = useCallback((result: SearchResult) => {
    setValue('symbol', result.symbol);
    setStockName(result.name);
    setSelectedSymbol(result.symbol);
    setShowDropdown(false);
    fetchPrice(result.symbol);
  }, [setValue, fetchPrice]);

  // Handle quick share buttons
  const handleQuickShares = useCallback((amount: number | 'max') => {
    if (amount === 'max') {
      const max = mode === 'sell' ? maxShares : maxAffordableShares;
      setValue('shares', Math.max(1, max));
    } else {
      const currentShares = watchedShares || 0;
      const newShares = currentShares + amount;
      const maxAllowed = mode === 'sell' ? maxShares : maxAffordableShares;
      setValue('shares', Math.min(Math.max(1, newShares), maxAllowed || 100000));
    }
  }, [setValue, watchedShares, mode, maxShares, maxAffordableShares]);

  // Handle form submission
  const onSubmit = async (data: TransactionFormData) => {
    try {
      if (mode === 'buy') {
        await dispatch(
          executeBuyOrder({
            symbol: data.symbol.toUpperCase(),
            name: stockName || data.symbol.toUpperCase(),
            shares: data.shares,
          })
        ).unwrap();
      } else {
        await dispatch(
          executeSellOrder({
            symbol: data.symbol.toUpperCase(),
            shares: data.shares,
          })
        ).unwrap();
      }
      onClose();
    } catch {
      // Error is handled by Redux
    }
  };

  // Get holdings for sell mode dropdown
  const availableHoldings = holdings.filter((h) => h.shares > 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            {mode === 'buy' ? 'Buy Stock' : 'Sell Stock'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick Pick Section - Only for Buy Mode */}
        {mode === 'buy' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Quick Pick
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_STOCKS.slice(0, 6).map((stock) => (
                <button
                  key={stock.symbol}
                  type="button"
                  onClick={() => handleQuickPick(stock)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${selectedSymbol === stock.symbol
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white'
                    }
                  `}
                >
                  {stock.symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Symbol Input */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {mode === 'buy' ? 'Or search symbol' : 'Stock Symbol'}
            </label>
            {mode === 'buy' ? (
              <div className="relative">
                <div className="relative">
                  <input
                    {...register('symbol')}
                    type="text"
                    placeholder="Type symbol (e.g., AAPL)"
                    autoComplete="off"
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  />
                  {/* Status Icon */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isLoadingPrice ? (
                      <svg className="w-5 h-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : currentPrice ? (
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : priceError ? (
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : null}
                  </div>
                </div>
                
                {/* Search Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded-lg border border-slate-600 shadow-xl z-20 max-h-48 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.symbol}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectSymbol(result)}
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-600 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-white">{result.symbol}</span>
                          <span className="text-slate-400 text-sm ml-2 truncate">
                            {result.name.length > 20 ? result.name.slice(0, 20) + '...' : result.name}
                          </span>
                        </div>
                        {POPULAR_STOCKS.some(p => p.symbol === result.symbol) && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                            Popular
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <select
                {...register('symbol')}
                onChange={(e) => {
                  const holding = holdings.find((h) => h.symbol === e.target.value);
                  if (holding) {
                    setValue('symbol', holding.symbol);
                    setStockName(holding.name);
                    setSelectedSymbol(holding.symbol);
                    fetchPrice(holding.symbol);
                  }
                }}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a stock to sell</option>
                {availableHoldings.map((holding) => (
                  <option key={holding.symbol} value={holding.symbol}>
                    {holding.symbol} - {holding.shares} shares @ ${holding.averageCost.toFixed(2)}
                  </option>
                ))}
              </select>
            )}
            {errors.symbol && (
              <p className="mt-1 text-sm text-red-400">{errors.symbol.message}</p>
            )}
          </div>

          {/* Stock Info Display */}
          {(stockName || currentPrice) && (
            <div className="p-3 bg-slate-700/30 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{stockName || selectedSymbol}</p>
                {priceError && <p className="text-red-400 text-sm">{priceError}</p>}
              </div>
              {currentPrice && (
                <p className="text-2xl font-bold text-white">
                  ${currentPrice.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Shares Input with Quick Buttons */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Number of Shares
            </label>
            <div className="flex gap-2">
              <input
                {...register('shares', { valueAsNumber: true })}
                type="number"
                min={1}
                max={mode === 'sell' ? maxShares : 100000}
                className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {/* Quick Share Buttons */}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickShares(1)}
                  className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm font-medium transition-colors"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickShares(5)}
                  className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm font-medium transition-colors"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickShares(10)}
                  className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm font-medium transition-colors"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickShares('max')}
                  disabled={!currentPrice}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                >
                  MAX
                </button>
              </div>
            </div>
            {errors.shares && (
              <p className="mt-1 text-sm text-red-400">{errors.shares.message}</p>
            )}
            {mode === 'sell' && maxShares > 0 && (
              <p className="mt-1 text-sm text-slate-400">
                Available: {maxShares} shares
              </p>
            )}
            {mode === 'buy' && currentPrice && maxAffordableShares > 0 && (
              <p className="mt-1 text-sm text-slate-400">
                Max affordable: {maxAffordableShares} shares
              </p>
            )}
          </div>

          {/* Price Summary */}
          <div className="p-4 bg-slate-700/30 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Price per share</span>
              <span className="text-white">
                {currentPrice ? `$${currentPrice.toFixed(2)}` : '-'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Shares</span>
              <span className="text-white">{watchedShares || 0}</span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-slate-600">
              <span className="text-slate-300">Total {mode === 'buy' ? 'Cost' : 'Value'}</span>
              <span className={mode === 'buy' && totalCost > cashBalance ? 'text-red-400' : 'text-white'}>
                ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {mode === 'buy' && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Cash Available</span>
                <span className={totalCost > cashBalance ? 'text-red-400' : 'text-emerald-400'}>
                  ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              status === 'loading' ||
              !currentPrice ||
              isLoadingPrice ||
              (mode === 'buy' && totalCost > cashBalance) ||
              (mode === 'sell' && (watchedShares || 0) > maxShares)
            }
            className={`
              w-full py-3 rounded-lg font-semibold transition-all text-lg
              ${mode === 'buy'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : mode === 'buy' ? (
              `Buy ${watchedShares || 0} Share${(watchedShares || 0) !== 1 ? 's' : ''} for $${totalCost.toFixed(2)}`
            ) : (
              `Sell ${watchedShares || 0} Share${(watchedShares || 0) !== 1 ? 's' : ''} for $${totalCost.toFixed(2)}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
});
