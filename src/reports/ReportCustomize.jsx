// src/reports/ReportCustomize.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";
import {
  setReportFields,
  getReportFields,
} from "../services/reportPreferences.js";

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

  const fetchColumns = async (tableName) => {
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
  };

  const handleAddTable = async () => {
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
  };

  const handleRemoveTable = (tableName) => {
    setSelectedTables((prev) => prev.filter((t) => t.tableName !== tableName));
  };

  const handleColumnToggle = (tableName, column) => {
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
  };

  const handleSelectAllColumns = (tableName) => {
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
  };

  const handleDeselectAllColumns = (tableName) => {
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
  };

  const savePreferences = () => {
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
    alert("Preferences saved successfully!");
    navigate(`/reports/${reportId}`);
  };

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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Customize Report
        </h2>

        {/* Add Table Section */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="font-semibold mb-3 text-gray-700">Add Table</h3>
          <div className="flex gap-3">
            <select
              className="flex-1 border rounded-lg p-2"
              value={currentTable}
              onChange={(e) => setCurrentTable(e.target.value)}
            >
              <option value="">-- Select Table --</option>
              {availableTables.map((table) => (
                <option key={table} value={table}>
                  {table}
                </option>
              ))}
            </select>
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
          <div className="text-center py-8 text-slate-500">
            <p>No tables added yet. Select a table above to get started.</p>
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
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            className="btn btn-outline px-6 py-2"
            onClick={() => navigate("/reports")}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
};

export default ReportCustomize;
