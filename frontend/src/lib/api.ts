import {
  OverviewResponse,
  ForecastsResponse,
  AccuracyResponse,
  VintageHistoryResponse
} from '../types/wind';

const rawApiUrl = (import.meta.env.VITE_API_URL || '/api').trim();
const API_BASE = rawApiUrl.endsWith('/api')
  ? rawApiUrl.replace(/\/+$/, '')
  : rawApiUrl.replace(/\/+$/, '') + (rawApiUrl.startsWith('http') ? '/api' : '');

export interface QueryOptions {
  month?: string;
  cutoffHour?: number;
  cutoffMinute?: number;
  resolutionMode?: 'exact' | 'hourly_block';
  forceLive?: boolean;
}

export async function fetchOverview(opts: QueryOptions = {}): Promise<OverviewResponse> {
  const params = new URLSearchParams();
  if (opts.month) params.append('month', opts.month);
  if (opts.cutoffHour !== undefined) params.append('cutoff_hour', opts.cutoffHour.toString());
  if (opts.cutoffMinute !== undefined) params.append('cutoff_minute', opts.cutoffMinute.toString());
  if (opts.resolutionMode) params.append('resolution_mode', opts.resolutionMode);
  if (opts.forceLive) params.append('force_live', 'true');

  const res = await fetch(`${API_BASE}/overview?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch overview (${res.status})`);
  }
  return res.json();
}

export async function fetchForecasts(
  dateFilter?: string,
  opts: QueryOptions = {}
): Promise<ForecastsResponse> {
  const params = new URLSearchParams();
  if (dateFilter) params.append('date', dateFilter);
  if (opts.month) params.append('month', opts.month);
  if (opts.cutoffHour !== undefined) params.append('cutoff_hour', opts.cutoffHour.toString());
  if (opts.cutoffMinute !== undefined) params.append('cutoff_minute', opts.cutoffMinute.toString());
  if (opts.resolutionMode) params.append('resolution_mode', opts.resolutionMode);
  if (opts.forceLive) params.append('force_live', 'true');

  const res = await fetch(`${API_BASE}/forecasts?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch forecasts (${res.status})`);
  }
  return res.json();
}

export async function fetchAccuracy(opts: QueryOptions = {}): Promise<AccuracyResponse> {
  const params = new URLSearchParams();
  if (opts.month) params.append('month', opts.month);
  if (opts.cutoffHour !== undefined) params.append('cutoff_hour', opts.cutoffHour.toString());
  if (opts.cutoffMinute !== undefined) params.append('cutoff_minute', opts.cutoffMinute.toString());
  if (opts.resolutionMode) params.append('resolution_mode', opts.resolutionMode);
  if (opts.forceLive) params.append('force_live', 'true');

  const res = await fetch(`${API_BASE}/accuracy?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch accuracy (${res.status})`);
  }
  return res.json();
}

export async function fetchVintages(
  deliveryStart: string,
  cutoffHour: number = 11,
  forceLive: boolean = false
): Promise<VintageHistoryResponse> {
  const params = new URLSearchParams();
  params.append('delivery_start', deliveryStart);
  params.append('cutoff_hour', cutoffHour.toString());
  if (forceLive) params.append('force_live', 'true');

  const res = await fetch(`${API_BASE}/vintages?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch vintages (${res.status})`);
  }
  return res.json();
}
