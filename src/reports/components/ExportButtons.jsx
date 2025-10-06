import React from "react";
import {
  exportCSV,
  exportExcel,
  exportPDF,
} from "../../services/reportService.js";

export default function ExportButtons({ rows, fileName = "report" }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="btn btn-outline"
        onClick={() => exportCSV(rows, fileName)}
      >
        CSV
      </button>
      <button
        type="button"
        className="btn btn-outline"
        onClick={() => exportExcel(rows, fileName)}
      >
        Excel
      </button>
      <button
        type="button"
        className="btn btn-outline"
        onClick={() => exportPDF(rows, fileName)}
      >
        PDF
      </button>
    </div>
  );
}
