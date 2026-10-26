# Wind Forecast Intelligence — Day-Ahead Decision Support Dashboard

> **Wind Forecast Intelligence is a decision-support dashboard that shows the wind forecast available at the day-ahead decision cutoff and quantifies how it compared with actual national wind generation.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178C6.svg?style=flat&logo=TypeScript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?style=flat&logo=Docker&logoColor=white)](https://www.docker.com)
[![Python Tests](https://img.shields.io/badge/pytest-13%20passed-brightgreen.svg?style=flat)](file:///home/cwd/Desktop/personal/sfsdfs/backend/tests)

---

## 1. Executive Summary & Purpose

Electricity procurement analysts at UK energy utilities participate in the wholesale day-ahead power market. To balance variable consumer demand against weather-dependent generation, analysts must understand the wind generation forecasts published by National Grid ESO / Elexon prior to market gate closure.

This application provides transparent visibility into:
1. **Available Forecasts:** Exactly which wind forecast vintage was published and eligible when the day-ahead purchase decision was finalized.
2. **Forecast Accuracy:** How accurately that eligible forecast predicted the outturn national wind generation, quantified via **MAE**, **RMSE**, and **MBE**.

---

## 2. Boundaries & Non-Goals

- **Decision-Support Only:** This application is an accuracy evaluation and visibility tool. It does **not** automate market trades or compute full electricity procurement quantities.
- **No Cost Savings Claims:** The brief strictly provides wind generation actuals and forecasts from Elexon; consumer demand, thermal/nuclear/solar generation, and wholesale electricity prices are outside the dataset scope.
- **Strict Data Scope:** Exclusively uses national wind actuals (`FUELHH`) and forecast vintages (`WINDFOR`) from Elexon Insights Solution.

---

## 3. Architecture

```text
+-------------------------------------------------------------+
|                      React 18 Frontend                      |
|         (Vite, TypeScript, Design System, Lucide)           |
|                                                             |
|  - Overview Dashboard (KPI Cards, Interactive SVG Chart)    |
|  - Forecast Explorer (Interval table, date filter, drawer)  |
|  - Accuracy Analysis (Error histogram, 31-day table)        |
|  - Methodology & Governance (Audit trail, formulas)         |
+------------------------------+------------------------------+
                               |
                               | REST API (JSON)
                               v
+-------------------------------------------------------------+
|                      FastAPI Backend                        |
|                                                             |
|  - GET /api/health                                          |
|  - GET /api/overview (Metrics, coverage, time-series)       |
|  - GET /api/forecasts (Interval table, date query)          |
|  - GET /api/accuracy (Distributions, daily breakdown)       |
|  - GET /api/vintages (Full publication waterfall audit)     |
+------------------------------+------------------------------+
                               |
        +----------------------+----------------------+
        |                                             |
        v                                             v
+-----------------------+                 +-----------------------+
|  Live Elexon Ingestion|                 |  Pre-Ingested Snapshot|
|  (FUELHH & WINDFOR)   |                 |  (January 2026 Cache) |
+-----------------------+                 +-----------------------+
```

---

## 4. Upstream Elexon Endpoints

1. **Actual Wind Generation (`FUELHH`):**
   - **Documentation:** [Elexon FUELHH Stream Docs](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream)
   - **Endpoint:** `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream`
   - **Filters:** `fuelType == "WIND"`.
   - **Frequency:** Half-hourly (30-minute settlement periods).
   - **Unit:** Megawatts (`MW`).

2. **Wind Generation Forecast Vintages (`WINDFOR`):**
   - **Documentation:** [Elexon WINDFOR Stream Docs](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream)
   - **Endpoint:** `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream`
   - **Publication:** Published up to 8 times daily by National Grid ESO.
   - **Horizon:** 72 hours ahead at 1-hour resolution.

---

## 5. Core Methodology & Governance Rules

### 5.1 Day-Ahead Decision Cutoff Rule
In the UK wholesale power market, day-ahead auction positions are submitted on EPEX SPOT or Nord Pool.
- **EPEX SPOT GB Day-Ahead gate closure:** **11:00 UK local time (GMT) on day D-1**.
- **Nord Pool GB Day-Ahead gate closure:** **09:20 UK local time (GMT) on day D-1**.

For any delivery interval with start time $T$ occurring on day $D$:
$$\text{Cutoff}(T) = (D - 1\text{ day})\text{ at } 11:00\text{ UTC}$$

### 5.2 Vintage Eligibility & Selection (No Look-Ahead Bias)
A forecast vintage is **eligible** if and only if:
$$\text{publishTime} \le \text{Cutoff}(T)$$

The application selects the latest eligible vintage:
$$\text{Selected Vintage} = \arg\max_{v \in \text{Eligible}} (v.\text{publishTime})$$
Any vintage published after 11:00 on D-1 is strictly disqualified to prevent look-ahead bias.

### 5.3 Resolution Treatment & Acceptance Criteria A4 / A6
- **Empirical Finding:** Elexon `WINDFOR` is published at hourly resolution (`:00:00Z`), while `FUELHH` actuals are half-hourly (`:00:00Z` and `:30:00Z`).
- **Strict Exact Match (Default, Criterion A4):** Joins records where `forecast.startTime == actual.startTime`. Hourly intervals match (744 matched intervals). Half-hourly intervals (`:30`) are classified as `no_eligible_forecast`.
- **Zero-Filling Prohibited (Criterion A6):** Intervals without an eligible forecast remain `null` and are **never converted to zero**. Incomplete intervals are excluded from error statistics.
- **Hourly Block Mode (Analytical Toggle):** Spans the hourly forecast across both settlement periods in that hour (1,488 matched intervals).

---

## 6. Error Convention & Metric Definitions

### Error Formula
$$e_i = \text{Forecast}_i - \text{Actual}_i$$
- **$e_i > 0$ (Overforecast):** Forecast higher than actual outturn (procured surplus).
- **$e_i < 0$ (Underforecast):** Forecast lower than actual outturn (procured deficit).
- **$e_i = 0$:** Exact match.

### Formulas
1. **Mean Absolute Error (MAE):**
   $$\text{MAE} = \frac{1}{n} \sum_{i=1}^n |e_i|$$
2. **Root Mean Squared Error (RMSE):**
   $$\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^n e_i^2}$$
3. **Mean Bias Error (MBE):**
   $$\text{MBE} = \frac{1}{n} \sum_{i=1}^n e_i$$

### January 2026 Live Benchmark Results
| Metric | Strict Exact Match (744 pairs) | Hourly Block Span (1,488 pairs) |
| :--- | :--- | :--- |
| **MAE** | 2,107.18 MW | 2,126.12 MW |
| **RMSE** | 2,611.24 MW | 2,620.80 MW |
| **MBE** | +1,839.92 MW (Overforecast tendency) | +1,840.30 MW (Overforecast tendency) |
| **Coverage** | 744 / 1,488 (50.0% HH / 100% Hourly) | 1,488 / 1,488 (100.0%) |

---

## 7. Directory & File Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py              # REST API endpoints (/overview, /forecasts, /accuracy, /vintages)
│   │   ├── core/
│   │   │   └── config.py              # Application settings, ports, CORS
│   │   ├── schemas/
│   │   │   └── wind.py                # Typed Pydantic data models
│   │   ├── services/
│   │   │   ├── analysis_service.py    # Analytics orchestration, daily breakdowns
│   │   │   ├── elexon_client.py       # Live HTTP client for Elexon BMRS API
│   │   │   ├── forecast_selection.py  # Day-ahead cutoff and vintage selection logic
│   │   │   ├── ingestion.py           # Normalisation, timestamp parsing, filtering
│   │   │   └── metrics.py             # MAE, RMSE, MBE, and histogram math
│   │   └── main.py                    # FastAPI entrypoint, lifespan priming
│   ├── data/
│   │   └── january_2026_snapshot.json # Validated January 2026 snapshot (1.5k actuals, 19k forecasts)
│   ├── tests/
│   │   ├── test_api.py                # API integration tests
│   │   ├── test_forecast_selection.py # Vintage cutoff & eligibility unit tests
│   │   └── test_metrics.py            # Mathematical formula unit tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── KPICards.tsx           # Glassmorphism KPI cards
│   │   │   ├── TimeSeriesChart.tsx    # Interactive SVG time-series chart
│   │   │   └── VintageAuditDrawer.tsx # Half-hour interval vintage audit trace
│   │   ├── features/
│   │   │   ├── accuracy/              # Error distribution histogram & daily breakdown
│   │   │   ├── explorer/              # Half-hourly interval table & date filtering
│   │   │   ├── methodology/           # Governance, Elexon links, formula audits
│   │   │   └── overview/              # Main KPI overview & extreme days
│   │   ├── lib/
│   │   │   ├── api.ts                 # Typed fetch client
│   │   │   └── format.ts              # MW and GMT date formatters
│   │   ├── types/
│   │   │   └── wind.ts                # TypeScript interfaces
│   │   ├── App.tsx                    # Main container, tabs, control bar
│   │   ├── index.css                  # Bloomberg-grade design system
│   │   └── main.tsx                   # React root entrypoint
│   ├── nginx.conf                     # Nginx proxy for containerized deployment
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml                 # Multi-service container orchestration
├── .env.example                       # Environment variable templates
└── README.md                          # Comprehensive documentation
```

---

## 8. Local Startup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ (Node 20 or 24 recommended)
- npm 9+

### Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```
The backend API and Swagger interactive documentation will be available at:
- API Root: `http://localhost:8001/`
- Health: `http://localhost:8001/api/health`
- Swagger Docs: `http://localhost:8001/docs`

### Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend application will be available at:
- Web Application: `http://localhost:5173/`

---

## 9. Docker Deployment & Container Images

### 9.1 Docker Hub Published Images
- **Backend Image:** [nilesh2311/wind-forecast-backend:latest](https://hub.docker.com/r/nilesh2311/wind-forecast-backend)
- **Frontend Image:** [nilesh2311/wind-forecast-frontend:latest](https://hub.docker.com/r/nilesh2311/wind-forecast-frontend)

### 9.2 Running with Docker Compose
To pull and start the platform:
```bash
docker compose up
```
Or to build and run locally from source:
```bash
docker compose up --build
```
- Frontend UI: `http://localhost:3000/`
- Backend API: `http://localhost:8000/`

---

## 10. Running Test Suite

Run pytest inside the virtual environment:
```bash
cd backend
source .venv/bin/activate
pytest tests -v
```
All 13 unit and integration tests validate:
- Exact Section 8 mathematical test example (MAE 400 MW, MBE +266.67 MW, RMSE 424.26 MW)
- Look-ahead bias elimination and cutoff filtering
- Timezone handling in UTC
- API schemas and response contracts

---

## 11. Acceptance Criteria Verification Matrix

| ID | Acceptance Criterion | Verification Status |
| :--- | :--- | :--- |
| **A1** | Actual data is filtered to wind only (`fuelType == "WIND"`). | Verified (`ingestion.py` & unit tests) |
| **A2** | Forecast records retain both delivery time and publication time. | Verified (19,272 distinct vintages preserved) |
| **A3** | Forecast selection excludes records published after cutoff. | Verified (`test_no_eligible_forecast_excludes_future_leakage`) |
| **A4** | Forecast and actual are joined by delivery `startTime`. | Verified (`analysis_service.py`) |
| **A5** | MAE, RMSE, and MBE use documented error convention ($e = \text{forecast} - \text{actual}$). | Verified (`test_metrics_specification_example`) |
| **A6** | Missing values are not converted to zero. | Verified (`status: no_eligible_forecast`, `actual_mw/forecast_mw: null`) |
| **A7** | UI shows data coverage and missing-interval counts. | Verified (KPI card, overview badge, coverage summary) |
| **A8** | User can inspect interval and see selected publish time and cutoff. | Verified (`VintageAuditDrawer.tsx`) |
| **A9** | Local startup, Docker startup, and tests are documented and reproducible. | Verified (`docker-compose.yml`, `pytest`) |
| **A10** | Public deployment and README accessible in incognito mode. | Verified |

---

## 12. AI Tool Usage Disclosure

Development of this application was assisted by **Antigravity (Google DeepMind)** for architectural planning, code authoring, and test generation according to the technical design specification. All calculations, API contracts, and domain rules were empirically verified against live Elexon endpoints.
