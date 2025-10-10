import React, { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getReportCatalog } from "../services/reportCatalog.js";
import { getReportLastViewed } from "../services/reportPreferences.js";
import { formatMMDDYYYY } from "../services/date.js";
import ReportSchemaTable from "./components/ReportSchemaTable.jsx";

const IconButton = React.memo(({ label, onClick, children }) => {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className="btn btn-outline p-2 rounded-full"
    >
      {children}
    </button>
  );
});

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-5 w-5"
    >
      <path
        d="M12 5c-5 0-9 7-9 7s4 7 9 7 9-7 9-7-4-7-9-7z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AdjustIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
      />
    </svg>
  );
}

export default function ReportSelectorPage() {
  const navigate = useNavigate();
  const catalog = useMemo(() => getReportCatalog(), []);
  const [expanded, setExpanded] = useState({}); // reportId -> boolean

  const toggle = useCallback(
    (id) => setExpanded((s) => ({ ...s, [id]: !s[id] })),
    []
  );

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse and manage your reports
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3 bg-slate-50">
          <h2 className="font-semibold text-slate-700">Available Reports</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="w-12 px-3 py-2"> </th>
                <th className="text-left px-3 py-2">Title</th>
                <th className="text-left px-3 py-2 w-40">Last Viewed</th>
                <th className="text-left px-3 py-2 w-40">Exec Time</th>
                <th className="w-40 px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map((cat) => (
                <React.Fragment key={cat.id}>
                  <tr className="bg-slate-100/70">
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2 font-medium" colSpan={4}>
                      {cat.title}
                    </td>
                  </tr>
                  {cat.reports.map((r) => (
                    <React.Fragment key={r.id}>
                      <tr className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <button
                            aria-label="expand"
                            onClick={() => toggle(r.id)}
                            className="btn btn-outline py-1 px-2 min-w-8"
                          >
                            {expanded[r.id] ? "−" : "+"}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            className="text-indigo-700 hover:underline"
                            onClick={() => navigate(`/reports/${r.id}`)}
                          >
                            {r.title}
                          </button>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {(() => {
                            const v = getReportLastViewed(r.id);
                            if (v) return formatMMDDYYYY(new Date(v));
                            const d = new Date(r.lastViewed);
                            return Number.isNaN(d.getTime())
                              ? r.lastViewed
                              : formatMMDDYYYY(d);
                          })()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {r.execTime}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <IconButton
                              label="View"
                              onClick={() => navigate(`/reports/${r.id}`)}
                            >
                              <EyeIcon />
                            </IconButton>
                            <IconButton
                              label="View Historical Data"
                              onClick={() =>
                                navigate(`/reports/${r.id}?mode=history`)
                              }
                            >
                              <ClockIcon />
                            </IconButton>
                            <IconButton
                              label="Customize"
                              onClick={() =>
                                navigate(`/reports/${r.id}/customize`)
                              }
                            >
                              <AdjustIcon />
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                      {expanded[r.id] && (
                        <tr>
                          <td />
                          <td className="px-3 pb-4" colSpan={4}>
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                              <ReportSchemaTable reportId={r.id} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
