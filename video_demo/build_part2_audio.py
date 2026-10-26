import asyncio
import edge_tts
import subprocess

VOICE = "en-IN-PrabhatNeural"

PART2_TEXT = """
Welcome to Part Two: the technical architecture and codebase review for our engineering leadership.

Our architectural objective was to build a robust, decoupled, and audit-compliant platform that eliminates look-ahead bias, achieves sub-50 millisecond API latencies, and provides zero-friction deployment.

Starting with System Architecture:
The platform is organized into three decoupled layers:
Layer One: Upstream Ingestion. We connect directly to Elexon Insights Solution REST APIs. We consume two streams: FUELHH for national half-hourly wind actual generation, and WINDFOR for multi-horizon forecast vintages published up to eight times daily by National Grid ESO.

Layer Two: The Backend Engine built with FastAPI and Python 3.12. In the backend, our services adhere to strict single-responsibility principles:
- Cutoff Selector Service in cutoff_selector.py: This implements our core governance invariant. For delivery hour T on day D, the cutoff time is strictly D minus 1 at 11:00 UTC. The selector queries published forecast vintages and identifies the candidate set with publishTime less than or equal to cutoff. It selects the latest eligible vintage by maximum publishTime. Crucially, any forecast published after 11:00 AM D minus 1 is strictly disqualified, completely eliminating future leakage.
- Metrics Engine in metrics.py: Calculates national-level MAE, RMSE, and Mean Bias Error according to the documented signed convention: Error equals Forecast minus Actual. Positive values indicate over-forecasting, while negative values indicate under-forecasting.
- Analysis Service in analysis_service.py: Joins actuals and eligible forecasts on normalized UTC delivery timestamps. Missing intervals are explicitly preserved as null values and tracked as missing counts, never coerced to zero.
- Lifespan Preloader in main.py: On server startup, the service preloads our validated January 2026 snapshot of 1,537 actuals and 19,272 forecast records into an in-memory indexed cache. As a result, endpoints serve responses in under 20 milliseconds without database round-trips.

Layer Three: The Modern React 18 Frontend.
Built with Vite, TypeScript, and Tailwind CSS, styled with the Chalk design system in light mode.
Key components include:
- TimeSeriesChart.tsx: A pure, responsive SVG charting component with animated linear gradients and interactive cursor scrubbing—eliminating heavy external canvas dependencies.
- VintageAuditDrawer.tsx: A slide-over modal that renders the publication waterfall for any interval, showing publication timestamps and cutoff eligibility status.
- api.ts: A resilient API client that handles dynamic environment variables and edge proxying seamlessly.

Regarding Testing and Quality Engineering:
We maintain a suite of 13 automated unit and integration tests using pytest under backend/tests.
Our tests specifically validate:
1. The exact mathematical example from Section 8 of the specification: MAE 400 Megawatts, MBE plus 266.67 Megawatts, and RMSE 424.26 Megawatts.
2. Cutoff filtering: verifying that future forecasts published after 11:00 AM on D-1 are strictly excluded.
3. Timezone consistency: ensuring all timestamps are evaluated in UTC.
4. API response contracts and Pydantic schema validation.
Every test passes cleanly.

Finally, CI/CD and Production Deployment:
The entire system is containerized:
- The backend Dockerfile uses a clean Python 3.12 slim base with a non-root user.
- The frontend Dockerfile uses a multi-stage Node 20 build served through an optimized Nginx alpine container.
- Production images are published on Docker Hub under nilesh2311/wind-forecast-backend and nilesh2311/wind-forecast-frontend.
- In production, the backend is deployed on Render at asfdsfs.onrender.com, and the frontend is deployed globally on Vercel at asfdsfs-five.vercel.app with edge reverse-proxy rewrites configured in vercel.json to eliminate CORS.

The codebase is fully documented and tracked on GitHub at NileshPandey05/asfdsfs.
Thank you for your time, and I look forward to your review and feedback.
"""

async def generate():
    print("Regenerating Part 2 with rate=+25%...")
    p2 = edge_tts.Communicate(PART2_TEXT.strip(), VOICE, rate="+25%")
    await p2.save("video_demo/part2_tech_lead_review.mp3")
    print("Part 2 regenerated successfully.")

if __name__ == "__main__":
    asyncio.run(generate())
