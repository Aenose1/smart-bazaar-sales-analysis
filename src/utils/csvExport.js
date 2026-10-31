import Papa from 'papaparse';

/**
 * Utility to trigger browser CSV download.
 */
const downloadCSVBlob = (csvString, filename) => {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Downloads Original CSV.
 */
export const exportOriginalCSV = (rawData, filename = 'smart_bazaar_original_dataset.csv') => {
  if (!rawData || rawData.length === 0) return;
  const csv = Papa.unparse(rawData);
  downloadCSVBlob(csv, filename);
};

/**
 * Downloads Cleaned Dataset CSV with numeric INR values and explicit metadata.
 */
export const exportCleanedCSV = (cleanedRows, filename = 'smart_bazaar_cleaned_dataset.csv') => {
  if (!cleanedRows || cleanedRows.length === 0) return;

  const exportData = cleanedRows.map(row => ({
    Order_ID: row.orderId,
    Order_Date: row.dateFormatted || 'N/A',
    Product_Name: row.productName,
    Category: row.category,
    Unit_Price_INR: row.price,
    Quantity_Sold: row.quantity,
    Revenue_INR: row.revenue,
    Region: row.region
  }));

  const csvContent = `# METADATA: Smart Bazaar Cleaned Sales Dataset (All financial figures are in Indian Rupees - INR)\n` + Papa.unparse(exportData);
  downloadCSVBlob(csvContent, filename);
};

/**
 * Downloads Product-Wise Summary CSV.
 */
export const exportProductSummaryCSV = (productSummaries, filename = 'smart_bazaar_product_summary.csv') => {
  if (!productSummaries || productSummaries.length === 0) return;

  const exportData = productSummaries.map(p => ({
    Product_Name: p.name,
    Category: p.category,
    Average_Unit_Price_INR: Math.round(p.avgPrice * 100) / 100,
    Total_Quantity_Sold: p.totalQuantity,
    Total_Revenue_INR: Math.round(p.totalRevenue * 100) / 100,
    Total_Orders: p.orderCount,
    Revenue_Contribution_Percent: Math.round(p.revenueContribution * 100) / 100
  }));

  const csvContent = `# METADATA: Smart Bazaar Product Performance Summary (Currency: INR ₹)\n` + Papa.unparse(exportData);
  downloadCSVBlob(csvContent, filename);
};

/**
 * Downloads Filtered Table CSV.
 */
export const exportFilteredTableCSV = (filteredRows, filename = 'smart_bazaar_filtered_sales.csv') => {
  if (!filteredRows || filteredRows.length === 0) return;
  exportCleanedCSV(filteredRows, filename);
};

/**
 * Downloads Sales Forecast CSV.
 */
export const exportSalesForecastCSV = (forecastResult, filename = 'smart_bazaar_sales_forecast.csv') => {
  if (!forecastResult || !forecastResult.forecastTable) return;

  const exportData = forecastResult.forecastTable.map(f => ({
    Forecast_Period: f.forecastYear,
    Forecast_Year: f.year,
    Predicted_Revenue_INR: f.forecastRevenue,
    Uncertainty_Lower_Bound_INR: f.lowerBound,
    Uncertainty_Upper_Bound_INR: f.upperBound
  }));

  const metadataHeader = `# METADATA: Smart Bazaar Sales Forecast Report (${forecastResult.yearsToForecast}-Year Projection)\n` +
    `# Product: ${forecastResult.selectedProduct}\n` +
    `# Algorithm: ${forecastResult.methodName}\n` +
    `# Baseline Revenue (INR): ${forecastResult.baselineRevenue}\n` +
    `# Projected Growth (CAGR): ${forecastResult.cagr}%\n`;

  const csvContent = metadataHeader + Papa.unparse(exportData);
  downloadCSVBlob(csvContent, filename);
};
