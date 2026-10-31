import React, { useState, useMemo } from 'react';
import { generateSalesForecast } from '../utils/forecasting.js';
import { formatCurrency, formatPercent } from '../utils/formatters.js';
import { exportSalesForecastCSV } from '../utils/csvExport.js';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { TrendingUp, Download, AlertTriangle, CheckCircle2, HelpCircle, Settings2 } from 'lucide-react';

export const SalesForecastPage = ({ cleanedRows, metrics }) => {
  const [forecastYears, setForecastYears] = useState(5);
  const [selectedProduct, setSelectedProduct] = useState('ALL');
  const [growthScenarioRate, setGrowthScenarioRate] = useState(10);

  const forecastResult = useMemo(() => {
    if (!cleanedRows || cleanedRows.length === 0) return null;
    return generateSalesForecast({
      cleanedRows,
      yearsToForecast: forecastYears,
      selectedProduct,
      hypotheticalGrowthRate: metrics?.hasHistoricalDates ? null : growthScenarioRate
    });
  }, [cleanedRows, forecastYears, selectedProduct, growthScenarioRate, metrics]);

  if (!cleanedRows || cleanedRows.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>No Dataset Loaded for Forecasting</h2>
        <p style={{ marginTop: '0.5rem' }}>Upload a CSV file to generate 5-year and 7-year future sales projections.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>5-Year & 7-Year Predictive Sales Forecasting</h1>
          <p>Statistical extrapolation and trend modeling of future retail revenue in Indian Rupees (₹).</p>
        </div>

        {forecastResult && (
          <button className="btn btn-primary" onClick={() => exportSalesForecastCSV(forecastResult)}>
            <Download size={16} />
            Export Forecast CSV
          </button>
        )}
      </div>

      {/* Control Panel Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Forecast Horizon:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`btn ${forecastYears === 5 ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 0.85rem' }}
                onClick={() => setForecastYears(5)}
              >
                5-Year Forecast
              </button>
              <button
                className={`btn ${forecastYears === 7 ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 0.85rem' }}
                onClick={() => setForecastYears(7)}
              >
                7-Year Forecast
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Product Scope:
            </label>
            <select
              className="select-input"
              style={{ width: '220px', padding: '0.45rem 0.75rem' }}
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="ALL">Entire Retail Portfolio (All Products)</option>
              {metrics?.productSummaries.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {!metrics?.hasHistoricalDates && (
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-orange)', display: 'block', marginBottom: '0.35rem' }}>
                Scenario Growth Rate (%/yr):
              </label>
              <select
                className="select-input"
                style={{ width: '150px', padding: '0.45rem 0.75rem' }}
                value={growthScenarioRate}
                onChange={(e) => setGrowthScenarioRate(Number(e.target.value))}
              >
                <option value={5}>5% Growth</option>
                <option value={8}>8% Growth</option>
                <option value={10}>10% Growth</option>
                <option value={12}>12% Growth</option>
                <option value={15}>15% Growth</option>
              </select>
            </div>
          )}
        </div>

        {forecastResult && (
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Projected Growth (CAGR)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                {formatPercent(forecastResult.cagr)} / yr
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{forecastYears}-Year Target Revenue</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                {formatCurrency(forecastResult.forecastTable[forecastResult.forecastTable.length - 1].forecastRevenue)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Model Transparency & Diagnostics Notice */}
      {forecastResult && (
        <div
          style={{
            backgroundColor: forecastResult.isDataDriven ? '#f0fdf4' : '#fff7ed',
            border: `1px solid ${forecastResult.isDataDriven ? '#bbf7d0' : '#fed7aa'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem'
          }}
        >
          {forecastResult.isDataDriven ? (
            <CheckCircle2 size={24} color="var(--accent-green)" style={{ marginTop: '2px', flexShrink: 0 }} />
          ) : (
            <AlertTriangle size={24} color="var(--accent-orange)" style={{ marginTop: '2px', flexShrink: 0 }} />
          )}

          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: forecastResult.isDataDriven ? '#166534' : '#9a3412', marginBottom: '0.25rem' }}>
              Forecasting Model: {forecastResult.methodName}
            </h4>
            <p style={{ fontSize: '0.88rem', color: forecastResult.isDataDriven ? '#15803d' : '#c2410c' }}>
              {forecastResult.limitationsNote}
            </p>
            {forecastResult.isDataDriven && (
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.82rem', fontWeight: 600 }}>
                <span>Historical Observations: {forecastResult.historicalObservationsCount} records</span>
                <span>Time Horizon: {forecastResult.historicalYearsCount} years</span>
                <span>R-Squared (Fit Score): {forecastResult.rSquared}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Forecast Chart */}
      {forecastResult && (
        <div className="chart-card" style={{ marginBottom: '2rem' }}>
          <div className="chart-header">
            <div className="chart-title-box">
              <h3>Historical Revenue vs. {forecastYears}-Year Future Projection</h3>
              <p>Solid blue line represents historical empirical actuals; dashed orange line represents model forecast.</p>
            </div>
          </div>
          <div className="chart-container" style={{ height: '380px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastResult.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actualRevenue"
                  name="Historical Actual Revenue (₹)"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 6 }}
                />
                <Area
                  type="monotone"
                  dataKey="forecastRevenue"
                  name="Projected Future Revenue (₹)"
                  stroke="#ea580c"
                  strokeWidth={3}
                  strokeDasharray="6 6"
                  fillOpacity={1}
                  fill="url(#colorForecast)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Annual Breakdown Forecast Table */}
      {forecastResult && (
        <div className="table-container">
          <div className="table-header-bar">
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
              {forecastYears}-Year Forecast Projection Table (INR ₹)
            </h3>
            <button className="btn btn-secondary" onClick={() => exportSalesForecastCSV(forecastResult)}>
              <Download size={14} />
              Export Table to CSV
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Forecast Period</th>
                  <th>Year</th>
                  <th style={{ textAlign: 'right' }}>Projected Revenue (₹)</th>
                  <th style={{ textAlign: 'right' }}>Lower Bound (Confidence Range)</th>
                  <th style={{ textAlign: 'right' }}>Upper Bound (Confidence Range)</th>
                </tr>
              </thead>
              <tbody>
                {forecastResult.forecastTable.map((row, idx) => (
                  <tr key={idx}>
                    <td><strong>{row.forecastYear}</strong></td>
                    <td>{row.year}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-orange)' }}>
                      {formatCurrency(row.forecastRevenue)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {formatCurrency(row.lowerBound)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {formatCurrency(row.upperBound)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
