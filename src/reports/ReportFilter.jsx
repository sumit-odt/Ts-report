// src/reports/ReportFilter.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getReportFields,
  setReportFilters,
  getReportFilters,
} from "../services/reportPreferences.js";
import SearchableSelect from "./components/SearchableSelect.jsx";

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
  const [fieldOptions, setFieldOptions] = useState([]);
  const [items, setItems] = useState([]);
  const [logic, setLogic] = useState("AND");
  const [loading, setLoading] = useState(true);

  const loadFields = useCallback(() => {
    setLoading(true);
    const savedFields = getReportFields(id);
    const options = (savedFields || []).map((f) => ({ value: f, label: f }));
    setFieldOptions(options);

    // Load saved filters if any
    const savedFilters = getReportFilters(id);
    if (savedFilters && savedFilters.items && savedFilters.items.length > 0) {
      setItems(savedFilters.items);
      setLogic(savedFilters.logic || "AND");
    } else {
      setItems(
        options.length > 0
          ? [{ field: options[0].value, condition: "eq", value: "" }]
          : []
      );
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadFields();
    const handler = (e) => {
      if (e.detail?.reportId === id) loadFields();
    };
    window.addEventListener("reportFieldsUpdated", handler);
    return () => window.removeEventListener("reportFieldsUpdated", handler);
  }, [id, loadFields]);

  const updateItem = useCallback(
    (idx, changes) =>
      setItems((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, ...changes } : it))
      ),
    []
  );

  const addItem = useCallback(() => {
    if (fieldOptions.length === 0) return;
    setItems((prev) => [
      ...prev,
      { field: fieldOptions[0].value, condition: "eq", value: "" },
    ]);
  }, [fieldOptions]);

  const removeItem = useCallback(
    (idx) => setItems((prev) => prev.filter((_, i) => i !== idx)),
    []
  );

  const apply = useCallback(() => {
    // Save filters to localStorage
    const filterData = { items, logic };
    setReportFilters(id, filterData);

    // Dispatch event to notify other components
    window.dispatchEvent(
      new CustomEvent("reportFiltersUpdated", {
        detail: { reportId: id, filters: filterData },
      })
    );

    // Navigate back to report
    navigate(`/reports/${id}`);
  }, [id, items, logic, navigate]);

  const clear = useCallback(() => {
    // Clear filters from localStorage
    setReportFilters(id, null);

    // Reset items
    if (fieldOptions.length > 0) {
      setItems([{ field: fieldOptions[0].value, condition: "eq", value: "" }]);
    } else {
      setItems([]);
    }

    // Dispatch event to notify report page
    window.dispatchEvent(
      new CustomEvent("reportFiltersUpdated", {
        detail: { reportId: id, filters: null },
      })
    );

    // Navigate back to report
    navigate(`/reports/${id}`);
  }, [fieldOptions, id, navigate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Filter Report</h1>
          <p className="text-sm text-slate-500 mt-1">
            Add conditions to filter your data
          </p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => navigate(`/reports/${id}`)}
        >
          ← Back to Report
        </button>
      </div>

      <div className="card p-6 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}
        {!loading && fieldOptions.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 mx-auto text-slate-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-slate-600 font-medium mb-2">
              No columns available
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Please customize your report first to select columns
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/reports/${id}/customize`)}
            >
              Customize Report
            </button>
          </div>
        )}

        {!loading && fieldOptions.length > 0 && (
          <div className="flex items-center justify-between mb-3">
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
        )}

        {!loading &&
          fieldOptions.length > 0 &&
          items.map((it, idx) => (
            <div
              key={idx}
              className="grid md:grid-cols-12 gap-3 items-end bg-slate-50/60 border border-slate-200 p-3 rounded-lg"
            >
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Select or Type Field
                </label>
                <SearchableSelect
                  value={it.field}
                  onChange={(value) => updateItem(idx, { field: value })}
                  options={fieldOptions}
                  placeholder="Select or type field name"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Filter Condition
                </label>
                <SearchableSelect
                  value={it.condition}
                  onChange={(value) => updateItem(idx, { condition: value })}
                  options={CONDITIONS}
                  placeholder="Select condition"
                  editable={false}
                />
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
                  className="btn btn-outline p-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition"
                  title="Remove this condition"
                  onClick={() => removeItem(idx)}
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}

        {!loading && fieldOptions.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              {items.filter((it) => it.value).length} of {items.length}{" "}
              condition(s) configured
            </p>
            <div className="flex gap-2">
              <button className="btn btn-outline px-5 py-2" onClick={clear}>
                Clear All
              </button>
              <button className="btn btn-primary px-5 py-2" onClick={apply}>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
