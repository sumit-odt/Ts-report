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

  const editSchema = () => {
    const newLabel = prompt("Edit schema name", "Report Schema");
    if (newLabel == null) return;
    // You can implement schema-level editing logic here
    console.log("Edit schema:", newLabel);
  };

  const copySchema = () => {
    if (!confirm("Copy entire schema?")) return;
    // You can implement schema copying logic here
    console.log("Copy schema");
  };

  const deleteSchema = () => {
    if (!confirm("Delete entire schema? This will remove all fields.")) return;
    setRows([]);
  };

  return (
    <div className="overflow-x-auto">
      {/* Schema Actions */}
      <div className="mb-4 flex items-center gap-2">
        <button className="btn btn-outline py-2 px-4" onClick={editSchema}>
          Edit Schema
        </button>
        <button className="btn btn-outline py-2 px-4" onClick={copySchema}>
          Copy Schema
        </button>
        <button className="btn btn-outline py-2 px-4" onClick={deleteSchema}>
          Delete Schema
        </button>
      </div>

      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-3 py-2 w-24 text-left">Required</th>
            <th className="px-3 py-2 text-left">Field</th>
            <th className="px-3 py-2 text-left">Label</th>
            <th className="px-3 py-2 text-left">Type</th>
            <th className="px-3 py-2 text-left">Format</th>
            <th className="px-3 py-2 text-left">Calculation</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
