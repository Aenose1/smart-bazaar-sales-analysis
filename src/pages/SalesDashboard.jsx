import React, { useState, useMemo } from 'react';
import { ChartCard } from '../components/ChartCard.jsx';
import { formatCurrency, formatCompactINR, formatNumber } from '../utils/formatters.js';
import { generateSalesForecast } from '../utils/forecasting.js';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, ScatterChart as ScatterIcon, Layers } from 'lucide-react';

const COLOR_PALETTE = ['#2563eb', '#7c3aed', '#0d9488', '#ea580c', '#db2777', '#16a34a', '#eab308', '#0284c7'];

export const SalesDashboardPage = ({ metrics, cleanedRows }) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [comparedProducts, setComparedProducts] = useState([]);

  // Generate default comparison products if empty
  const availableProducts = useMemo(() => {
    if (!metrics) return [];
    return metrics.productSummaries.map(p => p.name);
  }, [metrics]);

  const activeCompareProducts = useMemo(() => {
    if (comparedProducts.length > 0) return comparedProducts;
    return availableProducts.slice(0, 4);
  }, [comparedProducts, availableProducts]);

  // Compute filtered metrics
  const activeRows = useMemo(() => {
    if (!cleanedRows) return [];
    if (selectedCategoryFilter === 'ALL') return cleanedRows;
    return cleanedRows.filter(r => r.category === selectedCategoryFilter);
  }, [cleanedRows, selectedCategoryFilter]);

  // Forecast data for Chart 5
  const forecastResult = useMemo(() => {
    if (!cleanedRows) return null;
    return generateSalesForecast({ cleanedRows: activeRows, yearsToForecast: 5 });
  }, [activeRows]);

  if (!metrics || metrics.productSummaries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>No Sales Data Available</h2>
        <p style={{ marginTop: '0.5rem' }}>Please upload a valid sales CSV file to view interactive charts.</p>
      </div>
    );
  }

  // Top 10 by Revenue
  const top10Revenue = metrics.productSummaries.slice(0, 10);
  // Top 10 by Quantity
  const top10Quantity = [...metrics.productSummaries].sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 10);

  // Scatter plot data
  const scatterData = metrics.productSummaries.map(p => ({
    name: p.name,
    price: p.avgPrice,
    quantity: p.totalQuantity,
    revenue: p.totalRevenue
  }));

  // Comparison chart data
  const compareData = activeCompareProducts.map(pName => {
    const item = metrics.productSummaries.find(p => p.name === pName);
    return {
      name: pName,
      revenue: item ? item.totalRevenue : 0,
      quantity: item ? item.totalQuantity : 0,
      avgPrice: item ? item.avgPrice : 0
    };
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Interactive Sales Analytics Dashboard</h1>
          <p>Comprehensive visual breakdown of retail product performance, historical trends, and revenue distribution.</p>
        </div>

        {/* Category Filter */}
        {metrics.categorySummaries.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Category Filter:</span>
            <select
              className="select-input"
              style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories ({metrics.categorySummaries.length})</option>
              {metrics.categorySummaries.map(c => (
                <option key={c.category} value={c.category}>{c.category}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid of 8 Visualizations */}
      <div className="charts-grid">
        
        {/* Chart 1: Top Products by Revenue */}
        <ChartCard
          title="Chart 1: Top Products by Revenue (INR)"
          subtitle="Top 10 performing products ranked by total revenue contribution"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={top10Revenue} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={formatCompactINR} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [formatCurrency(value), 'Revenue']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
              <Bar dataKey="totalRevenue" fill="#2563eb" radius={[0, 4, 4, 0]}>
                {top10Revenue.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 2: Top Products by Quantity */}
        <ChartCard
          title="Chart 2: Top Products by Units Sold"
          subtitle="Top 10 products ranked by cumulative volume sold"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top10Quantity} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip
                formatter={(value) => [formatNumber(value) + ' units', 'Quantity Sold']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
              <Bar dataKey="totalQuantity" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 3: Monthly Sales Trend */}
        <ChartCard
          title="Chart 3: Monthly Revenue Trend (INR)"
          subtitle="Historical month-on-month sales turnover"
        >
          {metrics.hasHistoricalDates ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.monthlyTrends} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatCompactINR} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Monthly Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#0d9488" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              No dated transaction observations found in CSV to plot monthly trend.
            </div>
          )}
        </ChartCard>

        {/* Chart 4: Category-Wise Revenue */}
        <ChartCard
          title="Chart 4: Category-Wise Revenue Share"
          subtitle="Proportional breakdown of total revenue by product department"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={metrics.categorySummaries}
                dataKey="totalRevenue"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={4}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
              >
                {metrics.categorySummaries.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 5: Historical Sales & Future Forecast */}
        <ChartCard
          title="Chart 5: Historical Revenue & 5-Year Forecast"
          subtitle={forecastResult?.isDataDriven ? 'Linear regression projection with uncertainty bounds' : 'Illustrative scenario simulation'}
        >
          {forecastResult ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastResult.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={formatCompactINR} />
                <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actualRevenue"
                  name="Historical Actual Revenue (₹)"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="forecastRevenue"
                  name="5-Year Projected Revenue (₹)"
                  stroke="#ea580c"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>

        {/* Chart 6: Product Price vs Quantity */}
        <ChartCard
          title="Chart 6: Price vs. Quantity Correlation"
          subtitle="Scatter plot analyzing relationship between unit price and sales volume"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis type="number" dataKey="price" name="Unit Price (₹)" unit="₹" tickFormatter={(v) => `₹${v}`} />
              <YAxis type="number" dataKey="quantity" name="Units Sold" unit=" units" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{ background: '#fff', border: '1px solid #ccc', padding: '0.5rem 0.8rem', borderRadius: '6px' }}>
                        <strong>{data.name}</strong>
                        <div>Price: {formatCurrency(data.price)}</div>
                        <div>Quantity: {formatNumber(data.quantity)} units</div>
                        <div>Total Revenue: {formatCurrency(data.revenue)}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Products" data={scatterData} fill="#db2777" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 7: Product Comparison */}
        <ChartCard
          title="Chart 7: Multi-Product Direct Comparison"
          subtitle="Side-by-side revenue performance across selected products"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compareData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatCompactINR} />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 8: Year-over-Year Growth */}
        <ChartCard
          title="Chart 8: Annual Revenue & Growth Trajectory"
          subtitle="Comparing annual sales volume across historical years"
        >
          {metrics.annualTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.annualTrends} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={formatCompactINR} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Annual Revenue']} />
                <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              Single-year or non-dated dataset. Multi-year comparison requires multi-year transaction dates.
            </div>
          )}
        </ChartCard>

      </div>
    </div>
  );
};
