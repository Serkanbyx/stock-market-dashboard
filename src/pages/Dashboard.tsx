import { useCallback, useEffect, useState, memo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToWatchlist, removeFromWatchlist } from '../store/slices/watchlistSlice';
import { fetchTopGainers, fetchTopLosers } from '../store/slices/marketSlice';
import { MarketOverview } from '../components/MarketOverview';
import { Watchlist } from '../components/Watchlist';
import { StockTable } from '../components/StockTable';

/**
 * Dashboard Page
 * Main landing page with market overview, watchlist, and top movers
 */
export const Dashboard = memo(function Dashboard() {
  const dispatch = useAppDispatch();
  const { topGainers, topLosers, status: marketStatus } = useAppSelector(
    (state) => state.market
  );
  const { items: watchlistItems } = useAppSelector((state) => state.watchlist);
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>('gainers');

  // Fetch market data on mount
  useEffect(() => {
    dispatch(fetchTopGainers());
    dispatch(fetchTopLosers());
  }, [dispatch]);

  // Get watchlist symbols for highlighting in table
  const watchlistSymbols = watchlistItems.map((item) => item.symbol);

  // Handle watchlist toggle
  const handleWatchlistToggle = useCallback(
    (symbol: string, name: string) => {
      const isInWatchlist = watchlistSymbols.includes(symbol);
      if (isInWatchlist) {
        dispatch(removeFromWatchlist(symbol));
      } else {
        dispatch(addToWatchlist({ symbol, name }));
      }
    },
    [dispatch, watchlistSymbols]
  );

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Market Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Real-time market data and analysis
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live Data
        </div>
      </div>

      {/* Market Overview */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          Market Indices
        </h2>
        <MarketOverview />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column - Stock Tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('gainers')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${
                  activeTab === 'gainers'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }
              `}
            >
              Top Gainers
            </button>
            <button
              onClick={() => setActiveTab('losers')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${
                  activeTab === 'losers'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }
              `}
            >
              Top Losers
            </button>
          </div>

          {/* Stock Table */}
          <StockTable
            stocks={activeTab === 'gainers' ? topGainers : topLosers}
            title={activeTab === 'gainers' ? 'Top Gainers' : 'Top Losers'}
            isLoading={marketStatus === 'loading'}
            onAddToWatchlist={handleWatchlistToggle}
            watchlistSymbols={watchlistSymbols}
          />

          {/* Popular Stocks Quick Access */}
          <div className="bg-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Popular Stocks
            </h3>
            <div className="flex flex-wrap gap-2">
              {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'].map(
                (symbol) => (
                  <a
                    key={symbol}
                    href={`/stock/${symbol}`}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {symbol}
                  </a>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Watchlist */}
        <div className="space-y-6">
          <Watchlist />

          {/* Market Info Card */}
          <div className="bg-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Market Hours
            </h3>
            <div className="space-y-3">
              <MarketStatusItem
                market="NYSE / NASDAQ"
                status={isMarketOpen() ? 'open' : 'closed'}
                hours="9:30 AM - 4:00 PM ET"
              />
              <MarketStatusItem
                market="Pre-Market"
                status="info"
                hours="4:00 AM - 9:30 AM ET"
              />
              <MarketStatusItem
                market="After-Hours"
                status="info"
                hours="4:00 PM - 8:00 PM ET"
              />
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Quick Tips
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                Search any stock symbol in the search bar above
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                Click the star icon to add stocks to your watchlist
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                Click on any stock to view detailed charts and analysis
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Market Status Item Component
 */
interface MarketStatusItemProps {
  market: string;
  status: 'open' | 'closed' | 'info';
  hours: string;
}

const MarketStatusItem = memo(function MarketStatusItem({
  market,
  status,
  hours,
}: MarketStatusItemProps) {
  const statusColors = {
    open: 'bg-emerald-500',
    closed: 'bg-red-500',
    info: 'bg-slate-500',
  };

  const statusLabels = {
    open: 'Open',
    closed: 'Closed',
    info: '',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
        <span className="text-slate-300">{market}</span>
        {statusLabels[status] && (
          <span
            className={`
              text-xs px-1.5 py-0.5 rounded
              ${status === 'open' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}
            `}
          >
            {statusLabels[status]}
          </span>
        )}
      </div>
      <span className="text-sm text-slate-500">{hours}</span>
    </div>
  );
});

/**
 * Check if US stock market is currently open
 */
function isMarketOpen(): boolean {
  const now = new Date();
  const day = now.getDay();
  
  // Weekend check
  if (day === 0 || day === 6) return false;

  // Convert to ET (rough approximation)
  const etOffset = -5; // EST (doesn't account for DST)
  const utcHours = now.getUTCHours();
  const etHours = (utcHours + etOffset + 24) % 24;
  const minutes = now.getMinutes();
  const totalMinutes = etHours * 60 + minutes;

  // Market hours: 9:30 AM - 4:00 PM ET
  const marketOpen = 9 * 60 + 30;  // 9:30 AM
  const marketClose = 16 * 60;      // 4:00 PM

  return totalMinutes >= marketOpen && totalMinutes < marketClose;
}
