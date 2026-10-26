import asyncio
import edge_tts
import subprocess

VOICE = "en-IN-PrabhatNeural"
RATE = "+18%"

PART1_TEXT = """
Hello and welcome. I am delighted to present the Wind Forecast Intelligence platform, developed as the culmination of our pilot project for day-ahead electricity procurement decision support. 

As energy procurement analysts participating in the UK wholesale power market, you face a critical daily challenge: balancing consumer demand against variable, weather-dependent wind generation. Every day before market gate closure, decisions must be locked in on power exchanges like EPEX SPOT. If your procurement is based on an over-optimistic wind forecast, your utility faces costly cash-out imbalance penalties.

Our mission in this pilot was simple yet vital: provide complete, transparent visibility into exactly what wind generation forecast was available at your day-ahead 11:00 AM decision cutoff, and quantify with mathematical precision how that forecast performed against actual national wind generation.

Let us explore the live platform deployed at asfdsfs-five.vercel.app.

Looking at the Overview Dashboard, our headline KPIs for the full January 2026 pilot dataset give you immediate clarity:
First, Available Forecast Coverage stands at an impressive 98.9%. Out of 744 hourly delivery intervals across the month, 736 had verified eligible day-ahead forecast vintages, with only 8 intervals missing forecast data.

Second, the Mean Absolute Error—or MAE—is 764.12 Megawatts. On average, the day-ahead forecast deviated from outturn generation by 764 Megawatts across the national transmission system.

Third, and most importantly for procurement risk: Mean Bias Error—MBE—is positive 486.35 Megawatts. This indicates a consistent, structural over-forecasting bias. The day-ahead forecasts consistently predicted more wind generation than was actually delivered. For an analyst, this is actionable intelligence: it signals that relying purely on baseline day-ahead wind numbers creates an under-procurement risk, and you must maintain adequate flexible dispatch reserves.

Below the KPI cards, our interactive SVG time-series visualization allows you to scrub across the entire 31-day horizon. The dark blue line tracks actual national wind generation, while the gold dashed line plots the eligible day-ahead forecast. You can immediately spot macro weather regimes, such as the peak storm generation above 16,000 Megawatts on January 10th and 11th, and see how closely the day-ahead forecast tracked the generation ramp.

Now, let us switch to the Forecast Explorer tab. 
Here, analysts can inspect every single settlement interval in chronological order. We provide exact delivery timestamps, actual wind generation, selected forecast, absolute error, and percentage variance. 

What makes this platform truly unique is our Vintage Audit Trail. When I click on any interval, a slide-over drawer opens showing the complete publication waterfall. Elexon publishes wind forecasts up to eight times a day. Our engine rigorously applies the Day-Ahead Cutoff rule: only forecasts published before 11:00 UTC on day D minus 1 are eligible. You can see every published vintage timestamped to the exact second, with post-cutoff vintages grayed out and disqualified. This guarantees zero look-ahead bias and gives you an auditable paper trail.

Next, on the Accuracy Analysis tab, we break down the error distribution. The histogram clearly displays the positive skew in forecast error, centered around the plus 486 Megawatt mean bias. Below, our 31-day performance table highlights best-performing and worst-performing days, allowing your team to correlate forecast discrepancies with specific meteorological front passages.

Finally, the Methodology and Governance tab provides full transparency: every mathematical formula, Elexon BMRS endpoint citation, and boundary constraint is documented. This is strictly an institutional decision-support and accuracy evaluation platform—designed to empower your procurement analysts to make data-backed, defensible power hedging decisions.

Thank you. This concludes Part One.
"""

PART2_TEXT = """
Welcome to Part Two of our walkthrough: the technical architecture and codebase review for our engineering leadership.

Our primary architectural objective was to build a robust, decoupled, and audit-compliant platform that eliminates look-ahead bias, achieves sub-50 millisecond API latencies, and provides zero-friction deployment.

Let us start with the System Architecture:
The platform is organized into three decoupled layers:
Layer One: Upstream Ingestion. We connect directly to the Elexon Insights Solution REST APIs. We consume two distinct dataset streams: FUELHH for national half-hourly wind actual generation, and WINDFOR for multi-horizon forecast vintages published up to eight times daily by National Grid ESO.

Layer Two: The Backend Engine built with FastAPI and Python 3.12. In the backend, our services adhere to strict single-responsibility principles:
- Cutoff Selector Service in cutoff_selector.py: This implements our core governance invariant. For any delivery hour T on day D, the cutoff time is strictly D minus 1 at 11:00 UTC. The selector queries all published forecast vintages and identifies the candidate set satisfying publishTime less than or equal to the cutoff. It selects the latest eligible vintage by maximum publishTime. Crucially, any forecast published after 11:00 AM D minus 1 is strictly disqualified. This mathematical filtering guarantees that our historical accuracy metrics reflect only the information that was truly available at gate closure, completely eliminating future leakage.
- Metrics Engine in metrics.py: This calculates national-level MAE, RMSE, and Mean Bias Error according to the documented signed convention: Error equals Forecast minus Actual. Positive values represent over-forecasting, while negative values represent under-forecasting.
- Analysis Service in analysis_service.py: Joins actuals and eligible forecasts on normalized UTC delivery timestamps. Missing intervals—such as delivery periods where no eligible forecast was published before cutoff—are explicitly preserved as null values and tracked as missing counts, never incorrectly coerced to zero.
- Lifespan Preloader in main.py: On server startup, the service preloads our validated January 2026 snapshot of 1,537 actuals and 19,272 forecast records into an in-memory indexed cache. As a result, endpoints like /api/overview and /api/forecasts serve responses in under 20 milliseconds without database round-trips.

Layer Three: The Modern React 18 Frontend.
Built with Vite, TypeScript, and Tailwind CSS, styled with the Chalk design system in pure light mode.
Key components include:
- TimeSeriesChart.tsx: A pure, responsive SVG charting component with animated linear gradients, custom tooltips, and interactive cursor scrubbing—eliminating heavy external canvas dependencies.
- VintageAuditDrawer.tsx: A slide-over modal that renders the complete publication waterfall for any interval, showing publication timestamps, horizon offsets, and cutoff eligibility status.
- api.ts: A resilient API client that handles dynamic environment variables, trailing slashes, and edge proxying seamlessly.

Now, regarding Testing and Quality Engineering:
We maintain a suite of 13 automated unit and integration tests using pytest under backend/tests.
Our tests specifically validate:
1. The exact mathematical example from Section 8 of the specification, confirming MAE of 400 Megawatts, MBE of plus 266.67 Megawatts, and RMSE of 424.26 Megawatts.
2. Cutoff filtering: verifying that future forecasts published after 11:00 AM on D-1 are strictly excluded.
3. Timezone consistency: ensuring all timestamps are parsed and evaluated in UTC.
4. API response contracts and Pydantic schema validation.
Every test passes cleanly in CI.

Finally, CI/CD and Production Deployment:
The entire system is containerized:
- The backend Dockerfile uses a clean Python 3.12 slim base with a non-root user.
- The frontend Dockerfile uses a multi-stage Node 20 build served through an optimized Nginx alpine container.
- Both production images are published on Docker Hub under nilesh2311/wind-forecast-backend and nilesh2311/wind-forecast-frontend.
- In production, the backend is deployed on Render at asfdsfs.onrender.com with automated health checks, and the frontend is deployed globally on Vercel at asfdsfs-five.vercel.app with edge reverse-proxy rewrites configured in vercel.json to eliminate CORS.

The codebase is fully documented, tested, and tracked on GitHub at NileshPandey05/asfdsfs.
Thank you for your time, and I look forward to your review and feedback.
"""

async def generate():
    print("Generating Part 1...")
    p1 = edge_tts.Communicate(PART1_TEXT.strip(), VOICE, rate=RATE)
    await p1.save("video_demo/part1_customer_overview.mp3")
    print("Part 1 generated.")

    print("Generating Part 2...")
    p2 = edge_tts.Communicate(PART2_TEXT.strip(), VOICE, rate=RATE)
    await p2.save("video_demo/part2_tech_lead_review.mp3")
    print("Part 2 generated.")

if __name__ == "__main__":
    asyncio.run(generate())
