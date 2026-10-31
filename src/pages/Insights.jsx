import React, { useMemo } from 'react';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters.js';
import { Lightbulb, TrendingUp, AlertCircle, ShoppingBag, Target, ArrowRight } from 'lucide-react';

export const InsightsPage = ({ metrics }) => {
  const insights = useMemo(() => {
    if (!metrics || metrics.productSummaries.length === 0) return [];

    const list = [];
    const topRevenueProd = metrics.highestRevenueProduct;
    const topVolumeProd = metrics.bestSellingProduct;
    const topCategory = metrics.categorySummaries.length > 0 ? metrics.categorySummaries[0] : null;

    // Insight 1: Top Revenue Contributor
    if (topRevenueProd && topRevenueProd.revenue > 0) {
      const pSummary = metrics.productSummaries.find(p => p.name === topRevenueProd.name);
      list.push({
        id: 1,
        title: `Primary Revenue Anchor: ${topRevenueProd.name}`,
        type: 'revenue',
        observedFact: `${topRevenueProd.name} is your highest grossing product, generating ${formatCurrency(topRevenueProd.revenue)} in sales revenue (${pSummary ? pSummary.revenueContribution.toFixed(1) : '0'}% of total store turnover).`,
        recommendation: `Ensure robust supply chain stock levels for ${topRevenueProd.name} to avoid out-of-stock revenue loss. Consider creating promotional bundle packs with complementary accessories.`
      });
    }

    // Insight 2: Volume Driver vs Price Margin
    if (topVolumeProd && topVolumeProd.quantity > 0) {
      list.push({
        id: 2,
        title: `Highest Sales Volume Driver: ${topVolumeProd.name}`,
        type: 'volume',
        observedFact: `${topVolumeProd.name} leads in units sold with ${formatNumber(topVolumeProd.quantity)} total units purchased across customer orders.`,
        recommendation: `Leverage high customer traction on ${topVolumeProd.name} for loss-leader placement near store entrances or checkout pages to drive basket size for higher-margin goods.`
      });
    }

    // Insight 3: Category Dominance
    if (topCategory) {
      list.push({
        id: 3,
        title: `Dominant Product Category: ${topCategory.category}`,
        type: 'category',
        observedFact: `The ${topCategory.category} department generates ${formatCurrency(topCategory.totalRevenue)} (${topCategory.percentage.toFixed(1)}% of total store revenue) with ${formatNumber(topCategory.totalQuantity)} units sold.`,
        recommendation: `Expand inventory depth within ${topCategory.category}. Negotiate volume procurement discounts with suppliers to widen profit margins.`
      });
    }

    // Insight 4: Premium High-Value vs Velocity Analysis
    const highPriceLowQty = metrics.productSummaries.find(p => p.avgPrice > metrics.avgUnitPrice * 1.5 && p.totalQuantity < metrics.totalUnits / metrics.uniqueProductsCount);
    if (highPriceLowQty) {
      list.push({
        id: 4,
        title: `High-Margin Premium Item: ${highPriceLowQty.name}`,
        type: 'pricing',
        observedFact: `${highPriceLowQty.name} sells at a premium price of ${formatCurrency(highPriceLowQty.avgPrice)} (well above store average of ${formatCurrency(metrics.avgUnitPrice)}), contributing ${formatCurrency(highPriceLowQty.totalRevenue)} despite lower volume (${highPriceLowQty.totalQuantity} units).`,
        recommendation: `Target high-income buyer segments with targeted digital marketing campaigns highlighting quality and premium value.`
      });
    }

    // Insight 5: Growth Trajectory
    if (metrics.salesGrowth !== null) {
      const isPositive = metrics.salesGrowth >= 0;
      list.push({
        id: 5,
        title: `Overall Sales Growth Trajectory (${metrics.salesGrowth.toFixed(1)}%)`,
        type: isPositive ? 'growth' : 'warning',
        observedFact: `Store sales turnover shows a ${isPositive ? 'positive increase' : 'decline'} of ${metrics.salesGrowth.toFixed(1)}% compared to prior baseline historical periods.`,
        recommendation: isPositive 
          ? `Capitalize on positive momentum by re-investing surplus cash flow into seasonal marketing campaigns and inventory expansion.`
          : `Audit slow-moving inventory items, run clearance sales on lagging products, and optimize pricing to revitalize demand.`
      });
    }

    return list;
  }, [metrics]);

  if (!metrics || insights.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>No Insights Available</h2>
        <p style={{ marginTop: '0.5rem' }}>Upload a retail dataset to generate automated business intelligence.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Automated Business Insights & Strategic Recommendations</h1>
        <p>Data-driven findings synthesized from actual sales records, product margins, and volume velocity.</p>
      </div>

      <div style={{ display: 'grid', gap: '1.25rem' }}>
        {insights.map(item => (
          <div
            key={item.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-md)',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Lightbulb size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{item.title}</h3>
            </div>

            <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                Observed Empirical Fact:
              </strong>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{item.observedFact}</p>
            </div>

            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0' }}>
              <strong style={{ fontSize: '0.85rem', color: '#166534', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                <Target size={14} /> Actionable Business Recommendation:
              </strong>
              <p style={{ color: '#15803d', fontSize: '0.95rem', fontWeight: 500 }}>{item.recommendation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
