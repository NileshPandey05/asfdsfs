import math
from statistics import mean
from typing import Optional, List, Tuple

def calculate_metrics(pairs: List[Tuple[float, float]]) -> dict:
    """
    Calculate MAE, RMSE, and MBE for forecast-actual pairs.
    Error convention: error = forecast - actual.
    - Overforecast: error > 0
    - Underforecast: error < 0
    - Incomplete pairs must be excluded prior to passing.
    """
    errors = [forecast - actual for forecast, actual in pairs]
    if not errors:
        return {
            "sample_count": 0,
            "mae_mw": None,
            "rmse_mw": None,
            "mbe_mw": None,
        }
    
    count = len(errors)
    mae = mean(abs(e) for e in errors)
    rmse = math.sqrt(mean(e * e for e in errors))
    mbe = mean(errors)
    
    return {
        "sample_count": count,
        "mae_mw": round(mae, 4),
        "rmse_mw": round(rmse, 4),
        "mbe_mw": round(mbe, 4),
    }

def calculate_error_distribution(pairs: List[Tuple[float, float]], num_bins: int = 10) -> List[dict]:
    """
    Generates histogram buckets for forecast errors (forecast - actual).
    """
    errors = [forecast - actual for forecast, actual in pairs]
    if not errors:
        return []
    
    min_err = min(errors)
    max_err = max(errors)
    
    # If all errors are identical
    if math.isclose(min_err, max_err):
        return [{
            "bin_range": f"{round(min_err, 1)} MW",
            "count": len(errors),
            "lower_mw": min_err,
            "upper_mw": max_err
        }]
    
    step = (max_err - min_err) / num_bins
    buckets = []
    
    for i in range(num_bins):
        low = min_err + i * step
        high = min_err + (i + 1) * step
        # For the last bin, include the upper edge
        if i == num_bins - 1:
            cnt = sum(1 for e in errors if low <= e <= high)
        else:
            cnt = sum(1 for e in errors if low <= e < high)
        
        buckets.append({
            "bin_range": f"[{round(low, 0):+0.0f}, {round(high, 0):+0.0f})",
            "count": cnt,
            "lower_mw": round(low, 1),
            "upper_mw": round(high, 1)
        })
        
    return buckets
