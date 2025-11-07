import { getJson } from "./httpClient.js";

export function fetchReports() {
  return getJson("/api/reports");
}

export function fetchReport(reportId) {
  return getJson(`/api/reports/${reportId}`);
}
