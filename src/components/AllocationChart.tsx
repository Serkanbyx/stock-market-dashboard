import { memo, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppSelector } from '../store/hooks';

// Color palette for chart segments
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
];

interface AllocationData {
  name: string;
  symbol: string;
  value: number;
  percentage: number;
}

/**
 * Allocation Chart Component
 * Displays portfolio allocation as a pie chart
 */
export const AllocationChart = memo(function AllocationChart() {
  const { holdings, currentPrices, cashBalance } = useAppSelector(
    (state) => state.portfolio
  );

  // Calculate allocation data
  const { chartData, totalValue } = useMemo(() => {
    // Calculate market value for each holding
    const holdingValues = holdings.map((holding) => {
      const currentPrice = currentPrices[holding.symbol] || holding.averageCost;
      const marketValue = currentPrice * holding.shares;
      return {
        name: holding.name,
        symbol: holding.symbol,
        value: marketValue,
      };
    });

    // Calculate total (holdings + cash)
    const holdingsTotal = holdingValues.reduce((sum, h) => sum + h.value, 0);
    const total = holdingsTotal + cashBalance;

    // Build chart data with percentages
    const data: AllocationData[] = holdingValues.map((h) => ({
      ...h,
      percentage: total > 0 ? (h.value / total) * 100 : 0,
    }));

    // Add cash as a segment if significant
    if (cashBalance > 0) {
      data.push({
        name: 'Cash',
        symbol: 'CASH',
        value: cashBalance,
        percentage: total > 0 ? (cashBalance / total) * 100 : 0,
      });
    }

    // Sort by value descending
    data.sort((a, b) => b.value - a.value);

    return { chartData: data, totalValue: total };
  }, [holdings, currentPrices, cashBalance]);

  if (chartData.length === 0 || (chartData.length === 1 && chartData[0].symbol === 'CASH')) {
    return (
      <div className="bg-card rounded-xl p-6 h-full">
        <h3 className="text-lg font-semibold text-white mb-4">Portfolio Allocation</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
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
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
            <p className="text-slate-400 mb-2">No allocation data</p>
            <p className="text-slate-500 text-sm">
              Buy some stocks to see your portfolio distribution
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 h-full">
      <h3 className="text-lg font-semibold text-white mb-4">Portfolio Allocation</h3>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.symbol}`}
                  fill={entry.symbol === 'CASH' ? '#64748b' : COLORS[index % COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
        {chartData.map((item, index) => (
          <div key={item.symbol} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    item.symbol === 'CASH' ? '#64748b' : COLORS[index % COLORS.length],
                }}
              />
              <span className="text-slate-300">
                {item.symbol}
                {item.symbol !== 'CASH' && (
                  <span className="text-slate-500 ml-1 text-xs">
                    {item.name.slice(0, 15)}
                    {item.name.length > 15 && '...'}
                  </span>
                )}
              </span>
            </div>
            <div className="text-right">
              <span className="text-white font-medium">
                {item.percentage.toFixed(1)}%
              </span>
              <span className="text-slate-500 ml-2">
                ${item.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">Total Value</span>
          <span className="text-white font-semibold">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
});

/**
 * Custom Tooltip Component
 */
interface TooltipPayload {
  name: string;
  symbol: string;
  value: number;
  percentage: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TooltipPayload }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
      <p className="font-semibold text-white">{data.symbol}</p>
      <p className="text-slate-400 text-sm">{data.name}</p>
      <div className="mt-2 pt-2 border-t border-slate-600">
        <p className="text-white">
          ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-slate-400 text-sm">{data.percentage.toFixed(2)}% of portfolio</p>
      </div>
    </div>
  );
};
