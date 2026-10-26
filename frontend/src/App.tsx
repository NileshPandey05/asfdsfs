import React, { useState, useEffect } from 'react';
import { OverviewResponse, ForecastsResponse, AccuracyResponse, ForecastAnalysisRow } from './types/wind';
import { fetchOverview, fetchForecasts, fetchAccuracy } from './lib/api';
import { OverviewView } from './features/overview/OverviewView';
import { ExplorerView } from './features/explorer/ExplorerView';
import { AccuracyView } from './features/accuracy/AccuracyView';
import { MethodologyView } from './features/methodology/MethodologyView';
import { VintageAuditDrawer } from './components/VintageAuditDrawer';
import {
  Wind,
  LayoutDashboard,
  Search,
  BarChart2,
  FileText,
  RefreshCw,
  Clock,
  Layers,
  Database,
  Radio,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'explorer' | 'accuracy' | 'methodology'>('overview');
  const [cutoffHour, setCutoffHour] = useState<number>(11);
  const [resolutionMode, setResolutionMode] = useState<'exact' | 'hourly_block'>('exact');
  const [forceLive, setForceLive] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>('2026-01-15');

  // Selected interval for vintage drawer
  const [activeInterval, setActiveInterval] = useState<ForecastAnalysisRow | null>(null);

  // Data states
  const [overviewData, setOverviewData] = useState<OverviewResponse | null>(null);
  const [forecastsData, setForecastsData] = useState<ForecastsResponse | null>(null);
  const [accuracyData, setAccuracyData] = useState<AccuracyResponse | null>(null);

  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
  const [loadingForecasts, setLoadingForecasts] = useState<boolean>(false);
  const [loadingAccuracy, setLoadingAccuracy] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load Overview
  const loadOverview = () => {
    setLoadingOverview(true);
    setErrorMsg(null);
    fetchOverview({
      month: '2026-01',
      cutoffHour,
      resolutionMode,
      forceLive
    })
      .then(res => {
        setOverviewData(res);
        setLoadingOverview(false);
      })
      .catch(err => {
        setErrorMsg(err.message);
        setLoadingOverview(false);
      });
  };

  // Load Forecasts for Explorer
  const loadForecasts = (date: string) => {
    setLoadingForecasts(true);
    fetchForecasts(date, {
      month: '2026-01',
      cutoffHour,
      resolutionMode,
      forceLive
    })
      .then(res => {
        setForecastsData(res);
        setLoadingForecasts(false);
      })
      .catch(err => {
        setErrorMsg(err.message);
        setLoadingForecasts(false);
      });
  };

  // Load Accuracy metrics
  const loadAccuracy = () => {
    setLoadingAccuracy(true);
    fetchAccuracy({
      month: '2026-01',
      cutoffHour,
      resolutionMode,
      forceLive
    })
      .then(res => {
        setAccuracyData(res);
        setLoadingAccuracy(false);
      })
      .catch(err => {
        setErrorMsg(err.message);
        setLoadingAccuracy(false);
      });
  };

  // Re-fetch on filter change
  useEffect(() => {
    loadOverview();
  }, [cutoffHour, resolutionMode, forceLive]);

  useEffect(() => {
    if (activeTab === 'explorer') {
      loadForecasts(selectedDate);
    }
  }, [activeTab, selectedDate, cutoffHour, resolutionMode, forceLive]);

  useEffect(() => {
    if (activeTab === 'accuracy') {
      loadAccuracy();
    }
  }, [activeTab, cutoffHour, resolutionMode, forceLive]);

  const handleNavigateToExplorer = (dateStr?: string) => {
    if (dateStr) setSelectedDate(dateStr);
    setActiveTab('explorer');
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="nav-logo-icon">
            <Wind size={22} />
          </div>
          <div>
            <h1 className="nav-title">Wind Forecast Intelligence</h1>
            <div className="nav-subtitle">UK Power Day-Ahead Decision Support</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="nav-tabs" id="main-nav-tabs">
          <button
            id="nav-tab-overview"
            className={`nav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={15} /> Overview
          </button>

          <button
            id="nav-tab-explorer"
            className={`nav-tab-btn ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explorer')}
          >
            <Search size={15} /> Forecast Explorer
          </button>

          <button
            id="nav-tab-accuracy"
            className={`nav-tab-btn ${activeTab === 'accuracy' ? 'active' : ''}`}
            onClick={() => setActiveTab('accuracy')}
          >
            <BarChart2 size={15} /> Accuracy Analysis
          </button>

          <button
            id="nav-tab-methodology"
            className={`nav-tab-btn ${activeTab === 'methodology' ? 'active' : ''}`}
            onClick={() => setActiveTab('methodology')}
          >
            <FileText size={15} /> Methodology & Quality
          </button>
        </nav>

        {/* Header Right Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="badge badge-scope">Period: Jan 2026</span>
          <span
            className={`badge ${overviewData?.period?.data_source?.includes('Live') ? 'badge-live' : 'badge-cached'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Radio size={12} />
            {overviewData?.period?.data_source?.includes('Live') ? 'Live Elexon' : 'Verified Snapshot'}
          </span>
        </div>
      </header>

      {/* Global Filter & Assumption Controls */}
      <div className="control-bar">
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 18 }}>
          {/* Cutoff Assumption Selector */}
          <div className="control-group">
            <Clock size={15} color="var(--color-accent)" />
            <span className="control-label">Decision Cutoff:</span>
            <select
              id="cutoff-hour-select"
              className="control-select"
              value={cutoffHour}
              onChange={e => setCutoffHour(Number(e.target.value))}
            >
              <option value={9}>09:00 UTC (Nord Pool GB Gate Closure)</option>
              <option value={11}>11:00 UTC (EPEX SPOT GB Gate Closure - Default)</option>
              <option value={12}>12:00 UTC (Noon D-1 Standard)</option>
              <option value={17}>17:00 UTC (End of Working Day D-1)</option>
            </select>
          </div>

          {/* Resolution Mode Toggle */}
          <div className="control-group">
            <Layers size={15} color="#059669" />
            <span className="control-label">Resolution Join:</span>
            <select
              id="resolution-mode-select"
              className="control-select"
              value={resolutionMode}
              onChange={e => setResolutionMode(e.target.value as 'exact' | 'hourly_block')}
            >
              <option value="exact">Strict Exact Match (A4: :00 only, 744 hrs)</option>
              <option value="hourly_block">Hourly Block Span (Analytical: :00 & :30, 1488 hrs)</option>
            </select>
          </div>

          {/* Data Source Toggle */}
          <div className="control-group">
            <Database size={15} color="#4f46e5" />
            <span className="control-label">Source Mode:</span>
            <select
              id="data-source-select"
              className="control-select"
              value={forceLive ? 'live' : 'snapshot'}
              onChange={e => setForceLive(e.target.value === 'live')}
            >
              <option value="snapshot">Validated Local Snapshot (Recommended)</option>
              <option value="live">Live Elexon API Stream</option>
            </select>
          </div>
        </div>

        {/* Refresh / Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {overviewData?.period?.retrieval_time && (
            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
              Data Timestamp: {new Date(overviewData.period.retrieval_time).toLocaleTimeString('en-GB')}
            </span>
          )}
          <button
            id="refresh-btn"
            className="control-select"
            onClick={() => {
              loadOverview();
              if (activeTab === 'explorer') loadForecasts(selectedDate);
              if (activeTab === 'accuracy') loadAccuracy();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '24px 28px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {errorMsg && (
          <div
            style={{
              padding: 16,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--color-danger)',
              borderRadius: 10,
              color: '#f87171',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <AlertTriangle size={18} />
            <div>
              <strong>Service Error:</strong> {errorMsg}
            </div>
          </div>
        )}

        {/* Tab Panels */}
        {activeTab === 'overview' && (
          loadingOverview || !overviewData ? (
            <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading Wind Forecast Intelligence overview...
            </div>
          ) : (
            <OverviewView
              data={overviewData}
              onSelectInterval={row => setActiveInterval(row)}
              onNavigateToExplorer={handleNavigateToExplorer}
            />
          )
        )}

        {activeTab === 'explorer' && (
          <ExplorerView
            forecastsData={forecastsData}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onSelectInterval={row => setActiveInterval(row)}
            loading={loadingForecasts}
          />
        )}

        {activeTab === 'accuracy' && (
          <AccuracyView accuracyData={accuracyData} loading={loadingAccuracy} />
        )}

        {activeTab === 'methodology' && <MethodologyView data={overviewData} />}
      </main>

      {/* Interval Vintage Audit Drawer */}
      <VintageAuditDrawer
        row={activeInterval}
        cutoffHour={cutoffHour}
        onClose={() => setActiveInterval(null)}
      />
    </div>
  );
};
