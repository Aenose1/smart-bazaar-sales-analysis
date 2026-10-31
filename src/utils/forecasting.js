/**
 * Linear Regression Helper to compute slope (m), intercept (c), and R-squared.
 */
export const calculateLinearRegression = (dataPoints) => {
  const n = dataPoints.length;
  if (n === 0) return { slope: 0, intercept: 0, rSquared: 0, stdError: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
  
  dataPoints.forEach(pt => {
    sumX += pt.x;
    sumY += pt.y;
    sumXY += pt.x * pt.y;
    sumXX += pt.x * pt.x;
    sumYY += pt.y * pt.y;
  });

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n, rSquared: 0, stdError: 0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared & Standard Error
  const yMean = sumY / n;
  let ssTot = 0;
  let ssRes = 0;

  dataPoints.forEach(pt => {
    const yPred = slope * pt.x + intercept;
    ssTot += Math.pow(pt.y - yMean, 2);
    ssRes += Math.pow(pt.y - pt.yPred, 2) || Math.pow(pt.y - yPred, 2);
  });

  const rSquared = ssTot > 0 ? Math.max(0, 1 - (ssRes / ssTot)) : 0;
  const stdError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : Math.sqrt(ssRes / n);

  return { slope, intercept, rSquared, stdError };
};

/**
 * Main forecasting engine supporting 5-year and 7-year projections.
 */
export const generateSalesForecast = ({
  cleanedRows,
  yearsToForecast = 5,
  selectedProduct = 'ALL',
  hypotheticalGrowthRate = null
}) => {
  // Filter by product if specified
  const filteredRows = selectedProduct === 'ALL' 
    ? cleanedRows 
    : cleanedRows.filter(r => r.productName === selectedProduct);

  const rowsWithDate = filteredRows.filter(r => r.date !== null);

  // If no date data exists or insufficient historical points, fallback to Hypothetical Scenario Mode
  if (rowsWithDate.length === 0 || hypotheticalGrowthRate !== null) {
    return generateHypotheticalForecast(filteredRows, yearsToForecast, hypotheticalGrowthRate || 8.0, selectedProduct);
  }

  // Aggregate by Year
  const yearMap = new Map();
  rowsWithDate.forEach(r => {
    const y = r.date.getFullYear();
    yearMap.set(y, (yearMap.get(y) || 0) + r.revenue);
  });

  const sortedYears = Array.from(yearMap.keys()).sort((a, b) => a - b);

  // If less than 2 historical years exist, aggregate by month to build a baseline or fallback to scenario
  if (sortedYears.length < 2) {
    // Try monthly aggregation
    const monthMap = new Map();
    rowsWithDate.forEach(r => {
      const ym = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(ym, (monthMap.get(ym) || 0) + r.revenue);
    });

    const sortedMonths = Array.from(monthMap.keys()).sort();
    if (sortedMonths.length < 3) {
      return generateHypotheticalForecast(filteredRows, yearsToForecast, 8.0, selectedProduct, 
        "Insufficient dated historical records (at least 2 distinct years or 3 distinct months required for data-driven regression)."
      );
    }
  }

  // Prepare Linear Regression Data Points
  const baseYear = sortedYears[0];
  const regressionPoints = sortedYears.map(y => ({
    x: y - baseYear,
    y: yearMap.get(y),
    year: y
  }));

  const { slope, intercept, rSquared, stdError } = calculateLinearRegression(regressionPoints);

  const historicalData = sortedYears.map(y => ({
    year: String(y),
    actualRevenue: yearMap.get(y),
    forecastRevenue: null,
    lowerBound: null,
    upperBound: null,
    isForecast: false
  }));

  const lastHistoricalYear = sortedYears[sortedYears.length - 1];
  const lastHistoricalRevenue = yearMap.get(lastHistoricalYear);

  const forecastTable = [];
  const chartData = [...historicalData];

  // Prevent slope from predicting negative revenue
  const effectiveSlope = Math.max(slope, 0);

  for (let i = 1; i <= yearsToForecast; i++) {
    const futureYear = lastHistoricalYear + i;
    const xVal = futureYear - baseYear;
    
    // Extrapolated revenue
    let predRevenue = effectiveSlope * xVal + intercept;
    
    // Ensure projected value isn't lower than last historical if slope is non-negative
    if (predRevenue <= 0) {
      predRevenue = lastHistoricalRevenue * Math.pow(1.03, i);
    }

    const marginOfError = (stdError * 1.5) + (predRevenue * 0.05 * i);
    const lowerBound = Math.max(0, predRevenue - marginOfError);
    const upperBound = predRevenue + marginOfError;

    const rowObj = {
      year: String(futureYear),
      forecastYear: `Year ${i} (${futureYear})`,
      actualRevenue: null,
      forecastRevenue: Math.round(predRevenue),
      lowerBound: Math.round(lowerBound),
      upperBound: Math.round(upperBound),
      isForecast: true
    };

    forecastTable.push(rowObj);
    chartData.push(rowObj);
  }

  // Calculate Projected Growth Rate
  const finalYearVal = forecastTable[forecastTable.length - 1].forecastRevenue;
  const totalProjectedGrowth = lastHistoricalRevenue > 0 
    ? ((finalYearVal - lastHistoricalRevenue) / lastHistoricalRevenue) * 100 
    : 0;

  const cagr = lastHistoricalRevenue > 0 && yearsToForecast > 0
    ? (Math.pow(finalYearVal / lastHistoricalRevenue, 1 / yearsToForecast) - 1) * 100
    : 0;

  return {
    isDataDriven: true,
    methodName: 'Ordinary Least Squares (OLS) Linear Regression',
    yearsToForecast,
    selectedProduct,
    historicalObservationsCount: rowsWithDate.length,
    historicalYearsCount: sortedYears.length,
    rSquared: Math.round(rSquared * 1000) / 1000,
    slope: Math.round(slope),
    intercept: Math.round(intercept),
    baselineRevenue: lastHistoricalRevenue,
    lastHistoricalYear,
    totalProjectedGrowth: Math.round(totalProjectedGrowth * 10) / 10,
    cagr: Math.round(cagr * 10) / 10,
    forecastTable,
    chartData,
    limitationsNote: `Model built on ${sortedYears.length} historical year(s) of sales data. Long-term ${yearsToForecast}-year projections assume consistent economic and market demand trends.`
  };
};

/**
 * Generates an illustrative scenario-based forecast when historical dates are missing or insufficient.
 */
const generateHypotheticalForecast = (filteredRows, yearsToForecast, growthRatePercent, selectedProduct, reason = null) => {
  const currentTotalRevenue = filteredRows.reduce((sum, r) => sum + r.revenue, 0);
  const currentYear = new Date().getFullYear();

  const chartData = [
    {
      year: `Current (${currentYear})`,
      actualRevenue: currentTotalRevenue,
      forecastRevenue: currentTotalRevenue,
      lowerBound: currentTotalRevenue,
      upperBound: currentTotalRevenue,
      isForecast: false
    }
  ];

  const forecastTable = [];
  let runningRevenue = currentTotalRevenue;
  const rateDecimal = growthRatePercent / 100;

  for (let i = 1; i <= yearsToForecast; i++) {
    const futureYear = currentYear + i;
    runningRevenue = runningRevenue * (1 + rateDecimal);

    const marginOfError = runningRevenue * 0.08 * i;
    const lowerBound = Math.max(0, runningRevenue - marginOfError);
    const upperBound = runningRevenue + marginOfError;

    const rowObj = {
      year: String(futureYear),
      forecastYear: `Year ${i} (${futureYear})`,
      actualRevenue: null,
      forecastRevenue: Math.round(runningRevenue),
      lowerBound: Math.round(lowerBound),
      upperBound: Math.round(upperBound),
      isForecast: true
    };

    forecastTable.push(rowObj);
    chartData.push(rowObj);
  }

  const totalGrowth = ((runningRevenue - currentTotalRevenue) / currentTotalRevenue) * 100;

  return {
    isDataDriven: false,
    methodName: `Illustrative Compound Growth Simulation (${growthRatePercent}% per annum)`,
    yearsToForecast,
    selectedProduct,
    historicalObservationsCount: filteredRows.length,
    historicalYearsCount: 0,
    rSquared: null,
    baselineRevenue: currentTotalRevenue,
    lastHistoricalYear: currentYear,
    totalProjectedGrowth: Math.round(totalGrowth * 10) / 10,
    cagr: growthRatePercent,
    forecastTable,
    chartData,
    reason: reason || "Uploaded dataset lacks date information needed for data-driven time-series regression.",
    limitationsNote: "This forecast is a scenario simulation based on user-selected growth rate assumptions. It is not an empirical statistical projection."
  };
};
