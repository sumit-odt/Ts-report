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
        # Click the 'Customize' button for the first report '401k Setup' to start customizing columns and filters.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/table/tbody/tr[2]/td[5]/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Open the table dropdown to select a table to add to the report.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Select the 'employees' table to add it to the report.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the 'Add Table' button to add the 'employees' table to the report.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Select columns 'first_name', 'last_name', and 'hire_date' for the report.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/div/div[2]/div/label[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/div/div[2]/div/label[3]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/div/div[2]/div/label[4]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the 'Save & Apply' button to save the report preferences and apply them.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[3]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Open the browser console or use developer tools to check localStorage for saved preferences.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Enter a filter value 'John' in the filter value input and apply the filter.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/div[3]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('John')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[3]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Check if preferences are backed up to Supabase by inspecting network requests or backend logs, or simulate Supabase backup failure to test fallback to localStorage.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Reload the page to simulate closing and reopening the application and verify if user preferences persist.
        await page.goto('http://localhost:5173/reports', timeout=10000)
        

        # Click the 'View' button for the '401k Setup' report to open the report and verify if customized columns and filters are applied automatically.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/table/tbody/tr[2]/td[5]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Simulate Supabase backup failure and reload the report to verify fallback to localStorage preferences load.
        await page.goto('http://localhost:5173/reports/401k-setup?simulateBackupFailure=true', timeout=10000)
        

        # Assert that preferences are saved in localStorage
        local_storage = await context.storage_state()
        assert any('preferences' in item['name'] for item in local_storage['origins'][0]['localStorage']), 'Preferences not saved in localStorage'
        
        # Assert that the report view has the customized columns applied
        columns = ['employees.first_name', 'employees.last_name', 'employees.hire_date']
        page_columns = await frame.evaluate('() => Array.from(document.querySelectorAll("table thead th")).map(th => th.textContent.trim())')
        assert all(col.split('.').pop() in page_columns for col in columns), 'Customized columns not applied in report view'
        
        # Assert that the filter 'John' is applied and visible in the table rows
        rows = await frame.evaluate('() => Array.from(document.querySelectorAll("table tbody tr")).map(tr => tr.textContent)')
        assert any('John' in row for row in rows), 'Filter value John not applied in report rows'
        
        # Assert that after reload, preferences are loaded and applied
        await page.reload()
        page_columns_after_reload = await frame.evaluate('() => Array.from(document.querySelectorAll("table thead th")).map(th => th.textContent.trim())')
        assert all(col.split('.').pop() in page_columns_after_reload for col in columns), 'Preferences not loaded after reload'
        rows_after_reload = await frame.evaluate('() => Array.from(document.querySelectorAll("table tbody tr")).map(tr => tr.textContent)')
        assert any('John' in row for row in rows_after_reload), 'Filter value John not applied after reload'
        
        # Assert fallback to localStorage when Supabase backup fails
        await page.goto('http://localhost:5173/reports/401k-setup?simulateBackupFailure=true', timeout=10000)
        page_columns_fallback = await frame.evaluate('() => Array.from(document.querySelectorAll("table thead th")).map(th => th.textContent.trim())')
        assert all(col.split('.').pop() in page_columns_fallback for col in columns), 'Fallback to localStorage failed for columns'
        rows_fallback = await frame.evaluate('() => Array.from(document.querySelectorAll("table tbody tr")).map(tr => tr.textContent)')
        assert any('John' in row for row in rows_fallback), 'Fallback to localStorage failed for filter value John'
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    