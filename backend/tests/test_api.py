from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "timestamp" in data

def test_overview_endpoint():
    res = client.get("/api/overview?month=2026-01&cutoff_hour=11&resolution_mode=exact")
    assert res.status_code == 200
    data = res.json()
    assert "metrics" in data
    assert "coverage" in data
    assert "series" in data
    assert data["coverage"]["expected_intervals"] == 1488
    # Exact mode: 744 matched, 744 no_eligible_forecast
    assert data["coverage"]["matched_intervals"] == 744
    assert data["coverage"]["no_eligible_forecast"] == 744
    assert data["metrics"]["sample_count"] == 744
    assert data["metrics"]["mae_mw"] > 0
    assert data["metrics"]["rmse_mw"] > 0
    assert len(data["series"]) == 1488

def test_overview_hourly_block_mode():
    res = client.get("/api/overview?month=2026-01&cutoff_hour=11&resolution_mode=hourly_block")
    assert res.status_code == 200
    data = res.json()
    assert data["coverage"]["matched_intervals"] == 1488
    assert data["coverage"]["coverage_percentage"] == 100.0

def test_forecasts_date_filter():
    res = client.get("/api/forecasts?date=2026-01-15&month=2026-01")
    assert res.status_code == 200
    data = res.json()
    assert data["date_filter"] == "2026-01-15"
    assert data["total_count"] == 48  # 48 half-hours in a day
    # Verify each row has valid fields
    for row in data["rows"]:
        assert row["start_time"].startswith("2026-01-15")
        assert "status" in row
        assert "decision_cutoff" in row

def test_accuracy_endpoint():
    res = client.get("/api/accuracy?month=2026-01")
    assert res.status_code == 200
    data = res.json()
    assert "metrics" in data
    assert "daily_metrics" in data
    assert len(data["daily_metrics"]) == 31
    assert "distribution" in data
    assert len(data["distribution"]) > 0

def test_interval_vintages_audit():
    res = client.get("/api/vintages?delivery_start=2026-01-15T14:00:00Z&cutoff_hour=11")
    assert res.status_code == 200
    data = res.json()
    assert "delivery_start" in data
    assert "vintages" in data
    assert len(data["vintages"]) > 0
    # Exactly one vintage should be selected if eligible exists
    selected_count = sum(1 for v in data["vintages"] if v["is_selected"])
    assert selected_count == 1
    # Selected vintage must be marked eligible
    for v in data["vintages"]:
        if v["is_selected"]:
            assert v["is_eligible"] is True
