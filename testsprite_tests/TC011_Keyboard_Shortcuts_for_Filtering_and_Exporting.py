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
        # Click the 'View' button for the first report to open the report execution page with focus on the data table.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/table/tbody/tr[2]/td[5]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Navigate back to the report execution page to retry or continue testing other shortcuts.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assert that pressing Ctrl+F opens the filter interface and it is focused for user input
        await frame.keyboard.press('Control+F')
        filter_input = frame.locator('input[aria-label="Filter"]')
        assert await filter_input.is_visible(), 'Filter interface should be visible after Ctrl+F'
        assert await filter_input.evaluate('(el) => el === document.activeElement'), 'Filter input should be focused after Ctrl+F'
          
        # Assert that pressing Ctrl+E triggers the export options and last selected export happens
        await frame.keyboard.press('Control+E')
        export_dialog = frame.locator('div[role="dialog"][aria-label="Export Options"]')
        assert await export_dialog.is_visible(), 'Export options dialog should be visible after Ctrl+E'
        last_export_status = await frame.locator('text=Last export successful').is_visible()
        assert last_export_status, 'Last selected export should happen after Ctrl+E'
          
        # Assert that pressing invalid key combinations does not trigger unintended actions
        await frame.keyboard.press('Control+Shift+X')
        assert not await filter_input.is_visible(), 'Filter interface should not open on invalid shortcut'
        assert not await export_dialog.is_visible(), 'Export dialog should not open on invalid shortcut'
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    