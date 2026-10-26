import math
import pytest
from app.services.metrics import calculate_metrics, calculate_error_distribution

def test_metrics_specification_example():
    """
    Verify exact test example from Section 8 of the specification:
    Forecasts: 7,000, 6,000, 5,500 MW
    Actuals: 6,500, 6,200, 5,000 MW
    Errors: +500, -200, +500 MW
    Expected:
    - MAE = 400 MW
    - MBE ≈ +266.6667 MW
    - RMSE ≈ 424.2641 MW
    """
    pairs = [
        (7000.0, 6500.0),
        (6000.0, 6200.0),
        (5500.0, 5000.0)
    ]
    res = calculate_metrics(pairs)
    
    assert res["sample_count"] == 3
    assert math.isclose(res["mae_mw"], 400.0, rel_tol=1e-3)
    assert math.isclose(res["mbe_mw"], 266.6667, rel_tol=1e-3)
    assert math.isclose(res["rmse_mw"], 424.2641, rel_tol=1e-3)

def test_metrics_empty_input():
    res = calculate_metrics([])
    assert res["sample_count"] == 0
    assert res["mae_mw"] is None
    assert res["rmse_mw"] is None
    assert res["mbe_mw"] is None

def test_metrics_sign_convention():
    """
    Overforecast: forecast > actual -> positive error (+100)
    Underforecast: forecast < actual -> negative error (-100)
    """
    pairs = [
        (1100.0, 1000.0),  # +100
        (900.0, 1000.0)    # -100
    ]
    res = calculate_metrics(pairs)
    assert res["sample_count"] == 2
    assert res["mae_mw"] == 100.0
    assert res["mbe_mw"] == 0.0
    assert res["rmse_mw"] == 100.0

def test_error_distribution():
    pairs = [
        (1200.0, 1000.0),
        (1100.0, 1000.0),
        (1000.0, 1000.0),
        (900.0, 1000.0)
    ]
    buckets = calculate_error_distribution(pairs, num_bins=4)
    assert len(buckets) == 4
    total_count = sum(b["count"] for b in buckets)
    assert total_count == 4
