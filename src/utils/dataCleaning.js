import { STANDARD_FIELDS } from './csvParser.js';

/**
 * Cleans a numeric string (removes currency symbols like ₹, $, €, commas, spaces)
 * Handles negative numbers like -500 or (500)
 */
export const parseCleanNumber = (val) => {
  if (val === null || val === undefined || val === '') return NaN;
  if (typeof val === 'number') return isNaN(val) ? NaN : val;
  let str = String(val).trim();
  if (str.toLowerCase() === 'nan' || str.toLowerCase() === 'null') return NaN;

  let isNegative = false;
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.slice(1, -1);
  } else if (str.startsWith('-')) {
    isNegative = true;
    str = str.slice(1);
  }

  // Remove all non-digit, non-period characters
  const cleanedStr = str.replace(/[^0-9.]/g, '');
  if (!cleanedStr) return NaN;
  const num = parseFloat(cleanedStr);
  if (isNaN(num)) return NaN;
  return isNegative ? -num : num;
};

/**
 * Parses dates robustly supporting:
 * - ISO: YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss, YYYY/MM/DD
 * - Year-Month: YYYY-MM, YYYY/MM
 * - Day-first: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
 * - Month-first: MM/DD/YYYY, MM-DD-YYYY
 * - Textual month: 27-Jun-2023, 27-June-2023, Jun 27, 2023
 * - Excel serial date numbers
 */
export const parseCleanDate = (val) => {
  if (!val) return null;
  const str = String(val).trim();
  if (!str || str.toLowerCase() === 'nan' || str.toLowerCase() === 'null') return null;

  // 1. Excel serial number check (e.g. 44560 -> 2022)
  const numericVal = Number(str);
  if (!isNaN(numericVal) && numericVal >= 30000 && numericVal <= 65000 && !str.includes('-') && !str.includes('/')) {
    const d = new Date(Math.round((numericVal - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return d;
  }

  // 2. YYYY-MM-DD or YYYY/MM/DD format
  const yyyymmdd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    const month = parseInt(yyyymmdd[2], 10) - 1;
    const day = parseInt(yyyymmdd[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Year-Month only: YYYY-MM or YYYY/MM
  const yyyymm = str.match(/^(\d{4})[-/.](\d{1,2})$/);
  if (yyyymm) {
    const year = parseInt(yyyymm[1], 10);
    const month = parseInt(yyyymm[2], 10) - 1;
    const d = new Date(year, month, 1);
    if (!isNaN(d.getTime())) return d;
  }

  // 4. DD/MM/YYYY or MM/DD/YYYY format
  const ddmmyyyy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (ddmmyyyy) {
    const part1 = parseInt(ddmmyyyy[1], 10);
    const part2 = parseInt(ddmmyyyy[2], 10);
    let year = parseInt(ddmmyyyy[3], 10);
    if (year < 100) year += 2000;

    let day = part1;
    let month = part2 - 1;
    // If part1 <= 12 and part2 > 12, it is US format MM/DD/YYYY
    if (part1 <= 12 && part2 > 12) {
      day = part2;
      month = part1 - 1;
    }
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // 5. DD-Mon-YYYY (e.g. 27-Jun-2023 or 27-June-2023)
  const monthNames = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  const textualMatch = str.match(/^(\d{1,2})[-/\s]([a-zA-Z]{3,9})[-/\s](\d{2,4})$/);
  if (textualMatch) {
    const day = parseInt(textualMatch[1], 10);
    const monStr = textualMatch[2].toLowerCase().slice(0, 3);
    let year = parseInt(textualMatch[3], 10);
    if (year < 100) year += 2000;
    if (monthNames[monStr] !== undefined) {
      const d = new Date(year, monthNames[monStr], day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 6. Direct native Date parse
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  return null;
};

/**
 * Cleans and standardizes raw CSV rows based on the confirmed column mapping.
 * Universally handles any Kaggle / Indian retail sales dataset.
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
    // 1. Resolve Product Name with resilient waterfall fallback
    let productName = productCol && row[productCol] !== undefined && row[productCol] !== null
      ? String(row[productCol]).trim()
      : '';

    if (!productName || productName.toLowerCase() === 'nan' || productName.toLowerCase() === 'null') {
      const rawKeys = Object.keys(row);
      const subCatKey = rawKeys.find(k => /sub[-_ ]?category/i.test(k));
      const prodKey = rawKeys.find(k => /product|item|description|particulars|title/i.test(k));
      if (subCatKey && row[subCatKey]) {
        productName = String(row[subCatKey]).trim();
      } else if (prodKey && row[prodKey]) {
        productName = String(row[prodKey]).trim();
      } else if (catCol && row[catCol]) {
        productName = String(row[catCol]).trim();
      } else {
        const anyCatKey = rawKeys.find(k => /category|department/i.test(k));
        if (anyCatKey && row[anyCatKey]) {
          productName = String(row[anyCatKey]).trim();
        } else if (orderIdCol && row[orderIdCol]) {
          productName = `Item (${String(row[orderIdCol]).trim()})`;
        } else {
          productName = `Retail Item #${index + 1}`;
        }
      }
    }

    // 2. Resolve Category
    let category = catCol && row[catCol] !== undefined && row[catCol] !== null
      ? String(row[catCol]).trim()
      : '';
    if (!category || category.toLowerCase() === 'nan' || category.toLowerCase() === 'null') {
      const rawKeys = Object.keys(row);
      const catKey = rawKeys.find(k => /category|department|segment|type/i.test(k));
      category = catKey && row[catKey] ? String(row[catKey]).trim() : 'General';
    }

    // 3. Resolve Region
    let region = regionCol && row[regionCol] !== undefined && row[regionCol] !== null
      ? String(row[regionCol]).trim()
      : '';
    if (!region || region.toLowerCase() === 'nan' || region.toLowerCase() === 'null') {
      const rawKeys = Object.keys(row);
      const regKey = rawKeys.find(k => /state|city|region|location|zone/i.test(k));
      region = regKey && row[regKey] ? String(row[regKey]).trim() : 'National';
    }

    // 4. Resolve Order ID
    let orderId = orderIdCol && row[orderIdCol] !== undefined && row[orderIdCol] !== null
      ? String(row[orderIdCol]).trim()
      : '';
    if (!orderId || orderId.toLowerCase() === 'nan' || orderId.toLowerCase() === 'null') {
      const rawKeys = Object.keys(row);
      const ordKey = rawKeys.find(k => /order|invoice|bill|id/i.test(k));
      orderId = ordKey && row[ordKey] ? String(row[ordKey]).trim() : `ORD-${index + 1001}`;
    }

    // 5. Parse Numeric Fields and Symmetrically Derive Missing Values
    let price = priceCol ? parseCleanNumber(row[priceCol]) : NaN;
    let quantity = qtyCol ? parseCleanNumber(row[qtyCol]) : NaN;
    let explicitRevenue = revCol ? parseCleanNumber(row[revCol]) : NaN;

    if (isNaN(explicitRevenue)) {
      const rawKeys = Object.keys(row);
      const amtKey = rawKeys.find(k => /amount|sales|revenue|total/i.test(k));
      if (amtKey) explicitRevenue = parseCleanNumber(row[amtKey]);
    }

    // Default quantity to 1 if missing or 0
    if (isNaN(quantity) || quantity <= 0) {
      quantity = 1;
    }

    let finalRevenue = 0;
    if (!isNaN(explicitRevenue) && explicitRevenue > 0) {
      finalRevenue = explicitRevenue;
      if (isNaN(price) || price <= 0) {
        price = finalRevenue / quantity;
      }
    } else if (!isNaN(price) && price > 0) {
      finalRevenue = price * quantity;
      calculatedRevenueCount++;
    } else {
      finalRevenue = 0;
    }

    if (isNaN(price) || price < 0) {
      price = quantity > 0 && finalRevenue > 0 ? finalRevenue / quantity : 0;
    }

    // 6. Resolve Date
    let dateObj = dateCol ? parseCleanDate(row[dateCol]) : null;
    if (!dateObj) {
      const rawKeys = Object.keys(row);
      const dateKey = rawKeys.find(k => /date|time|year[-_ ]?month|period|month/i.test(k));
      if (dateKey) dateObj = parseCleanDate(row[dateKey]);
    }

    if (!dateObj) {
      missingDateCount++;
    }

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

    // A row is considered valid if it has an identifiable product and non-negative sales activity
    const isValid = productName.length > 0 && (finalRevenue > 0 || (price > 0 && quantity > 0) || !isNaN(finalRevenue));

    const cleanedRecord = {
      id: index + 1,
      orderId,
      productName: productName || 'Retail Product',
      category: category || 'General',
      price: isNaN(price) ? 0 : Math.round(price * 100) / 100,
      quantity: isNaN(quantity) ? 1 : quantity,
      revenue: Math.round(finalRevenue * 100) / 100,
      date: dateObj,
      dateFormatted: dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}` : null,
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
      hasRegions: cleanedRows.some(r => r.region && r.region !== 'National' && r.region !== 'Unspecified'),
      hasOrderIds: cleanedRows.some(r => r.orderId && !r.orderId.startsWith('ORD-'))
    }
  };
};
