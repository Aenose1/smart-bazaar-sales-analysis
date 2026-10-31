import { STANDARD_FIELDS } from './csvParser.js';

/**
 * Cleans a numeric string (removes currency symbols like ₹ or $, commas, spaces)
 */
const parseCleanNumber = (val) => {
  if (val === null || val === undefined || val === '') return NaN;
  if (typeof val === 'number') return val;
  const cleanedStr = String(val).replace(/[₹$,\s]/g, '').trim();
  const num = parseFloat(cleanedStr);
  return isNaN(num) ? NaN : num;
};

/**
 * Parses dates robustly supporting DD/MM/YYYY, YYYY-MM-DD, etc.
 */
const parseCleanDate = (val) => {
  if (!val) return null;
  const str = String(val).trim();
  if (!str) return null;

  // Try direct Date parse
  let d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  // Try DD/MM/YYYY or DD-MM-YYYY format
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
    const year = parseInt(ddmmyyyyMatch[3], 10);
    d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
};

/**
 * Cleans and standardizes raw CSV rows based on the confirmed column mapping.
 */
export const cleanDataset = (rawData, columnMapping) => {
  const cleanedRows = [];
  const invalidRows = [];
  
  let missingProductCount = 0;
  let invalidPriceCount = 0;
  let invalidQtyCount = 0;
  let missingDateCount = 0;
  let calculatedRevenueCount = 0;

  const productCol = columnMapping[STANDARD_FIELDS.PRODUCT];
  const priceCol = columnMapping[STANDARD_FIELDS.PRICE];
  const qtyCol = columnMapping[STANDARD_FIELDS.QUANTITY];
  const revCol = columnMapping[STANDARD_FIELDS.REVENUE];
  const dateCol = columnMapping[STANDARD_FIELDS.DATE];
  const catCol = columnMapping[STANDARD_FIELDS.CATEGORY];
  const orderIdCol = columnMapping[STANDARD_FIELDS.ORDER_ID];
  const regionCol = columnMapping[STANDARD_FIELDS.REGION];

  rawData.forEach((row, index) => {
    const productName = productCol && row[productCol] ? String(row[productCol]).trim() : '';
    let price = priceCol ? parseCleanNumber(row[priceCol]) : NaN;
    let quantity = qtyCol ? parseCleanNumber(row[qtyCol]) : NaN;
    let explicitRevenue = revCol ? parseCleanNumber(row[revCol]) : NaN;
    const rawDate = dateCol ? row[dateCol] : null;
    const dateObj = parseCleanDate(rawDate);
    const category = catCol && row[catCol] ? String(row[catCol]).trim() : 'General';
    const orderId = orderIdCol && row[orderIdCol] ? String(row[orderIdCol]).trim() : `TRANS-${index + 1}`;
    const region = regionCol && row[regionCol] ? String(row[regionCol]).trim() : 'Unspecified';

    const warnings = [];

    if (!productName) {
      missingProductCount++;
      warnings.push('Missing product name');
    }

    if (isNaN(price) || price < 0) {
      invalidPriceCount++;
      warnings.push('Invalid price');
    }

    if (isNaN(quantity) || quantity <= 0) {
      invalidQtyCount++;
      warnings.push('Invalid quantity');
    }

    if (!dateObj) {
      missingDateCount++;
    }

    // Determine final revenue accurately without double counting
    let finalRevenue = 0;
    if (!isNaN(explicitRevenue) && explicitRevenue > 0) {
      finalRevenue = explicitRevenue;
      // Backfill price if missing but revenue and qty exist
      if (isNaN(price) && !isNaN(quantity) && quantity > 0) {
        price = explicitRevenue / quantity;
      }
    } else if (!isNaN(price) && !isNaN(quantity) && price >= 0 && quantity > 0) {
      finalRevenue = price * quantity;
      calculatedRevenueCount++;
    } else {
      warnings.push('Cannot compute revenue');
    }

    // Default price fallback if quantity and revenue exist
    if (isNaN(price) && finalRevenue > 0 && quantity > 0) {
      price = finalRevenue / quantity;
    }

    const isValid = productName.length > 0 && (finalRevenue > 0 || (price >= 0 && quantity > 0));

    const cleanedRecord = {
      id: index + 1,
      orderId,
      productName: productName || 'Unknown Product',
      category: category || 'General',
      price: isNaN(price) ? 0 : price,
      quantity: isNaN(quantity) ? 0 : quantity,
      revenue: finalRevenue,
      date: dateObj,
      dateFormatted: dateObj ? dateObj.toISOString().split('T')[0] : null,
      region,
      rawRow: row,
      warnings
    };

    if (isValid) {
      cleanedRows.push(cleanedRecord);
    } else {
      invalidRows.push({ ...cleanedRecord, rowIndex: index + 1 });
    }
  });

  return {
    cleanedRows,
    invalidRows,
    summary: {
      totalInputRows: rawData.length,
      validRowsCount: cleanedRows.length,
      invalidRowsCount: invalidRows.length,
      missingProductCount,
      invalidPriceCount,
      invalidQtyCount,
      missingDateCount,
      calculatedRevenueCount,
      hasDates: cleanedRows.some(r => r.date !== null),
      hasCategories: cleanedRows.some(r => r.category && r.category !== 'General'),
      hasRegions: cleanedRows.some(r => r.region && r.region !== 'Unspecified'),
      hasOrderIds: cleanedRows.some(r => r.orderId && !r.orderId.startsWith('TRANS-'))
    }
  };
};
