import { deleteJson, getJson, patchJson, postJson } from "./httpClient.js";

const API_ROOT = "/api/v1";

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (typeof value === "boolean") {
      searchParams.set(key, value ? "true" : "false");
      return;
    }
    searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function getOutcomeTree(params = {}) {
  return getJson(`${API_ROOT}/trees/ost${buildQuery(params)}`);
}

export function listOutcomes(params = {}) {
  return getJson(`${API_ROOT}/outcomes${buildQuery(params)}`);
}

export function createOutcome(payload) {
  return postJson(`${API_ROOT}/outcomes`, payload);
}

export function updateOutcome(outcomeId, payload) {
  return patchJson(`${API_ROOT}/outcomes/${outcomeId}`, payload, {
    etagKey: `outcome:${outcomeId}`,
  });
}

export function archiveOutcome(outcomeId) {
  return deleteJson(`${API_ROOT}/outcomes/${outcomeId}`, {
    etagKey: `outcome:${outcomeId}`,
  });
}

export function getOutcomeById(outcomeId) {
  return getJson(`${API_ROOT}/outcomes/${outcomeId}`, {
    etagKey: `outcome:${outcomeId}`,
  });
}

export function listOpportunities(params = {}) {
  return getJson(`${API_ROOT}/opportunities${buildQuery(params)}`);
}

export function createOpportunity(payload) {
  return postJson(`${API_ROOT}/opportunities`, payload);
}

export function updateOpportunity(opportunityId, payload) {
  return patchJson(`${API_ROOT}/opportunities/${opportunityId}`, payload, {
    etagKey: `opportunity:${opportunityId}`,
  });
}

export function archiveOpportunity(opportunityId) {
  return deleteJson(`${API_ROOT}/opportunities/${opportunityId}`, {
    etagKey: `opportunity:${opportunityId}`,
  });
}

export function getOpportunityById(opportunityId) {
  return getJson(`${API_ROOT}/opportunities/${opportunityId}`, {
    etagKey: `opportunity:${opportunityId}`,
  });
}

export function listSolutions(params = {}) {
  return getJson(`${API_ROOT}/solutions${buildQuery(params)}`);
}

export function createSolution(payload) {
  return postJson(`${API_ROOT}/solutions`, payload);
}

export function updateSolution(solutionId, payload) {
  return patchJson(`${API_ROOT}/solutions/${solutionId}`, payload, {
    etagKey: `solution:${solutionId}`,
  });
}

export function archiveSolution(solutionId) {
  return deleteJson(`${API_ROOT}/solutions/${solutionId}`, {
    etagKey: `solution:${solutionId}`,
  });
}

export function getSolutionById(solutionId) {
  return getJson(`${API_ROOT}/solutions/${solutionId}`, {
    etagKey: `solution:${solutionId}`,
  });
}

export function listAssumptions(params = {}) {
  return getJson(`${API_ROOT}/assumptions${buildQuery(params)}`);
}

export function createAssumption(payload) {
  return postJson(`${API_ROOT}/assumptions`, payload);
}

export function updateAssumption(assumptionId, payload) {
  return patchJson(`${API_ROOT}/assumptions/${assumptionId}`, payload, {
    etagKey: `assumption:${assumptionId}`,
  });
}

export function archiveAssumption(assumptionId) {
  return deleteJson(`${API_ROOT}/assumptions/${assumptionId}`, {
    etagKey: `assumption:${assumptionId}`,
  });
}

export function getAssumptionById(assumptionId) {
  return getJson(`${API_ROOT}/assumptions/${assumptionId}`, {
    etagKey: `assumption:${assumptionId}`,
  });
}

export function createOutcomeOpportunity(payload) {
  return postJson(`${API_ROOT}/edges/outcome-opportunity`, payload);
}

export function deleteOutcomeOpportunity(edgeId) {
  return deleteJson(`${API_ROOT}/edges/outcome-opportunity/${edgeId}`);
}

export function createOpportunitySolution(payload) {
  return postJson(`${API_ROOT}/edges/opportunity-solution`, payload);
}

export function batchCreateOpportunitySolutions(payload) {
  return postJson(`${API_ROOT}/edges/opportunity-solution/batch`, payload);
}

export function deleteOpportunitySolution(edgeId) {
  return deleteJson(`${API_ROOT}/edges/opportunity-solution/${edgeId}`);
}

export function createSolutionAssumption(payload) {
  return postJson(`${API_ROOT}/edges/solution-assumption`, payload);
}

export function deleteSolutionAssumption(edgeId) {
  return deleteJson(`${API_ROOT}/edges/solution-assumption/${edgeId}`);
}

export function listHypotheses(params = {}) {
  return getJson(`${API_ROOT}/hypotheses${buildQuery(params)}`);
}

export function createHypothesis(payload) {
  return postJson(`${API_ROOT}/hypotheses`, payload);
}

export function updateHypothesis(hypothesisId, payload) {
  return patchJson(`${API_ROOT}/hypotheses/${hypothesisId}`, payload, {
    etagKey: `hypothesis:${hypothesisId}`,
  });
}

export function deleteHypothesis(hypothesisId) {
  return deleteJson(`${API_ROOT}/hypotheses/${hypothesisId}`, {
    etagKey: `hypothesis:${hypothesisId}`,
  });
}

export function getHypothesisById(hypothesisId) {
  return getJson(`${API_ROOT}/hypotheses/${hypothesisId}`, {
    etagKey: `hypothesis:${hypothesisId}`,
  });
}

export function listExperiments(params = {}) {
  return getJson(`${API_ROOT}/experiments${buildQuery(params)}`);
}

export function createExperiment(payload) {
  return postJson(`${API_ROOT}/experiments`, payload);
}

export function updateExperiment(experimentId, payload) {
  return patchJson(`${API_ROOT}/experiments/${experimentId}`, payload, {
    etagKey: `experiment:${experimentId}`,
  });
}

export function deleteExperiment(experimentId) {
  return deleteJson(`${API_ROOT}/experiments/${experimentId}`, {
    etagKey: `experiment:${experimentId}`,
  });
}

export function getExperimentById(experimentId) {
  return getJson(`${API_ROOT}/experiments/${experimentId}`, {
    etagKey: `experiment:${experimentId}`,
  });
}

export function listInsights(params = {}) {
  return getJson(`${API_ROOT}/insights${buildQuery(params)}`);
}

export function createInsight(payload) {
  return postJson(`${API_ROOT}/insights`, payload);
}

export function updateInsight(insightId, payload) {
  return patchJson(`${API_ROOT}/insights/${insightId}`, payload, {
    etagKey: `insight:${insightId}`,
  });
}

export function deleteInsight(insightId) {
  return deleteJson(`${API_ROOT}/insights/${insightId}`, {
    etagKey: `insight:${insightId}`,
  });
}

export function getInsightById(insightId) {
  return getJson(`${API_ROOT}/insights/${insightId}`, {
    etagKey: `insight:${insightId}`,
  });
}
