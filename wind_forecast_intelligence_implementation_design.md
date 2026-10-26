# Wind Forecast Intelligence Dashboard

## End-to-End Product, Design, and Implementation Specification

**Purpose:** Build a focused decision-support web application for UK
electricity procurement analysts.\
**Required stack:** React frontend, Python backend, Docker, and
deployment to Vercel or Heroku.\
**Data scope:** National wind generation actuals and forecasts from
Elexon only.\
**Analysis scope:** Purchase decisions made in January 2026.\
**Time limit:** Maximum 16 hours.

> This is an implementation blueprint, not a claim that the app has
> already been built or that example numbers are real Elexon results.
> Verify endpoint details and the decision-cutoff rule before presenting
> results.

## 1. Executive summary

The app should answer two questions:

1.  **What wind generation forecast was available when a day-ahead
    purchase decision had to be made?**
2.  **How accurate was that eligible forecast compared with actual wind
    generation?**

The product is a forecast visibility and accuracy tool. It is not a
trading bot, does not calculate the full electricity procurement
requirement, and must not claim cost savings. The brief provides neither
consumer demand nor electricity prices or other generation sources.

Core workflow:

1.  Retrieve Elexon actual wind generation and forecast vintages.
2.  Normalise timestamps and values.
3.  For every delivery half-hour, select the latest forecast published
    no later than the relevant decision cutoff.
4.  Join that forecast to actual generation using the delivery
    `startTime`.
5.  Calculate forecast errors and summary metrics.
6.  Display a clear overview, interval explorer, and accuracy analysis
    with coverage and assumptions.

## 2. Requirements from the assignment

### Explicit requirements

-   Client: a UK energy utility whose team buys power in the day-ahead
    market.
-   Need: understand available renewable generation forecasts and
    quantify forecast accuracy.
-   Scope is restricted to national wind actuals and forecasts from
    Elexon; no other data.
-   Actuals endpoint:
    https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream
-   Actuals: filter `fuelType = WIND`; relevant fields are `startTime`
    (30-minute delivery interval) and `generation`.
-   Forecast endpoint:
    https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream
-   Forecast fields: `startTime`, `publishTime` (forecast
    creation/publication time), and `generation`.
-   Analyse purchase decisions made in January 2026.
-   Use React for frontend, Python for backend, Docker, and deploy the
    sample app in Vercel or Heroku.
-   Do not spend more than 16 hours.
-   Deliverables: unlisted YouTube video up to 10 minutes, public GitHub
    repo with anonymous/random name, README, deployment link, and
    completed submission form.
-   The README must explain the file/directory structure and how to
    start the app. If AI tools are used, disclose them in the README.
-   Open submitted URLs in incognito/private browsing and verify access.

### Recommended acceptance criteria

  -----------------------------------------------------------------------
  ID                                  Acceptance criterion
  ----------------------------------- -----------------------------------
  A1                                  Actual data is filtered to wind
                                      only.

  A2                                  Forecast records retain both
                                      delivery time and publication time;
                                      multiple vintages are not
                                      prematurely collapsed.

  A3                                  Forecast selection excludes records
                                      published after the decision
                                      cutoff.

  A4                                  Forecast and actual are joined by
                                      delivery `startTime`.

  A5                                  MAE, RMSE, and mean bias use a
                                      documented error convention.

  A6                                  Missing values are not converted to
                                      zero.

  A7                                  UI shows data coverage and
                                      missing-interval counts.

  A8                                  The user can inspect a delivery
                                      interval and see the selected
                                      publication time and cutoff.

  A9                                  Local startup, Docker startup, and
                                      tests are documented and
                                      reproducible.

  A10                                 Public deployment, repo, and video
                                      links are accessible in incognito
                                      mode.
  -----------------------------------------------------------------------

## 3. Business/domain understanding

An energy utility serves consumers and buys electricity to cover demand.
Wind output is weather-dependent, so the forecast used at decision time
may differ from actual output during delivery.

Illustration only: - Demand: 10,000 MW - Wind forecast: 6,500 MW -
Simplified demand not covered by wind: 3,500 MW

This is only a conceptual example. The app must not compute a real
procurement quantity because demand and other sources of generation are
outside the supplied scope.

### Terminology

-   **Delivery interval:** half-hour represented by `startTime`.
-   **Actual generation:** observed wind generation for the delivery
    interval.
-   **Forecast vintage:** forecast for a delivery interval, published at
    a particular `publishTime`.
-   **Decision cutoff:** the latest timestamp at which a forecast can be
    considered available for the purchase decision.
-   **Forecast error:** forecast minus actual, in MW.
-   **Overforecast:** forecast is above actual; positive error under the
    convention used here.
-   **Underforecast:** forecast is below actual; negative error under
    this convention.

Most important distinction: - `startTime` answers "for which delivery
interval is this value?" - `publishTime` answers "when did this forecast
become available?"

Do not join actuals to forecasts using `publishTime`. Use it only for
forecast eligibility and vintage selection.

## 4. Scope and non-goals

### In scope

-   National-level wind generation actuals from Elexon.
-   National-level wind generation forecast vintages from Elexon.
-   January 2026 decision window.
-   Half-hour interval comparison.
-   Forecast selection based on publication time.
-   MAE, RMSE, bias, and coverage reporting.
-   React UI, Python API, Docker, deployment, README, tests, and demo
    video.

### Out of scope

-   Consumer demand, prices, bids, market execution, or profit
    calculations.
-   Solar, thermal, hydro, or other non-wind datasets.
-   Third-party weather data.
-   Automated trading.
-   AI chatbot or unrelated features.
-   Complex user accounts, admin panels, or multi-tenancy unless
    specifically required.
-   Claims that the app calculates the full amount of electricity to
    procure.

## 5. Data discovery and ingestion

Before implementing the full app, inspect both Elexon endpoint documents
and sample payloads. Confirm exact query parameters, response envelope,
pagination, timestamp format, units, historical coverage, rate limits,
and error formats. Do not invent undocumented parameter names.

### Actuals: `FUELHH`

Source:
https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream

Relevant fields: - `fuelType`: filter to `WIND`. - `startTime`: delivery
interval. - `generation`: actual generation.

Implementation: 1. Request the required historical range using supported
date filters. 2. Filter to wind using the API query if available, and
validate `fuelType` in the returned data. 3. Parse timestamps into
timezone-aware datetimes. 4. Validate required fields and numeric
generation values. 5. Count malformed, duplicate, and missing records.
6. Preserve the source timestamp and retrieval time. 7. Never fill a
missing actual with zero.

### Forecasts: `WINDFOR`

Source:
https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream

Relevant fields: - `startTime`: target delivery interval. -
`publishTime`: forecast publication/creation time. - `generation`:
forecast generation.

Implementation: 1. Request all forecast vintages required to evaluate
January decision dates. 2. Parse `startTime` and `publishTime` as
timezone-aware datetimes. 3. Preserve multiple records for the same
delivery interval. 4. Validate generation values and timestamps. 5.
Count invalid or duplicate records and log upstream failures. 6. Do not
reduce the data to one forecast per interval until the cutoff has been
applied.

### January window ambiguity

"Purchase decisions made in January 2026" is not automatically the same
as "delivery intervals occurring in January 2026." A decision made on
January 31 may cover delivery on February 1.

Recommended interpretation: filter on decision date/cutoff between
January 1 and January 31, 2026, and include the delivery intervals those
decisions concern. Document this interpretation. If evaluation expects
delivery intervals strictly within January, make the window easy to
change in one analysis configuration.

### Caching

For reliable demonstrations, cache or bundle a validated data snapshot.
Show the retrieval timestamp and label whether data is live or cached. A
cached dataset is a fallback, not proof of live connectivity. Deployment
storage may be ephemeral; do not rely on local files persisting across
restarts unless the host guarantees it.

## 6. Forecast selection --- core business logic

This is the most important part of the project.

For each delivery interval `T`:

1.  Find forecast records whose `startTime` equals `T`.
2.  Determine the decision cutoff for that delivery interval.
3.  Keep only records where `publishTime <= decision_cutoff`.
4.  Select the eligible record with the greatest `publishTime`.
5.  Join it to actual generation for the same `startTime`.

Pseudocode:

``` python
eligible = [
    row for row in forecasts
    if row.start_time == delivery_start
    and row.publish_time <= decision_cutoff
]
selected = max(eligible, key=lambda row: row.publish_time) if eligible else None
```

### Cutoff assumption must be explicit

The assignment says purchase decisions happen one day before delivery
but does not define an exact decision time or market gate-closure rule.
Research the relevant UK day-ahead timing and the meaning of the Elexon
forecast publication timestamp. If an authoritative cutoff cannot be
established within the time limit, implement a configurable, clearly
labelled assumption. Never describe an assumption as an official market
rule.

Recommended code shape:

``` python
def decision_cutoff_for(delivery_start):
    # Derive the cutoff from documented configuration/business rule.
    # Keep this separate so it can be changed without altering metrics.
    ...
```

### Illustrative example

Suppose a delivery interval is January 15 at 14:00, and forecasts were
published: - Jan 13, 10:00 --- 5,800 MW - Jan 14, 08:00 --- 6,100 MW -
Jan 14, 12:00 --- 6,300 MW - Jan 15, 08:00 --- 6,700 MW

If the configured cutoff is Jan 14 at 11:00, select 6,100 MW. Later
forecasts were not available by that cutoff. These values are
illustrative, not Elexon observations.

### Avoid look-ahead bias

Do not simply select the latest forecast currently present for each
historical interval. That could use a forecast published after the
historical purchase decision and make the accuracy look better or
otherwise distort the evaluation.

### No eligible forecast

If no forecast was published by the cutoff: - Mark the interval
`no_eligible_forecast`. - Do not use a later forecast. - Exclude it from
forecast-error metrics. - Report the count and coverage percentage. - Do
not substitute zero.

## 7. Data model

A small set of typed records makes the processing pipeline easier to
test.

``` python
from datetime import datetime
from pydantic import BaseModel

class WindActual(BaseModel):
    start_time: datetime
    generation_mw: float

class WindForecast(BaseModel):
    start_time: datetime
    publish_time: datetime
    generation_mw: float

class ForecastAnalysisRow(BaseModel):
    start_time: datetime
    decision_cutoff: datetime
    selected_publish_time: datetime | None
    forecast_mw: float | None
    actual_mw: float | None
    error_mw: float | None
    status: str
```

Only use the `generation_mw` name after verifying the source unit. If
the source documents another unit, convert it explicitly or use a
neutral field name.

Suggested statuses: - `matched` - `no_eligible_forecast` -
`missing_actual` - `missing_both`

Represent missing values as `null`/`None`, never as `0`.

### Suggested project structure

``` text
project/
  backend/
    app/
      main.py
      api/routes.py
      core/config.py
      schemas/wind.py
      services/elexon_client.py
      services/ingestion.py
      services/forecast_selection.py
      services/metrics.py
      services/analysis_service.py
    tests/
      test_forecast_selection.py
      test_metrics.py
      test_api.py
    requirements.txt
    Dockerfile
  frontend/
    src/
      components/
        layout/
        charts/
        kpi/
        tables/
        states/
      features/
        overview/
        forecast-explorer/
        accuracy/
      lib/api.ts
      lib/format.ts
      types/wind.ts
    package.json
    Dockerfile
  docker-compose.yml
  .env.example
  README.md
```

This layout is a recommendation; keep the implementation appropriately
small for a 16-hour assignment.

## 8. Metrics and calculations

Use one error convention across the backend, frontend, charts, and
README:

\[ e_i = forecast_i - actual_i \]

-   Positive: overforecast.
-   Negative: underforecast.
-   Zero: exact match.

### Mean Absolute Error (MAE)

\[ MAE = `\frac{1}{n}`{=tex}`\sum`{=tex}\_{i=1}\^{n}\|e_i\| \]

Average absolute miss, in MW. Lower is better.

### Root Mean Squared Error (RMSE)

\[ RMSE = `\sqrt{\frac{1}{n}\sum_{i=1}^{n}e_i^2}`{=tex} \]

Penalises large misses more than MAE. Lower is better.

### Mean Bias Error (MBE)

\[ MBE = `\frac{1}{n}`{=tex}`\sum`{=tex}\_{i=1}\^{n}e_i \]

Positive MBE means the forecast tends to be higher than actual
generation. Negative MBE means it tends to be lower. Near-zero bias does
not mean every forecast was accurate.

### Python implementation

``` python
import math
from statistics import mean

def calculate_metrics(pairs: list[tuple[float, float]]) -> dict:
    # Each pair is (forecast_mw, actual_mw).
    errors = [forecast - actual for forecast, actual in pairs]
    if not errors:
        return {
            "sample_count": 0,
            "mae_mw": None,
            "rmse_mw": None,
            "mbe_mw": None,
        }
    return {
        "sample_count": len(errors),
        "mae_mw": mean(abs(e) for e in errors),
        "rmse_mw": math.sqrt(mean(e * e for e in errors)),
        "mbe_mw": mean(errors),
    }
```

Only pass rows with both a selected eligible forecast and an actual.
Report excluded/missing intervals separately.

### Test example (not real data)

Forecasts: 7,000, 6,000, 5,500 MW\
Actuals: 6,500, 6,200, 5,000 MW\
Errors: +500, -200, +500 MW

-   MAE = 400 MW
-   MBE ≈ +266.7 MW
-   RMSE ≈ 424.3 MW

Additional useful diagnostics: - matched interval count - expected
interval count - missing eligible forecast count and percentage -
missing actual count - optional error histogram or hour-of-day breakdown

Start with equally weighted half-hour intervals unless the business
requirements say otherwise. Do not claim that average error directly
represents financial cost or procurement risk.

## 9. Product design and user flows

### Main navigation

1.  Overview
2.  Forecast Explorer
3.  Accuracy Analysis
4.  Methodology & Data Quality

### Overview page

Purpose: answer "How did the selected forecast compare with actual wind
generation across the analysis period?"

Components: - Title: **Wind Forecast Intelligence** - Scope label:
"Decision dates: 1--31 Jan 2026" - Data retrieval timestamp and
live/cached status - KPI cards: MAE, RMSE, MBE, matched coverage -
Time-series chart: eligible forecast vs actual generation - Daily error
summary if time allows - Warning/assumption notice for the configured
cutoff - Clear missing-data indicators

A chart point should reveal the delivery time, forecast, actual, error,
and forecast publication time if available.

### Forecast Explorer page

Purpose: inspect what was available for a specific delivery interval.

Columns: - delivery `startTime` - decision cutoff - selected forecast
(MW) - selected `publishTime` - actual generation (MW) - signed error
(MW) - status

Interactions: - Select date. - Sort by absolute error. - Open interval
details. - Display forecast vintages and mark which were eligible at the
cutoff. - Explain why the selected vintage was chosen.

### Accuracy Analysis page

Components: - MAE, RMSE, MBE. - Matched sample count and coverage. -
Error distribution or forecast-vs-actual scatter plot if time allows. -
Daily/hourly breakdown only if useful and sufficiently populated. -
Plain-language explanation of each metric and the error sign convention.

### Methodology & Data Quality page

Show: - Elexon endpoint links. - Date-window interpretation. -
Decision-cutoff rule and whether it is verified or assumed. - Error
convention. - Metric definitions. - Counts of matched, missing, and
unmatched intervals. - Data retrieval timestamp and cache status.

### Visual style and usability

Prefer a clean analytics interface over decorative effects. Use readable
typography, restrained accent colours, high contrast, consistent MW
formatting, and UK-local time labels. Distinguish forecast and actual
with different line styles/colours, but do not rely on colour alone to
communicate meaning. Provide tooltips, table alternatives,
keyboard-operable filters, and loading/error/empty states.

Do not label the app as a procurement optimiser or show a "required
purchase" number derived from data that the assignment does not supply.

## 10. Architecture

``` text
Browser
  |
  | HTTPS / JSON
  v
React + TypeScript
  |
  | /api/*
  v
Python API (FastAPI recommended)
  |
  +-- Elexon FUELHH adapter (actual wind)
  +-- Elexon WINDFOR adapter (forecast vintages)
  +-- Timestamp normalisation
  +-- Decision-cutoff and forecast-selection service
  +-- Metrics/analysis service
  +-- Optional cache or bundled snapshot
```

Why this is appropriate: - React satisfies the frontend requirement. -
Python is suitable for parsing, timestamp handling, and numerical
analysis. - FastAPI provides typed request/response models and API
docs. - A separate selection service is easy to unit-test. - Caching
helps the demo survive upstream downtime. - A database is unnecessary
for a small, static historical pilot unless the data volume or
deployment design makes it useful.

Keep upstream HTTP code, data normalisation, forecast selection, metric
calculation, and route handlers separate.

## 11. Suggested API contract

These routes are recommendations, not exact routes specified in the
brief.

### `GET /api/health`

``` json
{"status": "ok"}
```

### `GET /api/overview?month=2026-01`

Returns period, metrics, coverage, time-series rows, and methodology
metadata.

Example schema only:

``` json
{
  "period": {
    "decision_date_from": "2026-01-01",
    "decision_date_to": "2026-01-31"
  },
  "metrics": {
    "sample_count": 0,
    "mae_mw": null,
    "rmse_mw": null,
    "mbe_mw": null
  },
  "coverage": {
    "expected_intervals": 0,
    "matched_intervals": 0,
    "no_eligible_forecast": 0,
    "missing_actual": 0
  },
  "series": [],
  "methodology": {
    "error_convention": "forecast_minus_actual",
    "cutoff_description": "See configured analysis assumption"
  }
}
```

Placeholder values must be replaced with calculated results. Never ship
fabricated KPIs.

### `GET /api/forecasts?date=2026-01-15`

Returns interval rows with `start_time`, `decision_cutoff`,
`selected_publish_time`, `forecast_mw`, `actual_mw`, `error_mw`, and
`status`.

### `GET /api/accuracy?month=2026-01`

Returns metrics, sample count, coverage counts, and optionally daily
metrics.

### Optional `GET /api/forecast-history`

For a delivery interval, return all forecast vintages, publication
times, and whether each vintage was eligible by the cutoff. Add this
only if time permits.

### Error response

``` json
{
  "error": {
    "code": "UPSTREAM_UNAVAILABLE",
    "message": "Elexon data could not be retrieved. Cached data may be available."
  }
}
```

Use suitable HTTP status codes, do not expose stack traces to the
browser, and log details on the server.

## 12. Backend build sequence

1.  **Bootstrap:** create a Python virtual environment, install
    FastAPI/Uvicorn/HTTPX/Pydantic and test dependencies, add
    `/api/health`.
2.  **Elexon client:** implement supported query parameters, timeouts,
    pagination, response validation, bounded retries for transient
    errors, and useful logs.
3.  **Normalisation:** parse timestamps, validate fields and values,
    preserve forecast vintages, count duplicates/invalid rows.
4.  **Cutoff function:** implement a configurable
    `decision_cutoff_for()` and document its source or assumption.
5.  **Selection service:** group by delivery time, filter by publication
    time, select latest eligible vintage, and represent missing
    eligibility explicitly.
6.  **Analysis service:** join selected forecast and actual by delivery
    time, calculate error fields, metrics, and coverage.
7.  **API routes:** validate date inputs, restrict scope, return typed
    schemas, configure CORS, and handle upstream failures.
8.  **Cache/snapshot:** save or bundle validated historical data with a
    retrieval timestamp so the demo remains usable.

## 13. Frontend build sequence

1.  Scaffold React + TypeScript (Vite is a reasonable choice).
2.  Define TypeScript interfaces for all API responses.
3.  Create shared layout, navigation, date control, KPI card, chart
    wrapper, data table, and loading/error/empty states.
4.  Build the overview and connect it to `/api/overview`.
5.  Build the interval table and details panel using `/api/forecasts`.
6.  Build accuracy KPIs and an error chart using `/api/accuracy`.
7.  Add methodology and coverage messaging.
8.  Test narrow layouts, null values, long labels, API failure, and
    keyboard interaction.

Use a typed API client in one module. TanStack Query is optional; a
simple fetch wrapper is enough for this assignment. Keep Elexon
ingestion in Python rather than duplicating the data logic in the
browser.

## 14. Testing plan

### Forecast selection unit tests

-   Multiple eligible vintages: newest eligible vintage wins.
-   Forecast published after cutoff is excluded.
-   No eligible forecast returns a missing status.
-   Forecasts for different delivery intervals are never mixed.
-   Timezone-aware comparisons work correctly.
-   Duplicate publication records follow a documented policy.

### Metric unit tests

-   Correct error signs.
-   MAE, RMSE, and MBE formulas.
-   Empty input returns count zero and null metrics.
-   Incomplete pairs are excluded before metrics.
-   Rounding is done for display, not before calculation.
-   The example dataset returns MAE 400, MBE about 266.6667, and RMSE
    about 424.2641.

### API and integration tests

-   Health route succeeds.
-   Invalid date returns a clear 4xx response.
-   Valid date returns expected schema.
-   Empty data does not crash.
-   Upstream failure returns controlled error.
-   A known record can be traced from source to UI.
-   Selected `publishTime` is never later than the cutoff.
-   UI timestamps and timezone labels are consistent.

### Data-quality checks

-   Actuals contain only wind records.
-   Forecast vintages are preserved.
-   Missing values are not changed to zero.
-   Metric sample count equals the number of rows with both forecast and
    actual.
-   Month-boundary intervals are handled according to the declared
    window.
-   No future forecast vintage leaks into historical decisions.

## 15. Time zones and boundaries

-   Use timezone-aware timestamps.
-   Compare/store timestamps in UTC internally.
-   Display in `Europe/London` for the UK-facing UI.
-   Do not hardcode UK time as UTC+0 year-round; daylight saving time
    exists.
-   Verify whether source `startTime` marks the start of the delivery
    interval and label it accurately.
-   Test midnight and month-boundary handling.
-   If the decision date is in January but delivery falls on February 1,
    include it if it belongs to the January decision window.

## 16. Docker and local development

Example backend commands:

``` bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Example frontend commands, in another terminal:

``` bash
cd frontend
npm install
npm run dev
```

Add `docker-compose.yml` with frontend and backend services, ports,
environment configuration, and a shared network if needed.

Run:

``` bash
docker compose build
docker compose up
```

The README must give the actual ports and URLs. Verify that the Docker
build and startup work on a clean environment. Keep `.env.example` with
placeholders and never commit real secrets.

## 17. Deployment

The assignment permits Vercel or Heroku. Since this application has a
React frontend and Python API, verify current platform support before
choosing the hosting topology.

A reasonable split is: - React frontend on Vercel. - Python backend on a
platform that supports the chosen Python/Docker deployment, such as
Heroku if available for the project.

Checklist: 1. Run frontend and backend locally. 2. Run Docker Compose.
3. Deploy backend and test `/api/health`. 4. Set frontend API base URL.
5. Configure backend CORS for the deployed frontend. 6. Deploy frontend.
7. Test every main page on the public URL. 8. Check logs and upstream
error handling. 9. Test URLs in incognito/private mode. 10. Add
deployment URL to README.

Do not assume the frontend host can run a long-lived Python container in
the same way as a conventional Docker host; verify the current platform
constraints.

## 18. Logging, failures, and security

Log upstream request ranges and duration, record counts,
invalid/duplicate rows, matched intervals, missing forecasts, missing
actuals, cache timestamps, and server-side exceptions. Do not log
secrets.

UI messages should distinguish: - Source temporarily unavailable. - No
eligible forecast by cutoff. - Actual generation unavailable. - No data
for selected period.

Security: - No user accounts are required for this public-data pilot. -
Validate query parameters and limit date ranges. - Set upstream
timeouts. - Keep secrets out of Git. - Do not expose environment
variables or stack traces. - Mention AI tool usage in README if AI tools
assisted development.

## 19. README outline

The repository README should include: 1. Product overview and
screenshots. 2. Scope and non-goals. 3. Architecture diagram. 4. Elexon
endpoint links. 5. Analysis window interpretation. 6. Decision-cutoff
rule and assumption. 7. Error sign convention and metric definitions. 8.
Data coverage and missing-data handling. 9. File/directory guide. 10.
Local startup commands. 11. Docker commands. 12. Environment variables.
13. Test commands. 14. Public deployment link. 15. Known limitations.
16. AI tool usage disclosure if applicable.

Use an anonymous/random public repository name as requested. Check that
commits, README, screenshots, and configuration do not accidentally
reveal secrets.

## 20. Video demo plan --- maximum 10 minutes

The assignment requires an unlisted YouTube video with two parts, each
no longer than five minutes. The video is the first evaluation item, so
do not submit without it.

### Part 1: customer-facing overview (4--5 minutes)

-   **0:00--0:30:** Explain the business problem: wind output varies, so
    forecast timing matters.
-   **0:30--1:30:** Present MAE, RMSE, bias, and coverage in plain
    language.
-   **1:30--2:45:** Show forecast-vs-actual chart.
-   **2:45--3:45:** Inspect a half-hour interval and show cutoff,
    selected publication time, actual, and error.
-   **3:45--4:30:** Show accuracy/coverage insights and missing-data
    treatment.
-   **4:30--5:00:** State the value and limits: decision support, not
    automatic procurement.

### Part 2: technical lead walkthrough (4--5 minutes)

-   **0:00--0:45:** Explain React + Python API + Elexon adapters.
-   **0:45--1:45:** Walk through ingestion and timestamp normalisation.
-   **1:45--2:45:** Explain the cutoff and `publishTime <= cutoff`
    selection rule.
-   **2:45--3:30:** Show metric implementation and unit tests.
-   **3:30--4:15:** Explain caching, missing data, API errors, and
    Docker.
-   **4:15--5:00:** Explain deployment, trade-offs, and remaining
    limitations.

Upload as **Unlisted**, check sound and screen readability, and open the
video URL in an incognito browser.

## 21. Sixteen-hour plan

  -----------------------------------------------------------------------
  Time                    Work                    Output
  ----------------------- ----------------------- -----------------------
  0--1.5 h                Inspect API docs,       Data notes and fixtures
                          sample payloads, units, 
                          pagination, and         
                          coverage                

  1.5--3.5 h              Implement client,       Working ingestion
                          normalisation, and      
                          snapshot/cache          

  3.5--5.5 h              Resolve/document        Tested analysis
                          cutoff, selection       
                          logic, metrics, unit    
                          tests                   

  5.5--6.5 h              Add API routes and      Usable backend
                          schemas                 

  6.5--9.5 h              Build overview and main Main dashboard
                          charts                  

  9.5--11 h               Build interval explorer Core workflow
                          and accuracy view       

  11--12 h                Methodology,            Trustworthy UX
                          data-quality and error  
                          states                  

  12--13 h                API/integration tests   Verified output
                          and validation          

  13--14 h                Docker, README,         Reproducible project
                          deployment              

  14--16 h                Polish, record demo,    Complete delivery
                          incognito verification, 
                          submit                  
  -----------------------------------------------------------------------

If time is running out, prioritise correctness of forecast selection,
metrics, interval table, Docker/README, deployment, and video. Skip
authentication, elaborate animations, unrelated data, chatbot features,
and automated trading.

## 22. Risks and mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Wrong decision cutoff               Research it, isolate it in
                                      configuration, and clearly label
                                      assumptions.

  Future forecast leakage             Preserve vintages and enforce
                                      `publishTime <= cutoff`.

  Missing observations                Report coverage and exclude
                                      incomplete pairs from metrics.

  January date ambiguity              Define decision-date vs
                                      delivery-date interpretation and
                                      test month boundaries.

  Elexon outage                       Use a clearly labelled
                                      cache/snapshot fallback.

  Timezone error                      Use aware timestamps, UK-local
                                      display, and boundary tests.

  Misleading business claims          Do not infer demand, bids, or
                                      financial savings from wind-only
                                      data.

  Deployment mismatch                 Verify frontend/backend hosting and
                                      CORS separately.

  Weak handoff video                  Record two clear sections within 10
                                      minutes and verify access.
  -----------------------------------------------------------------------

## 23. Definition of done

### Data and analysis

-   [ ] Actuals filtered to `fuelType = WIND`.
-   [ ] Forecast vintages preserve `startTime` and `publishTime`.
-   [ ] January decision-window interpretation is documented.
-   [ ] Cutoff is researched or clearly labelled as an assumption.
-   [ ] Selection excludes future vintages.
-   [ ] MAE, RMSE, MBE pass tests.
-   [ ] Missing values are not treated as zero.
-   [ ] Coverage counts are visible.

### Application and engineering

-   [ ] Overview KPIs and chart work.
-   [ ] Interval explorer shows cutoff and publication time.
-   [ ] Accuracy page explains metrics.
-   [ ] Loading, empty, and error states work.
-   [ ] MW and UK-local time are labelled.
-   [ ] Frontend/backend run locally.
-   [ ] Docker Compose works.
-   [ ] Tests pass.
-   [ ] `.env.example` exists and secrets are absent.
-   [ ] README covers setup, files, methodology, deployment, and AI
    usage.

### Submission

-   [ ] Public GitHub repo uses anonymous/random name.
-   [ ] Deployed URL works.
-   [ ] Unlisted video is no longer than 10 minutes and has both parts.
-   [ ] All URLs open in incognito/private mode.
-   [ ] Submission form is completed.

## 24. Final product positioning

Use this concise positioning in the README and customer demo:

> **Wind Forecast Intelligence is a decision-support dashboard that
> shows the wind forecast available at the day-ahead decision cutoff and
> quantifies how it compared with actual national wind generation.**

The product earns trust through transparent timing rules, accurate
calculations, visible data coverage, and traceability from each metric
to its delivery interval and forecast publication time. It does not
predict consumer demand, calculate the full procurement requirement,
recommend market bids, or measure financial savings because the
assignment does not supply the data required for those claims.
