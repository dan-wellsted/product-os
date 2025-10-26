import { get, post, put, del } from "./client.js";

export function fetchDiscoveryOverview(projectId) {
  return get(`/api/projects/${projectId}/discovery`);
}

export function createHypothesis(projectId, data) {
  return post(`/api/projects/${projectId}/hypotheses`, data);
}

export function updateHypothesis(projectId, hypothesisId, data) {
  return put(`/api/projects/${projectId}/hypotheses/${hypothesisId}`, data);
}

export function deleteHypothesis(projectId, hypothesisId) {
  return del(`/api/projects/${projectId}/hypotheses/${hypothesisId}`);
}
