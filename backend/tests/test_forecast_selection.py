from datetime import datetime, timezone
import pytest
from app.schemas.wind import WindForecast
from app.services.forecast_selection import decision_cutoff_for, select_forecast_vintage

def test_decision_cutoff_calculation():
    # Delivery on Jan 15 at 14:00 UTC
    delivery = datetime(2026, 1, 15, 14, 0, tzinfo=timezone.utc)
    # Day-ahead at 11:00 UTC -> Jan 14 at 11:00 UTC
    cutoff = decision_cutoff_for(delivery, cutoff_hour=11, cutoff_minute=0)
    assert cutoff == datetime(2026, 1, 14, 11, 0, tzinfo=timezone.utc)

def test_select_forecast_vintage_illustrative_example():
    """
    Illustrative example from Section 6 of specification:
    Delivery interval: Jan 15 at 14:00.
    Forecasts published:
    - Jan 13, 10:00: 5,800 MW
    - Jan 14, 08:00: 6,100 MW
    - Jan 14, 12:00: 6,300 MW (after 11:00 cutoff)
    - Jan 15, 08:00: 6,700 MW (after 11:00 cutoff)
    Configured cutoff: Jan 14 at 11:00 UTC.
    Expected selection: Jan 14, 08:00 (6,100 MW).
    """
    delivery = datetime(2026, 1, 15, 14, 0, tzinfo=timezone.utc)
    cutoff = datetime(2026, 1, 14, 11, 0, tzinfo=timezone.utc)
    
    vintages = [
        WindForecast(
            start_time=delivery,
            publish_time=datetime(2026, 1, 13, 10, 0, tzinfo=timezone.utc),
            generation_mw=5800.0
        ),
        WindForecast(
            start_time=delivery,
            publish_time=datetime(2026, 1, 14, 8, 0, tzinfo=timezone.utc),
            generation_mw=6100.0
        ),
        WindForecast(
            start_time=delivery,
            publish_time=datetime(2026, 1, 14, 12, 0, tzinfo=timezone.utc),
            generation_mw=6300.0
        ),
        WindForecast(
            start_time=delivery,
            publish_time=datetime(2026, 1, 15, 8, 0, tzinfo=timezone.utc),
            generation_mw=6700.0
        ),
    ]
    
    selected, total_count, eligible_count = select_forecast_vintage(delivery, vintages, cutoff)
    assert selected is not None
    assert total_count == 4
    assert eligible_count == 2
    assert selected.generation_mw == 6100.0
    assert selected.publish_time == datetime(2026, 1, 14, 8, 0, tzinfo=timezone.utc)

def test_no_eligible_forecast_excludes_future_leakage():
    delivery = datetime(2026, 1, 15, 14, 0, tzinfo=timezone.utc)
    cutoff = datetime(2026, 1, 14, 11, 0, tzinfo=timezone.utc)
    
    # Only vintages published AFTER cutoff
    vintages = [
        WindForecast(
            start_time=delivery,
            publish_time=datetime(2026, 1, 14, 12, 0, tzinfo=timezone.utc),
            generation_mw=6300.0
        )
    ]
    selected, total_count, eligible_count = select_forecast_vintage(delivery, vintages, cutoff)
    assert selected is None
    assert total_count == 1
    assert eligible_count == 0
