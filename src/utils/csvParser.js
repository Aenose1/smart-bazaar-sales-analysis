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
 * Known column name aliases for automatic field detection.
 */
const COLUMN_ALIASES = {
  [STANDARD_FIELDS.PRODUCT]: [
    'product', 'product_name', 'productname', 'item', 'item_name', 
    'title', 'description', 'product title'
  ],
  [STANDARD_FIELDS.PRICE]: [
    'price', 'unit_price', 'unitprice', 'selling_price', 'rate', 
    'cost', 'mrp', 'price_per_unit'
  ],
  [STANDARD_FIELDS.QUANTITY]: [
    'quantity', 'units_sold', 'unitssold', 'qty', 'units', 
    'volume', 'quantity_sold'
  ],
  [STANDARD_FIELDS.REVENUE]: [
    'revenue', 'sales_amount', 'salesamount', 'total_sales', 'total_amount', 
    'sales', 'amount', 'total_revenue', 'line_total'
  ],
  [STANDARD_FIELDS.DATE]: [
    'order_date', 'orderdate', 'date', 'transaction_date', 'sale_date', 
    'created_at', 'invoice_date'
  ],
  [STANDARD_FIELDS.CATEGORY]: [
    'category', 'product_category', 'department', 'type', 'group'
  ],
  [STANDARD_FIELDS.ORDER_ID]: [
    'order_id', 'orderid', 'transaction_id', 'invoice_no', 'bill_no', 'id'
  ],
  [STANDARD_FIELDS.REGION]: [
    'region', 'location', 'state', 'zone', 'city', 'store_location'
  ]
};

/**
 * Automatically maps raw CSV column headers to internal standard fields.
 */
export const autoDetectColumns = (headers) => {
  const mapping = {};
  const normalizedHeaders = headers.map(h => String(h).trim().toLowerCase());

  Object.entries(COLUMN_ALIASES).forEach(([field, aliases]) => {
    // Exact match first
    let matchedIdx = normalizedHeaders.findIndex(h => aliases.includes(h));
    
    // Partial substring fallback if exact match fails
    if (matchedIdx === -1) {
      matchedIdx = normalizedHeaders.findIndex(h => 
        aliases.some(alias => h.includes(alias) || alias.includes(h))
      );
    }

    if (matchedIdx !== -1) {
      mapping[field] = headers[matchedIdx];
    } else {
      mapping[field] = null;
    }
  });

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
