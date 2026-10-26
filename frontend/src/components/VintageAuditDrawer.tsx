import React, { useEffect, useState } from 'react';
import { ForecastAnalysisRow, VintageHistoryResponse } from '../types/wind';
import { fetchVintages } from '../lib/api';
import { formatMW, formatUKDateTime, formatUKTime, formatSignedMW } from '../lib/format';
import { X, CheckCircle2, Clock, AlertCircle, ShieldAlert, Star, ExternalLink } from 'lucide-react';

interface Props {
  row: ForecastAnalysisRow | null;
  cutoffHour: number;
  onClose: () => void;
}

export const VintageAuditDrawer: React.FC<Props> = ({ row, cutoffHour, onClose }) => {
  const [data, setData] = useState<VintageHistoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!row) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    fetchVintages(row.start_time, cutoffHour)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [row, cutoffHour]);

  if (!row) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose} id="vintage-drawer-backdrop">
      <div className="drawer-panel" onClick={e => e.stopPropagation()} id="vintage-drawer-panel">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-scope">Interval Audit Trace</span>
              <span className="badge badge-matched">{row.status}</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>
              Delivery Interval: {formatUKDateTime(row.start_time)}
            </h2>
          </div>
          <button className="drawer-close-btn" onClick={onClose} id="drawer-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Summary Card */}
        <div className="card-glass" style={{ padding: 18, marginBottom: 24, background: 'var(--secondary)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Decision Cutoff
              </div>
              <div className="mono-num" style={{ fontSize: '0.92rem', color: 'var(--foreground)', fontWeight: 600 }}>
                {formatUKDateTime(row.decision_cutoff)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Actual Outturn
              </div>
              <div className="mono-num" style={{ fontSize: '0.92rem', color: 'var(--color-actual)', fontWeight: 700 }}>
                {formatMW(row.actual_mw)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Selected Forecast
              </div>
              <div className="mono-num" style={{ fontSize: '0.92rem', color: 'var(--color-forecast)', fontWeight: 700 }}>
                {formatMW(row.forecast_mw)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Signed Forecast Error
              </div>
              <div
                className="mono-num"
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: (row.error_mw ?? 0) > 0 ? '#b45309' : '#4338ca'
                }}
              >
                {formatSignedMW(row.error_mw)}
              </div>
            </div>
          </div>
        </div>

        {/* Logic Rule Explanation */}
        <div
          style={{
            background: 'rgba(2, 132, 199, 0.08)',
            border: '1px solid rgba(2, 132, 199, 0.25)',
            borderRadius: 10,
            padding: 14,
            marginBottom: 24,
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5
          }}
        >
          <div style={{ fontWeight: 600, color: '#0284c7', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={15} />
            Vintage Selection Business Rule
          </div>
          To prevent <strong>look-ahead bias</strong> in procurement decision evaluation, only forecast vintages published
          <strong> on or before {formatUKTime(row.decision_cutoff)} on D-1</strong> are eligible. The latest eligible vintage is selected.
          Later vintages published closer to delivery are strictly disqualified.
        </div>

        {/* Vintages Waterfall List */}
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            All Published Forecast Vintages ({data?.vintages.length ?? 0})
          </h3>

          {loading && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading vintage history from Elexon...
            </div>
          )}

          {error && (
            <div style={{ padding: 16, background: 'rgba(220, 38, 38, 0.1)', border: '1px solid var(--color-danger)', borderRadius: 8, color: '#b91c1c' }}>
              {error}
            </div>
          )}

          {data && data.vintages.length === 0 && (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No forecast vintages published for this delivery interval.
            </div>
          )}

          {data && data.vintages.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.vintages.map((v, i) => (
                <div
                  key={i}
                  className="card-glass"
                  style={{
                    padding: 14,
                    background: v.is_selected
                      ? 'rgba(2, 132, 199, 0.08)'
                      : v.is_eligible
                      ? '#ffffff'
                      : 'rgba(220, 38, 38, 0.04)',
                    border: v.is_selected
                      ? '1.5px solid #0284c7'
                      : v.is_eligible
                      ? '1px solid var(--border)'
                      : '1px dashed rgba(220, 38, 38, 0.25)',
                    boxShadow: v.is_selected ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {v.is_selected ? (
                        <span className="badge" style={{ background: '#0284c7', color: '#fff' }}>
                          <Star size={12} fill="#fff" /> SELECTED
                        </span>
                      ) : v.is_eligible ? (
                        <span className="badge badge-matched">
                          Eligible
                        </span>
                      ) : (
                        <span className="badge badge-missing-actual">
                          Disqualified (Post-Cutoff)
                        </span>
                      )}
                      <span className="mono-num" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--foreground)' }}>
                        {formatUKDateTime(v.publish_time)}
                      </span>
                    </div>

                    <div className="mono-num" style={{ fontSize: '1.05rem', fontWeight: 700, color: v.is_selected ? '#0284c7' : 'var(--foreground)' }}>
                      {formatMW(v.generation_mw)}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      {v.is_eligible
                        ? `${Math.abs(v.time_before_cutoff_minutes ?? 0).toFixed(0)} mins before gate closure`
                        : `Published ${Math.abs(v.time_before_cutoff_minutes ?? 0).toFixed(0)} mins after gate closure`}
                    </span>
                    {v.is_selected && (
                      <span style={{ color: '#0284c7', fontWeight: 600 }}>
                        &check; Latest available before decision cutoff
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
