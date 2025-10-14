import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatMMDDYYYY } from './date.js';
import { supabase } from './supabaseClient.js';
import { getReportFields, getReportTableName, getReportFilters } from './reportPreferences.js';

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

// Lazy load mock data only when needed
let MOCK_DATA_CACHE = null;
function getMockData() {
  if (!MOCK_DATA_CACHE) {
    MOCK_DATA_CACHE = Array.from({ length: 250 }, (_, i) => generateMockRow(i));
  }
  return MOCK_DATA_CACHE;
}

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

export async function fetchReportData({ page, pageSize, sort, filters, reportId }) {
  // If reportId is provided and has custom table/columns, fetch from Supabase
  if (reportId) {
    const tableNames = getReportTableName(reportId); // Can be comma-separated
    const selectedColumns = getReportFields(reportId); // Format: "table.column"
    
    if (tableNames && selectedColumns && selectedColumns.length > 0) {
      try {
        const tables = tableNames.split(',');
        
        if (tables.length === 1) {
          // Single table query
          const tableName = tables[0];
          const columns = selectedColumns.map(col => col.replace(`${tableName}.`, ''));
          
          let query = supabase.from(tableName).select(columns.join(','), { count: 'exact' });
          
          // Apply filters
          const savedFilters = getReportFilters(reportId);
          if (savedFilters && savedFilters.items && savedFilters.items.length > 0) {
            const validFilters = savedFilters.items.filter(f => f.field && f.condition && f.value);
            
            if (validFilters.length > 0) {
              const logic = savedFilters.logic || 'AND';
              
              if (logic === 'OR' && validFilters.length > 1) {
                // Build OR condition string for Supabase
                const orConditions = validFilters.map(filter => {
                  const fieldName = filter.field.includes('.') ? filter.field.split('.')[1] : filter.field;
                  
                  switch (filter.condition) {
                    case 'eq':
                      return `${fieldName}.eq.${filter.value}`;
                    case 'neq':
                      return `${fieldName}.neq.${filter.value}`;
                    case 'gt':
                      return `${fieldName}.gt.${filter.value}`;
                    case 'lt':
                      return `${fieldName}.lt.${filter.value}`;
                    case 'contains':
                      return `${fieldName}.ilike.%${filter.value}%`;
                    case 'starts':
                      return `${fieldName}.ilike.${filter.value}%`;
                    case 'ends':
                      return `${fieldName}.ilike.%${filter.value}`;
                    default:
                      return `${fieldName}.eq.${filter.value}`;
                  }
                }).join(',');
                
                query = query.or(orConditions);
              } else {
                // Apply AND logic (default behavior when chaining)
                validFilters.forEach(filter => {
                  const fieldName = filter.field.includes('.') ? filter.field.split('.')[1] : filter.field;
                  
                  switch (filter.condition) {
                    case 'eq':
                      query = query.eq(fieldName, filter.value);
                      break;
                    case 'neq':
                      query = query.neq(fieldName, filter.value);
                      break;
                    case 'gt':
                      query = query.gt(fieldName, filter.value);
                      break;
                    case 'lt':
                      query = query.lt(fieldName, filter.value);
                      break;
                    case 'contains':
                      query = query.ilike(fieldName, `%${filter.value}%`);
                      break;
                    case 'starts':
                      query = query.ilike(fieldName, `${filter.value}%`);
                      break;
                    case 'ends':
                      query = query.ilike(fieldName, `%${filter.value}`);
                      break;
                  }
                });
              }
            }
          }
          
          // Apply sorting
          if (sort && sort.key) {
            const sortKey = sort.key.includes('.') ? sort.key.split('.')[1] : sort.key;
            // Only apply sorting if the column exists in the selected columns
            if (columns.includes(sortKey)) {
              query = query.order(sortKey, { ascending: sort.direction === 'asc' });
            }
          }
          
          // Apply pagination
          const offset = (page - 1) * pageSize;
          query = query.range(offset, offset + pageSize - 1);
          
          const { data, error, count } = await query;
          if (error) throw error;
          
          // Add table prefix to column names for display (to match column keys)
          const prefixedData = (data || []).map(row => {
            const prefixed = {};
            Object.keys(row).forEach(key => {
              prefixed[`${tableName}.${key}`] = row[key];
            });
            return prefixed;
          });
          
          return { rows: prefixedData || [], total: count || 0 };
          
        } else {
          // Multiple tables - fetch from each table and combine
          const primaryTable = tables[0];
          const primaryColumns = selectedColumns
            .filter(col => col.startsWith(`${primaryTable}.`))
            .map(col => col.replace(`${primaryTable}.`, ''));
          
          if (primaryColumns.length === 0) {
            throw new Error("No columns selected for primary table");
          }
          
          // Fetch from primary table with pagination
          let query = supabase.from(primaryTable).select(primaryColumns.join(','), { count: 'exact' });
          
          // Apply filters to primary table
          const savedFilters = getReportFilters(reportId);
          if (savedFilters && savedFilters.items && savedFilters.items.length > 0) {
            const validFilters = savedFilters.items.filter(f => {
              if (!f.field || !f.condition || !f.value) return false;
              const fieldName = f.field.includes('.') ? f.field.split('.')[1] : f.field;
              const filterTable = f.field.includes('.') ? f.field.split('.')[0] : primaryTable;
              return filterTable === primaryTable && primaryColumns.includes(fieldName);
            });
            
            if (validFilters.length > 0) {
              const logic = savedFilters.logic || 'AND';
              
              if (logic === 'OR' && validFilters.length > 1) {
                // Build OR condition string for Supabase
                const orConditions = validFilters.map(filter => {
                  const fieldName = filter.field.includes('.') ? filter.field.split('.')[1] : filter.field;
                  
                  switch (filter.condition) {
                    case 'eq':
                      return `${fieldName}.eq.${filter.value}`;
                    case 'neq':
                      return `${fieldName}.neq.${filter.value}`;
                    case 'gt':
                      return `${fieldName}.gt.${filter.value}`;
                    case 'lt':
                      return `${fieldName}.lt.${filter.value}`;
                    case 'contains':
                      return `${fieldName}.ilike.%${filter.value}%`;
                    case 'starts':
                      return `${fieldName}.ilike.${filter.value}%`;
                    case 'ends':
                      return `${fieldName}.ilike.%${filter.value}`;
                    default:
                      return `${fieldName}.eq.${filter.value}`;
                  }
                }).join(',');
                
                query = query.or(orConditions);
              } else {
                // Apply AND logic (default behavior when chaining)
                validFilters.forEach(filter => {
                  const fieldName = filter.field.includes('.') ? filter.field.split('.')[1] : filter.field;
                  
                  switch (filter.condition) {
                    case 'eq':
                      query = query.eq(fieldName, filter.value);
                      break;
                    case 'neq':
                      query = query.neq(fieldName, filter.value);
                      break;
                    case 'gt':
                      query = query.gt(fieldName, filter.value);
                      break;
                    case 'lt':
                      query = query.lt(fieldName, filter.value);
                      break;
                    case 'contains':
                      query = query.ilike(fieldName, `%${filter.value}%`);
                      break;
                    case 'starts':
                      query = query.ilike(fieldName, `${filter.value}%`);
                      break;
                    case 'ends':
                      query = query.ilike(fieldName, `%${filter.value}`);
                      break;
                  }
                });
              }
            }
          }
          
          // Apply sorting on primary table
          if (sort && sort.key) {
            const sortKey = sort.key.includes('.') ? sort.key.split('.')[1] : sort.key;
            if (primaryColumns.includes(sortKey)) {
              query = query.order(sortKey, { ascending: sort.direction === 'asc' });
            }
          }
          
          // Apply pagination
          const offset = (page - 1) * pageSize;
          query = query.range(offset, offset + pageSize - 1);
          
          const { data: primaryData, error, count } = await query;
          if (error) throw error;
          
          // Fetch data from other tables (without pagination, just get all)
          const otherTablesData = {};
          for (let i = 1; i < tables.length; i++) {
            const tableName = tables[i];
            const tableColumns = selectedColumns
              .filter(col => col.startsWith(`${tableName}.`))
              .map(col => col.replace(`${tableName}.`, ''));
            
            if (tableColumns.length > 0) {
              const { data, error: tableError } = await supabase
                .from(tableName)
                .select(tableColumns.join(','))
                .limit(pageSize);
              
              if (!tableError && data && data.length > 0) {
                otherTablesData[tableName] = data;
              }
            }
          }
          
          // Combine data from all tables
          const combinedData = primaryData.map((primaryRow, idx) => {
            const combined = {};
            
            // Add primary table data with prefix
            Object.keys(primaryRow).forEach(key => {
              combined[`${primaryTable}.${key}`] = primaryRow[key];
            });
            
            // Add data from other tables with prefix
            Object.keys(otherTablesData).forEach(tableName => {
              const tableData = otherTablesData[tableName];
              if (tableData[idx]) {
                Object.keys(tableData[idx]).forEach(key => {
                  combined[`${tableName}.${key}`] = tableData[idx][key];
                });
              }
            });
            
            return combined;
          });
          
          return { rows: combinedData || [], total: count || 0 };
        }
      } catch (err) {
        console.error("Supabase fetch error:", err);
        throw new Error(`Failed to fetch data: ${err.message}`);
      }
    }
  }
  
  // Fallback to mock data if no custom table is configured
  await new Promise((r) => setTimeout(r, 350)); // simulate latency
  const mockData = getMockData();
  let rows = applyFilters(mockData, filters || {});
  rows = applySort(rows, sort || { key: 'date', direction: 'desc' });
  const total = rows.length;
  const offset = (page - 1) * pageSize;
  const paged = rows.slice(offset, offset + pageSize);
  return { rows: paged, total };
}

export function exportCSV(rows, fileName = 'report') {
  if (!rows || rows.length === 0) {
    alert('No data to export');
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportExcel(rows, fileName = 'report') {
  if (!rows || rows.length === 0) {
    alert('No data to export');
    return;
  }
  const sheet = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Report');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function exportPDF(rows, fileName = 'report') {
  if (!rows || rows.length === 0) {
    alert('No data to export');
    return;
  }
  const doc = new jsPDF('l', 'pt');
  const headers = Object.keys(rows[0]);
  const data = rows.map((r) => headers.map((h) => r[h]));
  doc.text('Report', 40, 40);
  autoTable(doc, { startY: 60, head: [headers], body: data });
  doc.save(`${fileName}.pdf`);
}


