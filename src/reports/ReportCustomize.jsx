import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getReportFields,
  setReportFields,
} from "../services/reportPreferences.js";

// Mocked sources and tables; later replace with API
export const SOURCES = {
  Payroll: ["Employees", "Timesheets", "Departments"],
  HR: ["People", "Positions", "Locations"],
  Finance: ["Accounts", "Transactions"],
};

export const FIELDS = {
  Employees: ["id", "firstName", "lastName", "hireDate", "status"],
  Timesheets: ["date", "clockIn", "clockOut", "breakMins", "totalMins"],
  Departments: ["code", "name"],
  People: ["empId", "name", "dob"],
  Positions: ["title", "grade"],
  Locations: ["name"],
  Accounts: ["number", "name"],
  Transactions: ["date", "amount", "type"],
};

export default function ReportCustomize() {
  const navigate = useNavigate();
  const { id } = useParams();
  const sourceOptions = useMemo(() => Object.keys(SOURCES), []);
  const [source, setSource] = useState(sourceOptions[0]);
  const tableOptions = useMemo(() => SOURCES[source] || [], [source]);
  const [table, setTable] = useState(tableOptions[0]);
  const fields = useMemo(() => FIELDS[table] || [], [table]);
  const [selected, setSelected] = useState([]);

  // Load previously saved selections for this report
  useEffect(() => {
    const saved = getReportFields(id);
    if (Array.isArray(saved)) setSelected(saved);
  }, [id]);

  const toggleField = (f) => {
    setSelected((prev) => {
      const next = prev.includes(f)
        ? prev.filter((x) => x !== f)
        : [...prev, f];
      // Persist immediately so it sticks until deselected
      setReportFields(id, next);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Customize Report</h1>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-outline"
            onClick={() => navigate("/reports")}
          >
            Back
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setReportFields(id, selected);
              navigate(`/reports/${id}`);
            }}
            disabled={selected.length === 0}
          >
            Save & Apply
          </button>
        </div>
      </div>

      <div className="card p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Data Source
            </label>
            <select
              className="input"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setTable((SOURCES[e.target.value] || [])[0]);
              }}
            >
              {sourceOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Table
            </label>
            <select
              className="input"
              value={table}
              onChange={(e) => setTable(e.target.value)}
            >
              {(SOURCES[source] || []).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="self-end text-sm text-slate-600">
            Report: <span className="font-medium">{id}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-3">
            <div className="font-medium mb-2">Available Fields</div>
            <div className="flex flex-wrap gap-2">
              {fields.map((f) => (
                <button
                  key={f}
                  className="btn btn-outline"
                  onClick={() => toggleField(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="card p-3">
            <div className="font-medium mb-2">Selected Fields</div>
            {selected.length === 0 ? (
              <div className="text-slate-500 text-sm">
                Report customization options will appear here
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selected.map((f) => (
                  <button
                    key={f}
                    className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm"
                    title="Click to remove"
                    onClick={() => toggleField(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
