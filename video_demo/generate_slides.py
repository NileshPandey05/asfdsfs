import os
import shutil
from PIL import Image, ImageDraw, ImageFont

SLIDES_DIR = "video_demo/slides"
os.makedirs(SLIDES_DIR, exist_ok=True)

# Artifact source screenshots
SRC_OVERVIEW = "/home/cwd/.gemini/antigravity-ide/brain/e85db169-2809-416a-ba3c-532249ffaf62/overview_light_theme_1793003587686.png"
SRC_EXPLORER = "/home/cwd/.gemini/antigravity-ide/brain/e85db169-2809-416a-ba3c-532249ffaf62/forecast_explorer_view_1793003599746.png"
SRC_DRAWER = "/home/cwd/.gemini/antigravity-ide/brain/e85db169-2809-416a-ba3c-532249ffaf62/vintage_audit_drawer_1793003608654.png"
SRC_ACCURACY = "/home/cwd/.gemini/antigravity-ide/brain/e85db169-2809-416a-ba3c-532249ffaf62/accuracy_analysis_view_1793003623593.png"
SRC_METHODOLOGY = "/home/cwd/.gemini/antigravity-ide/brain/e85db169-2809-416a-ba3c-532249ffaf62/methodology_quality_view_1793003630832.png"

def create_slide_with_frame(bg_color, title, subtitle, image_path, out_path, banner_text=""):
    canvas = Image.new("RGB", (1920, 1080), bg_color)
    draw = ImageDraw.Draw(canvas)
    
    # Header background bar
    draw.rectangle([(0, 0), (1920, 110)], fill=(15, 23, 42))
    draw.rectangle([(0, 110), (1920, 113)], fill=(59, 130, 246)) # accent line
    
    # Header text
    draw.text((60, 25), title, fill=(255, 255, 255))
    draw.text((60, 65), subtitle, fill=(148, 163, 184))
    
    if banner_text:
        draw.rectangle([(1450, 30), (1860, 80)], fill=(30, 58, 138), outline=(96, 165, 250), width=1)
        draw.text((1470, 45), banner_text, fill=(219, 234, 254))
        
    # Embed image with rounded frame
    if os.path.exists(image_path):
        img = Image.open(image_path).convert("RGB")
        target_w, target_h = 1800, 920
        img = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        canvas.paste(img, (60, 135))
        draw.rectangle([(59, 134), (1861, 1056)], outline=(71, 85, 105), width=2)
        
    canvas.save(out_path, quality=95)
    print(f"Created {out_path}")

def create_text_slide(bg_color, title, subtitle, bullets, out_path, section_tag=""):
    canvas = Image.new("RGB", (1920, 1080), bg_color)
    draw = ImageDraw.Draw(canvas)
    
    # Top banner
    draw.rectangle([(0, 0), (1920, 130)], fill=(15, 23, 42))
    draw.rectangle([(0, 130), (1920, 134)], fill=(59, 130, 246))
    
    draw.text((80, 30), title, fill=(255, 255, 255))
    draw.text((80, 75), subtitle, fill=(148, 163, 184))
    
    if section_tag:
        draw.rectangle([(1520, 35), (1840, 85)], fill=(37, 99, 235))
        draw.text((1540, 50), section_tag, fill=(255, 255, 255))
        
    # Cards layout
    y = 170
    for card_title, card_body in bullets:
        draw.rectangle([(80, y), (1840, y + 140)], fill=(30, 41, 59), outline=(51, 65, 85), width=2)
        draw.rectangle([(80, y), (90, y + 140)], fill=(59, 130, 246)) # left accent strip
        draw.text((120, y + 25), card_title, fill=(248, 250, 252))
        draw.text((120, y + 70), card_body, fill=(203, 213, 225))
        y += 165
        
    canvas.save(out_path, quality=95)
    print(f"Created {out_path}")

def build_all():
    # Slide 1: Part 1 Title
    create_text_slide(
        (15, 23, 42),
        "Wind Forecast Intelligence — Decision Support Platform",
        "UK Wholesale Power Day-Ahead Procurement Pilot Evaluation",
        [
            ("Executive Purpose & Mission", "Provides energy procurement analysts transparent visibility into available wind forecasts at day-ahead cutoff (11:00 UTC D-1) and quantifies outturn generation accuracy."),
            ("Key Pilot Findings (January 2026)", "Analyzed 744 hourly delivery periods: 98.9% eligible forecast coverage (736 hours), 764.12 MW Mean Absolute Error (MAE), and +486.35 MW Mean Bias Error (MBE)."),
            ("Commercial Decision Support Takeaway", "Consistent +486 MW positive bias indicates structural over-forecasting tendency, alerting utility traders to procure adequate flexible balancing reserves."),
            ("Live Deployments & Infrastructure", "Frontend live on Vercel: https://asfdsfs-five.vercel.app | Backend live on Render: https://asfdsfs.onrender.com | Docker Hub: nilesh2311/wind-forecast-backend")
        ],
        f"{SLIDES_DIR}/slide_01_title.png",
        "PART 1: CUSTOMER PILOT"
    )

    # Slide 2: Overview Dashboard UI
    create_slide_with_frame(
        (241, 245, 249),
        "Live Dashboard — Headline KPIs & 31-Day Time Series",
        "Overview tab showing 98.9% Coverage, 764 MW MAE, +486 MW Over-forecast Bias, and Storm Ramp Tracking",
        SRC_OVERVIEW,
        f"{SLIDES_DIR}/slide_02_overview.png",
        "LIVE PORTAL: VERCEL"
    )

    # Slide 3: Forecast Explorer UI
    create_slide_with_frame(
        (241, 245, 249),
        "Forecast Explorer — Settlement Interval Granularity",
        "Half-hourly chronological delivery schedule with actual generation, selected eligible forecast, and variance",
        SRC_EXPLORER,
        f"{SLIDES_DIR}/slide_03_explorer.png",
        "DATE FILTER & SEARCH"
    )

    # Slide 4: Vintage Publication Audit Drawer
    create_slide_with_frame(
        (241, 245, 249),
        "Vintage Audit Trail — Publication Waterfall & Zero Look-Ahead Bias",
        "Rigorous verification of D-1 11:00 UTC cutoff rule; post-cutoff vintages are strictly disqualified",
        SRC_DRAWER,
        f"{SLIDES_DIR}/slide_04_drawer.png",
        "AUDIT-COMPLIANT"
    )

    # Slide 5: Accuracy Analysis UI
    create_slide_with_frame(
        (241, 245, 249),
        "Accuracy Analysis — Error Distribution & 31-Day Performance Table",
        "Quantifying error spread (MAE 764 MW, RMSE 1021 MW) and correlating discrepancies with front passages",
        SRC_ACCURACY,
        f"{SLIDES_DIR}/slide_05_accuracy.png",
        "ERROR DISTRIBUTION"
    )

    # Slide 6: Methodology & Governance
    create_slide_with_frame(
        (241, 245, 249),
        "Methodology & Governance — Mathematical Invariants & Upstream Sources",
        "Formal citations for Elexon BMRS FUELHH & WINDFOR streams, EPEX SPOT cutoff, and signed error conventions",
        SRC_METHODOLOGY,
        f"{SLIDES_DIR}/slide_06_methodology.png",
        "FULL GOVERNANCE"
    )

    # Slide 7: Part 2 Title
    create_text_slide(
        (15, 23, 42),
        "Part 2: Technical Architecture & Codebase Review",
        "Engineering Leadership Walkthrough — Design Patterns, Testing & Deployment",
        [
            ("Decoupled 3-Tier Architecture", "Clean separation of upstream Elexon BMRS ingestion, FastAPI Python 3.12 analytics engine, and React 18 TypeScript frontend."),
            ("Zero Look-Ahead Bias Guarantee", "Strict mathematical cutoff invariant: filter vintages where publishTime <= D-1 11:00 UTC; select max(publishTime). Zero future leakage."),
            ("In-Memory Lifespan Preloader", "Prime January 2026 dataset (1,537 actuals, 19,272 forecasts) in indexed memory on startup. Sub-20ms endpoint response latency."),
            ("100% Passing Test Suite & CI/CD", "13 pytest unit/integration tests validating Section 8 specs, timezones, and Pydantic v2 contracts. Multi-stage Docker Hub containers.")
        ],
        f"{SLIDES_DIR}/slide_07_tech_title.png",
        "PART 2: TECH LEAD REVIEW"
    )

    # Slide 8: Cutoff & Math Invariants
    create_text_slide(
        (15, 23, 42),
        "Core Methodology & Mathematical Invariants",
        "Eliminating Look-Ahead Bias & Standardized Signed Error Calculations",
        [
            ("Day-Ahead Gate Closure Cutoff Rule", "Cutoff(T) = (Delivery Day D - 1 day) at 11:00 UTC (EPEX SPOT auction gate closure)."),
            ("Vintage Eligibility Formulation", "Eligible = { v in Vintages | v.publishTime <= Cutoff(T) }; Selected = argmax(v.publishTime for v in Eligible)."),
            ("Standard Signed Error Convention", "e_t = Forecast_t - Actual_t. Positive values indicate Over-Forecasting (+486 MW), negative indicate Under-Forecasting."),
            ("Missing Value Integrity", "Missing forecast intervals (e.g. 8 missing hours) are strictly preserved as null with explicit status; never coerced to 0.")
        ],
        f"{SLIDES_DIR}/slide_08_math.png",
        "MATHEMATICAL RIGOR"
    )

    # Slide 9: Codebase & Testing Architecture
    create_text_slide(
        (15, 23, 42),
        "Codebase Structure & Automated Test Engineering",
        "Modular Service Architecture with 13 Pytest Validation Tests",
        [
            ("backend/app/services/", "cutoff_selector.py (vintage eligibility), metrics.py (MAE/RMSE/MBE math), ingestion.py (Elexon streams), analysis_service.py (joins)."),
            ("backend/tests/ (13 Passes)", "test_metrics.py validates exact Section 8 math (MAE 400 MW, MBE +266.67 MW, RMSE 424.26 MW); test_forecast_selection.py validates zero leakage."),
            ("frontend/src/ (React 18 + Vite)", "Pure SVG TimeSeriesChart.tsx (no heavy canvas), VintageAuditDrawer.tsx, Chalk tweakcn light theme tokens, resilient api.ts client."),
            ("Multi-Stage Docker & Deployments", "Production Docker images published to Docker Hub: nilesh2311/wind-forecast-backend & frontend. Reverse-proxy edge routing on Vercel.")
        ],
        f"{SLIDES_DIR}/slide_09_code.png",
        "TEST SUITE: 13 PASSED"
    )

    # Slide 10: Conclusion & Links
    create_text_slide(
        (15, 23, 42),
        "Production Deployment Summary & Submission Links",
        "Wind Forecast Intelligence — Day-Ahead Decision Support Dashboard",
        [
            ("Public Live Web Application", "Vercel URL: https://asfdsfs-five.vercel.app/ (Zero CORS, edge reverse proxy)"),
            ("Live Production Backend REST API", "Render URL: https://asfdsfs.onrender.com/ (Swagger docs: https://asfdsfs.onrender.com/docs)"),
            ("Public GitHub Repository", "Repository: https://github.com/NileshPandey05/asfdsfs (Includes README, tests, and Docker setup)"),
            ("Docker Hub Images", "Backend: nilesh2311/wind-forecast-backend:latest | Frontend: nilesh2311/wind-forecast-frontend:latest")
        ],
        f"{SLIDES_DIR}/slide_10_links.png",
        "PROJECT COMPLETE"
    )

if __name__ == "__main__":
    build_all()
