// Mock catalog of reports with categories and simple schema definitions

const GENERAL_REPORTS = [
  {
    id: "401k-setup",
    title: "401k Setup",
    lastViewed: "09/29/2025",
    execTime: "< 10 seconds",
    schema: [
      { required: true, field: "employeeId", label: "Employee ID", type: "string", format: "", calculation: "" },
      { required: true, field: "enrollmentDate", label: "Enrollment Date", type: "date", format: "YYYY-MM-DD", calculation: "" },
      { required: false, field: "contribution", label: "Contribution %", type: "number", format: "0-100", calculation: "sum" }
    ]
  },
  {
    id: "dependent-birthday",
    title: "Dependent Birthday",
    lastViewed: "09/29/2025",
    execTime: "< 10 seconds",
    schema: [
      { required: true, field: "employee", label: "Employee", type: "string", format: "", calculation: "" },
      { required: true, field: "dependentName", label: "Dependent", type: "string", format: "", calculation: "" },
      { required: true, field: "birthday", label: "Birthday", type: "date", format: "MMM DD, YYYY", calculation: "" }
    ]
  },
  {
    id: "direct-deposit-setup",
    title: "Direct Deposit Setup",
    lastViewed: "08/04/2025",
    execTime: "< 10 seconds",
    schema: [
      { required: true, field: "employee", label: "Employee", type: "string", format: "", calculation: "" },
      { required: true, field: "bankName", label: "Bank", type: "string", format: "", calculation: "" },
      { required: true, field: "account", label: "Account #", type: "masked", format: "****1234", calculation: "" }
    ]
  },
  {
    id: "personal-information",
    title: "Personal Information",
    lastViewed: "08/04/2025",
    execTime: "< 10 seconds",
    schema: [
      { required: true, field: "name", label: "Name", type: "string", format: "", calculation: "" },
      { required: false, field: "address", label: "Address", type: "string", format: "", calculation: "" },
      { required: false, field: "phone", label: "Phone", type: "string", format: "+91-xxxxx-xxxxx", calculation: "" }
    ]
  }
];

const ANNIVERSARY_REPORTS = [
  {
    id: "employee-anniversary",
    title: "Employee Anniversary Report",
    lastViewed: "09/29/2025",
    execTime: "< 10 seconds",
    schema: [
      { required: true, field: "employee", label: "Employee", type: "string", format: "", calculation: "" },
      { required: true, field: "hireDate", label: "Hire Date", type: "date", format: "YYYY-MM-DD", calculation: "" },
      { required: false, field: "years", label: "Years", type: "number", format: "", calculation: "datediff(hireDate, today)" }
    ]
  },
  {
    id: "employee-review-date",
    title: "Employee Review Date",
    lastViewed: "08/04/2025",
    execTime: "< 10 seconds",
    schema: [
      { required: true, field: "employee", label: "Employee", type: "string", format: "", calculation: "" },
      { required: true, field: "reviewDate", label: "Review Date", type: "date", format: "YYYY-MM-DD", calculation: "" }
    ]
  }
];

export function getReportCatalog() {
  return [
    { id: "general", title: "General", reports: GENERAL_REPORTS },
    { id: "anniversary", title: "Anniversary/Review", reports: ANNIVERSARY_REPORTS }
  ];
}

export function getReportById(id) {
  const all = [...GENERAL_REPORTS, ...ANNIVERSARY_REPORTS];
  return all.find((r) => r.id === id);
}

export function getSchemaForReport(id) {
  return getReportById(id)?.schema || [];
}

// Store for custom reports (in localStorage)
const CUSTOM_REPORTS_KEY = 'custom_reports';

function getCustomReports() {
  try {
    const stored = localStorage.getItem(CUSTOM_REPORTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error loading custom reports:', e);
    return [];
  }
}

function saveCustomReports(reports) {
  try {
    localStorage.setItem(CUSTOM_REPORTS_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Error saving custom reports:', e);
  }
}

export function addNewReport(report) {
  const customReports = getCustomReports();
  
  // Check if report with same ID already exists
  const existingIndex = customReports.findIndex(r => r.id === report.id);
  
  if (existingIndex >= 0) {
    // Update existing report
    customReports[existingIndex] = report;
  } else {
    // Add new report
    customReports.push(report);
  }
  
  saveCustomReports(customReports);
  
  // Dispatch event to notify other components
  window.dispatchEvent(new CustomEvent('reportCatalogUpdated'));
  
  return report;
}

export function deleteReport(reportId) {
  const customReports = getCustomReports();
  const filtered = customReports.filter(r => r.id !== reportId);
  saveCustomReports(filtered);
  
  // Also clear preferences for this report
  localStorage.removeItem(`report_fields_${reportId}`);
  localStorage.removeItem(`report_filters_${reportId}`);
  localStorage.removeItem(`report_last_viewed_${reportId}`);
  
  // Dispatch event
  window.dispatchEvent(new CustomEvent('reportCatalogUpdated'));
}

// Updated getReportCatalog to include custom reports
export function getReportCatalogWithCustom() {
  const baseCatalog = getReportCatalog();
  const customReports = getCustomReports();
  
  if (customReports.length === 0) {
    return baseCatalog;
  }
  
  // Group custom reports by category
  const customByCategory = customReports.reduce((acc, report) => {
    const category = report.category || 'custom';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(report);
    return acc;
  }, {});
  
  // Merge with base catalog
  const merged = [...baseCatalog];
  
  Object.entries(customByCategory).forEach(([category, reports]) => {
    const existingCategory = merged.find(cat => cat.id === category);
    
    if (existingCategory) {
      existingCategory.reports = [...existingCategory.reports, ...reports];
    } else {
      merged.push({
        id: category,
        title: category.charAt(0).toUpperCase() + category.slice(1),
        reports: reports
      });
    }
  });
  
  return merged;
}

// Updated getReportById to include custom reports
export function getReportByIdWithCustom(id) {
  // First check base reports
  let report = getReportById(id);
  if (report) return report;
  
  // Then check custom reports
  const customReports = getCustomReports();
  return customReports.find(r => r.id === id);
}


