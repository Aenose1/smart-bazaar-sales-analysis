import React, { useState, useMemo } from 'react';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters.js';
import { generateSalesForecast } from '../utils/forecasting.js';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ShoppingBag, Tag, IndianRupee, Layers, TrendingUp, Search } from 'lucide-react';

export const ProductAnalysisPage = ({ metrics, cleanedRows }) => {
  const [selectedProduct, setSelectedProduct] = useState('');

  const productList = useMemo(() => {
    if (!metrics) return [];
    return metrics.productSummaries;
  }, [metrics]);

  const activeProductName = selectedProduct || (productList.length > 0 ? productList[0].name : '');

  const productInfo = useMemo(() => {
    return productList.find(p => p.name === activeProductName) || null;
  }, [productList, activeProductName]);

  // Product specific historical monthly trends
  const productMonthlyTrends = useMemo(() => {
    if (!cleanedRows || !activeProductName) return [];

    const monthMap = new Map();
    cleanedRows
      .filter(r => r.productName === activeProductName && r.date !== null)
      .forEach(r => {
        const ym = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(ym, (monthMap.get(ym) || 0) + r.revenue);
      });

    return Array.from(monthMap.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [cleanedRows, activeProductName]);

  // Product specific forecast
  const productForecast = useMemo(() => {
    if (!cleanedRows || !activeProductName) return null;
    return generateSalesForecast({
      cleanedRows,
      yearsToForecast: 5,
      selectedProduct: activeProductName
    });
  }, [cleanedRows, activeProductName]);

  if (!metrics || productList.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>No Product Data</h2>
        <p style={{ marginTop: '0.5rem' }}>Upload a dataset to view individual product deep-dive metrics.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Product Performance Deep-Dive</h1>
          <p>Analyze individual product pricing, revenue contribution, historical trends, and future demand forecast.</p>
        </div>

        {/* Product Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Search size={18} color="var(--accent-blue)" />
          <select
            className="select-input"
            style={{ width: '280px', padding: '0.55rem 0.85rem', fontWeight: 600 }}
            value={activeProductName}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            {productList.map(p => (
              <option key={p.name} value={p.name}>
                {p.name} ({formatCurrency(p.totalRevenue)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {productInfo && (
        <>
          {/* Top Product Stats Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Average Selling Price</span>
                <div className="kpi-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <Tag size={20} />
                </div>
              </div>
              <div className="kpi-value">{formatCurrency(productInfo.avgPrice)}</div>
              <div className="kpi-footer">Unit price in INR</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Total Units Sold</span>
                <div className="kpi-icon-box" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                  <ShoppingBag size={20} />
                </div>
              </div>
              <div className="kpi-value">{formatNumber(productInfo.totalQuantity)}</div>
              <div className="kpi-footer">Cumulative quantity sold</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Total Product Revenue</span>
                <div className="kpi-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <IndianRupee size={20} />
                </div>
              </div>
              <div className="kpi-value">{formatCurrency(productInfo.totalRevenue)}</div>
              <div className="kpi-footer">Total gross sales revenue</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Revenue Contribution</span>
                <div className="kpi-icon-box" style={{ background: '#fff7ed', color: '#ea580c' }}>
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="kpi-value">{formatPercent(productInfo.revenueContribution)}</div>
              <div className="kpi-footer">Share of store turnover</div>
            </div>
          </div>

          {/* Product Trend & Forecast Charts */}
          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-title-box">
                  <h3>Historical Monthly Trend: {activeProductName}</h3>
                  <p>Month-on-month revenue generated by this product</p>
                </div>
              </div>
              <div className="chart-container">
                {productMonthlyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={productMonthlyTrends} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `₹${v}`} />
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                      <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    No dated historical observations found for this product.
                  </div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-title-box">
                  <h3>5-Year Revenue Forecast: {activeProductName}</h3>
                  <p>{productForecast?.isDataDriven ? 'Linear regression time-series extrapolation' : 'Scenario projection'}</p>
                </div>
              </div>
              <div className="chart-container">
                {productForecast ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={productForecast.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(v) => `₹${v}`} />
                      <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                      <Line type="monotone" dataKey="actualRevenue" name="Actual Sales (₹)" stroke="#2563eb" strokeWidth={3} />
                      <Line type="monotone" dataKey="forecastRevenue" name="Forecast Sales (₹)" stroke="#ea580c" strokeWidth={3} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
