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


