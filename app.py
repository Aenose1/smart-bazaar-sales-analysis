from __future__ import annotations
import os, secrets, time
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
from services.csv_service import read_csv_bytes
from services.analysis_service import analyze_dataframe
from services.forecasting_service import forecast_dataframe
from services.export_service import dataframe_to_csv, analysis_to_csv

APP_VERSION = "1.0.0"
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(20 * 1024 * 1024)))
SESSION_TTL_SECONDS = int(os.getenv("DATASET_TTL_SECONDS", str(2 * 60 * 60)))
DATASETS = {}

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
CORS(app, resources={r"/api/*": {"origins": [o.strip() for o in allowed_origins if o.strip()]}})

def json_error(message, code="BAD_REQUEST", status=400, details=None):
    payload = {"success": False, "error": {"code": code, "message": message}}
    if details: payload["error"]["details"] = details
    return jsonify(payload), status

def cleanup_expired():
    now = time.time()
    for key in list(DATASETS):
        if now - DATASETS[key]["created_at"] > SESSION_TTL_SECONDS:
            DATASETS.pop(key, None)

def store_dataset(df, filename, mapping=None):
    cleanup_expired()
    dataset_id = secrets.token_urlsafe(24)
    DATASETS[dataset_id] = {"df": df.copy(), "filename": filename, "mapping": mapping or {}, "created_at": time.time()}
    return dataset_id

def get_dataset(dataset_id):
    cleanup_expired()
    if not dataset_id or dataset_id not in DATASETS:
        return None
    return DATASETS[dataset_id]

def parse_request_dataset():
    """Return (dataframe, dataset_id, filename, mapping_override, error_response)."""
    mapping_override = request.form.get("mapping")
    if mapping_override:
        import json
        try: mapping_override = json.loads(mapping_override)
        except Exception: return None, None, None, None, json_error("mapping must be valid JSON.", "INVALID_MAPPING")
    else: mapping_override = None
    if "file" in request.files and request.files["file"].filename:
        uploaded = request.files["file"]
        filename = os.path.basename(uploaded.filename)
        if not filename.lower().endswith(".csv"):
            return None, None, None, None, json_error("Please upload a .csv file.", "INVALID_FILE_TYPE")
        raw = uploaded.read(MAX_UPLOAD_BYTES + 1)
        if len(raw) > MAX_UPLOAD_BYTES:
            return None, None, None, None, json_error("File exceeds the configured upload size limit.", "FILE_TOO_LARGE", 413)
        try: df = read_csv_bytes(raw)
        except ValueError as exc: return None, None, None, None, json_error(str(exc), "INVALID_CSV")
        dataset_id = store_dataset(df, filename, mapping_override)
        return df, dataset_id, filename, mapping_override, None
    body = request.get_json(silent=True) or {}
    dataset_id = body.get("dataset_id") or request.form.get("dataset_id")
    item = get_dataset(dataset_id)
    if not item:
        return None, None, None, None, json_error("Upload a CSV or provide a valid dataset_id. Dataset sessions expire after a period of inactivity.", "DATASET_NOT_FOUND", 404)
    return item["df"].copy(), dataset_id, item["filename"], mapping_override or item.get("mapping"), None

@app.get("/api/health")
def health():
    cleanup_expired()
    return jsonify({"success": True, "status": "ok", "application": "Smart Bazaar Sales Analysis API", "version": APP_VERSION, "analysis_service": "available", "active_datasets": len(DATASETS)})

@app.post("/api/analyze")
def analyze():
    df, dataset_id, filename, mapping, error = parse_request_dataset()
    if error: return error
    try:
        result, prepared, detected = analyze_dataframe(df, mapping)
        # Save selected mapping for subsequent product/forecast calls.
        DATASETS[dataset_id]["mapping"] = detected
        result["dataset_id"] = dataset_id
        result["metadata"]["filename"] = filename
        return jsonify(result)
    except Exception:
        app.logger.exception("CSV analysis failed")
        return json_error("The CSV was read, but analysis failed. Check the column mapping and data values.", "ANALYSIS_FAILED", 422)

@app.post("/api/product-details")
def product_details():
    body = request.get_json(silent=True) or {}
    product_name = body.get("product_name") or body.get("product")
    if not product_name: return json_error("product_name is required.", "MISSING_PRODUCT_NAME")
    df, dataset_id, filename, mapping, error = parse_request_dataset()
    if error: return error
    try:
        analysis, prepared, detected = analyze_dataframe(df, mapping)
        matches = prepared.loc[prepared["_product"].astype(str) == str(product_name)].copy()
        if matches.empty: return json_error("The selected product was not found in this dataset.", "PRODUCT_NOT_FOUND", 404)
        rev = matches["_revenue"].dropna()
        qty = matches["_quantity"].dropna()
        price = matches["_price"].dropna()
        dates = matches.loc[matches["_date"].notna() & matches["_revenue"].notna()].copy()
        trends = []
        if not dates.empty:
            dates["period"] = dates["_date"].dt.to_period("M").astype(str)
            trends = [{"period": str(k), "revenue_inr": float(v)} for k,v in dates.groupby("period")["_revenue"].sum().sort_index().items()]
        return jsonify({"success": True, "dataset_id": dataset_id, "currency": "INR", "product": {"name": str(product_name), "category": str(matches["_category"].mode().iloc[0]) if not matches["_category"].mode().empty else "General", "record_count": int(len(matches)), "total_revenue_inr": float(rev.sum()) if len(rev) else None, "total_quantity_sold": float(qty.sum()) if len(qty) else None, "average_unit_price_inr": float(price.mean()) if len(price) else None, "min_unit_price_inr": float(price.min()) if len(price) else None, "max_unit_price_inr": float(price.max()) if len(price) else None, "first_sale_date": str(matches["_date"].min().date()) if matches["_date"].notna().any() else None, "last_sale_date": str(matches["_date"].max().date()) if matches["_date"].notna().any() else None, "monthly_trends": trends}, "warnings": analysis.get("warnings", [])})
    except Exception:
        app.logger.exception("Product detail lookup failed")
        return json_error("Could not calculate product details for this dataset.", "PRODUCT_ANALYSIS_FAILED", 422)

@app.post("/api/forecast")
def forecast():
    body = request.get_json(silent=True) or {}
    horizon = body.get("horizon_years", body.get("horizon", 5))
    try: horizon = int(horizon)
    except (TypeError, ValueError): return json_error("horizon_years must be 5 or 7.", "INVALID_HORIZON")
    if horizon not in (5, 7): return json_error("horizon_years must be 5 or 7.", "INVALID_HORIZON")
    df, dataset_id, filename, mapping, error = parse_request_dataset()
    if error: return error
    try:
        result = forecast_dataframe(df, horizon_years=horizon, product_name=body.get("product_name"), mapping_override=mapping)
        result["dataset_id"] = dataset_id
        return jsonify(result)
    except ValueError as exc: return json_error(str(exc), "INVALID_FORECAST_REQUEST")
    except Exception:
        app.logger.exception("Forecasting failed")
        return json_error("Forecasting failed. Check date and revenue columns.", "FORECAST_FAILED", 422)

@app.post("/api/export")
def export():
    body = request.get_json(silent=True) or {}
    kind = body.get("type", "products")
    dataset_id = body.get("dataset_id")
    item = get_dataset(dataset_id)
    if not item: return json_error("A valid dataset_id is required. Upload and analyze the CSV first.", "DATASET_NOT_FOUND", 404)
    try:
        analysis, _, _ = analyze_dataframe(item["df"], item.get("mapping"))
        if kind == "cleaned":
            # Export original columns and add normalized analysis fields for transparency.
            df = item["df"].copy()
            prepared, _, _, _ = __import__("services.csv_service", fromlist=["prepare_dataframe"]).prepare_dataframe(df, item.get("mapping"))
            export_df = df.copy()
            export_df["Revenue_INR"] = prepared["_revenue"]
            export_df["Quantity_Normalized"] = prepared["_quantity"]
            export_df["Unit_Price_INR"] = prepared["_price"]
            content = dataframe_to_csv(export_df)
        elif kind == "products": content = analysis_to_csv(analysis, "products")
        elif kind == "monthly": content = analysis_to_csv(analysis, "monthly")
        elif kind == "annual": content = analysis_to_csv(analysis, "annual")
        elif kind == "forecast":
            forecast_result = forecast_dataframe(item["df"], horizon_years=int(body.get("horizon_years", 5)), product_name=body.get("product_name"), mapping_override=item.get("mapping"))
            if not forecast_result.get("available"):
                return json_error(forecast_result.get("message", "Forecast is unavailable for this dataset."), "FORECAST_UNAVAILABLE", 422, {"warnings": forecast_result.get("warnings", [])})
            content = analysis_to_csv(forecast_result, "forecast")
        else: return json_error("type must be cleaned, products, monthly, annual, or forecast.", "INVALID_EXPORT_TYPE")
        from flask import Response
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        return Response(content, mimetype="text/csv; charset=utf-8", headers={"Content-Disposition": f'attachment; filename="smart-bazaar-{kind}-{stamp}.csv"'})
    except Exception:
        app.logger.exception("CSV export failed")
        return json_error("Could not generate the requested CSV export.", "EXPORT_FAILED", 422)

@app.errorhandler(413)
def too_large(_exc): return json_error("Uploaded file is too large.", "FILE_TOO_LARGE", 413)

@app.errorhandler(404)
def not_found(_exc): return json_error("API endpoint not found.", "NOT_FOUND", 404)

if __name__ == "__main__":
    app.run(host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "5000")), debug=os.getenv("FLASK_DEBUG", "false").lower() == "true")
