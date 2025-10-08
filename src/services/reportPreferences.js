// src/services/reportPreferences.js
import { supabase } from "./supabaseClient.js";

// Use localStorage as primary storage for now (Supabase table may not be set up yet)
export function setReportFields(reportId, selectedColumns, tableName) {
  if (!reportId) {
    console.warn("setReportFields: No reportId provided");
    return;
  }
  try {
    // Store in localStorage
    const key = `report_fields_${reportId}`;
    const data = {
      selectedColumns,
      tableName,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
    console.log("✅ Saved to localStorage:", { reportId, selectedColumns, tableName });
    
    // Dispatch event to update components immediately
    window.dispatchEvent(
      new CustomEvent("reportFieldsUpdated", {
        detail: { reportId, selectedColumns },
      })
    );
    console.log("✅ Dispatched reportFieldsUpdated event");
    
    // Also try to save to Supabase (optional, will fail silently if table doesn't exist)
    supabase.from("report_preferences").upsert([
      {
        report_id: reportId,
        table_name: tableName,
        selected_columns: selectedColumns,
      },
    ]).catch((e) => console.log("Supabase save skipped:", e.message));
  } catch (e) {
    console.error("setReportFields error", e);
  }
}

export function getReportFields(reportId) {
  if (!reportId) {
    console.warn("getReportFields: No reportId provided");
    return [];
  }
  try {
    // Get from localStorage
    const key = `report_fields_${reportId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const data = JSON.parse(stored);
      console.log("✅ Retrieved from localStorage:", { reportId, fields: data.selectedColumns });
      return data.selectedColumns || [];
    }
    console.log("⚠️ No saved fields found for:", reportId);
    return [];
  } catch (e) {
    console.error("getReportFields error", e);
    return [];
  }
}

export function getReportTableName(reportId) {
  if (!reportId) return null;
  try {
    const key = `report_fields_${reportId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const data = JSON.parse(stored);
      return data.tableName || null;
    }
    return null;
  } catch (e) {
    console.error("getReportTableName error", e);
    return null;
  }
}

// Use localStorage for last viewed since the column doesn't exist in Supabase table yet
export function getReportLastViewed(reportId) {
  if (!reportId) return null;
  try {
    const key = `report_last_viewed_${reportId}`;
    const stored = localStorage.getItem(key);
    return stored || null;
  } catch (e) {
    console.error("getReportLastViewed error", e);
    return null;
  }
}

export function setReportLastViewed(reportId) {
  if (!reportId) return;
  try {
    const key = `report_last_viewed_${reportId}`;
    localStorage.setItem(key, new Date().toISOString());
  } catch (e) {
    console.error("setReportLastViewed error", e);
  }
}