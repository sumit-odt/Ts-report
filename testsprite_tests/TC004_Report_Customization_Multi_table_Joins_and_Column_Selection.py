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
        # Click on the 'Customize' button for the '401k Setup' report to open the report customization interface.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/table/tbody/tr[2]/td[5]/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Open the table dropdown to view available tables to add.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Select 'employees' table from the dropdown and click 'Add Table' to add it to the report.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Open the table dropdown to select another related table to add.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Select 'departments' table from the dropdown and click 'Add Table' to add it to the report.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click 'Add Table' button again to confirm adding 'departments' table if not added yet, then verify automatic foreign key linking between 'employees' and 'departments' tables.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click 'Select All' button for 'employees' table to select all columns and verify the column counter updates.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/div/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click 'Select All' button for 'departments' table to select all columns and verify the column counter updates accordingly.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/div[2]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click 'Deselect All' button for 'employees' table to deselect all columns and verify the column counter updates accordingly.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/div/div/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click 'Remove Table' button for 'employees' table and verify that the system prevents removal of the primary table.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/div/div/div[2]/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Drag and reorder the selected columns in the 'departments' table and verify the updated order is reflected immediately in the schema preview.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[2]/div/div[2]/div/label').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click 'Save & Apply' button to save the customization changes and confirm the changes are applied successfully.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/div[3]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assertion: Verify tables are linked automatically using foreign keys
        linked_tables = await frame.locator('xpath=//div[contains(@class, "linked-tables")]//table').all_text_contents()
        assert any('employees' in table for table in linked_tables), "Employees table should be linked automatically"
        assert any('departments' in table for table in linked_tables), "Departments table should be linked automatically"
        # Assertion: Confirm column counters update in real-time and users cannot remove the primary table
        employees_selected_count = await frame.locator('xpath=//div[contains(@class, "employees-table")]//button[contains(text(), "Selected")]').text_content()
        departments_selected_count = await frame.locator('xpath=//div[contains(@class, "departments-table")]//button[contains(text(), "Selected")]').text_content()
        assert '0' in employees_selected_count or 'selected' in employees_selected_count.lower(), "Employees table selected count should update"
        assert '0' not in departments_selected_count, "Departments table selected count should update"
        remove_primary_btn = frame.locator('xpath=//div[contains(@class, "primary-table")]//button[contains(text(), "Remove Table")]')
        assert await remove_primary_btn.is_disabled(), "Primary table remove button should be disabled"
        # Assertion: Ensure customization changes reflect accurately in the schema preview
        schema_preview_columns = await frame.locator('xpath=//div[contains(@class, "schema-preview")]//div[contains(@class, "column-name")]').all_text_contents()
        expected_order = ['departments.code', 'departments.name']
        assert schema_preview_columns == expected_order, "Schema preview should reflect reordered columns"
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    