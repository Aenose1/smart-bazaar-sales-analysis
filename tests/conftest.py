import io, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import pytest
from app import app, DATASETS

@pytest.fixture
def client():
    app.config.update(TESTING=True)
    with app.test_client() as client:
        yield client
    DATASETS.clear()

@pytest.fixture
def sample_csv():
    # 24 monthly observations to exercise the forecast pipeline.
    lines = ["Product_Name,Unit_Price,Quantity,Order_Date,Category,Order_ID"]
    for i in range(24):
        year = 2023 + i // 12
        month = i % 12 + 1
        lines.append(f"Tea,100,{10+i},01/{month:02d}/{year},Grocery,O{i+1}")
    return ("\n".join(lines)).encode("utf-8")
