import Papa from 'papaparse';

/**
 * Standard column field names used internally by the application.
 */
export const STANDARD_FIELDS = {
  PRODUCT: 'product',
  PRICE: 'price',
  QUANTITY: 'quantity',
  REVENUE: 'revenue',
  DATE: 'date',
  CATEGORY: 'category',
  ORDER_ID: 'orderId',
  REGION: 'region'
};

/**
 * Helper to normalize string to clean alphanumeric lowercase:
 * e.g., "Order ID" -> "orderid", "Sub-Category" -> "subcategory", "Unit Price (₹)" -> "unitprice"
 */
export const toCanonical = (str) => {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Known canonical column name aliases for universal Kaggle / retail dataset detection.
 * Listed in strict priority order (exact canonical matches).
 */
const CANONICAL_ALIASES = {
  [STANDARD_FIELDS.PRODUCT]: [
    // Direct product / item names
    'productname', 'product', 'itemname', 'item', 'description', 'itemdescription',
    'productdescription', 'title', 'producttitle', 'particulars', 'commodity',
    'goods', 'sku', 'skuname', 'article', 'articlename', 'name',
    // Sub-category / brand / model
    'subcategory', 'subcat', 'subdepartment', 'subgroup', 'subclass',
    'brand', 'brandname', 'model', 'modelname'
  ],
  [STANDARD_FIELDS.CATEGORY]: [
    'category', 'productcategory', 'itemcategory', 'department', 'dept',
    'segment', 'producttype', 'type', 'group', 'class', 'division',
    'classification', 'sector', 'lineofbusiness', 'vertical'
  ],
  [STANDARD_FIELDS.PRICE]: [
    'unitprice', 'sellingprice', 'price', 'rate', 'mrp', 'cost', 'unitcost',
    'priceperunit', 'itemprice', 'listprice', 'saleprice', 'retailprice',
    'unitrate', 'priceeach', 'costprice'
  ],
  [STANDARD_FIELDS.QUANTITY]: [
    'quantity', 'qty', 'unitssold', 'quantitysold', 'quantityordered',
    'units', 'volume', 'pieces', 'count', 'pcs', 'numberofitems',
    'itemsold', 'orderedquantity', 'totalunits', 'orderquantity'
  ],
  [STANDARD_FIELDS.REVENUE]: [
    'revenue', 'sales', 'amount', 'salesamount', 'totalamount', 'totalsales',
    'total', 'totalrevenue', 'linetotal', 'itemtotal', 'turnover',
    'netamount', 'nettotal', 'grandtotal', 'value', 'totalvalue',
    'orderamount', 'ordersales'
  ],
  [STANDARD_FIELDS.DATE]: [
    'orderdate', 'date', 'transactiondate', 'invoicedate', 'saledate',
    'billingdate', 'purchasedate', 'timestamp', 'createdat', 'datetime',
    'yearmonth', 'period', 'month', 'transdate', 'billdate', 'dateofsale'
  ],
  [STANDARD_FIELDS.ORDER_ID]: [
    'orderid', 'transactionid', 'invoiceno', 'invoiceid', 'billno',
    'receiptno', 'ordernumber', 'orderreference', 'orderno', 'transid',
    'billnumber', 'receiptid', 'transactionnumber', 'id'
  ],
  [STANDARD_FIELDS.REGION]: [
    'region', 'state', 'city', 'location', 'zone', 'storelocation',
    'branch', 'territory', 'market', 'country', 'province', 'district',
    'place', 'store', 'storename', 'storeid', 'area', 'address'
  ]
};

/**
 * Automatically maps raw CSV column headers to internal standard fields.
 * Handles Kaggle, Indian retail, Superstore, ERP, and POS formats.
 */
export const autoDetectColumns = (headers) => {
  const mapping = {};
  const canonHeaderMap = new Map();

  headers.forEach(h => {
    const c = toCanonical(h);
    if (!canonHeaderMap.has(c)) {
      canonHeaderMap.set(c, h);
    }
  });

  // Track matched headers to prevent cross-field duplicate assignments
  const usedHeaders = new Set();

  // 1. Strict Priority Matching via canonical lookup
  Object.entries(CANONICAL_ALIASES).forEach(([field, aliases]) => {
    let matchedHeader = null;

    // Check exact canonical alias matches first
    for (const alias of aliases) {
      if (canonHeaderMap.has(alias) && !usedHeaders.has(canonHeaderMap.get(alias))) {
        matchedHeader = canonHeaderMap.get(alias);
        break;
      }
    }

    // 2. Substring fallback if no exact match found
    if (!matchedHeader) {
      for (const [canonH, origH] of canonHeaderMap.entries()) {
        if (!usedHeaders.has(origH)) {
          const hasSubstring = aliases.some(alias => canonH.includes(alias) || alias.includes(canonH));
          if (hasSubstring) {
            matchedHeader = origH;
            break;
          }
        }
      }
    }

    if (matchedHeader) {
      mapping[field] = matchedHeader;
      usedHeaders.add(matchedHeader);
    } else {
      mapping[field] = null;
    }
  });

  // 3. Intelligent fallback for Product Name
  // If no product column matched, but Category exists and Sub-Category is not separate,
  // allow Category to serve as both category and product fallback.
  if (!mapping[STANDARD_FIELDS.PRODUCT]) {
    if (mapping[STANDARD_FIELDS.CATEGORY]) {
      mapping[STANDARD_FIELDS.PRODUCT] = mapping[STANDARD_FIELDS.CATEGORY];
    } else {
      // Find any header mentioning item/product/name
      const anyProd = headers.find(h => /item|prod|name|desc/i.test(h));
      if (anyProd) mapping[STANDARD_FIELDS.PRODUCT] = anyProd;
    }
  }

  return mapping;
};

/**
 * Parses CSV text or file using PapaParse.
 */
export const parseCSVData = (fileOrString) => {
  return new Promise((resolve, reject) => {
    Papa.parse(fileOrString, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Handle numbers carefully ourselves
      complete: (results) => {
        if (results.errors && results.errors.length > 0 && (!results.data || results.data.length === 0)) {
          return reject(new Error('Failed to parse CSV file: ' + results.errors[0].message));
        }

        const rawData = results.data || [];
        const headers = results.meta.fields || (rawData.length > 0 ? Object.keys(rawData[0]) : []);

        if (headers.length === 0 || rawData.length === 0) {
          return reject(new Error('The uploaded CSV file is empty or missing header rows.'));
        }

        const detectedMapping = autoDetectColumns(headers);

        resolve({
          headers,
          rawData,
          detectedMapping,
          totalRows: rawData.length,
          previewRows: rawData.slice(0, 10)
        });
      },
      error: (err) => reject(err)
    });
  });
};
