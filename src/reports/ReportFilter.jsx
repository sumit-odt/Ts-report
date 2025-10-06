import React, { useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getReportFields } from "../services/reportPreferences.js";
import {
  FIELDS as CUSTOMIZE_FIELDS,
  SOURCES as CUSTOMIZE_SOURCES,
} from "./ReportCustomize.jsx";

const CONDITIONS = [
  { value: "eq", label: "equals (=)" },
  { value: "neq", label: "not equals (≠)" },
  { value: "gt", label: "greater than (>)" },
  { value: "lt", label: "less than (<)" },
  { value: "contains", label: "contains" },
  { value: "starts", label: "starts with" },
  { value: "ends", label: "ends with" },
];

export default function ReportFilter() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  // Build field options from ReportCustomize's SOURCES/FIELDS + saved custom columns for this report
  const fieldOptions = useMemo(() => {
    const allFromFields = Object.values(CUSTOMIZE_FIELDS || {}).flat();
    const unique = Array.from(new Set(allFromFields));
    const saved = getReportFields(id) || [];
    const mergedOrdered = [
      ...unique,
      ...saved.filter((k) => !unique.includes(k)),
    ];
    return mergedOrdered.map((k) => ({ value: k, label: k }));
  }, [id]);

  const [items, setItems] = useState([
    { field: fieldOptions[0]?.value || "date", condition: "eq", value: "" },
  ]);
  const [logic, setLogic] = useState("AND");

  const updateItem = (idx, changes) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...changes } : it))
    );
  };

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { field: fieldOptions[0]?.value || "date", condition: "eq", value: "" },
    ]);
  const removeItem = (idx) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const apply = () => {
    const payload = { reportId: id, logic, items };
    // For now, just log. Later this can be pushed into state/store/URL.
    // eslint-disable-next-line no-console
    console.log("APPLY_FILTER", payload);
    navigate(`/reports/${id}`);
  };

  const clear = () => {
    setItems([
      { field: fieldOptions[0]?.value || "date", condition: "eq", value: "" },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Filters</h1>
        <button
          className="btn btn-outline"
          onClick={() => navigate(`/reports`)}
        >
          Back
        </button>
      </div>

      <div className="card p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Combine with</span>
            <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
              <button
                type="button"
                className={`px-3 py-1.5 text-sm ${
                  logic === "AND"
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-slate-100"
                }`}
                onClick={() => setLogic("AND")}
              >
                AND
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-sm border-l border-slate-300 ${
                  logic === "OR"
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-slate-100"
                }`}
                onClick={() => setLogic("OR")}
              >
                OR
              </button>
            </div>
          </div>
          <button className="btn btn-outline" onClick={addItem}>
            Add Condition
          </button>
        </div>

        <div className="grid gap-3">
          {items.map((it, idx) => (
            <div
              key={idx}
              className="grid md:grid-cols-12 gap-3 items-end bg-slate-50/60 border border-slate-200 p-3 rounded-lg"
            >
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Select Field
                </label>
                <select
                  className="input"
                  value={it.field}
                  onChange={(e) => updateItem(idx, { field: e.target.value })}
                >
                  {fieldOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Filter Condition
                </label>
                <select
                  className="input"
                  value={it.condition}
                  onChange={(e) =>
                    updateItem(idx, { condition: e.target.value })
                  }
                >
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Filter Value
                </label>
                <input
                  className="input"
                  placeholder="Enter value"
                  value={it.value}
                  onChange={(e) => updateItem(idx, { value: e.target.value })}
                />
              </div>
              <div className="md:col-span-1 flex items-end justify-end">
                <button
                  type="button"
                  className="btn btn-outline p-2 rounded-full"
                  title="Remove condition"
                  onClick={() => removeItem(idx)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                  >
                    <path
                      d="M6 7h12M9 7V5h6v2m-8 3l1 10h8l1-10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button className="btn btn-outline" onClick={clear}>
            Clear Filter
          </button>
          <button className="btn btn-primary" onClick={apply}>
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
}
