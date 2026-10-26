import React from 'react';
import { OverviewResponse } from '../../types/wind';
import { ExternalLink, Database, ShieldCheck, CheckCircle2, AlertTriangle, Layers, Clock } from 'lucide-react';

interface Props {
  data: OverviewResponse | null;
}

export const MethodologyView: React.FC<Props> = ({ data }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} id="methodology-view">
      {/* Title */}
      <div className="card-glass" style={{ padding: 24 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: 8 }}>
          Methodology, Data Quality & Governance
        </h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          This specification details the mathematical formulas, decision timing assumptions, upstream data origins,
          and integrity rules applied to evaluate UK day-ahead wind generation forecasts.
        </p>
      </div>

      {/* Grid of Methodology Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Upstream Sources Card */}
        <div className="card-glass" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Database size={20} color="#0284c7" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)' }}>
              Elexon Data Ingestion Endpoints
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <div style={{ padding: 12, background: 'var(--secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span>Actual Wind Generation (FUELHH)</span>
                <a
                  href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                >
                  Docs <ExternalLink size={12} />
                </a>
              </div>
              <div>Filter: <code>fuelType == "WIND"</code></div>
              <div>Frequency: 30-minute settlement period intervals (<code>HH</code>)</div>
              <div>Unit: Megawatts (<code>MW</code>)</div>
            </div>

            <div style={{ padding: 12, background: 'var(--secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span>Wind Generation Forecasts (WINDFOR)</span>
                <a
                  href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                >
                  Docs <ExternalLink size={12} />
                </a>
              </div>
              <div>Publication: Up to 8 times daily by National Grid ESO</div>
              <div>Fields: <code>startTime</code>, <code>publishTime</code>, <code>generation</code></div>
              <div>Horizon: 72 hours ahead at 1-hour resolution</div>
            </div>
          </div>
        </div>

        {/* Gate Closure and Timing Card */}
        <div className="card-glass" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Clock size={20} color="#b45309" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)' }}>
              Day-Ahead Decision Cutoff Mechanics
            </h3>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p>
              In the GB wholesale electricity market, day-ahead power is auctioned on EPEX SPOT and Nord Pool.
              EPEX SPOT GB auction gate closure occurs at <strong>11:00 UK local time (GMT) on day D-1</strong>.
            </p>
            <p>
              <strong>Vintage Selection Rule:</strong> For any delivery interval T on day D, we define:
              <br />
              <code>Cutoff(T) = (D - 1 day) at 11:00 UTC</code>
              <br />
              Only forecast vintages with <code>publishTime &le; Cutoff(T)</code> are eligible. We select the vintage with the maximum <code>publishTime</code> among eligible records.
            </p>
            <div style={{ padding: 10, background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.25)', borderRadius: 8, color: '#b45309' }}>
              <strong>Look-Ahead Bias Elimination:</strong> Selecting later forecasts published after gate closure would falsely inflate accuracy metrics. Our filter strictly guarantees timing integrity.
            </div>
          </div>
        </div>

        {/* Resolution Discrepancy & A4/A6 Compliance */}
        <div className="card-glass" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Layers size={20} color="#059669" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)' }}>
              Temporal Resolution & Zero-Fill Integrity
            </h3>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p>
              <strong>Data Discovery:</strong> Elexon's <code>WINDFOR</code> dataset publishes hourly forecasts (ending in <code>:00:00Z</code>),
              whereas <code>FUELHH</code> records half-hourly actuals (ending in <code>:00:00Z</code> and <code>:30:00Z</code>).
            </p>
            <p>
              <strong>Acceptance Criterion A4:</strong> In <em>Strict Exact Match</em> mode, forecast and actual are joined strictly where <code>forecast.startTime == actual.startTime</code>.
              Hourly intervals match directly (744 matched intervals).
            </p>
            <p>
              <strong>Acceptance Criterion A6:</strong> Half-hourly intervals (<code>:30</code>) with no published forecast are labelled <code>no_eligible_forecast</code>.
              They are <strong>never converted to zero</strong> and are excluded from error statistics to prevent distortion.
            </p>
            <p>
              <strong>Analytical Mode:</strong> The user can also toggle <em>Hourly Block Mode</em> to map each hourly forecast vintage across both half-hours in that hour (yielding 1,488 pairs).
            </p>
          </div>
        </div>

        {/* Mathematical Formulas Card */}
        <div className="card-glass" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <ShieldCheck size={20} color="#4f46e5" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)' }}>
              Formulas & Error Convention
            </h3>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <strong>Single Error Convention:</strong>
              <div style={{ fontFamily: 'var(--font-mono)', padding: '6px 0', color: 'var(--foreground)' }}>
                e_i = Forecast_i - Actual_i
              </div>
              <ul style={{ paddingLeft: 18, marginTop: 4 }}>
                <li>e_i &gt; 0: Overforecast (Forecast higher than actual outturn)</li>
                <li>e_i &lt; 0: Underforecast (Forecast lower than actual outturn)</li>
              </ul>
            </div>

            <div>
              <strong>Mean Absolute Error (MAE):</strong>
              <div style={{ fontFamily: 'var(--font-mono)', padding: '6px 0', color: '#0284c7' }}>
                MAE = (1/n) * &Sigma; |Forecast_i - Actual_i|
              </div>
            </div>

            <div>
              <strong>Root Mean Squared Error (RMSE):</strong>
              <div style={{ fontFamily: 'var(--font-mono)', padding: '6px 0', color: '#4f46e5' }}>
                RMSE = &radic;( (1/n) * &Sigma; (Forecast_i - Actual_i)&sup2; )
              </div>
            </div>

            <div>
              <strong>Mean Bias Error (MBE):</strong>
              <div style={{ fontFamily: 'var(--font-mono)', padding: '6px 0', color: '#b45309' }}>
                MBE = (1/n) * &Sigma; (Forecast_i - Actual_i)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
