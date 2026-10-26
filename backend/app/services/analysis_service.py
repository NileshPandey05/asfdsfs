import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional, Tuple, Any
from app.schemas.wind import (
    WindActual,
    WindForecast,
    ForecastAnalysisRow,
    MetricsSummary,
    CoverageSummary,
    PeriodInfo,
    DailyMetricRow,
    OverviewResponse,
    ForecastsResponse,
    AccuracyResponse,
    VintageDetail,
    VintageHistoryResponse
)
from app.services.forecast_selection import decision_cutoff_for, select_forecast_vintage
from app.services.metrics import calculate_metrics, calculate_error_distribution
from app.services.ingestion import IngestionService

logger = logging.getLogger(__name__)

class AnalysisService:
    def __init__(self, ingestion_service: Optional[IngestionService] = None):
        self.ingestion = ingestion_service or IngestionService()

    async def get_overview(
        self,
        month: str = "2026-01",
        cutoff_hour: int = 11,
        cutoff_minute: int = 0,
        resolution_mode: str = "exact",
        force_live: bool = False
    ) -> OverviewResponse:
        actuals, forecasts, meta = await self.ingestion.load_live_or_snapshot(
            force_live=force_live, month=month
        )
        
        rows = self._build_analysis_rows(
            actuals=actuals,
            forecasts=forecasts,
            month=month,
            cutoff_hour=cutoff_hour,
            cutoff_minute=cutoff_minute,
            resolution_mode=resolution_mode
        )
        
        # Calculate summary metrics on matched rows
        matched_pairs = [
            (r.forecast_mw, r.actual_mw)
            for r in rows
            if r.status == "matched" and r.forecast_mw is not None and r.actual_mw is not None
        ]
        
        metrics_dict = calculate_metrics(matched_pairs)
        metrics = MetricsSummary(**metrics_dict)
        
        # Calculate coverage summary
        expected_count = len(rows)
        matched_count = len(matched_pairs)
        no_eligible_count = sum(1 for r in rows if r.status == "no_eligible_forecast")
        missing_actual_count = sum(1 for r in rows if r.status == "missing_actual")
        missing_both_count = sum(1 for r in rows if r.status == "missing_both")
        coverage_pct = round((matched_count / expected_count * 100.0) if expected_count > 0 else 0.0, 2)
        
        coverage = CoverageSummary(
            expected_intervals=expected_count,
            matched_intervals=matched_count,
            no_eligible_forecast=no_eligible_count,
            missing_actual=missing_actual_count,
            missing_both=missing_both_count,
            coverage_percentage=coverage_pct
        )
        
        daily_metrics = self._calculate_daily_metrics(rows)
        
        period = PeriodInfo(
            month=month,
            decision_date_from=f"{month}-01",
            decision_date_to=f"{month}-31",
            cutoff_rule=f"Day-Ahead (D-1) at {cutoff_hour:02d}:{cutoff_minute:02d} UTC",
            resolution_mode="Exact startTime match (:00 only)" if resolution_mode == "exact" else "Hourly block mapping (:00 and :30)",
            data_source=meta.get("source", "Elexon Insights API"),
            retrieval_time=meta.get("retrieved_at")
        )
        
        methodology = {
            "error_convention": "forecast_minus_actual",
            "overforecast_definition": "positive error (forecast > actual)",
            "underforecast_definition": "negative error (forecast < actual)",
            "cutoff_description": f"Forecast published on or before {cutoff_hour:02d}:{cutoff_minute:02d} UTC on day D-1",
            "no_zero_filling": True,
            "resolution_explanation": (
                "WINDFOR is published at hourly resolution (:00:00Z) while FUELHH actuals are half-hourly. "
                "In exact mode, :30:00Z intervals are classified as no_eligible_forecast per Acceptance Criterion A4 & A6. "
                "In hourly_block mode, the hourly forecast spans both settlement periods."
            )
        }
        
        return OverviewResponse(
            period=period,
            metrics=metrics,
            coverage=coverage,
            series=rows,
            daily_metrics=daily_metrics,
            methodology=methodology
        )

    async def get_forecasts(
        self,
        date_filter: Optional[str] = None,
        month: str = "2026-01",
        cutoff_hour: int = 11,
        cutoff_minute: int = 0,
        resolution_mode: str = "exact",
        force_live: bool = False
    ) -> ForecastsResponse:
        actuals, forecasts, meta = await self.ingestion.load_live_or_snapshot(
            force_live=force_live, month=month
        )
        rows = self._build_analysis_rows(
            actuals=actuals,
            forecasts=forecasts,
            month=month,
            cutoff_hour=cutoff_hour,
            cutoff_minute=cutoff_minute,
            resolution_mode=resolution_mode
        )
        
        if date_filter:
            rows = [r for r in rows if r.start_time.strftime("%Y-%m-%d") == date_filter]
            
        period = PeriodInfo(
            month=month,
            decision_date_from=f"{month}-01",
            decision_date_to=f"{month}-31",
            cutoff_rule=f"Day-Ahead (D-1) at {cutoff_hour:02d}:{cutoff_minute:02d} UTC",
            resolution_mode=resolution_mode,
            data_source=meta.get("source", "Elexon Insights API"),
            retrieval_time=meta.get("retrieved_at")
        )
        
        return ForecastsResponse(
            period=period,
            date_filter=date_filter,
            total_count=len(rows),
            rows=rows
        )

    async def get_accuracy(
        self,
        month: str = "2026-01",
        cutoff_hour: int = 11,
        cutoff_minute: int = 0,
        resolution_mode: str = "exact",
        force_live: bool = False
    ) -> AccuracyResponse:
        overview = await self.get_overview(
            month=month,
            cutoff_hour=cutoff_hour,
            cutoff_minute=cutoff_minute,
            resolution_mode=resolution_mode,
            force_live=force_live
        )
        
        matched_pairs = [
            (r.forecast_mw, r.actual_mw)
            for r in overview.series
            if r.status == "matched" and r.forecast_mw is not None and r.actual_mw is not None
        ]
        
        dist = calculate_error_distribution(matched_pairs, num_bins=12)
        
        return AccuracyResponse(
            period=overview.period,
            metrics=overview.metrics,
            coverage=overview.coverage,
            daily_metrics=overview.daily_metrics,
            distribution=dist
        )

    async def get_interval_vintages(
        self,
        delivery_start: datetime,
        cutoff_hour: int = 11,
        cutoff_minute: int = 0,
        force_live: bool = False
    ) -> VintageHistoryResponse:
        """
        Returns all forecast publication vintages for a specific interval,
        tagging which ones were eligible on or before the cutoff, and highlighting
        which one was selected.
        """
        actuals, forecasts, _ = await self.ingestion.load_live_or_snapshot(force_live=force_live)
        
        cutoff = decision_cutoff_for(delivery_start, cutoff_hour, cutoff_minute)
        
        # Find actual for this interval
        actual_val = None
        for a in actuals:
            if a.start_time == delivery_start:
                actual_val = a.generation_mw
                break
                
        # Find all forecasts targeting this delivery_start (or hour if :30)
        target_st = delivery_start if delivery_start.minute == 0 else delivery_start.replace(minute=0, second=0)
        vintages_found = [f for f in forecasts if f.start_time == target_st]
        
        eligible_vintages = [f for f in vintages_found if f.publish_time <= cutoff]
        selected_vintage = max(eligible_vintages, key=lambda f: f.publish_time) if eligible_vintages else None
        
        details: List[VintageDetail] = []
        for v in sorted(vintages_found, key=lambda f: f.publish_time):
            is_elig = v.publish_time <= cutoff
            is_sel = selected_vintage is not None and v.publish_time == selected_vintage.publish_time
            diff_mins = (cutoff - v.publish_time).total_seconds() / 60.0
            details.append(VintageDetail(
                publish_time=v.publish_time,
                generation_mw=v.generation_mw,
                is_eligible=is_elig,
                is_selected=is_sel,
                time_before_cutoff_minutes=round(diff_mins, 1)
            ))
            
        return VintageHistoryResponse(
            delivery_start=delivery_start,
            decision_cutoff=cutoff,
            actual_mw=actual_val,
            selected_publish_time=selected_vintage.publish_time if selected_vintage else None,
            vintages=details
        )

    def _build_analysis_rows(
        self,
        actuals: List[WindActual],
        forecasts: List[WindForecast],
        month: str,
        cutoff_hour: int,
        cutoff_minute: int,
        resolution_mode: str
    ) -> List[ForecastAnalysisRow]:
        # Index actuals by start_time
        actual_map: Dict[datetime, float] = {a.start_time: a.generation_mw for a in actuals}
        
        # Index forecasts by target start_time
        forecasts_by_start: Dict[datetime, List[WindForecast]] = {}
        for f in forecasts:
            if f.start_time not in forecasts_by_start:
                forecasts_by_start[f.start_time] = []
            forecasts_by_start[f.start_time].append(f)
            
        # Determine all expected half-hour intervals in month
        year_val, month_val = map(int, month.split("-"))
        start_dt = datetime(year_val, month_val, 1, 0, 0, 0, tzinfo=timezone.utc)
        if month_val == 12:
            end_dt = datetime(year_val + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        else:
            end_dt = datetime(year_val, month_val + 1, 1, 0, 0, 0, tzinfo=timezone.utc)
            
        current = start_dt
        rows: List[ForecastAnalysisRow] = []
        
        while current < end_dt:
            cutoff = decision_cutoff_for(current, cutoff_hour, cutoff_minute)
            actual_val = actual_map.get(current)
            
            # Identify candidate forecasts
            if resolution_mode == "exact":
                candidates = forecasts_by_start.get(current, [])
            else:
                # Hourly block mode: if minute is 30, also look up hour :00
                hour_key = current.replace(minute=0, second=0)
                candidates = forecasts_by_start.get(hour_key, [])
                
            selected_f, total_v, eligible_v = select_forecast_vintage(current, candidates, cutoff)
            
            forecast_val = selected_f.generation_mw if selected_f else None
            selected_pt = selected_f.publish_time if selected_f else None
            
            if forecast_val is not None and actual_val is not None:
                status = "matched"
                error_val = round(forecast_val - actual_val, 2)
            elif forecast_val is None and actual_val is not None:
                status = "no_eligible_forecast"
                error_val = None
            elif forecast_val is not None and actual_val is None:
                status = "missing_actual"
                error_val = None
            else:
                status = "missing_both"
                error_val = None
                
            rows.append(ForecastAnalysisRow(
                start_time=current,
                decision_cutoff=cutoff,
                selected_publish_time=selected_pt,
                forecast_mw=round(forecast_val, 2) if forecast_val is not None else None,
                actual_mw=round(actual_val, 2) if actual_val is not None else None,
                error_mw=error_val,
                status=status,
                all_vintages_count=total_v,
                eligible_vintages_count=eligible_v
            ))
            
            current += timedelta(minutes=30)
            
        return rows

    def _calculate_daily_metrics(self, rows: List[ForecastAnalysisRow]) -> List[DailyMetricRow]:
        by_date: Dict[str, List[ForecastAnalysisRow]] = {}
        for r in rows:
            d_str = r.start_time.strftime("%Y-%m-%d")
            if d_str not in by_date:
                by_date[d_str] = []
            by_date[d_str].append(r)
            
        results: List[DailyMetricRow] = []
        for d_str in sorted(by_date.keys()):
            day_rows = by_date[d_str]
            matched = [
                (r.forecast_mw, r.actual_mw)
                for r in day_rows
                if r.status == "matched" and r.forecast_mw is not None and r.actual_mw is not None
            ]
            m = calculate_metrics(matched)
            avg_act = round(sum(p[1] for p in matched) / len(matched), 2) if matched else None
            avg_fct = round(sum(p[0] for p in matched) / len(matched), 2) if matched else None
            
            results.append(DailyMetricRow(
                date=d_str,
                sample_count=m["sample_count"],
                mae_mw=m["mae_mw"],
                rmse_mw=m["rmse_mw"],
                mbe_mw=m["mbe_mw"],
                avg_actual_mw=avg_act,
                avg_forecast_mw=avg_fct
            ))
            
        return results
