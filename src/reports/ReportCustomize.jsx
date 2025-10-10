// src/reports/ReportCustomize.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";
import {
  setReportFields,
  getReportFields,
} from "../services/reportPreferences.js";
import SearchableSelect from "./components/SearchableSelect.jsx";

const ReportCustomize = () => {
  const { id: reportId } = useParams();
  const navigate = useNavigate();

  const [availableTables] = useState([
    "employees",
    "departments",
    "timesheets",
    "accounts",
    "transactions",
  ]);

  // Store multiple tables with their columns
  // Structure: [{ tableName: "employees", columns: ["id", "name"], selectedColumns: ["id", "name"] }]
  const [selectedTables, setSelectedTables] = useState([]);
  const [currentTable, setCurrentTable] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    // Check if table already added
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
        selectedColumns: [], // Initially no columns selected
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

  const savePreferences = useCallback(() => {
    // Validate that at least one table has selected columns
    const hasSelectedColumns = selectedTables.some(
      (t) => t.selectedColumns.length > 0
    );
    if (!hasSelectedColumns) {
      alert("Please select at least one column from any table.");
      return;
    }

    // Flatten all selected columns with table prefix (e.g., "employees.id", "departments.name")
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

    // Save the configuration
    setReportFields(reportId, allColumns, tableNames.join(","));
    navigate(`/reports/${reportId}`);
  }, [reportId, selectedTables, navigate]);

  const availableTableOptions = useMemo(
    () =>
      availableTables.map((table) => ({
        value: table,
        label: table,
      })),
    [availableTables]
  );

  // Load previously saved preferences
  useEffect(() => {
    const savedCols = getReportFields(reportId);
    if (savedCols && savedCols.length > 0) {
      // Parse saved columns back to table structure
      const tablesMap = {};
      savedCols.forEach((col) => {
        const [tableName, columnName] = col.split(".");
        if (tableName && columnName) {
          if (!tablesMap[tableName]) {
            tablesMap[tableName] = [];
          }
          tablesMap[tableName].push(columnName);
        }
      });

      // Fetch columns for each saved table
      Object.keys(tablesMap).forEach(async (tableName) => {
        const columns = await fetchColumns(tableName);
        setSelectedTables((prev) => {
          // Check if table already exists
          if (prev.some((t) => t.tableName === tableName)) {
            return prev;
          }
          return [
            ...prev,
            {
              tableName,
              columns,
              selectedColumns: tablesMap[tableName],
            },
          ];
        });
      });
    }
  }, [reportId]);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Customize Report
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Select tables and columns to display in your report
          </p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => navigate(`/reports/${reportId}`)}
        >
          ← Back to Report
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {/* Add Table Section */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
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
          <div className="text-center py-12">
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
              Select a table above to start customizing your report
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
                      ({table.selectedColumns.length} of {table.columns.length}{" "}
                      columns selected)
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
                      onClick={() => handleDeselectAllColumns(table.tableName)}
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

        {/* Save Button */}
        <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
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
              onClick={() => navigate(`/reports/${reportId}`)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary px-6 py-2"
              onClick={savePreferences}
              disabled={
                selectedTables.length === 0 ||
                !selectedTables.some((t) => t.selectedColumns.length > 0)
              }
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCustomize;
