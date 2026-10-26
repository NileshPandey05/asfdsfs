from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class WindActual(BaseModel):
    start_time: datetime
    publish_time: Optional[datetime] = None
    settlement_date: Optional[str] = None
    settlement_period: Optional[int] = None
    fuel_type: str = "WIND"
    generation_mw: float

class WindForecast(BaseModel):
    start_time: datetime
    publish_time: datetime
    generation_mw: float

class VintageDetail(BaseModel):
    publish_time: datetime
    generation_mw: float
    is_eligible: bool
    is_selected: bool
    time_before_cutoff_minutes: Optional[float] = None

class ForecastAnalysisRow(BaseModel):
    start_time: datetime
    decision_cutoff: datetime
    selected_publish_time: Optional[datetime] = None
    forecast_mw: Optional[float] = None
    actual_mw: Optional[float] = None
    error_mw: Optional[float] = None
    status: str = Field(
        ...,
        description="One of: 'matched', 'no_eligible_forecast', 'missing_actual', 'missing_both'"
    )
    all_vintages_count: int = 0
    eligible_vintages_count: int = 0

class MetricsSummary(BaseModel):
    sample_count: int
    mae_mw: Optional[float] = None
    rmse_mw: Optional[float] = None
    mbe_mw: Optional[float] = None

class CoverageSummary(BaseModel):
    expected_intervals: int
    matched_intervals: int
    no_eligible_forecast: int
    missing_actual: int
    missing_both: int = 0
    coverage_percentage: float

class PeriodInfo(BaseModel):
    month: str
    decision_date_from: str
    decision_date_to: str
    cutoff_rule: str
    resolution_mode: str
    data_source: str
    retrieval_time: Optional[str] = None

class DailyMetricRow(BaseModel):
    date: str
    sample_count: int
    mae_mw: Optional[float] = None
    rmse_mw: Optional[float] = None
    mbe_mw: Optional[float] = None
    avg_actual_mw: Optional[float] = None
    avg_forecast_mw: Optional[float] = None

class ErrorDistributionBucket(BaseModel):
    bin_range: str
    count: int
    lower_mw: float
    upper_mw: float

class OverviewResponse(BaseModel):
    period: PeriodInfo
    metrics: MetricsSummary
    coverage: CoverageSummary
    series: List[ForecastAnalysisRow]
    daily_metrics: List[DailyMetricRow]
    methodology: dict

class ForecastsResponse(BaseModel):
    period: PeriodInfo
    date_filter: Optional[str] = None
    total_count: int
    rows: List[ForecastAnalysisRow]

class AccuracyResponse(BaseModel):
    period: PeriodInfo
    metrics: MetricsSummary
    coverage: CoverageSummary
    daily_metrics: List[DailyMetricRow]
    distribution: List[ErrorDistributionBucket]

class VintageHistoryResponse(BaseModel):
    delivery_start: datetime
    decision_cutoff: datetime
    actual_mw: Optional[float] = None
    selected_publish_time: Optional[datetime] = None
    vintages: List[VintageDetail]
