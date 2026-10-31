/**
 * Computes comprehensive retail metrics from cleaned sales data.
 */
export const computeSalesMetrics = (cleanedRows) => {
  if (!cleanedRows || cleanedRows.length === 0) {
    return {
      totalRevenue: 0,
      totalUnits: 0,
      uniqueProductsCount: 0,
      avgUnitPrice: 0,
      bestSellingProduct: { name: 'N/A', quantity: 0 },
      highestRevenueProduct: { name: 'N/A', revenue: 0 },
      avgOrderValue: 0,
      salesGrowth: null,
      productSummaries: [],
      categorySummaries: [],
      regionalSummaries: [],
      monthlyTrends: [],
      annualTrends: [],
      hasHistoricalDates: false
    };
  }

  // 1. Core KPIs
  let totalRevenue = 0;
  let totalUnits = 0;
  let totalPricesSum = 0;
  let priceCount = 0;

  const productMap = new Map();
  const categoryMap = new Map();
  const regionMap = new Map();
  const orderMap = new Map();
  const monthMap = new Map();
  const yearMap = new Map();

  cleanedRows.forEach(row => {
    totalRevenue += row.revenue;
    totalUnits += row.quantity;

    if (row.price > 0) {
      totalPricesSum += row.price;
      priceCount++;
    }

    // Product aggregation
    const pName = row.productName;
    if (!productMap.has(pName)) {
      productMap.set(pName, {
        name: pName,
        category: row.category,
        totalRevenue: 0,
        totalQuantity: 0,
        orderCount: 0,
        prices: []
      });
    }
    const pStats = productMap.get(pName);
    pStats.totalRevenue += row.revenue;
    pStats.totalQuantity += row.quantity;
    pStats.orderCount += 1;
    if (row.price > 0) pStats.prices.push(row.price);

    // Category aggregation
    const cName = row.category || 'General';
    if (!categoryMap.has(cName)) {
      categoryMap.set(cName, { category: cName, totalRevenue: 0, totalQuantity: 0, count: 0 });
    }
    const cStats = categoryMap.get(cName);
    cStats.totalRevenue += row.revenue;
    cStats.totalQuantity += row.quantity;
    cStats.count += 1;

    // Region aggregation
    const rName = row.region || 'Unspecified';
    if (!regionMap.has(rName)) {
      regionMap.set(rName, { region: rName, totalRevenue: 0, totalQuantity: 0 });
    }
    const rStats = regionMap.get(rName);
    rStats.totalRevenue += row.revenue;
    rStats.totalQuantity += row.quantity;

    // Order ID aggregation
    const oId = row.orderId;
    if (oId) {
      orderMap.set(oId, (orderMap.get(oId) || 0) + row.revenue);
    }

    // Date aggregation
    if (row.date) {
      const year = row.date.getFullYear();
      const month = `${year}-${String(row.date.getMonth() + 1).padStart(2, '0')}`;

      // Monthly
      if (!monthMap.has(month)) {
        monthMap.set(month, { month, year, revenue: 0, quantity: 0, count: 0 });
      }
      const mStats = monthMap.get(month);
      mStats.revenue += row.revenue;
      mStats.quantity += row.quantity;
      mStats.count += 1;

      // Annual
      if (!yearMap.has(year)) {
        yearMap.set(year, { year, revenue: 0, quantity: 0, count: 0 });
      }
      const yStats = yearMap.get(year);
      yStats.revenue += row.revenue;
      yStats.quantity += row.quantity;
      yStats.count += 1;
    }
  });

  // Unique Products & Average Unit Price
  const uniqueProductsCount = productMap.size;
  const avgUnitPrice = priceCount > 0 ? totalPricesSum / priceCount : 0;

  // Best-Selling & Highest Revenue Products
  let bestSellingProduct = { name: 'N/A', quantity: 0 };
  let highestRevenueProduct = { name: 'N/A', revenue: 0 };

  const productSummaries = Array.from(productMap.values()).map(p => {
    const avgPrice = p.prices.length > 0 ? p.prices.reduce((a, b) => a + b, 0) / p.prices.length : 0;
    const revenueContribution = totalRevenue > 0 ? (p.totalRevenue / totalRevenue) * 100 : 0;

    if (p.totalQuantity > bestSellingProduct.quantity) {
      bestSellingProduct = { name: p.name, quantity: p.totalQuantity, revenue: p.totalRevenue };
    }
    if (p.totalRevenue > highestRevenueProduct.revenue) {
      highestRevenueProduct = { name: p.name, revenue: p.totalRevenue, quantity: p.totalQuantity };
    }

    return {
      name: p.name,
      category: p.category,
      totalRevenue: p.totalRevenue,
      totalQuantity: p.totalQuantity,
      orderCount: p.orderCount,
      avgPrice,
      revenueContribution
    };
  });

  // Sort summaries
  productSummaries.sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Category Summaries
  const categorySummaries = Array.from(categoryMap.values()).map(c => ({
    ...c,
    percentage: totalRevenue > 0 ? (c.totalRevenue / totalRevenue) * 100 : 0
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Regional Summaries
  const regionalSummaries = Array.from(regionMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Average Order Value
  let avgOrderValue = 0;
  if (orderMap.size > 0) {
    const totalOrderRevenues = Array.from(orderMap.values()).reduce((a, b) => a + b, 0);
    avgOrderValue = totalOrderRevenues / orderMap.size;
  }

  // Monthly trends sorted chronologically
  const monthlyTrends = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  // Annual trends & Growth calculation
  const annualTrends = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  
  let salesGrowth = null;
  if (annualTrends.length >= 2) {
    const latestYear = annualTrends[annualTrends.length - 1];
    const prevYear = annualTrends[annualTrends.length - 2];
    if (prevYear.revenue > 0) {
      salesGrowth = ((latestYear.revenue - prevYear.revenue) / prevYear.revenue) * 100;
    }
  } else if (monthlyTrends.length >= 2) {
    const latestMonth = monthlyTrends[monthlyTrends.length - 1];
    const prevMonth = monthlyTrends[monthlyTrends.length - 2];
    if (prevMonth.revenue > 0) {
      salesGrowth = ((latestMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100;
    }
  }

  return {
    totalRevenue,
    totalUnits,
    uniqueProductsCount,
    avgUnitPrice,
    bestSellingProduct,
    highestRevenueProduct,
    avgOrderValue,
    salesGrowth,
    productSummaries,
    categorySummaries,
    regionalSummaries,
    monthlyTrends,
    annualTrends,
    hasHistoricalDates: monthlyTrends.length > 0
  };
};
