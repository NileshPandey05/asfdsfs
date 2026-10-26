import React, { useState, useMemo } from 'react';
import { ForecastAnalysisRow, ForecastsResponse } from '../../types/wind';
import { formatMW, formatSignedMW, formatUKDateTime, formatUKTime, getStatusBadge } from '../../lib/format';
import { Calendar, Search, Filter, ArrowUpDown, ChevronRight, Eye } from 'lucide-react';

interface Props {
  forecastsData: ForecastsResponse | null;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onSelectInterval: (row: ForecastAnalysisRow) => void;
  loading: boolean;
}

export const ExplorerView: React.FC<Props> = ({
  forecastsData,
  selectedDate,
  onDateChange,
  onSelectInterval,
  loading
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'time' | 'error' | 'actual'>('time');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const rows = forecastsData?.rows ?? [];

  // Filter and sort rows
  const filteredRows = useMemo(() => {
    let result = rows;
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    return [...result].sort((a, b) => {
      if (sortField === 'time') {
        const tA = new Date(a.start_time).getTime();
        const tB = new Date(b.start_time).getTime();
        return sortAsc ? tA - tB : tB - tA;
      }
      if (sortField === 'error') {
        const errA = a.error_mw !== null ? Math.abs(a.error_mw) : -1;
        const errB = b.error_mw !== null ? Math.abs(b.error_mw) : -1;
        return sortAsc ? errA - errB : errB - errA;
      }
      if (sortField === 'actual') {
        const actA = a.actual_mw ?? -1;
        const actB = b.actual_mw ?? -1;
        return sortAsc ? actA - actB : actB - actA;
      }
      return 0;
    });
  }, [rows, statusFilter, sortField, sortAsc]);

  const handleSort = (field: 'time' | 'error' | 'actual') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default to descending for errors
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} id="explorer-view">
      {/* Top Filter and Date Picker Header */}
      <div className="card-glass" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="control-group">
              <span className="control-label">Delivery Date:</span>
              <input
                id="explorer-date-input"
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                className="control-input"
                value={selectedDate}
                onChange={e => onDateChange(e.target.value)}
              />
            </div>

            {/* Quick Day Stepper */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[-1, 1].map(offset => {
                const currentD = new Date(selectedDate);
                currentD.setUTCDate(currentD.getUTCDate() + offset);
                const nextStr = currentD.toISOString().slice(0, 10);
                const isValid = nextStr >= '2026-01-01' && nextStr <= '2026-01-31';
                return (
                  <button
                    key={offset}
                    disabled={!isValid}
                    onClick={() => isValid && onDateChange(nextStr)}
                    className="control-select"
                    style={{ padding: '6px 10px', fontSize: '0.78rem', opacity: isValid ? 1 : 0.4 }}
                  >
                    {offset > 0 ? '+1 Day' : '-1 Day'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="control-label">Filter:</span>
            <div className="nav-tabs" style={{ padding: 2 }}>
              <button
                className={`nav-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => setStatusFilter('all')}
              >
                All ({rows.length})
              </button>
              <button
                className={`nav-tab-btn ${statusFilter === 'matched' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => setStatusFilter('matched')}
              >
                Matched ({rows.filter(r => r.status === 'matched').length})
              </button>
              <button
                className={`nav-tab-btn ${statusFilter === 'no_eligible_forecast' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => setStatusFilter('no_eligible_forecast')}
              >
                No Forecast ({rows.filter(r => r.status === 'no_eligible_forecast').length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interval Table */}
      <div className="card-glass table-wrap" style={{ minHeight: 480 }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            Retrieving half-hourly intervals for {selectedDate}...
          </div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-dim)' }}>
            No delivery intervals match the selected filter.
          </div>
        ) : (
          <table className="data-table" id="forecasts-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('time')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Delivery Time (GMT) <ArrowUpDown size={12} />
                  </div>
                </th>
                <th>Decision Cutoff (D-1)</th>
                <th>Eligible Forecast (MW)</th>
                <th>Selected Publish Time</th>
                <th onClick={() => handleSort('actual')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Actual Outturn (MW) <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort('error')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Signed Error (MW) <ArrowUpDown size={12} />
                  </div>
                </th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Audit</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, idx) => {
                const badge = getStatusBadge(row.status);
                const isOver = (row.error_mw ?? 0) > 0;
                return (
                  <tr
                    key={idx}
                    className="clickable"
                    onClick={() => onSelectInterval(row)}
                    id={`interval-row-${idx}`}
                  >
                    <td className="mono-num" style={{ fontWeight: 600, color: '#fff' }}>
                      {formatUKTime(row.start_time)}
                    </td>
                    <td className="mono-num" style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                      {formatUKDateTime(row.decision_cutoff)}
                    </td>
                    <td className="mono-num" style={{ fontWeight: 600, color: 'var(--color-forecast)' }}>
                      {formatMW(row.forecast_mw)}
                    </td>
                    <td className="mono-num" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {row.selected_publish_time ? formatUKDateTime(row.selected_publish_time) : '—'}
                    </td>
                    <td className="mono-num" style={{ fontWeight: 600, color: 'var(--color-actual)' }}>
                      {formatMW(row.actual_mw)}
                    </td>
                    <td
                      className="mono-num"
                      style={{
                        fontWeight: 700,
                        color:
                          row.error_mw === null
                            ? 'var(--text-dim)'
                            : isOver
                            ? '#fbbf24'
                            : '#a5b4fc'
                      }}
                    >
                      {formatSignedMW(row.error_mw)}
                    </td>
                    <td>
                      <span className={`badge ${badge.className}`}>{badge.label}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectInterval(row);
                        }}
                        style={{
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38bdf8',
                          padding: '5px 10px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <Eye size={12} /> Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
