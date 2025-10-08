// src/reports/ReportTable.jsx
import React, { useEffect, useState } from "react";
import { getReportFields } from "../../services/reportPreferences.js";
import { useParams } from "react-router-dom";

function SortIcon({ active, direction }) {
  return (
    <span
      className={`ml-1 inline-block transition-transform ${
        active ? "text-indigo-600" : "text-slate-400"
      }`}
    >
      {direction === "asc" ? "▲" : "▼"}
    </span>
  );
}

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

  const columns = React.useMemo(() => {
    const selected = Array.isArray(customColumns) ? customColumns : persisted;
    if (Array.isArray(selected) && selected.length > 0) {
      const byKey = Object.fromEntries(baseDefaults.map((c) => [c.key, c]));
      return selected.map((k) => byKey[k] || { key: k, label: k });
    }
    return baseDefaults;
  }, [persisted, customColumns]);

  const changeSort = (key) => {
    if (sort.key === key) {
      onSortChange({
        key,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
    } else {
      onSortChange({ key, direction: "asc" });
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="table-stretch text-sm" style={{ tableLayout: "auto" }}>
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
                  className="flex items-center"
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
              <tr key={idx} className="even:bg-slate-50/60">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-3 py-2 ${
                      c.key.includes("Mins") ? "text-right" : ""
                    }`}
                  >
                    {r[c.key] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200 p-3 text-sm">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="input w-24 py-1"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-outline"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </button>
          <div>
            Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
          </div>
          <button
            className="btn btn-outline"
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
