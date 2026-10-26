import React from 'react';
import { MetricsSummary, CoverageSummary } from '../types/wind';
import { formatMW, formatSignedMW } from '../lib/format';
import { Target, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  metrics: MetricsSummary;
  coverage: CoverageSummary;
}

export const KPICards: React.FC<Props> = ({ metrics, coverage }) => {
  const isBiasPositive = (metrics.mbe_mw ?? 0) > 0;

  return (
    <div className="kpi-grid">
      {/* MAE */}
      <div className="card-glass kpi-card" style={{ '--kpi-accent': '#0284c7' } as React.CSSProperties} id="kpi-mae">
        <div className="kpi-header">
          <span className="kpi-title">Mean Absolute Error (MAE)</span>
          <div className="kpi-icon-wrap">
            <Target size={18} />
          </div>
        </div>
        <div className="kpi-value mono-num" style={{ color: 'var(--foreground)' }}>{formatMW(metrics.mae_mw)}</div>
        <div className="kpi-subtext">Average magnitude of forecast error across delivery intervals</div>
      </div>

      {/* RMSE */}
      <div className="card-glass kpi-card" style={{ '--kpi-accent': '#4f46e5' } as React.CSSProperties} id="kpi-rmse">
        <div className="kpi-header">
          <span className="kpi-title">Root Mean Squared Error (RMSE)</span>
          <div className="kpi-icon-wrap">
            <TrendingUp size={18} />
          </div>
        </div>
        <div className="kpi-value mono-num" style={{ color: 'var(--foreground)' }}>{formatMW(metrics.rmse_mw)}</div>
        <div className="kpi-subtext">Penalises extreme misses; useful for sizing intraday reserves</div>
      </div>

      {/* MBE (Mean Bias Error) */}
      <div
        className="card-glass kpi-card"
        style={{ '--kpi-accent': isBiasPositive ? '#d97706' : '#4f46e5' } as React.CSSProperties}
        id="kpi-mbe"
      >
        <div className="kpi-header">
          <span className="kpi-title">Mean Bias Error (MBE)</span>
          <div className="kpi-icon-wrap">
            <AlertTriangle size={18} />
          </div>
        </div>
        <div className="kpi-value mono-num" style={{ color: isBiasPositive ? '#b45309' : '#4338ca' }}>
          {formatSignedMW(metrics.mbe_mw)}
        </div>
        <div className="kpi-subtext">
          {isBiasPositive ? 'Systemic Overforecast (Forecast > Actual)' : 'Systemic Underforecast (Forecast < Actual)'}
        </div>
      </div>

      {/* Coverage */}
      <div className="card-glass kpi-card" style={{ '--kpi-accent': '#059669' } as React.CSSProperties} id="kpi-coverage">
        <div className="kpi-header">
          <span className="kpi-title">Matched Data Coverage</span>
          <div className="kpi-icon-wrap">
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div className="kpi-value mono-num" style={{ color: '#059669' }}>
          {coverage.coverage_percentage}%
        </div>
        <div className="kpi-subtext">
          {coverage.matched_intervals.toLocaleString()} of {coverage.expected_intervals.toLocaleString()} intervals evaluated
        </div>
      </div>
    </div>
  );
};
