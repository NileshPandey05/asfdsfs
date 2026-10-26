import React from 'react';
import { AccuracyResponse } from '../../types/wind';
import { formatMW, formatSignedMW } from '../../lib/format';
import { BarChart3, TrendingUp, HelpCircle, AlertCircle, ArrowUpRight } from 'lucide-react';

interface Props {
  accuracyData: AccuracyResponse | null;
  loading: boolean;
}

export const AccuracyView: React.FC<Props> = ({ accuracyData, loading }) => {
  if (loading || !accuracyData) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
        Computing forecast accuracy distributions...
      </div>
    );
  }

  const { metrics, distribution, daily_metrics } = accuracyData;

  // Find max bucket count for histogram scaling
  const maxBucketCount = Math.max(...distribution.map(d => d.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} id="accuracy-view">
      {/* Top Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* MAE Definition */}
        <div className="card-glass" style={{ padding: 20 }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
            Mean Absolute Error (MAE)
          </div>
          <div className="mono-num" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0284c7', margin: '6px 0' }}>
            {formatMW(metrics.mae_mw)}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Measures average miss magnitude irrespective of direction. Linear penalty for procurement deviation.
          </p>
        </div>

        {/* RMSE Definition */}
        <div className="card-glass" style={{ padding: 20 }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
            Root Mean Squared Error (RMSE)
          </div>
          <div className="mono-num" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#4f46e5', margin: '6px 0' }}>
            {formatMW(metrics.rmse_mw)}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Heavily penalises large forecast errors. Critical for sizing balancing mechanism reserves and risk buffers.
          </p>
        </div>

        {/* MBE Definition */}
        <div className="card-glass" style={{ padding: 20 }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
            Mean Bias Error (MBE)
          </div>
          <div
            className="mono-num"
            style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              color: (metrics.mbe_mw ?? 0) > 0 ? '#b45309' : '#4338ca',
              margin: '6px 0'
            }}
          >
            {formatSignedMW(metrics.mbe_mw)}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {(metrics.mbe_mw ?? 0) > 0
              ? 'Indicates persistent over-forecasting. Day-ahead positions tend to be long versus outturn.'
              : 'Indicates persistent under-forecasting. Day-ahead positions tend to be short versus outturn.'}
          </p>
        </div>
      </div>

      {/* Error Distribution Histogram */}
      <div className="card-glass" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>
              Forecast Error Distribution (MW)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Spread of signed errors (<code>e = Forecast - Actual</code>) across all evaluated delivery intervals
            </p>
          </div>
          <span className="badge badge-scope">Sample: {metrics.sample_count} intervals</span>
        </div>

        {/* Histogram Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              height: 200,
              gap: 8,
              padding: '10px 0',
              borderBottom: '1px solid var(--border-subtle)'
            }}
          >
            {distribution.map((bucket, i) => {
              const heightPct = (bucket.count / maxBucketCount) * 100;
              const isOver = bucket.lower_mw >= 0;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end'
                  }}
                >
                  <span className="mono-num" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 4 }}>
                    {bucket.count > 0 ? bucket.count : ''}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max(heightPct, 2)}%`,
                      background: isOver
                        ? 'linear-gradient(180deg, #d97706 0%, rgba(217, 119, 6, 0.3) 100%)'
                        : 'linear-gradient(180deg, #4f46e5 0%, rgba(79, 70, 229, 0.3) 100%)',
                      borderRadius: '4px 4px 0 0',
                      border: isOver ? '1px solid #b45309' : '1px solid #4338ca',
                      transition: 'height 0.3s ease'
                    }}
                    title={`${bucket.bin_range}: ${bucket.count} intervals`}
                  />
                </div>
              );
            })}
          </div>

          {/* Histogram X Axis Labels */}
          <div style={{ display: 'flex', gap: 8 }}>
            {distribution.map((bucket, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '0.68rem',
                  color: 'var(--text-dim)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {bucket.bin_range}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Performance Table */}
      <div className="card-glass table-wrap" style={{ padding: 20 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: 14 }}>
          Daily Accuracy Breakdown (31 Days)
        </h3>

        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Matched Intervals</th>
              <th>MAE (MW)</th>
              <th>RMSE (MW)</th>
              <th>Mean Bias Error (MW)</th>
              <th>Avg Actual (MW)</th>
              <th>Avg Forecast (MW)</th>
            </tr>
          </thead>
          <tbody>
            {daily_metrics.map((day, idx) => {
              const isOver = (day.mbe_mw ?? 0) > 0;
              return (
                <tr key={idx}>
                  <td className="mono-num" style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                    {day.date}
                  </td>
                  <td className="mono-num">{day.sample_count}</td>
                  <td className="mono-num" style={{ color: '#0284c7', fontWeight: 600 }}>
                    {formatMW(day.mae_mw)}
                  </td>
                  <td className="mono-num" style={{ color: '#4f46e5', fontWeight: 600 }}>
                    {formatMW(day.rmse_mw)}
                  </td>
                  <td
                    className="mono-num"
                    style={{
                      fontWeight: 700,
                      color: day.mbe_mw === null ? 'var(--text-dim)' : isOver ? '#b45309' : '#4338ca'
                    }}
                  >
                    {formatSignedMW(day.mbe_mw)}
                  </td>
                  <td className="mono-num" style={{ color: 'var(--color-actual)' }}>
                    {formatMW(day.avg_actual_mw)}
                  </td>
                  <td className="mono-num" style={{ color: 'var(--color-forecast)' }}>
                    {formatMW(day.avg_forecast_mw)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
