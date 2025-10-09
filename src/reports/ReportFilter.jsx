// src/reports/ReportFilter.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getReportFields } from "../services/reportPreferences.js";
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

  const loadFields = () => {
    setLoading(true);
    const savedFields = getReportFields(id);
    const options = (savedFields || []).map((f) => ({ value: f, label: f }));
    setFieldOptions(options);

    setItems(
      options.length > 0
        ? [{ field: options[0].value, condition: "eq", value: "" }]
        : []
    );
    setLoading(false);
  };

  useEffect(() => {
    loadFields();
    const handler = (e) => {
      if (e.detail?.reportId === id) loadFields();
    };
    window.addEventListener("reportFieldsUpdated", handler);
    return () => window.removeEventListener("reportFieldsUpdated", handler);
  }, [id]);

  const updateItem = (idx, changes) =>
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...changes } : it))
    );

  const addItem = () => {
    if (fieldOptions.length === 0) return;
    setItems((prev) => [
      ...prev,
      { field: fieldOptions[0].value, condition: "eq", value: "" },
    ]);
  };

  const removeItem = (idx) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const apply = () => {
    console.log("APPLY_FILTER", { reportId: id, logic, items });
    navigate(`/reports/${id}`);
  };

  const clear = () => {
    if (fieldOptions.length > 0) {
      setItems([{ field: fieldOptions[0].value, condition: "eq", value: "" }]);
    } else {
      setItems([]);
    }
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
        {loading && <p>Loading fields…</p>}
        {!loading && fieldOptions.length === 0 && (
          <div className="text-slate-500 text-sm mb-2">
            No fields selected in Report Customize for this report.
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
                  className="btn btn-outline p-2 rounded-full"
                  title="Remove condition"
                  onClick={() => removeItem(idx)}
                >
                  ❌
                </button>
              </div>
            </div>
          ))}

        {!loading && fieldOptions.length > 0 && (
          <div className="flex items-center justify-end gap-2">
            <button className="btn btn-outline" onClick={clear}>
              Clear Filter
            </button>
            <button className="btn btn-primary" onClick={apply}>
              Apply Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
