import { memo, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { HistoricalDataPoint, TimeRange } from '../types';

interface StockChartProps {
  data: HistoricalDataPoint[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  isLoading?: boolean;
}

const TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'];

/**
 * Stock Price Chart Component
 * Displays historical price data with interactive time range selection
 */
export const StockChart = memo(function StockChart({
  data,
  timeRange,
  onTimeRangeChange,
  isLoading = false,
}: StockChartProps) {
  // Calculate chart data and statistics
  const { chartData, stats } = useMemo(() => {
    if (data.length === 0) {
      return { chartData: [], stats: null };
    }

    const chartData = data.map((point) => ({
      date: formatDate(point.date, timeRange),
      price: point.close,
      fullDate: point.date,
    }));

    const prices = data.map((p) => p.close);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;

    return {
      chartData,
      stats: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((a, b) => a + b, 0) / prices.length,
        change,
        changePercent,
        isPositive: change >= 0,
      },
    };
  }, [data, timeRange]);

  // Determine chart color based on price change
  const chartColor = stats?.isPositive ? '#10b981' : '#ef4444';
  const gradientId = stats?.isPositive ? 'colorPositive' : 'colorNegative';

  return (
    <div className="bg-card rounded-xl p-4 lg:p-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Price History</h3>
          {stats && (
            <p className={`text-sm ${stats.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.isPositive ? '+' : ''}
              {stats.change.toFixed(2)} ({stats.changePercent.toFixed(2)}%)
              <span className="text-slate-400 ml-2">for selected period</span>
            </p>
          )}
        </div>

        {/* Time Range Buttons */}
        <div className="flex gap-1 bg-slate-700/50 p-1 rounded-lg">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-md
                transition-all duration-200
                ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-600'
                }
              `}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-[300px] lg:h-[400px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400">Loading chart data...</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-slate-400">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />

              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                domain={['dataMin - 5', 'dataMax + 5']}
                width={60}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: '#64748b',
                  strokeWidth: 1,
                  strokeDasharray: '5 5',
                }}
              />

              {stats && (
                <ReferenceLine
                  y={stats.avg}
                  stroke="#64748b"
                  strokeDasharray="3 3"
                  label={{
                    value: `Avg: $${stats.avg.toFixed(2)}`,
                    position: 'right',
                    fill: '#64748b',
                    fontSize: 10,
                  }}
                />
              )}

              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Statistics */}
      {stats && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="High" value={`$${stats.max.toFixed(2)}`} />
          <StatCard label="Low" value={`$${stats.min.toFixed(2)}`} />
          <StatCard label="Average" value={`$${stats.avg.toFixed(2)}`} />
          <StatCard
            label="Change"
            value={`${stats.isPositive ? '+' : ''}${stats.changePercent.toFixed(2)}%`}
            isPositive={stats.isPositive}
          />
        </div>
      )}
    </div>
  );
});

/**
 * Custom Tooltip Component for the Chart
 */
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { fullDate: string } }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0];
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{data.payload.fullDate}</p>
      <p className="text-white font-semibold">${data.value.toFixed(2)}</p>
    </div>
  );
};

/**
 * Stat Card Component for displaying chart statistics
 */
interface StatCardProps {
  label: string;
  value: string;
  isPositive?: boolean;
}

const StatCard = memo(function StatCard({ label, value, isPositive }: StatCardProps) {
  return (
    <div className="bg-slate-700/30 rounded-lg p-3">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p
        className={`font-semibold ${
          isPositive !== undefined
            ? isPositive
              ? 'text-emerald-400'
              : 'text-red-400'
            : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
});

/**
 * Format date based on time range
 */
function formatDate(dateString: string, timeRange: TimeRange): string {
  const date = new Date(dateString);
  
  switch (timeRange) {
    case '1D':
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case '1W':
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    case '1M':
    case '3M':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case '6M':
    case '1Y':
      return date.toLocaleDateString('en-US', { month: 'short' });
    case '5Y':
      return date.toLocaleDateString('en-US', { year: 'numeric' });
    default:
      return dateString;
  }
}
