import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import ReportPage from "./reports/ReportPage.jsx";
import ReportSelectorPage from "./reports/ReportSelectorPage.jsx";
import ReportCustomize from "./reports/ReportCustomize.jsx";
import ReportFilter from "./reports/ReportFilter.jsx";

function AppShell() {
  return (
    <div className="app-container">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white grid place-items-center font-bold">
              R
            </div>
            <span className="font-semibold">Reports</span>
          </div>
          {/* <nav className="text-sm text-slate-600">Modern Report Module</nav> */}
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/reports" replace />} />
          <Route path="/reports" element={<ReportSelectorPage />} />
          <Route path="/reports/:id" element={<ReportPage />} />
          <Route path="/reports/:id/customize" element={<ReportCustomize />} />
          <Route path="/reports/:id/filter" element={<ReportFilter />} />
          <Route path="*" element={<div className="p-6">Not Found</div>} />
        </Routes>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </React.StrictMode>
);
