from __future__ import annotations
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error
from .csv_service import prepare_dataframe

def forecast_dataframe(raw_df: pd.DataFrame, horizon_years=5, product_name=None, mapping_override=None):
    if horizon_years not in (5, 7):
        raise ValueError("horizon_years must be 5 or 7.")
    df, mapping, warnings, revenue_source = prepare_dataframe(raw_df, mapping_override)
    if not mapping.get("date") or not df["_date"].notna().any():
        return {"success": True, "available": False, "currency": "INR", "message": "A valid date column and dated sales observations are required for a data-driven forecast.", "warnings": warnings + ["No historical dates are available."], "forecast": [], "historical": [], "evaluation": None, "model": None}
    if df["_revenue"].notna().sum() == 0:
        return {"success": True, "available": False, "currency": "INR", "message": "Revenue cannot be calculated from this dataset.", "warnings": warnings, "forecast": [], "historical": [], "evaluation": None, "model": None}
    subset = df.loc[df["_date"].notna() & df["_revenue"].notna()].copy()
    if product_name:
        subset = subset.loc[subset["_product"].astype(str) == str(product_name)]
    if subset.empty:
        return {"success": True, "available": False, "currency": "INR", "message": "No dated sales observations were found for the selected product.", "warnings": warnings, "forecast": [], "historical": [], "evaluation": None, "model": None}
    subset["period"] = subset["_date"].dt.to_period("M")
    hist = subset.groupby("period")["_revenue"].sum().sort_index()
    # Missing months are filled with zero only between first and last observed months and disclosed.
    full_idx = pd.period_range(hist.index.min(), hist.index.max(), freq="M")
    missing_count = len(full_idx) - len(hist)
    hist = hist.reindex(full_idx, fill_value=0.0)
    if missing_count:
        warnings.append(f"{missing_count} missing month(s) between the first and last observed dates were treated as zero sales for modeling; verify that this is appropriate.")
    if len(hist) < 12:
        return {"success": True, "available": False, "currency": "INR", "message": f"At least 12 monthly observations are required for this demo forecast; only {len(hist)} are available.", "warnings": warnings, "forecast": [], "historical": [{"period": str(p), "revenue_inr": float(v)} for p,v in hist.items()], "evaluation": None, "model": None}
    x = np.arange(len(hist), dtype=float).reshape(-1, 1)
    y = hist.to_numpy(dtype=float)
    evaluation = None
    if len(y) >= 18:
        split = max(12, int(len(y) * 0.8))
        if split < len(y):
            test_model = LinearRegression().fit(x[:split], y[:split])
            pred_test = np.maximum(0, test_model.predict(x[split:]))
            actual = y[split:]
            evaluation = {"mae_inr": float(mean_absolute_error(actual, pred_test)), "rmse_inr": float(np.sqrt(mean_squared_error(actual, pred_test))), "holdout_observations": int(len(actual)), "method": "chronological holdout"}
            nonzero = actual != 0
            if nonzero.any(): evaluation["mape_percent"] = float(np.mean(np.abs((actual[nonzero] - pred_test[nonzero]) / actual[nonzero])) * 100)
    else:
        warnings.append("Fewer than 18 monthly observations are available; no reliable holdout evaluation was performed.")
    model = LinearRegression().fit(x, y)
    future_x = np.arange(len(y), len(y) + horizon_years * 12, dtype=float).reshape(-1, 1)
    future_y = np.maximum(0, model.predict(future_x))
    last_period = hist.index.max()
    forecast = []
    for i, value in enumerate(future_y):
        period = last_period + i + 1
        forecast.append({"period": str(period), "year": int(period.year), "month": int(period.month), "forecast_revenue_inr": round(float(value), 2)})
    annual_forecast = {}
    for item in forecast:
        annual_forecast.setdefault(item["year"], 0.0)
        annual_forecast[item["year"]] += item["forecast_revenue_inr"]
    last_12_total = float(hist.tail(12).sum())
    annual = [{"year": year, "forecast_revenue_inr": round(value, 2)} for year,value in sorted(annual_forecast.items())]
    if len(hist) < 24:
        warnings.append("Forecasts extending 5–7 years beyond limited history are highly uncertain and should be treated as indicative, not guaranteed.")
    return {"success": True, "available": True, "currency": "INR", "product_name": product_name, "horizon_years": horizon_years, "historical": [{"period": str(p), "revenue_inr": round(float(v),2)} for p,v in hist.items()], "forecast": forecast, "annual_forecast": annual, "baseline_last_12_months_revenue_inr": round(last_12_total,2), "projected_total_revenue_inr": round(float(sum(future_y)),2), "evaluation": evaluation, "model": {"name": "Linear regression on monthly revenue trend", "observations": int(len(hist)), "slope_inr_per_month": float(model.coef_[0]), "limitations": "This trend model does not guarantee future outcomes and does not explicitly model seasonality or market changes."}, "warnings": warnings}
