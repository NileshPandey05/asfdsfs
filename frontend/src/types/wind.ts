export interface PeriodInfo {
  month: string;
  decision_date_from: string;
  decision_date_to: string;
  cutoff_rule: string;
  resolution_mode: string;
  data_source: string;
  retrieval_time?: string | null;
}

export interface MetricsSummary {
  sample_count: number;
  mae_mw: number | null;
  rmse_mw: number | null;
  mbe_mw: number | null;
}

export interface CoverageSummary {
  expected_intervals: number;
  matched_intervals: number;
  no_eligible_forecast: number;
  missing_actual: number;
  missing_both: number;
  coverage_percentage: number;
}

export interface ForecastAnalysisRow {
  start_time: string;
  decision_cutoff: string;
  selected_publish_time: string | null;
  forecast_mw: number | null;
  actual_mw: number | null;
  error_mw: number | null;
  status: 'matched' | 'no_eligible_forecast' | 'missing_actual' | 'missing_both';
  all_vintages_count: number;
  eligible_vintages_count: number;
}

export interface DailyMetricRow {
  date: string;
  sample_count: number;
  mae_mw: number | null;
  rmse_mw: number | null;
  mbe_mw: number | null;
  avg_actual_mw: number | null;
  avg_forecast_mw: number | null;
}

export interface ErrorDistributionBucket {
  bin_range: string;
  count: number;
  lower_mw: number;
  upper_mw: number;
}

export interface OverviewResponse {
  period: PeriodInfo;
  metrics: MetricsSummary;
  coverage: CoverageSummary;
  series: ForecastAnalysisRow[];
  daily_metrics: DailyMetricRow[];
  methodology: {
    error_convention: string;
    overforecast_definition: string;
    underforecast_definition: string;
    cutoff_description: string;
    no_zero_filling: boolean;
    resolution_explanation: string;
  };
}

export interface ForecastsResponse {
  period: PeriodInfo;
  date_filter: string | null;
  total_count: number;
  rows: ForecastAnalysisRow[];
}

export interface AccuracyResponse {
  period: PeriodInfo;
  metrics: MetricsSummary;
  coverage: CoverageSummary;
  daily_metrics: DailyMetricRow[];
  distribution: ErrorDistributionBucket[];
}

export interface VintageDetail {
  publish_time: string;
  generation_mw: number;
  is_eligible: boolean;
  is_selected: boolean;
  time_before_cutoff_minutes?: number | null;
}

export interface VintageHistoryResponse {
  delivery_start: string;
  decision_cutoff: string;
  actual_mw: number | null;
  selected_publish_time: string | null;
  vintages: VintageDetail[];
}
