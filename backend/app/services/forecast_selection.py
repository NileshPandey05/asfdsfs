from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple
from app.schemas.wind import WindForecast, ForecastAnalysisRow

def decision_cutoff_for(
    delivery_start: datetime,
    cutoff_hour: int = 11,
    cutoff_minute: int = 0
) -> datetime:
    """
    Derives the day-ahead decision cutoff for a given delivery interval start time.
    Standard rule for UK Day-Ahead power procurement:
    Decisions for delivery on Day D are finalized on Day D - 1 at the market auction gate closure
    (typically 11:00 UTC for EPEX SPOT GB Day-Ahead auction).
    """
    # Ensure UTC timezone awareness
    if delivery_start.tzinfo is None:
        delivery_start = delivery_start.replace(tzinfo=timezone.utc)
    else:
        delivery_start = delivery_start.astimezone(timezone.utc)
        
    delivery_date = delivery_start.date()
    # Prior day D-1
    decision_date = delivery_date - timedelta(days=1)
    
    return datetime(
        year=decision_date.year,
        month=decision_date.month,
        day=decision_date.day,
        hour=cutoff_hour,
        minute=cutoff_minute,
        second=0,
        microsecond=0,
        tzinfo=timezone.utc
    )

def select_forecast_vintage(
    delivery_start: datetime,
    forecast_vintages: List[WindForecast],
    cutoff: datetime
) -> Tuple[Optional[WindForecast], int, int]:
    """
    Selects the latest eligible forecast vintage published on or before the cutoff.
    Returns: (selected_vintage, total_vintages_count, eligible_vintages_count)
    """
    total_count = len(forecast_vintages)
    eligible = [f for f in forecast_vintages if f.publish_time <= cutoff]
    eligible_count = len(eligible)
    
    if not eligible:
        return None, total_count, 0
        
    # Greatest publish_time wins (newest available prior to gate closure)
    selected = max(eligible, key=lambda f: f.publish_time)
    return selected, total_count, eligible_count
