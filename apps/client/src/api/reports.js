import { get } from "./client.js";

export function fetchReports() {
  return get("/api/reports");
}

export function fetchReport(reportId) {
  return get(`/api/reports/${reportId}`);
}
