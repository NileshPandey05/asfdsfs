import React from 'react';
import { OverviewResponse, ForecastAnalysisRow } from '../../types/wind';
import { KPICards } from '../../components/KPICards';
import { TimeSeriesChart } from '../../components/TimeSeriesChart';
import { formatMW, formatSignedMW } from '../../lib/format';
import { Info, AlertCircle, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface Props {
  data: OverviewResponse;
  onSelectInterval: (row: ForecastAnalysisRow) => void;
  onNavigateToExplorer: (dateStr?: string) => void;
}

export const OverviewView: React.FC<Props> = ({ data, onSelectInterval, onNavigateToExplorer }) => {
  // Find highest error day and lowest error day
  const sortedDays = [...data.daily_metrics]
    .filter(d => d.mae_mw !== null)
    .sort((a, b) => (b.mae_mw ?? 0) - (a.mae_mw ?? 0));

  const worstDay = sortedDays[0];
  const bestDay = sortedDays[sortedDays.length - 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} id="overview-view">
      {/* Scope and Context Banner */}
      <div
        className="card-glass"
        style={{
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.08) 0%, rgba(255, 255, 255, 0.9) 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(2, 132, 199, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7'
            }}
          >
            <Activity size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '0.94rem' }}>
              Day-Ahead Procurement Decision Evaluation Period: January 2026
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Evaluating forecasts published by {data.period.cutoff_rule} for national wind generation delivery.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-scope">Scope: 1–31 Jan 2026</span>
          <span className="badge badge-matched">{data.period.resolution_mode}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards metrics={data.metrics} coverage={data.coverage} />

      {/* Time-Series Chart */}
      <TimeSeriesChart series={data.series} onSelectInterval={onSelectInterval} />

      {/* Analytical Insights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Extreme Days Card */}
        <div className="card-glass" style={{ padding: 22 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Daily Accuracy Extremes
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {worstDay && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 12,
                  background: 'rgba(220, 38, 38, 0.06)',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                  borderRadius: 10
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ArrowUpRight size={14} /> Peak Forecast Divergence
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '0.92rem' }}>
                    {worstDay.date}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono-num" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#b91c1c' }}>
                    {formatMW(worstDay.mae_mw)} MAE
                  </div>
                  <button
                    onClick={() => onNavigateToExplorer(worstDay.date)}
                    style={{ background: 'transparent', border: 'none', color: '#0284c7', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Inspect Intervals &rarr;
                  </button>
                </div>
              </div>
            )}

            {bestDay && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 12,
                  background: 'rgba(5, 150, 105, 0.06)',
                  border: '1px solid rgba(5, 150, 105, 0.2)',
                  borderRadius: 10
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ArrowDownRight size={14} /> Highest Forecast Precision
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '0.92rem' }}>
                    {bestDay.date}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono-num" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#047857' }}>
                    {formatMW(bestDay.mae_mw)} MAE
                  </div>
                  <button
                    onClick={() => onNavigateToExplorer(bestDay.date)}
                    style={{ background: 'transparent', border: 'none', color: '#0284c7', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Inspect Intervals &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Governance & Integrity Card */}
        <div className="card-glass" style={{ padding: 22 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Decision-Support Governance
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Info size={16} color="#38bdf8" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong>Single Error Convention:</strong> <code>e = Forecast - Actual</code>. Positive indicates overforecasting; negative indicates underforecasting.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertCircle size={16} color="#fbbf24" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong>Zero-Filling Prohibited:</strong> Missing forecast vintages or missing actual generation records are never substituted with 0, ensuring statistics reflect true market conditions.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Activity size={16} color="#34d399" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong>No Trading Claims:</strong> Consumer electricity demand and market bids are outside the Elexon wind dataset scope; this tool assesses forecast error, not financial savings.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
