import asyncio
import time
from playwright.async_api import async_playwright

CDP_URL = "http://127.0.0.1:9222"
VERCEL_APP_URL = "https://asfdsfs-five.vercel.app/"
RENDER_DOCS_URL = "https://asfdsfs.onrender.com/docs"
GITHUB_REPO_URL = "https://github.com/NileshPandey05/asfdsfs"

async def smooth_scroll(page, start_y, end_y, steps=25, delay=0.04):
    delta = (end_y - start_y) / steps
    current = start_y
    for _ in range(steps):
        current += delta
        await page.evaluate(f"window.scrollTo({{ top: {current}, behavior: 'instant' }})")
        await asyncio.sleep(delay)

async def run_live_walkthrough():
    print("=" * 65)
    print("Connecting to live Chrome instance via CDP (http://127.0.0.1:9222)...")
    print("=" * 65)

    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(CDP_URL)
        print("Connected to Chrome via CDP!")

        # Find or create the Vercel app page
        page = None
        for ctx in browser.contexts:
            for pg in ctx.pages:
                if "asfdsfs-five.vercel.app" in pg.url:
                    page = pg
                    break

        if not page:
            context = browser.contexts[0] if browser.contexts else await browser.new_context()
            page = await context.new_page()
            await page.goto(VERCEL_APP_URL, wait_until="networkidle")

        print("Bringing Wind Forecast Intelligence tab to front...")
        await page.bring_to_front()
        await page.goto(VERCEL_APP_URL, wait_until="networkidle")
        await page.evaluate("window.scrollTo(0, 0)")
        await asyncio.sleep(2)

        # -------------------------------------------------------------
        # Part 1: Customer & Business Overview (0:00 - 3:53)
        # -------------------------------------------------------------
        print("\n[PART 1: Customer & Business Overview]")
        
        # 1. Start at Overview Tab header (0:00 - 0:38)
        print("-> [0:00-0:38] Executive Hook & Project Overview...")
        overview_tab = page.locator('button:has-text("Overview")')
        await overview_tab.click()
        await page.evaluate("window.scrollTo(0, 0)")
        await asyncio.sleep(35)

        # 2. Scroll to KPI Cards (0:38 - 1:15)
        print("-> [0:38-1:15] Scrolling to Headline KPIs (Coverage, MAE, MBE)...")
        await smooth_scroll(page, 0, 240, steps=25, delay=0.04)
        await asyncio.sleep(35)

        # 3. Scroll to SVG Time Series Chart (1:15 - 1:45)
        print("-> [1:15-1:45] Scrolling to Interactive SVG Time-Series Chart...")
        await smooth_scroll(page, 240, 600, steps=25, delay=0.04)
        await asyncio.sleep(3)

        chart_svg = page.locator('svg').first
        if await chart_svg.count() > 0:
            box = await chart_svg.bounding_box()
            if box:
                print("-> Hovering along time-series chart (actuals vs forecast scrub)...")
                start_x = box['x'] + 60
                end_x = box['x'] + box['width'] - 60
                y = box['y'] + box['height'] / 2
                steps = 40
                step_x = (end_x - start_x) / steps
                for i in range(steps):
                    await page.mouse.move(start_x + (i * step_x), y)
                    await asyncio.sleep(0.4)
        await asyncio.sleep(10)

        # 4. Switch to Forecast Explorer Tab (1:45 - 2:05)
        print("-> [1:45-2:05] Switching to Forecast Explorer tab...")
        await page.evaluate("window.scrollTo(0, 0)")
        explorer_tab = page.locator('button:has-text("Forecast Explorer")')
        await explorer_tab.click()
        await asyncio.sleep(2)
        await smooth_scroll(page, 0, 400, steps=20, delay=0.04)
        await asyncio.sleep(15)

        # 5. Open Vintage Audit Drawer (2:05 - 2:25)
        print("-> [2:05-2:25] Opening Vintage Audit Drawer (Publication Waterfall)...")
        inspect_btn = page.locator('table button').first
        if await inspect_btn.count() > 0:
            await inspect_btn.click()
            await asyncio.sleep(2)
            print("-> Drawer open: demonstrating D-1 11:00 UTC cutoff & audit trail...")
            await asyncio.sleep(16)
            # Close drawer
            close_btn = page.locator('button[aria-label="Close"], button:has-text("Close"), svg.lucide-x').first
            if await close_btn.count() > 0:
                await close_btn.click()
                await asyncio.sleep(2)

        # 6. Switch to Accuracy Analysis Tab (2:25 - 2:48)
        print("-> [2:25-2:48] Switching to Accuracy Analysis tab...")
        await page.evaluate("window.scrollTo(0, 0)")
        accuracy_tab = page.locator('button:has-text("Accuracy Analysis")')
        await accuracy_tab.click()
        await asyncio.sleep(2)
        print("-> Showing Error Distribution Histogram...")
        await smooth_scroll(page, 0, 320, steps=20, delay=0.04)
        await asyncio.sleep(10)
        print("-> Scrolling to 31-day error breakdown table...")
        await smooth_scroll(page, 320, 680, steps=20, delay=0.04)
        await asyncio.sleep(10)

        # 7. Switch to Methodology & Quality Tab (2:48 - 3:53)
        print("-> [2:48-3:53] Switching to Methodology & Governance tab...")
        await page.evaluate("window.scrollTo(0, 0)")
        methodology_tab = page.locator('button:has-text("Methodology & Quality")')
        await methodology_tab.click()
        await asyncio.sleep(2)
        print("-> Showing formal citations & mathematical governance...")
        await smooth_scroll(page, 0, 450, steps=25, delay=0.04)
        await asyncio.sleep(30)
        await smooth_scroll(page, 450, 900, steps=25, delay=0.04)
        await asyncio.sleep(30)

        # -------------------------------------------------------------
        # Part 2: Technical Architecture & Leadership Review (3:53 - 8:07)
        # -------------------------------------------------------------
        print("\n[PART 2: Technical Architecture & Codebase Review]")
        await page.evaluate("window.scrollTo(0, 0)")
        await asyncio.sleep(20)

        # Open and inspect live Swagger documentation on Render
        print("-> [4:40-6:00] Navigating to live Render Swagger API Docs (https://asfdsfs.onrender.com/docs)...")
        await page.goto(RENDER_DOCS_URL, wait_until="networkidle")
        await asyncio.sleep(3)
        print("-> Demonstrating live FastAPI endpoints & schemas...")
        await smooth_scroll(page, 0, 450, steps=25, delay=0.04)
        await asyncio.sleep(25)
        await smooth_scroll(page, 450, 950, steps=25, delay=0.04)
        await asyncio.sleep(35)

        # Open and inspect public GitHub repository
        print("-> [6:00-7:30] Navigating to public GitHub repository (https://github.com/NileshPandey05/asfdsfs)...")
        await page.goto(GITHUB_REPO_URL, wait_until="networkidle")
        await asyncio.sleep(3)
        print("-> Inspecting public repository, README structure, and test suite...")
        await smooth_scroll(page, 0, 600, steps=25, delay=0.04)
        await asyncio.sleep(25)
        await smooth_scroll(page, 600, 1300, steps=25, delay=0.04)
        await asyncio.sleep(35)
        await smooth_scroll(page, 1300, 2000, steps=25, delay=0.04)
        await asyncio.sleep(25)

        # Return to live web application at Vercel for closing
        print("-> [7:30-8:07] Returning to live web app at https://asfdsfs-five.vercel.app/ for closing...")
        await page.goto(VERCEL_APP_URL, wait_until="networkidle")
        await page.evaluate("window.scrollTo(0, 0)")
        await asyncio.sleep(25)

        print("\n" + "=" * 65)
        print("Live CDP Walkthrough Completed Successfully!")
        print("=" * 65)

if __name__ == "__main__":
    asyncio.run(run_live_walkthrough())
