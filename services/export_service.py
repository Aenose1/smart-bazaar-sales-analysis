from __future__ import annotations
import io
import pandas as pd

def dataframe_to_csv(df: pd.DataFrame) -> bytes:
    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    return buffer.getvalue().encode("utf-8-sig")

def analysis_to_csv(analysis: dict, kind: str) -> bytes:
    if kind == "products":
        rows = analysis.get("product_summaries", [])
        return dataframe_to_csv(pd.DataFrame(rows))
    if kind == "monthly":
        return dataframe_to_csv(pd.DataFrame(analysis.get("monthly_trends", [])))
    if kind == "annual":
        return dataframe_to_csv(pd.DataFrame(analysis.get("annual_trends", [])))
    if kind == "forecast":
        return dataframe_to_csv(pd.DataFrame(analysis.get("forecast", [])))
    raise ValueError("Unsupported export type. Use products, monthly, annual, or forecast.")
