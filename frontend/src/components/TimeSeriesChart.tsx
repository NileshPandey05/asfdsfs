import React, { useState, useMemo, useRef } from 'react';
import { ForecastAnalysisRow } from '../types/wind';
import { formatMW, formatSignedMW, formatUKDateTime, formatUKTime } from '../lib/format';
import { Calendar, Maximize2 } from 'lucide-react';

interface Props {
  series: ForecastAnalysisRow[];
  onSelectInterval?: (row: ForecastAnalysisRow) => void;
}

export const TimeSeriesChart: React.FC<Props> = ({ series, onSelectInterval }) => {
  const [selectedDayRange, setSelectedDayRange] = useState<string>('all');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter series based on day range
  const filteredSeries = useMemo(() => {
    if (selectedDayRange === 'all') return series;
    const [startDay, endDay] = selectedDayRange.split('-').map(Number);
    return series.filter(r => {
      const day = new Date(r.start_time).getUTCDate();
      return day >= startDay && day <= endDay;
    });
  }, [series, selectedDayRange]);

  // Compute SVG dimensions and scale
  const width = 1000;
  const height = 340;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };

  const { maxVal, minVal, points } = useMemo(() => {
    let maxV = 0;
    let minV = 0;

    filteredSeries.forEach(r => {
      if (r.actual_mw !== null && r.actual_mw > maxV) maxV = r.actual_mw;
      if (r.forecast_mw !== null && r.forecast_mw > maxV) maxV = r.forecast_mw;
    });

    // Add 10% headroom
    maxV = Math.ceil((maxV * 1.1) / 1000) * 1000;

    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;
    const count = filteredSeries.length;

    const pts = filteredSeries.map((r, i) => {
      const x = padding.left + (i / Math.max(count - 1, 1)) * innerW;
      const yActual =
        r.actual_mw !== null
          ? padding.top + innerH - (r.actual_mw / maxV) * innerH
          : null;
      const yForecast =
        r.forecast_mw !== null
          ? padding.top + innerH - (r.forecast_mw / maxV) * innerH
          : null;

      return { x, yActual, yForecast, row: r };
    });

    return { maxVal: maxV, minVal: minV, points: pts };
  }, [filteredSeries]);

  // Generate SVG paths
  const forecastPath = useMemo(() => {
    const valid = points.filter(p => p.yForecast !== null);
    if (!valid.length) return '';
    return valid.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yForecast!.toFixed(1)}`).join(' ');
  }, [points]);

  const actualPath = useMemo(() => {
    const valid = points.filter(p => p.yActual !== null);
    if (!valid.length) return '';
    return valid.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yActual!.toFixed(1)}`).join(' ');
  }, [points]);

  // Mouse handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relX = (mouseX / rect.width) * width;

    // Find closest point
    let closestIdx = 0;
    let minDist = Infinity;
    points.forEach((p, idx) => {
      const dist = Math.abs(p.x - relX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  };

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="card-glass chart-container" id="time-series-card">
      <div className="chart-header">
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            Day-Ahead Wind Forecast vs Actual Generation
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Comparing eligible Elexon WINDFOR forecast available at cutoff with observed FUELHH actuals
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Legend */}
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: 'var(--color-actual)' }}></span>
              <span>Actual Wind</span>
            </div>
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: 'var(--color-forecast)' }}></span>
              <span>Eligible Forecast</span>
            </div>
          </div>

          {/* Time range selector */}
          <div className="control-group">
            <Calendar size={14} color="var(--text-muted)" />
            <select
              id="chart-range-select"
              className="control-select"
              value={selectedDayRange}
              onChange={e => setSelectedDayRange(e.target.value)}
            >
              <option value="all">Full Month (Jan 1–31)</option>
              <option value="1-7">Week 1 (Jan 1–7)</option>
              <option value="8-14">Week 2 (Jan 8–14)</option>
              <option value="15-21">Week 3 (Jan 15–21)</option>
              <option value="22-31">Week 4 (Jan 22–31)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="chart-svg-wrap" ref={containerRef}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          onClick={() => {
            if (activePoint && onSelectInterval) {
              onSelectInterval(activePoint.row);
            }
          }}
        >
          {/* Y Axis Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + (height - padding.top - padding.bottom) * (1 - ratio);
            const val = maxVal * ratio;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.1)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill="var(--text-dim)"
                  fontSize="11"
                  textAnchor="end"
                  fontFamily="var(--font-mono)"
                >
                  {val.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* X Axis Time Labels */}
          {points.length > 0 &&
            [0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => {
              const idx = Math.min(Math.floor(ratio * (points.length - 1)), points.length - 1);
              const p = points[idx];
              if (!p) return null;
              return (
                <text
                  key={i}
                  x={p.x}
                  y={height - 12}
                  fill="var(--text-dim)"
                  fontSize="11"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  {new Date(p.row.start_time).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </text>
              );
            })}

          {/* Forecast Line */}
          {forecastPath && (
            <path
              d={forecastPath}
              fill="none"
              stroke="var(--color-forecast)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 6px rgba(0, 210, 255, 0.35))"
            />
          )}

          {/* Actual Line */}
          {actualPath && (
            <path
              d={actualPath}
              fill="none"
              stroke="var(--color-actual)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 6px rgba(16, 185, 129, 0.35))"
            />
          )}

          {/* Active Hover Crosshair and Points */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={height - padding.bottom}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeDasharray="3 3"
              />

              {activePoint.yActual !== null && (
                <circle
                  cx={activePoint.x}
                  cy={activePoint.yActual}
                  r="5"
                  fill="var(--color-actual)"
                  stroke="#fff"
                  strokeWidth="2"
                />
              )}

              {activePoint.yForecast !== null && (
                <circle
                  cx={activePoint.x}
                  cy={activePoint.yForecast}
                  r="5"
                  fill="var(--color-forecast)"
                  stroke="#fff"
                  strokeWidth="2"
                />
              )}
            </g>
          )}
        </svg>

        {/* Floating Tooltip */}
        {activePoint && (
          <div
            className="chart-tooltip"
            style={{
              left: Math.min(Math.max(activePoint.x - 100, 10), width - 240),
              top: 15
            }}
          >
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: 6, fontSize: '0.82rem' }}>
              {formatUKDateTime(activePoint.row.start_time)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--color-forecast)' }}>Eligible Forecast:</span>
                <span className="mono-num" style={{ fontWeight: 600 }}>
                  {formatMW(activePoint.row.forecast_mw)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--color-actual)' }}>Actual Generation:</span>
                <span className="mono-num" style={{ fontWeight: 600 }}>
                  {formatMW(activePoint.row.actual_mw)}
                </span>
              </div>

              {activePoint.row.error_mw !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 4, marginTop: 2 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Signed Error:</span>
                  <span
                    className="mono-num"
                    style={{
                      fontWeight: 700,
                      color: activePoint.row.error_mw > 0 ? '#fbbf24' : '#a5b4fc'
                    }}
                  >
                    {formatSignedMW(activePoint.row.error_mw)}
                  </span>
                </div>
              )}

              {activePoint.row.selected_publish_time && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>
                  Vintage: {formatUKTime(activePoint.row.selected_publish_time)} (Cutoff: {formatUKTime(activePoint.row.decision_cutoff)})
                </div>
              )}

              {onSelectInterval && (
                <div style={{ fontSize: '0.7rem', color: 'var(--color-accent)', marginTop: 4, textAlign: 'right' }}>
                  Click to inspect vintages &rarr;
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
