import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5173", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Select multiple reports and confirm metadata updates after viewing each report.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/table/tbody/tr[2]/td[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Navigate back to the Report Catalog Browser and select another report to verify metadata updates after viewing.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Select the 'Dependent Birthday' report and view it to confirm metadata updates.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/table/tbody/tr[3]/td[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Navigate back to the Report Catalog Browser and verify if the metadata for viewed reports has updated correctly to reflect recent activity.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assertion: Check that only authorized reports are listed by verifying the titles against expected authorized reports
        authorized_report_titles = {"401k Setup", "Dependent Birthday", "Direct Deposit Setup", "Personal Information", "Employee Anniversary Report", "Employee Review Date"}
        for category in page_content["available_reports"]:
            for report in category["reports"]:
                assert report["title"] in authorized_report_titles, f"Unauthorized report found: {report['title']}"
                # Verify last viewed date format MM/DD/YYYY
                import re
                assert re.match(r"\d{2}/\d{2}/\d{4}", report["last_viewed"]), f"Invalid last viewed date format for report {report['title']}: {report['last_viewed']}"
                # Verify execution time format, e.g. '< 10 seconds'
                assert re.match(r"< \d+ seconds", report["execution_time"]), f"Invalid execution time format for report {report['title']}: {report['execution_time']}"
        # After viewing reports, verify metadata updates for recently viewed reports
        # Assuming the last viewed date for viewed reports should be today (or the latest date in the data)
        from datetime import datetime
        latest_date = max(datetime.strptime(report["last_viewed"], "%m/%d/%Y") for category in page_content["available_reports"] for report in category["reports"])
        expected_recent_titles = {"401k Setup", "Dependent Birthday"}  # Reports viewed in the test steps
        for category in page_content["available_reports"]:
            for report in category["reports"]:
                if report["title"] in expected_recent_titles:
                    # Check that last viewed date is the latest date
                    last_viewed_date = datetime.strptime(report["last_viewed"], "%m/%d/%Y")
                    assert last_viewed_date == latest_date, f"Last viewed date not updated for report {report['title']}"
                    # Check execution time format again
                    assert re.match(r"< \d+ seconds", report["execution_time"]), f"Invalid execution time format for report {report['title']}"
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    