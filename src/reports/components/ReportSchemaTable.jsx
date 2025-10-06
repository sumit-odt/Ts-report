import React, { useEffect, useMemo, useState } from "react";
import { getSchemaForReport } from "../../services/reportCatalog.js";
import { getReportFields } from "../../services/reportPreferences.js";

export default function ReportSchemaTable({ reportId }) {
  const initial = useMemo(() => getSchemaForReport(reportId), [reportId]);
  const [rows, setRows] = useState(initial);

  useEffect(() => {
    const selected = getReportFields(reportId);
    if (Array.isArray(selected) && selected.length > 0) {
      // Filter to selected fields, and keep the order of selections
      const byField = Object.fromEntries(
        (initial || []).map((r) => [r.field, r])
      );
      const filtered = selected
        .map(
          (f) =>
            byField[f] || {
              required: false,
              field: f,
              label: f,
              type: "string",
              format: "",
              calculation: "",
            }
        )
        .filter(Boolean);
      setRows(filtered);
      return;
    }
    setRows(initial);
  }, [reportId, initial]);

  const editRow = (idx) => {
    const current = rows[idx];
    const label = prompt("Edit label", current.label);
    if (label == null) return;
    const next = rows.map((r, i) => (i === idx ? { ...r, label } : r));
    setRows(next);
  };

  const copyRow = (idx) => {
    const next = [...rows];
    next.splice(idx + 1, 0, { ...rows[idx] });
    setRows(next);
  };

  const deleteRow = (idx) => {
    if (!confirm("Delete this field?")) return;
    const next = rows.filter((_, i) => i !== idx);
    setRows(next);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-3 py-2 w-24 text-left">Required</th>
            <th className="px-3 py-2 text-left">Field</th>
            <th className="px-3 py-2 text-left">Label</th>
            <th className="px-3 py-2 text-left">Type</th>
            <th className="px-3 py-2 text-left">Format</th>
            <th className="px-3 py-2 text-left">Calculation</th>
            <th className="px-3 py-2 w-40 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="border-t border-slate-200">
              <td className="px-3 py-2">{r.required ? "Yes" : "No"}</td>
              <td className="px-3 py-2 font-mono">{r.field}</td>
              <td className="px-3 py-2">{r.label}</td>
              <td className="px-3 py-2">{r.type}</td>
              <td className="px-3 py-2">{r.format}</td>
              <td className="px-3 py-2">{r.calculation}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-outline py-1"
                    onClick={() => editRow(idx)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-outline py-1"
                    onClick={() => copyRow(idx)}
                  >
                    Copy
                  </button>
                  <button
                    className="btn btn-outline py-1"
                    onClick={() => deleteRow(idx)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
