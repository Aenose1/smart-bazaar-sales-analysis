from __future__ import annotations
import io
import re
import pandas as pd

ALIASES = {
    "product": ["product", "product_name", "productname", "item", "item_name", "item_identifier", "sku", "title", "description"],
    "price": ["price", "unit_price", "unitprice", "selling_price", "mrp", "item_mrp", "rate", "price_per_unit"],
    "quantity": ["quantity", "units_sold", "qty", "quantity_sold", "units", "volume"],
    "revenue": ["revenue", "sales", "sales_amount", "total_sales", "total_amount", "item_outlet_sales", "total_revenue", "line_total"],
    "date": ["date", "order_date", "transaction_date", "sale_date", "invoice_date", "created_at"],
    "category": ["category", "product_category", "department", "type", "group", "item_type"],
    "region": ["region", "location", "state", "zone", "city", "outlet_location"],
    "order_id": ["order_id", "orderid", "transaction_id", "invoice_no", "bill_no", "order_number"],
    "cost": ["cost", "unit_cost", "cost_price", "purchase_price"]
}

def norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(value).strip().lower()).strip("_")

def detect_columns(columns):
    normalized = {col: norm(col) for col in columns}
    mapping = {}
    for field, aliases in ALIASES.items():
        matches = [col for col, name in normalized.items() if name in aliases]
        if not matches:
            matches = [col for col, name in normalized.items() if any(a in name for a in aliases if len(a) > 3)]
        mapping[field] = matches[0] if matches else None
    return mapping

def read_csv_bytes(raw: bytes) -> pd.DataFrame:
    if not raw or not raw.strip():
        raise ValueError("The uploaded CSV is empty.")
    errors = []
    for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            df = pd.read_csv(io.BytesIO(raw), encoding=encoding, dtype=str, keep_default_na=False)
            break
        except (UnicodeDecodeError, pd.errors.ParserError) as exc:
            errors.append(str(exc))
    else:
        raise ValueError("Could not parse the CSV. Check its encoding, delimiter, and headers.")
    df.columns = [str(c).strip() for c in df.columns]
    df = df.loc[:, [c for c in df.columns if c and not c.lower().startswith("unnamed:")]]
    if len(df.columns) == 0 or len(df) == 0:
        raise ValueError("CSV must contain a header row and at least one data row.")
    if len(df.columns) > 300:
        raise ValueError("CSV has too many columns (maximum 300).")
    if len(df) > 250_000:
        raise ValueError("CSV has too many rows (maximum 250,000 for this demo).")
    return df

def numeric_series(series):
    cleaned = series.astype(str).str.replace(r"[₹,$€£\s]", "", regex=True).str.replace(",", "", regex=False)
    return pd.to_numeric(cleaned, errors="coerce")

def prepare_dataframe(df: pd.DataFrame, mapping_override=None):
    mapping = detect_columns(df.columns)
    if mapping_override:
        for key, value in mapping_override.items():
            if key in ALIASES and value in df.columns:
                mapping[key] = value
    warnings = []
    if not mapping["product"]:
        warnings.append("No product column was detected. Product-level summaries may be unavailable.")
    if not mapping["date"]:
        warnings.append("No date column was detected. Historical trends and time-based forecasts are unavailable.")
    if not mapping["revenue"] and not (mapping["price"] and mapping["quantity"]):
        warnings.append("Revenue cannot be calculated: provide a revenue column or both price and quantity columns.")
    out = df.copy()
    out["_product"] = out[mapping["product"]].astype(str).str.strip() if mapping["product"] else "Unknown product"
    out.loc[out["_product"].isin(["", "nan", "None"]), "_product"] = "Unknown product"
    out["_category"] = out[mapping["category"]].astype(str).str.strip() if mapping["category"] else "General"
    out.loc[out["_category"].isin(["", "nan", "None"]), "_category"] = "General"
    out["_region"] = out[mapping["region"]].astype(str).str.strip() if mapping["region"] else "Unspecified"
    out["_price"] = numeric_series(out[mapping["price"]]) if mapping["price"] else float("nan")
    out["_quantity"] = numeric_series(out[mapping["quantity"]]) if mapping["quantity"] else float("nan")
    # Existing sales/revenue column is treated as a row-level amount, never multiplied by quantity again.
    if mapping["revenue"]:
        out["_revenue"] = numeric_series(out[mapping["revenue"]])
        revenue_source = "existing_column"
    elif mapping["price"] and mapping["quantity"]:
        out["_revenue"] = out["_price"] * out["_quantity"]
        revenue_source = "unit_price_times_quantity"
    else:
        out["_revenue"] = float("nan")
        revenue_source = "unavailable"
    out["_date"] = pd.to_datetime(out[mapping["date"]], errors="coerce", dayfirst=True) if mapping["date"] else pd.NaT
    if mapping["date"]:
        bad_dates = int(out[mapping["date"]].astype(str).str.strip().ne("").sum() - out["_date"].notna().sum())
        if bad_dates > 0:
            warnings.append(f"{bad_dates} non-empty date value(s) could not be parsed.")
    invalid_revenue = int(out["_revenue"].isna().sum())
    if invalid_revenue:
        warnings.append(f"{invalid_revenue} row(s) have no valid revenue amount and are excluded from revenue totals.")
    if mapping["price"] and out["_price"].isna().any():
        warnings.append(f"{int(out['_price'].isna().sum())} row(s) have missing or invalid prices.")
    if mapping["quantity"] and out["_quantity"].isna().any():
        warnings.append(f"{int(out['_quantity'].isna().sum())} row(s) have missing or invalid quantities.")
    if mapping["revenue"] and mapping["price"] and mapping["quantity"]:
        warnings.append("Revenue was taken from the existing sales/revenue column; it was not multiplied by quantity again.")
    return out, mapping, warnings, revenue_source
