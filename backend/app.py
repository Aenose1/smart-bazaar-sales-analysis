"""
Smart Bazaar Sales Analysis - Backend API
DWM Mini Project (Data Warehousing & Mining)
Technologies: Python, Flask, Flask-CORS, Pandas, Scikit-learn, NumPy
"""

import os
import io
import re
import math
import json
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

app = Flask(__name__)
# Enable CORS for all routes (Vite dev server, Vercel frontend, and local origins)
CORS(app, resources={r"/*": {"origins": "*"}})

# Path to sample dataset
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLE_FILE_PATH = os.path.join(BASE_DIR, "..", "public", "sample-sales.csv")
if not os.path.exists(SAMPLE_FILE_PATH):
    SAMPLE_FILE_PATH = os.path.join(BASE_DIR, "sample-sales.csv")

COLUMN_ALIASES = {
    "product": [
        "productname", "product", "itemname", "item", "description", "itemdescription",
        "productdescription", "title", "producttitle", "particulars", "commodity",
        "goods", "sku", "skuname", "article", "articlename", "name",
        "subcategory", "subcat", "subdepartment", "subgroup", "subclass",
        "brand", "brandname", "model", "modelname"
    ],
    "category": [
        "category", "productcategory", "itemcategory", "department", "dept",
        "segment", "producttype", "type", "group", "class", "division",
        "classification", "sector", "lineofbusiness", "vertical"
    ],
    "price": [
        "unitprice", "sellingprice", "price", "rate", "mrp", "cost", "unitcost",
        "priceperunit", "itemprice", "listprice", "saleprice", "retailprice",
        "unitrate", "priceeach", "costprice"
    ],
    "quantity": [
        "quantity", "qty", "unitssold", "quantitysold", "quantityordered",
        "units", "volume", "pieces", "count", "pcs", "numberofitems",
        "itemsold", "orderedquantity", "totalunits", "orderquantity"
    ],
    "revenue": [
        "revenue", "sales", "amount", "salesamount", "totalamount", "totalsales",
        "total", "totalrevenue", "linetotal", "itemtotal", "turnover",
        "netamount", "nettotal", "grandtotal", "value", "totalvalue",
        "orderamount", "ordersales"
    ],
    "date": [
        "orderdate", "date", "transactiondate", "invoicedate", "saledate",
        "billingdate", "purchasedate", "timestamp", "createdat", "datetime",
        "yearmonth", "period", "month", "transdate", "billdate", "dateofsale"
    ],
    "order_id": [
        "orderid", "transactionid", "invoiceno", "invoiceid", "billno",
        "receiptno", "ordernumber", "orderreference", "orderno", "transid",
        "billnumber", "receiptid", "transactionnumber", "id"
    ],
    "region": [
        "region", "state", "city", "location", "zone", "storelocation",
        "branch", "territory", "market", "country", "province", "district",
        "place", "store", "storename", "storeid", "area", "address"
    ]
}

def to_canonical(s):
    return re.sub(r"[^a-z0-9]", "", str(s).lower())

def auto_detect_columns(headers):
    mapping = {}
    canon_map = {to_canonical(h): h for h in headers}
    used_headers = set()

    for field, aliases in COLUMN_ALIASES.items():
        matched = None
        for alias in aliases:
            if alias in canon_map and canon_map[alias] not in used_headers:
                matched = canon_map[alias]
                break
        if not matched:
            for canon_h, orig_h in canon_map.items():
                if orig_h not in used_headers:
                    if any(alias in canon_h or canon_h in alias for alias in aliases):
                        matched = orig_h
                        break
        if matched:
            mapping[field] = matched
            used_headers.add(matched)
        else:
            mapping[field] = None

    if not mapping.get("product"):
        if mapping.get("category"):
            mapping["product"] = mapping["category"]
        else:
            for h in headers:
                if any(k in h.lower() for k in ["item", "prod", "desc", "name"]):
                    mapping["product"] = h
                    break

    return mapping

def clean_and_process_df(df, mapping=None):
    if mapping is None:
        mapping = auto_detect_columns(df.columns.tolist())

    col_prod = mapping.get("product")
    col_price = mapping.get("price")
    col_qty = mapping.get("quantity")
    col_rev = mapping.get("revenue")
    col_date = mapping.get("date")
    col_cat = mapping.get("category")
    col_order = mapping.get("order_id")
    col_reg = mapping.get("region")

    cleaned_records = []
    
    for idx, row in df.iterrows():
        # Product resolution with resilient fallback
        p_name = ""
        if col_prod and pd.notna(row.get(col_prod)):
            p_name = str(row[col_prod]).strip()
        if not p_name or p_name.lower() in ("nan", "null"):
            for col_name in df.columns:
                c_clean = to_canonical(col_name)
                if any(k in c_clean for k in ("subcategory", "product", "item", "description", "particulars")) and pd.notna(row[col_name]):
                    p_name = str(row[col_name]).strip()
                    break
        if not p_name or p_name.lower() in ("nan", "null"):
            if col_cat and pd.notna(row.get(col_cat)):
                p_name = str(row[col_cat]).strip()
            else:
                p_name = f"Retail Item #{idx + 1}"

        # Category resolution
        cat = "General"
        if col_cat and pd.notna(row.get(col_cat)):
            cat = str(row[col_cat]).strip()

        # Region resolution
        reg = "National"
        if col_reg and pd.notna(row.get(col_reg)):
            reg = str(row[col_reg]).strip()

        # Order ID resolution
        oid = f"ORD-{idx + 1001}"
        if col_order and pd.notna(row.get(col_order)):
            oid = str(row[col_order]).strip()

        # Clean Price
        price = 0.0
        if col_price and pd.notna(row.get(col_price)):
            try:
                price = float(re.sub(r"[^0-9.]", "", str(row[col_price])))
            except ValueError:
                price = 0.0

        # Clean Quantity
        qty = 1.0
        if col_qty and pd.notna(row.get(col_qty)):
            try:
                qty = float(re.sub(r"[^0-9.]", "", str(row[col_qty])))
                if qty <= 0:
                    qty = 1.0
            except ValueError:
                qty = 1.0

        # Clean Revenue
        rev = 0.0
        if col_rev and pd.notna(row.get(col_rev)):
            try:
                rev = float(re.sub(r"[^0-9.]", "", str(row[col_rev])))
            except ValueError:
                rev = 0.0

        # Derive symmetric values
        if rev <= 0 and price > 0 and qty > 0:
            rev = price * qty
        elif price <= 0 and rev > 0 and qty > 0:
            price = rev / qty

        # Clean Date
        date_obj = None
        date_str = None
        raw_d = None
        if col_date and pd.notna(row.get(col_date)):
            raw_d = str(row[col_date]).strip()
        else:
            for col_name in df.columns:
                c_clean = to_canonical(col_name)
                if any(k in c_clean for k in ("date", "time", "yearmonth", "month")) and pd.notna(row[col_name]):
                    raw_d = str(row[col_name]).strip()
                    break

        if raw_d and raw_d.lower() not in ("nan", "null"):
            for fmt in ("%Y-%m-%d", "%Y-%m", "%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y", "%Y/%m/%d", "%d.%m.%Y", "%d-%b-%Y", "%d-%B-%Y"):
                try:
                    dt = datetime.strptime(raw_d[:10] if len(raw_d) >= 10 and fmt != "%Y-%m" else raw_d, fmt)
                    date_obj = dt
                    date_str = dt.strftime("%Y-%m-%d")
                    break
                except ValueError:
                    continue

        if p_name and (rev > 0 or (price > 0 and qty > 0) or not math.isnan(rev)):
            cleaned_records.append({
                "id": idx + 1,
                "orderId": oid,
                "productName": p_name,
                "category": cat,
                "price": round(price, 2),
                "quantity": int(qty) if qty.is_integer() else round(qty, 2),
                "revenue": round(rev, 2),
                "date": date_str,
                "region": reg
            })

    return cleaned_records, mapping

def calculate_metrics(cleaned_rows):
    if not cleaned_rows:
        return {}

    total_revenue = sum(r["revenue"] for r in cleaned_rows)
    total_units = sum(r["quantity"] for r in cleaned_rows)
    
    products = {}
    categories = {}
    regions = {}
    orders = set()
    monthly = {}
    annual = {}

    for r in cleaned_rows:
        pname = r["productName"]
        cat = r["category"]
        reg = r["region"]
        orders.add(r["orderId"])

        # Product breakdown
        if pname not in products:
            products[pname] = {"name": pname, "category": cat, "totalRevenue": 0.0, "totalQuantity": 0, "orderCount": 0, "prices": []}
        products[pname]["totalRevenue"] += r["revenue"]
        products[pname]["totalQuantity"] += r["quantity"]
        products[pname]["orderCount"] += 1
        if r["price"] > 0:
            products[pname]["prices"].append(r["price"])

        # Category breakdown
        if cat not in categories:
            categories[cat] = {"category": cat, "totalRevenue": 0.0, "totalQuantity": 0, "count": 0}
        categories[cat]["totalRevenue"] += r["revenue"]
        categories[cat]["totalQuantity"] += r["quantity"]
        categories[cat]["count"] += 1

        # Region
        if reg not in regions:
            regions[reg] = {"region": reg, "totalRevenue": 0.0, "totalQuantity": 0}
        regions[reg]["totalRevenue"] += r["revenue"]
        regions[reg]["totalQuantity"] += r["quantity"]

        # Date trends
        if r["date"]:
            dt = datetime.strptime(r["date"], "%Y-%m-%d")
            y = dt.year
            ym = dt.strftime("%Y-%m")

            if ym not in monthly:
                monthly[ym] = {"month": ym, "revenue": 0.0, "quantity": 0}
            monthly[ym]["revenue"] += r["revenue"]
            monthly[ym]["quantity"] += r["quantity"]

            if y not in annual:
                annual[y] = {"year": y, "revenue": 0.0, "quantity": 0}
            annual[y]["revenue"] += r["revenue"]
            annual[y]["quantity"] += r["quantity"]

    product_summaries = []
    best_selling = {"name": "N/A", "quantity": 0}
    highest_rev = {"name": "N/A", "revenue": 0.0}

    for p in products.values():
        avg_price = float(np.mean(p["prices"])) if p["prices"] else 0.0
        share = (p["totalRevenue"] / total_revenue * 100) if total_revenue > 0 else 0.0
        
        if p["totalQuantity"] > best_selling["quantity"]:
            best_selling = {"name": p["name"], "quantity": p["totalQuantity"], "revenue": round(p["totalRevenue"], 2)}
        if p["totalRevenue"] > highest_rev["revenue"]:
            highest_rev = {"name": p["name"], "revenue": round(p["totalRevenue"], 2), "quantity": p["totalQuantity"]}

        product_summaries.append({
            "name": p["name"],
            "category": p["category"],
            "totalRevenue": round(p["totalRevenue"], 2),
            "totalQuantity": p["totalQuantity"],
            "orderCount": p["orderCount"],
            "avgPrice": round(avg_price, 2),
            "revenueContribution": round(share, 2)
        })

    product_summaries.sort(key=lambda x: x["totalRevenue"], reverse=True)

    category_summaries = [
        {
            "category": c["category"],
            "totalRevenue": round(c["totalRevenue"], 2),
            "totalQuantity": c["totalQuantity"],
            "percentage": round((c["totalRevenue"] / total_revenue * 100) if total_revenue > 0 else 0.0, 2)
        }
        for c in categories.values()
    ]
    category_summaries.sort(key=lambda x: x["totalRevenue"], reverse=True)

    regional_summaries = sorted([
        {"region": reg["region"], "totalRevenue": round(reg["totalRevenue"], 2), "totalQuantity": reg["totalQuantity"]}
        for reg in regions.values()
    ], key=lambda x: x["totalRevenue"], reverse=True)

    monthly_trends = sorted([
        {"month": m["month"], "revenue": round(m["revenue"], 2), "quantity": m["quantity"]}
        for m in monthly.values()
    ], key=lambda x: x["month"])

    annual_trends = sorted([
        {"year": a["year"], "revenue": round(a["revenue"], 2), "quantity": a["quantity"]}
        for a in annual.values()
    ], key=lambda x: x["year"])

    # YoY Growth
    growth = None
    if len(annual_trends) >= 2:
        prev_rev = annual_trends[-2]["revenue"]
        curr_rev = annual_trends[-1]["revenue"]
        if prev_rev > 0:
            growth = round(((curr_rev - prev_rev) / prev_rev) * 100, 2)

    avg_unit_price = (total_revenue / total_units) if total_units > 0 else 0.0
    avg_order_val = (total_revenue / len(orders)) if orders else 0.0

    return {
        "totalRevenue": round(total_revenue, 2),
        "totalUnits": total_units,
        "uniqueProductsCount": len(products),
        "avgUnitPrice": round(avg_unit_price, 2),
        "bestSellingProduct": best_selling,
        "highestRevenueProduct": highest_rev,
        "avgOrderValue": round(avg_order_val, 2),
        "salesGrowth": growth,
        "productSummaries": product_summaries,
        "categorySummaries": category_summaries,
        "regionalSummaries": regional_summaries,
        "monthlyTrends": monthly_trends,
        "annualTrends": annual_trends,
        "hasHistoricalDates": len(monthly_trends) > 0
    }

# --- ROUTES ---

@app.route("/", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "app": "Smart Bazaar Sales Analysis Backend",
        "domain": "Data Warehousing and Mining (DWM) College Mini Project",
        "version": "1.0.0",
        "currency": "INR (₹)",
        "author": "Aenose Joel Gurrala"
    })

@app.route("/api/sample", methods=["GET"])
def get_sample_data():
    """Returns sample retail sales CSV or JSON"""
    if os.path.exists(SAMPLE_FILE_PATH):
        try:
            df = pd.read_csv(SAMPLE_FILE_PATH)
            cleaned, mapping = clean_and_process_df(df)
            metrics = calculate_metrics(cleaned)
            return jsonify({
                "success": True,
                "isSample": True,
                "totalRows": len(df),
                "headers": df.columns.tolist(),
                "previewRows": df.head(10).to_dict(orient="records"),
                "detectedMapping": mapping,
                "cleanedRows": cleaned,
                "metrics": metrics
            })
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    return jsonify({"success": False, "error": "Sample file not found"}), 404

@app.route("/api/upload", methods=["POST"])
def upload_dataset():
    """Upload and process CSV dataset via multipart/form-data"""
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "error": "Empty file name"}), 400

    try:
        df = pd.read_csv(file)
        if df.empty:
            return jsonify({"success": False, "error": "The uploaded CSV file is empty"}), 400

        headers = df.columns.tolist()
        cleaned, mapping = clean_and_process_df(df)
        metrics = calculate_metrics(cleaned)

        return jsonify({
            "success": True,
            "filename": file.filename,
            "totalRows": len(df),
            "headers": headers,
            "previewRows": df.head(10).to_dict(orient="records"),
            "detectedMapping": mapping,
            "cleanedRows": cleaned,
            "metrics": metrics
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to process CSV: {str(e)}"}), 500

@app.route("/api/analyze", methods=["POST"])
def analyze_dataset():
    """Analyze provided cleaned JSON rows"""
    data = request.get_json(silent=True) or {}
    rows = data.get("rows", [])
    if not rows:
        return jsonify({"success": False, "error": "No rows provided for analysis"}), 400

    metrics = calculate_metrics(rows)
    return jsonify({"success": True, "metrics": metrics})

@app.route("/api/forecast", methods=["POST"])
def forecast_sales():
    """Perform OLS Linear Regression Sales Forecasting (5 or 7 years)"""
    data = request.get_json(silent=True) or {}
    rows = data.get("rows", [])
    years_to_forecast = int(data.get("years", 5))
    selected_product = data.get("product", "ALL")

    if not rows:
        return jsonify({"success": False, "error": "No data available for forecasting"}), 400

    if selected_product != "ALL":
        rows = [r for r in rows if r.get("productName") == selected_product]

    dated_rows = [r for r in rows if r.get("date")]
    if len(dated_rows) < 2:
        # Fallback to growth simulation
        current_rev = sum(r.get("revenue", 0) for r in rows)
        curr_year = datetime.now().year
        forecast_table = []
        chart_data = [{"year": str(curr_year), "actualRevenue": current_rev, "forecastRevenue": current_rev}]
        run_rev = current_rev
        for i in range(1, years_to_forecast + 1):
            future_y = curr_year + i
            run_rev *= 1.08
            row_item = {
                "year": str(future_y),
                "forecastYear": f"Year {i} ({future_y})",
                "actualRevenue": None,
                "forecastRevenue": round(run_rev, 2),
                "lowerBound": round(run_rev * 0.9, 2),
                "upperBound": round(run_rev * 1.1, 2)
            }
            forecast_table.append(row_item)
            chart_data.append(row_item)

        return jsonify({
            "isDataDriven": False,
            "methodName": "Scenario Growth Simulation (8% per annum)",
            "yearsToForecast": years_to_forecast,
            "selectedProduct": selected_product,
            "cagr": 8.0,
            "chartData": chart_data,
            "forecastTable": forecast_table
        })

    # Group by year
    year_map = {}
    for r in dated_rows:
        y = int(r["date"].split("-")[0])
        year_map[y] = year_map.get(y, 0.0) + r.get("revenue", 0.0)

    sorted_years = sorted(year_map.keys())
    if len(sorted_years) < 2:
        return jsonify({"isDataDriven": False, "error": "At least 2 distinct historical years are required for OLS regression."}), 400

    base_year = sorted_years[0]
    X = np.array([[y - base_year] for y in sorted_years])
    y = np.array([year_map[y] for y in sorted_years])

    model = LinearRegression()
    model.fit(X, y)
    r_squared = float(model.score(X, y))
    slope = float(model.coef_[0])
    intercept = float(model.intercept_)

    last_year = sorted_years[-1]
    last_rev = year_map[last_year]

    chart_data = [{"year": str(yr), "actualRevenue": round(year_map[yr], 2), "forecastRevenue": None} for yr in sorted_years]
    forecast_table = []

    for i in range(1, years_to_forecast + 1):
        future_y = last_year + i
        pred = float(model.predict([[future_y - base_year]])[0])
        if pred <= 0:
            pred = last_rev * (1.03 ** i)
        
        margin = pred * (0.05 * i)
        row_item = {
            "year": str(future_y),
            "forecastYear": f"Year {i} ({future_y})",
            "actualRevenue": None,
            "forecastRevenue": round(pred, 2),
            "lowerBound": round(max(0, pred - margin), 2),
            "upperBound": round(pred + margin, 2)
        }
        forecast_table.append(row_item)
        chart_data.append(row_item)

    final_rev = forecast_table[-1]["forecastRevenue"]
    cagr = round(((final_rev / last_rev) ** (1 / years_to_forecast) - 1) * 100, 2) if last_rev > 0 else 0.0

    return jsonify({
        "isDataDriven": True,
        "methodName": "Ordinary Least Squares (OLS) Linear Regression",
        "yearsToForecast": years_to_forecast,
        "selectedProduct": selected_product,
        "rSquared": round(r_squared, 3),
        "slope": round(slope, 2),
        "intercept": round(intercept, 2),
        "baselineRevenue": round(last_rev, 2),
        "cagr": cagr,
        "chartData": chart_data,
        "forecastTable": forecast_table
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
