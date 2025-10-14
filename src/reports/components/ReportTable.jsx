// src/reports/ReportTable.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { getReportFields } from "../../services/reportPreferences.js";
import { useParams, useNavigate } from "react-router-dom";
import SearchableSelect from "./SearchableSelect.jsx";

const SortIcon = React.memo(({ active, direction }) => {
  return (
    <span
      className={`ml-1 inline-block transition-transform ${
        active ? "text-indigo-600" : "text-slate-400"
      }`}
    >
      {direction === "asc" ? "▲" : "▼"}
    </span>
  );
});

const TableRow = React.memo(({ row, columns }) => {
  return (
    <tr className="even:bg-slate-50/60">
      {columns.map((c) => (
        <td
          key={c.key}
          className={`px-3 py-2 ${c.key.includes("Mins") ? "text-right" : ""}`}
        >
          {row[c.key] ?? ""}
        </td>
      ))}
    </tr>
  );
});

export default function ReportTable({
  rows,
  loading,
  error,
  sort,
  onSortChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  total,
  customColumns,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [persisted, setPersisted] = useState([]);

  useEffect(() => {
    const loadFields = () => {
      const fields = getReportFields(id);
      setPersisted(fields || []);
    };
    loadFields();

    const handler = (e) => {
      if (e.detail?.reportId === id) loadFields();
    };
    window.addEventListener("reportFieldsUpdated", handler);
    return () => window.removeEventListener("reportFieldsUpdated", handler);
  }, [id]);

  const baseDefaults = [
    { key: "date", label: "Date", width: "w-40" },
    { key: "employee", label: "Employee" },
    { key: "clockIn", label: "In", width: "w-24" },
    { key: "clockOut", label: "Out", width: "w-24" },
    { key: "breakMins", label: "Break (m)", width: "w-28" },
    { key: "totalMins", label: "Total (m)", width: "w-28" },
    { key: "location", label: "Location" },
  ];

  const columns = useMemo(() => {
    const selected = Array.isArray(customColumns) ? customColumns : persisted;
    if (Array.isArray(selected) && selected.length > 0) {
      const byKey = Object.fromEntries(baseDefaults.map((c) => [c.key, c]));
      return selected.map((k) => byKey[k] || { key: k, label: k });
    }
    return baseDefaults;
  }, [persisted, customColumns]);

  const changeSort = useCallback(
    (key) => {
      if (sort.key === key) {
        onSortChange({
          key,
          direction: sort.direction === "asc" ? "desc" : "asc",
        });
      } else {
        onSortChange({ key, direction: "asc" });
      }
    },
    [sort.key, sort.direction, onSortChange]
  );

  const handlePageSizeChange = useCallback(
    (value) => {
      onPageSizeChange(Number(value));
    },
    [onPageSizeChange]
  );

  const pageSizeOptions = useMemo(
    () =>
      [10, 20, 50, 100].map((n) => ({
        value: String(n),
        label: String(n),
      })),
    []
  );

  return (
    <div>
      {/* Column Info */}
      <div className="flex items-center justify-between mb-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="text-sm text-slate-600">
          {persisted.length > 0 ? (
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-indigo-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
              Showing {persisted.length} custom columns
            </span>
          ) : (
            <span className="text-slate-500">Using default columns</span>
          )}
        </div>
      </div>

      {/* Table - Scrollable */}
      <div className="overflow-x-auto" style={{ overflowY: "visible" }}>
        <table
          className="table-stretch text-sm"
          style={{ tableLayout: "auto" }}
        >
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-3 py-2 text-left font-medium whitespace-nowrap ${
                    c.width || ""
                  }`}
                >
                  <button
                    onClick={() => changeSort(c.key)}
                    className="flex items-center hover:text-indigo-600 transition"
                    aria-label={`Sort by ${c.label}`}
                  >
                    {c.label}{" "}
                    <SortIcon
                      active={sort.key === c.key}
                      direction={sort.direction}
                    />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-slate-500"
                >
                  Loading…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-red-600"
                >
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-slate-500"
                >
                  No data
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              rows.map((r, idx) => (
                <TableRow key={idx} row={r} columns={columns} />
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - Fixed (Outside scrollable area) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200 p-3 text-sm bg-white">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <div className="w-24">
            <SearchableSelect
              value={String(pageSize)}
              onChange={handlePageSizeChange}
              options={pageSizeOptions}
              editable={false}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-outline"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Previous
          </button>
          <div className="px-3 py-1 bg-slate-100 rounded text-sm font-medium">
            Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
          </div>
          <button
            className="btn btn-outline"
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            Next
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
