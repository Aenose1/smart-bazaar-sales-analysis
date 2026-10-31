import React from 'react';
import { KPICard } from '../components/KPICard.jsx';
import { formatCurrency, formatNumber } from '../utils/formatters.js';
import { 
  IndianRupee, 
  ShoppingBag, 
  Package, 
  Tag, 
  Trophy, 
  Sparkles, 
  ShoppingCart, 
  TrendingUp,
  Database,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const OverviewPage = ({ metrics, cleaningSummary, isSample, onNavigate, successMessage }) => {
  if (!metrics) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>No Dataset Loaded</h2>
        <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          Please upload a sales CSV file or load the sample Indian retail dataset to view analytics.
        </p>
        <button className="btn btn-primary" onClick={() => onNavigate('upload')}>
          Upload Dataset Now
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Executive Retail Sales Overview</h1>
        <p>Key performance statistics and summary metrics derived from your uploaded dataset.</p>
      </div>

      {successMessage && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-md)',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}
        >
          <CheckCircle2 size={20} color="#16a34a" />
          <div style={{ fontWeight: 600 }}>{successMessage}</div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="kpi-grid">
        <KPICard
          title="Total Sales Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          subtitle="Cumulative sales turnover (INR)"
          icon={IndianRupee}
          growth={metrics.salesGrowth}
          colorScheme="blue"
        />

        <KPICard
          title="Total Units Sold"
          value={formatNumber(metrics.totalUnits)}
          subtitle="Total product items sold"
          icon={ShoppingBag}
          colorScheme="purple"
        />

        <KPICard
          title="Unique Products"
          value={formatNumber(metrics.uniqueProductsCount)}
          subtitle="Distinct active catalog items"
          icon={Package}
          colorScheme="teal"
        />

        <KPICard
          title="Average Selling Price"
          value={formatCurrency(metrics.avgUnitPrice)}
          subtitle="Mean unit price across orders"
          icon={Tag}
          colorScheme="green"
        />

        <KPICard
          title="Best-Selling Product"
          value={metrics.bestSellingProduct.name}
          subtitle={`${formatNumber(metrics.bestSellingProduct.quantity)} units sold`}
          icon={Trophy}
          colorScheme="orange"
        />

        <KPICard
          title="Highest-Revenue Product"
          value={metrics.highestRevenueProduct.name}
          subtitle={formatCurrency(metrics.highestRevenueProduct.revenue)}
          icon={Sparkles}
          colorScheme="pink"
        />

        <KPICard
          title="Average Order Value"
          value={formatCurrency(metrics.avgOrderValue)}
          subtitle="Mean revenue generated per order"
          icon={ShoppingCart}
          colorScheme="blue"
        />

        <KPICard
          title="Sales Growth Rate"
          value={metrics.salesGrowth !== null ? `${metrics.salesGrowth.toFixed(1)}%` : 'N/A'}
          subtitle={metrics.salesGrowth !== null ? 'YoY / Period comparison' : 'Requires multi-period dates'}
          icon={TrendingUp}
          growth={metrics.salesGrowth}
          colorScheme="purple"
        />
      </div>

      {/* Dataset State & Diagnostics Summary */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database color="var(--accent-blue)" size={20} />
            Dataset Health & Summary Diagnostics
          </h3>
          <span className={`badge ${isSample ? 'badge-purple' : 'badge-success'}`}>
            {isSample ? 'Demonstration Dataset' : 'Custom Uploaded CSV'}
          </span>
        </div>

        {cleaningSummary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Valid Analyzed Records</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                {formatNumber(cleaningSummary.validRowsCount)} / {formatNumber(cleaningSummary.totalInputRows)}
              </div>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Time Series Coverage</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: cleaningSummary.hasDates ? 'var(--accent-blue)' : 'var(--accent-orange)' }}>
                {cleaningSummary.hasDates ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={16} /> Dated Transactions
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertTriangle size={16} /> No Dates Found
                  </span>
                )}
              </div>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Categorization Status</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: cleaningSummary.hasCategories ? 'var(--accent-teal)' : 'var(--text-muted)' }}>
                {cleaningSummary.hasCategories ? `${metrics.categorySummaries.length} Categories` : 'Uncategorized'}
              </div>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Calculated Revenues</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                {formatNumber(cleaningSummary.calculatedRevenueCount)} rows
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn btn-primary" onClick={() => onNavigate('dashboard')}>
            Explore Sales Dashboard
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('forecast')}>
            View 5-Year / 7-Year Forecast
          </button>
        </div>
      </div>
    </div>
  );
};
