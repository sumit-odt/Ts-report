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
        # Click the Customize button for the '401k Setup' report to open the Advanced Filtering section.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/table/tbody/tr[2]/td[5]/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the '-- Select Table --' dropdown to choose a table for filtering.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Select the 'employees' table to add it for filtering.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the 'Add Table' button to add the 'employees' table to the report customization.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Select relevant columns for filtering, then open the Advanced Filtering section to create filter conditions.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/div/div[2]/div/label[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/div/div[2]/div/label[3]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/div/div[2]/div/label[4]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/div/div[2]/div/label[5]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/div/div[2]/div/label[6]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the 'Save & Apply' button to proceed to the report execution or filtering interface where filters can be created.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[3]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the 'Filters' button to open the Advanced Filtering section.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Input a filter value for 'employees.first_name' and apply the filter to validate filtering functionality.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/div[3]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('John')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[3]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Open the Advanced Filtering section again to add multiple filter conditions using different data types and combine them with AND/OR logic.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click 'Add Condition' to add a second filter condition.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Change the second filter's field to a different data type (e.g., 'hire_date') to verify operators update accordingly, then input a value and combine conditions with AND logic.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[3]/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Clear the second filter condition's field input and type 'hire_date' manually to change the field to a date type, then verify the operator dropdown updates accordingly.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[3]/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[3]/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('hire_date')
        

        # Input a valid date value for the 'hire_date' filter condition and apply the filters to validate multi-condition filtering with AND logic.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[3]/div[3]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('2020-01-01')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[4]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Refresh or close and reopen the report without saving filter preferences to verify filters do not persist beyond the session.
        await page.goto('http://localhost:5173/reports/401k-setup', timeout=10000)
        

        # Assertion: Verify only appropriate operators are shown for each data type input
        operators_first_name = await frame.locator('xpath=//div[contains(@class, "filter-condition")][1]//select[contains(@class, "operator-dropdown")]//option').all_text_contents()
        assert 'equals' in operators_first_name and 'contains' in operators_first_name, "Expected operators for string type not found"
        operators_hire_date = await frame.locator('xpath=//div[contains(@class, "filter-condition")][2]//select[contains(@class, "operator-dropdown")]//option').all_text_contents()
        assert 'equals' in operators_hire_date and 'greater than' in operators_hire_date, "Expected operators for date type not found"
        # Assertion: Validate that the data returned respects the filter conditions
        rows = await frame.locator('xpath=//table//tbody//tr').all()
        for row in rows:
            first_name = await row.locator('xpath=./td[1]').text_content()
            hire_date = await row.locator('xpath=./td[3]').text_content()
            assert 'John' in first_name, f"Row first_name does not match filter: {first_name}"
            assert hire_date >= '2020-01-01', f"Row hire_date does not match filter: {hire_date}"
        # Assertion: Ensure filters do not persist and default to no filters after refresh
        active_filters_count_after_refresh = await frame.locator('xpath=//div[contains(@class, "active-filters-count")]').text_content()
        assert active_filters_count_after_refresh == '0', "Filters persisted after refresh, expected no active filters"
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    