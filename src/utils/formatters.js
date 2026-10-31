/**
 * Formats a numeric value into Indian Rupees (INR) format.
 * Example: 150000 -> "₹1,50,000.00" or "₹1,50,000"
 */
export const formatCurrency = (value, showDecimals = true) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '₹0.00';
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0
  }).format(value);
};

/**
 * Formats large monetary amounts with Indian compact notation (K, Lakh, Crore)
 * Useful for chart Y-axes and high-level KPI badges.
 */
export const formatCompactINR = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '₹0';
  const absVal = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absVal >= 10000000) {
    return `${sign}₹${(absVal / 10000000).toFixed(2)} Cr`;
  } else if (absVal >= 100000) {
    return `${sign}₹${(absVal / 100000).toFixed(2)} L`;
  } else if (absVal >= 1000) {
    return `${sign}₹${(absVal / 1000).toFixed(1)} K`;
  }
  return `${sign}₹${absVal.toFixed(0)}`;
};

/**
 * Formats a regular number with Indian comma separation.
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  }).format(value);
};

/**
 * Formats date object or date string to Indian standard DD/MM/YYYY
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formats percentage
 */
export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return '0.0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};
