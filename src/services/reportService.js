import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatMMDDYYYY } from './date.js';

// Mock dataset generator
const EMPLOYEES = ['Sumit Khanvilkar', 'Asha Patel', 'Rahul Sharma', 'Priya Mehta', 'Ravi Kumar'];
const LOCATIONS = ['Indore Office', 'Mumbai Office', 'Remote'];

function pad(num) { return String(num).padStart(2, '0'); }

function generateMockRow(dayIndex = 0) {
  const date = new Date();
  date.setDate(date.getDate() - dayIndex);
  const clockInHour = 9 + Math.floor(Math.random() * 2); // 9-10
  const clockOutHour = 17 + Math.floor(Math.random() * 3); // 17-19
  const breakMins = [30, 45, 60][Math.floor(Math.random() * 3)];
  const totalMins = (clockOutHour - clockInHour) * 60 - breakMins;
  return {
    dateISO: date.toISOString(),
    date: formatMMDDYYYY(date),
    employee: EMPLOYEES[Math.floor(Math.random() * EMPLOYEES.length)],
    clockIn: `${clockInHour}:${pad(Math.floor(Math.random() * 60))} AM`,
    clockOut: `${clockOutHour - 12}:${pad(Math.floor(Math.random() * 60))} PM`,
    breakMins,
    totalMins,
    location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
    status: Math.random() > 0.1 ? 'Active' : 'Inactive'
  };
}

const MOCK_DATA = Array.from({ length: 250 }, (_, i) => generateMockRow(i));

function applyFilters(rows, { startDate, endDate, location, status, search }) {
  return rows.filter((r) => {
    let ok = true;
    if (startDate) ok = ok && new Date(r.dateISO) >= new Date(startDate);
    if (endDate) ok = ok && new Date(r.dateISO) <= new Date(endDate);
    if (location && location !== 'All') ok = ok && r.location === location;
    if (status && status !== 'All') ok = ok && r.status === status;
    if (search) ok = ok && JSON.stringify(r).toLowerCase().includes(search.toLowerCase());
    return ok;
  });
}

function applySort(rows, { key, direction }) {
  const s = [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (key === 'date') {
      return new Date(a.dateISO) - new Date(b.dateISO);
    }
    if (typeof av === 'number' && typeof bv === 'number') return av - bv;
    return String(av).localeCompare(String(bv));
  });
  return direction === 'desc' ? s.reverse() : s;
}

export async function fetchReportData({ page, pageSize, sort, filters }) {
  await new Promise((r) => setTimeout(r, 350)); // simulate latency
  let rows = applyFilters(MOCK_DATA, filters || {});
  rows = applySort(rows, sort || { key: 'date', direction: 'desc' });
  const total = rows.length;
  const offset = (page - 1) * pageSize;
  const paged = rows.slice(offset, offset + pageSize);
  return { rows: paged, total };
}

export function exportCSV(rows, fileName = 'report') {
  const headers = Object.keys(rows[0] || {});
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${fileName}.csv`; a.click(); URL.revokeObjectURL(url);
}

export function exportExcel(rows, fileName = 'report') {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Report');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function exportPDF(rows, fileName = 'report') {
  const doc = new jsPDF('l', 'pt');
  const headers = Object.keys(rows[0] || {});
  const data = rows.map((r) => headers.map((h) => r[h]));
  doc.text('Report', 40, 40);
  autoTable(doc, { startY: 60, head: [headers], body: data });
  doc.save(`${fileName}.pdf`);
}


