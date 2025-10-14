// src/reports/ReportCreate.jsx
import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";
import { setReportFields } from "../services/reportPreferences.js";
import { addNewReport } from "../services/reportCatalog.js";
import SearchableSelect from "./components/SearchableSelect.jsx";

const ReportCreate = () => {
  const navigate = useNavigate();

  // Report metadata
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportCategory, setReportCategory] = useState("general");

  // Tables and columns
  const [availableTables] = useState([
    "employees",
    "departments",
    "timesheets",
    "accounts",
    "transactions",
  ]);

  const [selectedTables, setSelectedTables] = useState([]);
  const [currentTable, setCurrentTable] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categoryOptions = useMemo(
    () => [
      { value: "general", label: "General" },
      { value: "anniversary", label: "Anniversary/Review" },
      { value: "financial", label: "Financial" },
      { value: "hr", label: "Human Resources" },
      { value: "operations", label: "Operations" },
    ],
    []
  );

  const fetchColumns = useCallback(async (tableName) => {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .limit(1);
      if (error) throw error;

      const columns = data?.length ? Object.keys(data[0]) : [];
      return columns;
    } catch (err) {
      console.error("Error fetching columns:", err);
      setError(`Failed to fetch columns for table "${tableName}".`);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddTable = useCallback(async () => {
    if (!currentTable) {
      alert("Please select a table.");
      return;
    }

    if (selectedTables.some((t) => t.tableName === currentTable)) {
      alert("This table is already added.");
      return;
    }

    const columns = await fetchColumns(currentTable);
    if (columns.length === 0) {
      alert("No columns found for this table.");
      return;
    }

    setSelectedTables((prev) => [
      ...prev,
      {
        tableName: currentTable,
        columns: columns,
        selectedColumns: [],
      },
    ]);
    setCurrentTable("");
  }, [currentTable, selectedTables, fetchColumns]);

  const handleRemoveTable = useCallback((tableName) => {
    setSelectedTables((prev) => prev.filter((t) => t.tableName !== tableName));
  }, []);

  const handleColumnToggle = useCallback((tableName, column) => {
    setSelectedTables((prev) =>
      prev.map((table) => {
        if (table.tableName === tableName) {
          const isSelected = table.selectedColumns.includes(column);
          return {
            ...table,
            selectedColumns: isSelected
              ? table.selectedColumns.filter((c) => c !== column)
              : [...table.selectedColumns, column],
          };
        }
        return table;
      })
    );
  }, []);

  const handleSelectAllColumns = useCallback((tableName) => {
    setSelectedTables((prev) =>
      prev.map((table) => {
        if (table.tableName === tableName) {
          return {
            ...table,
            selectedColumns: [...table.columns],
          };
        }
        return table;
      })
    );
  }, []);

  const handleDeselectAllColumns = useCallback((tableName) => {
    setSelectedTables((prev) =>
      prev.map((table) => {
        if (table.tableName === tableName) {
          return {
            ...table,
            selectedColumns: [],
          };
        }
        return table;
      })
    );
  }, []);

  const createReport = useCallback(() => {
    // Validate report name
    if (!reportName.trim()) {
      alert("Please enter a report name.");
      return;
    }

    // Validate that at least one table has selected columns
    const hasSelectedColumns = selectedTables.some(
      (t) => t.selectedColumns.length > 0
    );
    if (!hasSelectedColumns) {
      alert("Please select at least one column from any table.");
      return;
    }

    // Generate report ID from name
    const reportId = reportName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-");

    // Flatten all selected columns with table prefix
    const allColumns = [];
    const tableNames = [];

    selectedTables.forEach((table) => {
      if (table.selectedColumns.length > 0) {
        tableNames.push(table.tableName);
        table.selectedColumns.forEach((col) => {
          allColumns.push(`${table.tableName}.${col}`);
        });
      }
    });

    // Create the report schema
    const schema = allColumns.map((col) => {
      const [table, field] = col.split(".");
      return {
        required: false,
        field: field,
        label: field
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        type: "string",
        format: "",
        calculation: "",
      };
    });

    // Add the new report to the catalog
    const newReport = {
      id: reportId,
      title: reportName,
      description: reportDescription || "Custom report",
      category: reportCategory,
      lastViewed: new Date().toISOString(),
      execTime: "< 10 seconds",
      schema: schema,
    };

    addNewReport(newReport);

    // Save the column configuration
    setReportFields(reportId, allColumns, tableNames.join(","));

    // Navigate to the new report
    navigate(`/reports/${reportId}`);
  }, [reportName, reportDescription, reportCategory, selectedTables, navigate]);

  const availableTableOptions = useMemo(
    () =>
      availableTables.map((table) => ({
        value: table,
        label: table,
      })),
    [availableTables]
  );

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Create New Report
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Define your custom report with tables and columns
          </p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => navigate("/reports")}
        >
          ← Back to Reports
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        {/* Report Metadata Section */}
        <div className="space-y-4 pb-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            Report Information
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Report Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., Employee Performance Report"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category
              </label>
              <SearchableSelect
                value={reportCategory}
                onChange={(value) => setReportCategory(value)}
                options={categoryOptions}
                placeholder="Select category"
                editable={false}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              className="input w-full"
              rows={3}
              placeholder="Brief description of what this report shows..."
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Tables and Columns Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Select Data Sources
          </h2>

          {/* Add Table Section */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-semibold mb-3 text-gray-700">Add Table</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <SearchableSelect
                  value={currentTable}
                  onChange={(value) => setCurrentTable(value)}
                  options={availableTableOptions}
                  placeholder="-- Select Table --"
                  editable={false}
                />
              </div>
              <button
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                onClick={handleAddTable}
                disabled={!currentTable || loading}
              >
                {loading ? "Loading..." : "Add Table"}
              </button>
            </div>
            {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
          </div>

          {/* Selected Tables and Columns */}
          {selectedTables.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <svg
                className="w-16 h-16 mx-auto text-slate-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <p className="text-slate-600 font-medium mb-2">
                No tables selected
              </p>
              <p className="text-sm text-slate-500">
                Select a table above to add columns to your report
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedTables.map((table) => (
                <div
                  key={table.tableName}
                  className="border border-slate-200 rounded-lg overflow-hidden"
                >
                  {/* Table Header */}
                  <div className="bg-slate-100 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-800">
                        {table.tableName}
                      </h3>
                      <span className="text-sm text-slate-600">
                        ({table.selectedColumns.length} of{" "}
                        {table.columns.length} columns selected)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                        onClick={() => handleSelectAllColumns(table.tableName)}
                      >
                        Select All
                      </button>
                      <span className="text-slate-400">|</span>
                      <button
                        className="text-sm text-slate-600 hover:text-slate-700"
                        onClick={() =>
                          handleDeselectAllColumns(table.tableName)
                        }
                      >
                        Deselect All
                      </button>
                      <span className="text-slate-400">|</span>
                      <button
                        className="text-sm text-red-600 hover:text-red-700"
                        onClick={() => handleRemoveTable(table.tableName)}
                      >
                        Remove Table
                      </button>
                    </div>
                  </div>

                  {/* Columns Grid */}
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-3 gap-3">
                      {table.columns.map((col) => (
                        <label
                          key={col}
                          className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={table.selectedColumns.includes(col)}
                            onChange={() =>
                              handleColumnToggle(table.tableName, col)
                            }
                            className="rounded"
                          />
                          <span className="text-sm">{col}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            {selectedTables.reduce(
              (sum, t) => sum + t.selectedColumns.length,
              0
            )}{" "}
            column(s) selected from {selectedTables.length} table(s)
          </p>
          <div className="flex gap-3">
            <button
              className="btn btn-outline px-6 py-2"
              onClick={() => navigate("/reports")}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary px-6 py-2"
              onClick={createReport}
              disabled={
                !reportName.trim() ||
                selectedTables.length === 0 ||
                !selectedTables.some((t) => t.selectedColumns.length > 0)
              }
            >
              <svg
                className="w-4 h-4 mr-2 inline-block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCreate;
