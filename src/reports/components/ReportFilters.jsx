import React, { useState } from "react";

export default function ReportFilters({ value, onChange, onSubmit }) {
  const [local, setLocal] = useState(value);

  const update = (key, val) => {
    const next = { ...local, [key]: val };
    setLocal(next);
  };

  const apply = (e) => {
    e?.preventDefault();
    onChange(local);
    onSubmit?.();
  };

  const reset = () => {
    const cleared = {
      startDate: "",
      endDate: "",
      location: "All",
      status: "All",
      search: "",
    };
    setLocal(cleared);
    onChange(cleared);
    onSubmit?.();
  };

  return (
    <form onSubmit={apply} className="grid gap-3 md:grid-cols-5">
      <div className="md:col-span-1">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Start date
        </label>
        <input
          type="date"
          value={local.startDate}
          onChange={(e) => update("startDate", e.target.value)}
          className="input"
        />
      </div>
      <div className="md:col-span-1">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          End date
        </label>
        <input
          type="date"
          value={local.endDate}
          onChange={(e) => update("endDate", e.target.value)}
          className="input"
        />
      </div>
      <div className="md:col-span-1">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Location
        </label>
        <select
          value={local.location}
          onChange={(e) => update("location", e.target.value)}
          className="input"
        >
          <option>All</option>
          <option>Indore Office</option>
          <option>Mumbai Office</option>
          <option>Remote</option>
        </select>
      </div>
      <div className="md:col-span-1">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Status
        </label>
        <select
          value={local.status}
          onChange={(e) => update("status", e.target.value)}
          className="input"
        >
          <option>All</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>
      <div className="md:col-span-1">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Search
        </label>
        <input
          placeholder="Search name, dept, etc"
          value={local.search}
          onChange={(e) => update("search", e.target.value)}
          className="input"
        />
      </div>
      <div className="md:col-span-5 flex items-center gap-2 justify-end">
        <button type="button" onClick={reset} className="btn btn-outline">
          Reset
        </button>
        <button type="submit" className="btn btn-primary">
          Apply Filters
        </button>
      </div>
    </form>
  );
}
