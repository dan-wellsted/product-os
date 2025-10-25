import { get, post, put, del } from "./client.js";

export function fetchDiscoveryProjects() {
  return get("/discovery/api/projects");
}

export function fetchDiscoveryOverview(projectId) {
  return get(`/discovery/api/projects/${projectId}/overview`);
}

export function createHypothesis(projectId, data) {
  return post(`/discovery/api/projects/${projectId}/hypotheses`, data);
}

export function updateHypothesis(projectId, hypothesisId, data) {
  return put(`/discovery/api/projects/${projectId}/hypotheses/${hypothesisId}`, data);
}

export function deleteHypothesis(projectId, hypothesisId) {
  return del(`/discovery/api/projects/${projectId}/hypotheses/${hypothesisId}`);
}
