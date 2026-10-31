from __future__ import annotations
import pandas as pd
import numpy as np
from .csv_service import prepare_dataframe

def _records(df):
    if df is None or df.empty: return []
    clean = df.replace({np.nan: None, pd.NaT: None})
    return clean.to_dict(orient="records")

def analyze_dataframe(raw_df: pd.DataFrame, mapping_override=None):
    df, mapping, warnings, revenue_source = prepare_dataframe(raw_df, mapping_override)
    revenue_valid = df["_revenue"].notna()
    total_revenue = float(df.loc[revenue_valid, "_revenue"].sum()) if revenue_valid.any() else None
    qty_valid = df["_quantity"].notna()
    total_units = float(df.loc[qty_valid, "_quantity"].sum()) if qty_valid.any() else None
    prices = df.loc[df["_price"].notna() & (df["_price"] > 0), "_price"]
    products_count = int(df["_product"].nunique()) if mapping["product"] else None
    product = df.loc[revenue_valid].groupby(["_product", "_category"], dropna=False).agg(
        total_revenue=("_revenue", "sum"), record_count=("_revenue", "size")
    ).reset_index() if revenue_valid.any() else pd.DataFrame()
    qty_product = df.loc[qty_valid].groupby("_product")["_quantity"].sum() if qty_valid.any() else pd.Series(dtype=float)
    price_product = df.loc[df["_price"].notna()].groupby("_product")["_price"].mean()
    if not product.empty:
        product["total_quantity"] = product["_product"].map(qty_product).fillna(0)
        product["average_unit_price_inr"] = product["_product"].map(price_product)
        product["revenue_contribution_percent"] = (product["total_revenue"] / total_revenue * 100) if total_revenue and total_revenue != 0 else 0
        product = product.rename(columns={"_product":"product_name", "_category":"category"}).sort_values("total_revenue", ascending=False)
    category = df.loc[revenue_valid].groupby("_category")["_revenue"].sum().sort_values(ascending=False) if revenue_valid.any() else pd.Series(dtype=float)
    region = df.loc[revenue_valid].groupby("_region")["_revenue"].sum().sort_values(ascending=False) if revenue_valid.any() else pd.Series(dtype=float)
    monthly = df.loc[df["_date"].notna() & revenue_valid].assign(period=lambda x: x["_date"].dt.to_period("M").astype(str)).groupby("period").agg(revenue_inr=("_revenue", "sum"), quantity=("_quantity", "sum"), transactions=("_revenue", "size")).reset_index().sort_values("period")
    annual = df.loc[df["_date"].notna() & revenue_valid].assign(year=lambda x: x["_date"].dt.year).groupby("year").agg(revenue_inr=("_revenue", "sum"), quantity=("_quantity", "sum"), transactions=("_revenue", "size")).reset_index().sort_values("year")
    has_dates = bool(df["_date"].notna().any())
    sales_growth = None
    if len(annual) >= 2:
        prev, cur = float(annual.iloc[-2]["revenue_inr"]), float(annual.iloc[-1]["revenue_inr"])
        if prev != 0: sales_growth = (cur - prev) / abs(prev) * 100
    order_col = mapping.get("order_id")
    avg_order_value = None
    if order_col and revenue_valid.any():
        order_data = df.loc[revenue_valid & df[order_col].astype(str).str.strip().ne("")].groupby(order_col)["_revenue"].sum()
        if not order_data.empty: avg_order_value = float(order_data.mean())
    best_seller = None
    if not qty_product.empty:
        best_seller = {"name": str(qty_product.idxmax()), "quantity": float(qty_product.max())}
    highest_revenue = None
    if not product.empty:
        row = product.iloc[0]
        highest_revenue = {"name": str(row["product_name"]), "revenue_inr": float(row["total_revenue"])}
    preview = raw_df.head(10).replace({np.nan: None}).to_dict(orient="records")
    def summary(series, key):
        return [{key: str(i), "revenue_inr": float(v), "contribution_percent": float(v / total_revenue * 100) if total_revenue else 0} for i,v in series.items()]
    product_records = _records(product)
    # Normalize possible NaN in product output and values into JSON-safe types.
    for item in product_records:
        for k,v in list(item.items()):
            if isinstance(v, (np.integer,)): item[k] = int(v)
            elif isinstance(v, (np.floating,)): item[k] = float(v) if np.isfinite(v) else None
    result = {
        "success": True,
        "currency": "INR",
        "metadata": {"row_count": int(len(raw_df)), "column_count": int(len(raw_df.columns)), "columns": list(raw_df.columns), "detected_mapping": mapping, "revenue_source": revenue_source, "valid_revenue_rows": int(revenue_valid.sum()), "date_rows": int(df["_date"].notna().sum())},
        "metrics": {
            "total_revenue_inr": total_revenue,
            "total_units_sold": total_units,
            "unique_products": products_count,
            "average_unit_price_inr": float(prices.mean()) if len(prices) else None,
            "highest_unit_price_inr": float(prices.max()) if len(prices) else None,
            "lowest_unit_price_inr": float(prices.min()) if len(prices) else None,
            "best_selling_product": best_seller,
            "highest_revenue_product": highest_revenue,
            "average_order_value_inr": avg_order_value,
            "sales_growth_percent": float(sales_growth) if sales_growth is not None else None,
            "has_historical_dates": has_dates
        },
        "product_summaries": product_records,
        "category_summaries": summary(category, "category"),
        "regional_summaries": summary(region, "region"),
        "monthly_trends": _records(monthly),
        "annual_trends": _records(annual),
        "preview_rows": preview,
        "warnings": warnings
    }
    return result, df, mapping
