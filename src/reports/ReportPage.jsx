import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  getReportFields,
  setReportLastViewed,
  getReportFilters,
  setReportFilters,
} from "../services/reportPreferences.js";
import ReportFilter from "./ReportFilter.jsx";
import ReportTable from "./components/ReportTable.jsx";
import ExportButtons from "./components/ExportButtons.jsx";
import { fetchReportData } from "../services/reportService.js";
import { useNavigate } from "react-router-dom";

export default function ReportPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    location: "All",
    status: "All",
    search: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState({ key: "date", direction: "desc" });
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customColumns, setCustomColumns] = useState([]);
  const [activeFilters, setActiveFilters] = useState(null);

  const query = useMemo(
    () => ({ page, pageSize, sort, filters, reportId: id }),
    [page, pageSize, sort, filters, id]
  );

  useEffect(() => {
    // Load customized fields, if any
    const fields = getReportFields(id);
    if (Array.isArray(fields) && fields.length > 0) {
      setCustomColumns(fields);
      // Set initial sort to first column if different from current
      if (fields[0] && sort.key === "date") {
        setSort({ key: fields[0], direction: "desc" });
      }
    }

    // Load active filters
    const savedFilters = getReportFilters(id);
    setActiveFilters(savedFilters);
  }, [id, sort.key]);

  useEffect(() => {
    // Record last viewed for this report
    if (id) setReportLastViewed(id);
    let active = true;
    setLoading(true);
    setError("");
    fetchReportData(query)
      .then((res) => {
        if (!active) return;
        setData(res.rows);
        setTotal(res.total);
      })
      .catch((err) => active && setError(err?.message || "Failed to load data"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [query]);

  // Listen for filter updates
  useEffect(() => {
    const handler = () => {
      // Reload filters and refetch data
      const savedFilters = getReportFilters(id);
      setActiveFilters(savedFilters);
      setPage(1); // Reset to first page

      // Immediately refetch data with new filters
      setLoading(true);
      setError("");
      fetchReportData({ page: 1, pageSize, sort, filters, reportId: id })
        .then((res) => {
          setData(res.rows);
          setTotal(res.total);
        })
        .catch((err) => setError(err?.message || "Failed to load data"))
        .finally(() => setLoading(false));
    };
    window.addEventListener("reportFiltersUpdated", handler);
    return () => window.removeEventListener("reportFiltersUpdated", handler);
  }, [id, pageSize, sort, filters]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + F to open filters
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        navigate(`/reports/${id}/filter`);
      }
      // Ctrl/Cmd + E to export
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        // Could trigger export dropdown
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [id, navigate]);

  const clearFilters = useCallback(() => {
    // Clear from localStorage
    setReportFilters(id, null);
    setActiveFilters(null);
    setPage(1);
    setLoading(true);
    setError("");
    fetchReportData({ page: 1, pageSize, sort, filters, reportId: id })
      .then((res) => {
        setData(res.rows);
        setTotal(res.total);
      })
      .catch((err) => setError(err?.message || "Failed to load data"))
      .finally(() => setLoading(false));
  }, [id, pageSize, sort, filters]);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {id?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View and manage report data
          </p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => navigate("/reports")}
        >
          ← Back to Reports
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">
              {total.toLocaleString()}
            </span>{" "}
            records
          </div>
          {activeFilters &&
            activeFilters.items &&
            activeFilters.items.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{activeFilters.items.length} filter(s) active</span>
                </div>
                <button
                  className="text-xs text-slate-600 hover:text-slate-800 underline"
                  onClick={clearFilters}
                >
                  Clear all
                </button>
              </div>
            )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-outline"
            onClick={() => navigate(`/reports/${id}/filter`)}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2.586a1 1 0 01-.293.707l-3.914 3.914A1 1 0 0012 12.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-4.586a1 1 0 00-.293-.707L3.793 7.793A1 1 0 013 7.086V4z"
              />
            </svg>
            Filters
          </button>
          <ExportButtons rows={data} fileName={(id || "report") + "-export"} />
          <button
            className="btn btn-outline p-2"
            onClick={() => navigate(`/reports/${id}/customize`)}
            title="Customize Columns"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="card">
        <ReportTable
          rows={data}
          loading={loading}
          error={error}
          sort={sort}
          onSortChange={setSort}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
          total={total}
          customColumns={customColumns}
        />
      </div>
    </div>
  );
}
