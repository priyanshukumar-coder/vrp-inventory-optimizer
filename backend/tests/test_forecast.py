from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_forecast_sample_endpoint():
    response = client.get("/api/forecast/sample")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "rmse" in data["metrics"]
    assert "mae" in data["metrics"]
    assert "r2_score" in data["metrics"]
    assert "mape" in data["metrics"]
    assert "feature_importances" in data
    assert "dealer_summaries" in data
    assert "daily_forecasts" in data
    assert len(data["dealer_summaries"]) > 0
    assert len(data["daily_forecasts"]) > 0
