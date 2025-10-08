import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getReportFields,
  setReportLastViewed,
} from "../services/reportPreferences.js";
import ReportFilter from "./ReportFilter.jsx";
import ReportTable from "./components/ReportTable.jsx";
import ExportButtons from "./components/ExportButtons.jsx";
import { fetchReportData } from "../services/reportService.js";
import { useNavigate } from "react-router-dom";

export default function ReportPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    location: "All",
    status: "All",
    search: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState({ key: "date", direction: "desc" });
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customColumns, setCustomColumns] = useState([]);

  const query = useMemo(
    () => ({ page, pageSize, sort, filters, reportId: id }),
    [page, pageSize, sort, filters, id]
  );

  useEffect(() => {
    // Load customized fields, if any
    const fields = getReportFields(id);
    if (Array.isArray(fields) && fields.length > 0) {
      setCustomColumns(fields);
    }
  }, [id]);

  useEffect(() => {
    // Record last viewed for this report
    if (id) setReportLastViewed(id);
    let active = true;
    setLoading(true);
    setError("");
    fetchReportData(query)
      .then((res) => {
        if (!active) return;
        setData(res.rows);
        setTotal(res.total);
      })
      .catch((err) => active && setError(err?.message || "Failed to load data"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [query]);

  return (
    <div className="space-y-4">
      <ReportFilter />

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          {total.toLocaleString()} records
        </div>
        <div className="flex items-center gap-2">
          {/* <button
            className="btn btn-outline"
            onClick={() => navigate(`/reports/${id}/filter`)}
          >
            Filter
          </button> */}
          <ExportButtons rows={data} fileName={(id || "report") + "-export"} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <ReportTable
          rows={data}
          loading={loading}
          error={error}
          sort={sort}
          onSortChange={setSort}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
          total={total}
          customColumns={customColumns}
        />
      </div>
    </div>
  );
}
