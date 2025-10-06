# Report Module (React + Vite + Tailwind)

Modern, responsive reports UI scaffold to replace legacy PayPlus 360 reporting pages.

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Run dev server:

```bash
npm run dev
```

3. Open the app at `http://localhost:5173` and navigate to `/reports`.

## Structure

```
src/
  main.jsx                 # Router + App shell
  index.css                # Tailwind styles and utility classes
  reports/
    ReportPage.jsx         # Container: filters + table + exports
    components/
      ReportFilters.jsx    # Date range, dropdowns, search
      ReportTable.jsx      # Sortable, paginated table
      ExportButtons.jsx    # CSV, Excel, PDF
  services/
    reportService.js       # Mock API + export helpers
```

## Notes

- Functional components with hooks, pure JS (no TS).
- Tailwind used for a clean, modern UI. Replace with MUI if preferred.
- `reportService.js` includes a mock dataset and latency simulation; replace with real API calls when ready.
