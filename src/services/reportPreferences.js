const STORAGE_KEY = 'report_preferences_v1';
const LAST_VIEWED_KEY = 'report_last_viewed_v1';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function writeAll(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getReportFields(reportId) {
  const all = readAll();
  return all[reportId]?.fields || null;
}

export function setReportFields(reportId, fields) {
  const all = readAll();
  all[reportId] = { ...(all[reportId] || {}), fields };
  writeAll(all);
}

export function clearReportFields(reportId) {
  const all = readAll();
  if (all[reportId]) {
    delete all[reportId].fields;
    writeAll(all);
  }
}

function readLastViewedMap() {
  try {
    const raw = localStorage.getItem(LAST_VIEWED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function writeLastViewedMap(map) {
  localStorage.setItem(LAST_VIEWED_KEY, JSON.stringify(map));
}

export function setReportLastViewed(reportId, isoDateString) {
  const map = readLastViewedMap();
  map[reportId] = isoDateString || new Date().toISOString();
  writeLastViewedMap(map);
}

export function getReportLastViewed(reportId) {
  const map = readLastViewedMap();
  return map[reportId] || null;
}


