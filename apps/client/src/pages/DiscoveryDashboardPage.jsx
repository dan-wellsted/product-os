import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import NodePanel from "../components/discovery/NodePanel.jsx";
import EdgeLinkers from "../components/discovery/EdgeLinkers.jsx";
import HypothesesPanel from "../components/discovery/HypothesesPanel.jsx";
import InsightsPanel from "../components/discovery/InsightsPanel.jsx";
import {
  listOutcomes,
  createOutcome,
  updateOutcome,
  archiveOutcome,
  getOutcomeById,
  listOpportunities,
  createOpportunity,
  updateOpportunity,
  archiveOpportunity,
  getOpportunityById,
  listSolutions,
  createSolution,
  updateSolution,
  archiveSolution,
  getSolutionById,
  listAssumptions,
  createAssumption,
  updateAssumption,
  archiveAssumption,
  getAssumptionById,
  listExperiments,
  createExperiment,
  updateExperiment,
  deleteExperiment,
  getExperimentById,
  getOutcomeTree,
  deleteOutcomeOpportunity,
  deleteOpportunitySolution,
  deleteSolutionAssumption,
  createOutcomeOpportunity,
  createOpportunitySolution,
  createSolutionAssumption,
} from "../api/discovery.js";
import {
  outcomeFormSchema,
  opportunityFormSchema,
  solutionFormSchema,
  assumptionFormSchema,
  experimentFormSchema,
} from "../lib/schemas.js";
import {
  ASSUMPTION_CATEGORIES,
  CONFIDENCE_LEVELS,
  VALIDATION_STATES,
  LIFECYCLE_STAGES,
  PRIVACY_LEVELS,
  EXPERIMENT_STATUSES,
} from "../lib/constants.js";
import { useToast } from "../hooks/useToast.js";

const FILTER_DEFAULTS = {
  q: "",
  status: "",
  includeDeprecated: false,
  from: "",
  to: "",
  validationState: "",
  assumptionCategory: "",
  relationshipType: "",
  confidenceLevel: "",
  lifecycleStage: "",
  privacyLevel: "",
  experimentStatus: "",
};

export default function DiscoveryDashboardPage() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [outcomeItems, setOutcomeItems] = useState([]);
  const [opportunityItems, setOpportunityItems] = useState([]);
  const [solutionItems, setSolutionItems] = useState([]);
  const [assumptionItems, setAssumptionItems] = useState([]);
  const [hypothesisItems, setHypothesisItems] = useState([]);

  const treeQuery = useQuery({
    queryKey: ["discovery", "ost-tree", { includeDeprecated: filters.includeDeprecated }],
    queryFn: () => getOutcomeTree({ includeDeprecated: filters.includeDeprecated }),
  });

  const treeData = treeQuery.data?.data ?? [];
  const treeTotals = treeQuery.data?.meta?.totals ?? {};

  const edgeOptions = useMemo(() => buildEdgeOptions(treeData), [treeData]);

  const nodeOptions = useMemo(
    () => ({
      outcomes: outcomeItems,
      opportunities: opportunityItems,
      solutions: solutionItems,
      assumptions: assumptionItems,
    }),
    [outcomeItems, opportunityItems, solutionItems, assumptionItems],
  );

  const hypothesisOptions = useMemo(
    () => hypothesisItems.map((item) => ({ value: item.id, label: item.statement })),
    [hypothesisItems],
  );

  const commonInvalidateKeys = [["discovery", "hypotheses"], ["discovery", "experiments"], ["discovery", "insights"]];

  const outcomeConfig = {
    key: "outcomes",
    title: "Outcomes",
    singular: "Outcome",
    listFn: listOutcomes,
    getFn: getOutcomeById,
    createFn: createOutcome,
    updateFn: (id, values) => updateOutcome(id, values),
    archiveFn: (id) => archiveOutcome(id),
    buildParams: (filterState) => ({
      q: filterState.q || undefined,
      status: filterState.status || undefined,
      includeDeprecated: filterState.includeDeprecated,
      from: filterState.from || undefined,
      to: filterState.to || undefined,
    }),
    schema: outcomeFormSchema,
    createDefaults: {
      name: "",
      description: "",
      metricName: "",
      metricBaseline: "",
      metricTarget: "",
      ownerId: "",
      status: "",
    },
    toFormValues: (record) => ({
      name: record.name ?? "",
      description: record.description ?? "",
      metricName: record.metricName ?? "",
      metricBaseline: record.metricBaseline != null ? String(record.metricBaseline) : "",
      metricTarget: record.metricTarget != null ? String(record.metricTarget) : "",
      ownerId: record.ownerId ?? "",
      status: record.status ?? "",
    }),
    fields: [
      { name: "name", label: "Name" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "metricName", label: "Metric name" },
      { name: "metricBaseline", label: "Metric baseline", type: "number" },
      { name: "metricTarget", label: "Metric target", type: "number" },
      { name: "ownerId", label: "Owner Id" },
      { name: "status", label: "Status" },
    ],
    listLabel: (item) => item.name,
    listDescription: (item) => item.description,
    invalidateKeys: commonInvalidateKeys,
  };

  const opportunityConfig = {
    key: "opportunities",
    title: "Opportunities",
    singular: "Opportunity",
    listFn: listOpportunities,
    getFn: getOpportunityById,
    createFn: createOpportunity,
    updateFn: (id, values) => updateOpportunity(id, values),
    archiveFn: (id) => archiveOpportunity(id),
    buildParams: (filterState) => ({
      q: filterState.q || undefined,
      status: filterState.status || undefined,
      includeDeprecated: filterState.includeDeprecated,
      from: filterState.from || undefined,
      to: filterState.to || undefined,
    }),
    schema: opportunityFormSchema,
    createDefaults: {
      description: "",
      segment: "",
      severity: "",
      status: "",
    },
    toFormValues: (record) => ({
      description: record.description ?? "",
      segment: record.segment ?? "",
      severity: record.severity ?? "",
      status: record.status ?? "",
    }),
    fields: [
      { name: "description", label: "Description", type: "textarea" },
      { name: "segment", label: "Segment" },
      { name: "severity", label: "Severity" },
      { name: "status", label: "Status" },
    ],
    listLabel: (item) => item.description,
    invalidateKeys: commonInvalidateKeys,
  };

  const solutionConfig = {
    key: "solutions",
    title: "Solutions",
    singular: "Solution",
    listFn: listSolutions,
    getFn: getSolutionById,
    createFn: createSolution,
    updateFn: (id, values) => updateSolution(id, values),
    archiveFn: (id) => archiveSolution(id),
    buildParams: (filterState) => ({
      q: filterState.q || undefined,
      status: filterState.status || undefined,
      includeDeprecated: filterState.includeDeprecated,
      from: filterState.from || undefined,
      to: filterState.to || undefined,
    }),
    schema: solutionFormSchema,
    createDefaults: {
      title: "",
      description: "",
      status: "",
    },
    toFormValues: (record) => ({
      title: record.title ?? "",
      description: record.description ?? "",
      status: record.status ?? "",
    }),
    fields: [
      { name: "title", label: "Title" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "status", label: "Status" },
    ],
    listLabel: (item) => item.title,
    invalidateKeys: commonInvalidateKeys,
  };

  const assumptionConfig = {
    key: "assumptions",
    title: "Assumptions",
    singular: "Assumption",
    listFn: listAssumptions,
    getFn: getAssumptionById,
    createFn: createAssumption,
    updateFn: (id, values) => updateAssumption(id, values),
    archiveFn: (id) => archiveAssumption(id),
    buildParams: (filterState) => ({
      q: filterState.q || undefined,
      status: filterState.status || undefined,
      includeDeprecated: filterState.includeDeprecated,
      from: filterState.from || undefined,
      to: filterState.to || undefined,
      category: filterState.assumptionCategory || undefined,
    }),
    schema: assumptionFormSchema,
    createDefaults: {
      statement: "",
      category: ASSUMPTION_CATEGORIES[0],
      riskLevel: "",
      status: "",
    },
    toFormValues: (record) => ({
      statement: record.statement ?? "",
      category: record.category ?? ASSUMPTION_CATEGORIES[0],
      riskLevel: record.riskLevel ?? "",
      status: record.status ?? "",
    }),
    fields: [
      { name: "statement", label: "Statement", type: "textarea" },
      { name: "category", label: "Category", type: "select", options: ASSUMPTION_CATEGORIES },
      { name: "riskLevel", label: "Risk level", type: "select", options: ["", ...CONFIDENCE_LEVELS] },
      { name: "status", label: "Status" },
    ],
    listLabel: (item) => item.statement,
    invalidateKeys: commonInvalidateKeys,
  };

  const experimentConfig = {
    key: "experiments",
    title: "Experiments",
    singular: "Experiment",
    listFn: listExperiments,
    getFn: getExperimentById,
    createFn: createExperiment,
    updateFn: (id, values) => updateExperiment(id, values),
    archiveFn: (id) => deleteExperiment(id),
    archiveLabel: "Delete",
    buildParams: (filterState) => ({
      q: filterState.q || undefined,
      status: filterState.experimentStatus || undefined,
      from: filterState.from || undefined,
      to: filterState.to || undefined,
    }),
    schema: experimentFormSchema,
    createDefaults: {
      hypothesisId: "",
      name: "",
      method: "",
      status: EXPERIMENT_STATUSES[0],
      startAt: "",
      endAt: "",
      resultSummary: "",
    },
    toFormValues: (record) => ({
      hypothesisId: record.hypothesisId ?? "",
      name: record.name ?? "",
      method: record.method ?? "",
      status: record.status ?? EXPERIMENT_STATUSES[0],
      startAt: record.startAt ? record.startAt.slice(0, 10) : "",
      endAt: record.endAt ? record.endAt.slice(0, 10) : "",
      resultSummary: record.resultSummary ?? "",
    }),
    fields: [
      { name: "hypothesisId", label: "Hypothesis", type: "select", options: hypothesisOptions },
      { name: "name", label: "Name" },
      { name: "method", label: "Method" },
      { name: "status", label: "Status", type: "select", options: EXPERIMENT_STATUSES },
      { name: "startAt", label: "Start date", type: "date" },
      { name: "endAt", label: "End date", type: "date" },
      { name: "resultSummary", label: "Result summary", type: "textarea" },
    ],
    listLabel: (item) => item.name,
    listDescription: (item) => item.method,
    invalidateKeys: [["discovery", "insights"]],
  };

  const hypothesisOptionsForPanels = useMemo(
    () => ({
      outcomes: nodeOptions.outcomes,
      opportunities: nodeOptions.opportunities,
      solutions: nodeOptions.solutions,
      assumptions: nodeOptions.assumptions,
      outcomeOpportunities: edgeOptions.outcomeOpportunities,
      opportunitySolutions: edgeOptions.opportunitySolutions,
      solutionAssumptions: edgeOptions.solutionAssumptions,
    }),
    [nodeOptions, edgeOptions],
  );

  const insightOptions = useMemo(
    () => ({
      experiments: queryClient.getQueryData(["discovery", "experiments-options"]) ?? [],
      outcomes: nodeOptions.outcomes,
      opportunities: nodeOptions.opportunities,
      solutions: nodeOptions.solutions,
      assumptions: nodeOptions.assumptions,
      outcomeOpportunities: edgeOptions.outcomeOpportunities,
      opportunitySolutions: edgeOptions.opportunitySolutions,
      solutionAssumptions: edgeOptions.solutionAssumptions,
    }),
    [nodeOptions, edgeOptions, queryClient],
  );

  const outcomeOptionsForSelect = useMemo(
    () => nodeOptions.outcomes.map((item) => ({ id: item.id, label: item.name })),
    [nodeOptions.outcomes],
  );
  const opportunityOptionsForSelect = useMemo(
    () => nodeOptions.opportunities.map((item) => ({ id: item.id, label: item.description })),
    [nodeOptions.opportunities],
  );
  const solutionOptionsForSelect = useMemo(
    () => nodeOptions.solutions.map((item) => ({ id: item.id, label: item.title })),
    [nodeOptions.solutions],
  );
  const assumptionOptionsForSelect = useMemo(
    () => nodeOptions.assumptions.map((item) => ({ id: item.id, label: item.statement })),
    [nodeOptions.assumptions],
  );

  const existingEdges = useMemo(
    () => ({
      outcomeOpportunities: edgeOptions.outcomeOpportunities,
      opportunitySolutions: edgeOptions.opportunitySolutions,
      solutionAssumptions: edgeOptions.solutionAssumptions,
    }),
    [edgeOptions],
  );

  const handleEditConfidence = async (type, edge) => {
    const current = edge.confidence ?? "";
    const input = window.prompt("Confidence (0-1)", current);
    if (input === null) return;
    const value = Number.parseFloat(input);
    if (Number.isNaN(value) || value < 0 || value > 1) {
      addToast({ status: "warning", title: "Invalid confidence" });
      return;
    }

    try {
      if (type === "outcomeOpportunity") {
        await deleteOutcomeOpportunity(edge.edgeId);
        await createOutcomeOpportunity({ outcomeId: edge.outcomeId, opportunityId: edge.opportunityId, confidence: value });
      }
      if (type === "opportunitySolution") {
        await deleteOpportunitySolution(edge.edgeId);
        await createOpportunitySolution({ opportunityId: edge.opportunityId, solutionId: edge.solutionId, confidence: value });
      }
      if (type === "solutionAssumption") {
        await deleteSolutionAssumption(edge.edgeId);
        await createSolutionAssumption({ solutionId: edge.solutionId, assumptionId: edge.assumptionId, confidence: value });
      }
      addToast({ status: "success", title: "Confidence updated" });
      queryClient.invalidateQueries({ queryKey: ["discovery", "ost-tree"] });
    } catch (error) {
      addToast({
        status: "error",
        title: "Unable to update edge",
        description: error?.problem?.detail ?? error.message,
      });
    }
  };

  const handleUnlinkEdge = async (type, edgeId) => {
    try {
      if (type === "outcomeOpportunity") await deleteOutcomeOpportunity(edgeId);
      if (type === "opportunitySolution") await deleteOpportunitySolution(edgeId);
      if (type === "solutionAssumption") await deleteSolutionAssumption(edgeId);
      addToast({ status: "success", title: "Edge removed" });
      queryClient.invalidateQueries({ queryKey: ["discovery", "ost-tree"] });
    } catch (error) {
      addToast({
        status: "error",
        title: "Unable to unlink edge",
        description: error?.problem?.detail ?? error.message,
      });
    }
  };

  return (
    <div className="stack">
      <header className="stack">
        <h1 className="page-title">Discovery Dashboard</h1>
        <p className="muted">
          Project ID: <code>{projectId}</code>
        </p>
      </header>

      <FiltersBar filters={filters} onChange={setFilters} />

      <TreeSection
        tree={treeData}
        totals={treeTotals}
        isLoading={treeQuery.isLoading}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["discovery", "ost-tree"] })}
        onEditConfidence={handleEditConfidence}
        onUnlink={handleUnlinkEdge}
      />

      <EdgeLinkers
        outcomeOptions={outcomeOptionsForSelect}
        opportunityOptions={opportunityOptionsForSelect}
        solutionOptions={solutionOptionsForSelect}
        assumptionOptions={assumptionOptionsForSelect}
        outcomeOpportunityEdges={existingEdges.outcomeOpportunities}
        opportunitySolutionEdges={existingEdges.opportunitySolutions}
        solutionAssumptionEdges={existingEdges.solutionAssumptions}
        onInvalidate={() => queryClient.invalidateQueries({ queryKey: ["discovery", "ost-tree"] })}
      />

      <NodePanel config={outcomeConfig} filters={filters} onItemsChange={setOutcomeItems} />
      <NodePanel config={opportunityConfig} filters={filters} onItemsChange={setOpportunityItems} />
      <NodePanel config={solutionConfig} filters={filters} onItemsChange={setSolutionItems} />
      <NodePanel config={assumptionConfig} filters={filters} onItemsChange={setAssumptionItems} />

      <HypothesesPanel
        filters={filters}
        options={hypothesisOptionsForPanels}
        onItemsChange={setHypothesisItems}
        onInvalidate={() => {
          queryClient.invalidateQueries({ queryKey: ["discovery", "experiments"] });
        }}
      />

      <NodePanel config={experimentConfig} filters={filters} onItemsChange={(items) => {
        queryClient.setQueryData(["discovery", "experiments-options"], items.map((item) => ({ id: item.id, name: item.name })));
      }} />

      <InsightsPanel filters={filters} options={insightOptions} />
    </div>
  );
}

function FiltersBar({ filters, onChange }) {
  const [formState, setFormState] = useState(filters);

  useEffect(() => {
    setFormState(filters);
  }, [filters]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onChange(formState);
  };

  const applyQuickValidation = (value) => {
    setFormState((prev) => ({ ...prev, validationState: value === prev.validationState ? "" : value }));
    onChange({ ...formState, validationState: value === formState.validationState ? "" : value });
  };

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <div className="grid two">
        <label className="stack">
          <span>Search</span>
          <input
            type="search"
            value={formState.q}
            onChange={(event) => setFormState((prev) => ({ ...prev, q: event.target.value }))}
            placeholder="Search across resources"
          />
        </label>
        <label className="stack">
          <span>Status</span>
          <input
            type="text"
            value={formState.status}
            onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value }))}
            placeholder="e.g., active"
          />
        </label>
        <label className="stack">
          <span>From</span>
          <input
            type="date"
            value={formState.from}
            onChange={(event) => setFormState((prev) => ({ ...prev, from: event.target.value }))}
          />
        </label>
        <label className="stack">
          <span>To</span>
          <input
            type="date"
            value={formState.to}
            onChange={(event) => setFormState((prev) => ({ ...prev, to: event.target.value }))}
          />
        </label>
      </div>

      <div className="grid three">
        <label className="stack">
          <span>Assumption category</span>
          <select
            value={formState.assumptionCategory}
            onChange={(event) => setFormState((prev) => ({ ...prev, assumptionCategory: event.target.value }))}
          >
            <option value="">All</option>
            {ASSUMPTION_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="stack">
          <span>Validation state</span>
          <select
            value={formState.validationState}
            onChange={(event) => setFormState((prev) => ({ ...prev, validationState: event.target.value }))}
          >
            <option value="">All</option>
            {VALIDATION_STATES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="stack">
          <span>Relationship type</span>
          <select
            value={formState.relationshipType}
            onChange={(event) => setFormState((prev) => ({ ...prev, relationshipType: event.target.value }))}
          >
            <option value="">All</option>
            {[
              "OUTCOME_OPPORTUNITY",
              "OPPORTUNITY_SOLUTION",
              "SOLUTION_ASSUMPTION",
              "NODE",
            ].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="stack">
          <span>Confidence level</span>
          <select
            value={formState.confidenceLevel}
            onChange={(event) => setFormState((prev) => ({ ...prev, confidenceLevel: event.target.value }))}
          >
            <option value="">All</option>
            {CONFIDENCE_LEVELS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="stack">
          <span>Lifecycle stage</span>
          <select
            value={formState.lifecycleStage}
            onChange={(event) => setFormState((prev) => ({ ...prev, lifecycleStage: event.target.value }))}
          >
            <option value="">All</option>
            {LIFECYCLE_STAGES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="stack">
          <span>Privacy level</span>
          <select
            value={formState.privacyLevel}
            onChange={(event) => setFormState((prev) => ({ ...prev, privacyLevel: event.target.value }))}
          >
            <option value="">All</option>
            {PRIVACY_LEVELS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="stack">
          <span>Experiment status</span>
          <select
            value={formState.experimentStatus}
            onChange={(event) => setFormState((prev) => ({ ...prev, experimentStatus: event.target.value }))}
          >
            <option value="">All</option>
            {EXPERIMENT_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="cluster" style={{ alignItems: "center" }}>
          <input
            type="checkbox"
            checked={formState.includeDeprecated}
            onChange={(event) => {
              const next = { ...formState, includeDeprecated: event.target.checked };
              setFormState(next);
              onChange(next);
            }}
          />
          <span>Include archived</span>
        </label>
      </div>

      <div className="cluster" style={{ flexWrap: "wrap" }}>
        <span>Quick filters:</span>
        {VALIDATION_STATES.map((state) => (
          <button
            key={state}
            type="button"
            className={state === formState.validationState ? "btn" : "btn-outline"}
            onClick={() => applyQuickValidation(state)}
          >
            {state}
          </button>
        ))}
      </div>

      <div className="card-actions">
        <button type="submit" className="btn">
          Apply filters
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={() => {
            setFormState(FILTER_DEFAULTS);
            onChange(FILTER_DEFAULTS);
          }}
        >
          Reset
        </button>
      </div>
    </form>
  );
}

function TreeSection({ tree, totals, isLoading, onRefresh, onEditConfidence, onUnlink }) {
  const [collapsedOutcomes, setCollapsedOutcomes] = useState(() => new Set());
  const [collapsedOpportunities, setCollapsedOpportunities] = useState(() => new Set());
  const [collapsedSolutions, setCollapsedSolutions] = useState(() => new Set());

  const toggleSet = (setState, id) => {
    setState((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="card stack">
      <header className="cluster" style={{ justifyContent: "space-between" }}>
        <div>
          <h2>Outcome → Opportunity → Solution → Assumption</h2>
          <p className="muted">
            Totals — Outcomes: {totals.outcomes ?? 0}, Opportunities: {totals.opportunities ?? 0}, Solutions: {totals.solutions ?? 0}, Assumptions: {totals.assumptions ?? 0}
          </p>
        </div>
        <button type="button" className="btn-outline" onClick={onRefresh}>
          Refresh tree
        </button>
      </header>

      {isLoading ? <p>Loading discovery tree…</p> : null}
      {!isLoading && tree.length === 0 ? <p className="muted">No discovery records yet.</p> : null}

      {!isLoading && tree.length ? (
        <ul className="stack">
          {tree.map((outcome) => {
            const outcomeCollapsed = collapsedOutcomes.has(outcome.id);
            return (
              <li key={outcome.id} className="panel stack">
                <header className="cluster" style={{ justifyContent: "space-between" }}>
                  <div>
                    <strong>{outcome.name}</strong>
                    {outcome.status === "deprecated" ? <span className="tag">Archived</span> : null}
                  </div>
                  <button type="button" className="btn-outline" onClick={() => toggleSet(setCollapsedOutcomes, outcome.id)}>
                    {outcomeCollapsed ? "Expand" : "Collapse"}
                  </button>
                </header>

                {!outcomeCollapsed && outcome.opportunities?.length ? (
                  <ul className="stack">
                    {outcome.opportunities.map((opEdge) => {
                      const opportunityCollapsed = collapsedOpportunities.has(opEdge.edgeId);
                      return (
                        <li key={opEdge.edgeId} className="panel stack">
                          <header className="cluster" style={{ justifyContent: "space-between" }}>
                            <div>
                              <strong>{opEdge.opportunity.description}</strong>
                              <span className="muted">Confidence: {opEdge.confidence ?? "—"}</span>
                            </div>
                            <div className="cluster">
                              <button
                                type="button"
                                className="btn-outline"
                                onClick={() => onEditConfidence("outcomeOpportunity", {
                                  ...opEdge,
                                  outcomeId: outcome.id,
                                  opportunityId: opEdge.opportunity.id,
                                })}
                              >
                                Edit confidence
                              </button>
                              <button
                                type="button"
                                className="btn-outline"
                                onClick={() => onUnlink("outcomeOpportunity", opEdge.edgeId)}
                              >
                                Unlink
                              </button>
                              <button
                                type="button"
                                className="btn-outline"
                                onClick={() => toggleSet(setCollapsedOpportunities, opEdge.edgeId)}
                              >
                                {opportunityCollapsed ? "Expand" : "Collapse"}
                              </button>
                            </div>
                          </header>

                          {!opportunityCollapsed && opEdge.solutions?.length ? (
                            <ul className="stack">
                              {opEdge.solutions.map((solEdge) => {
                                const solutionCollapsed = collapsedSolutions.has(solEdge.edgeId);
                                return (
                                  <li key={solEdge.edgeId} className="panel stack">
                                    <header className="cluster" style={{ justifyContent: "space-between" }}>
                                      <div>
                                        <strong>{solEdge.solution.title}</strong>
                                        <span className="muted">Confidence: {solEdge.confidence ?? "—"}</span>
                                      </div>
                                      <div className="cluster">
                                        <button
                                          type="button"
                                          className="btn-outline"
                                          onClick={() => onEditConfidence("opportunitySolution", {
                                            ...solEdge,
                                            opportunityId: opEdge.opportunity.id,
                                            solutionId: solEdge.solution.id,
                                          })}
                                        >
                                          Edit confidence
                                        </button>
                                        <button
                                          type="button"
                                          className="btn-outline"
                                          onClick={() => onUnlink("opportunitySolution", solEdge.edgeId)}
                                        >
                                          Unlink
                                        </button>
                                        <button
                                          type="button"
                                          className="btn-outline"
                                          onClick={() => toggleSet(setCollapsedSolutions, solEdge.edgeId)}
                                        >
                                          {solutionCollapsed ? "Expand" : "Collapse"}
                                        </button>
                                      </div>
                                    </header>

                                    {!solutionCollapsed && solEdge.assumptions?.length ? (
                                      <ul className="stack">
                                        {solEdge.assumptions.map((assEdge) => (
                                          <li key={assEdge.edgeId} className="panel stack">
                                            <div className="cluster" style={{ justifyContent: "space-between" }}>
                                              <div>
                                                <strong>{assEdge.assumption.statement}</strong>
                                                <span className="muted">Confidence: {assEdge.confidence ?? "—"}</span>
                                              </div>
                                              <div className="cluster">
                                                <button
                                                  type="button"
                                                  className="btn-outline"
                                                  onClick={() => onEditConfidence("solutionAssumption", {
                                                    ...assEdge,
                                                    solutionId: solEdge.solution.id,
                                                    assumptionId: assEdge.assumption.id,
                                                  })}
                                                >
                                                  Edit confidence
                                                </button>
                                                <button
                                                  type="button"
                                                  className="btn-outline"
                                                  onClick={() => onUnlink("solutionAssumption", assEdge.edgeId)}
                                                >
                                                  Unlink
                                                </button>
                                              </div>
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : null}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function buildEdgeOptions(tree) {
  const outcomeOpportunities = [];
  const opportunitySolutions = [];
  const solutionAssumptions = [];

  tree.forEach((outcome) => {
    outcome.opportunities?.forEach((opEdge) => {
      outcomeOpportunities.push({
        edgeId: opEdge.edgeId,
        label: `${outcome.name} → ${opEdge.opportunity.description}`,
        outcomeId: outcome.id,
        opportunityId: opEdge.opportunity.id,
        confidence: opEdge.confidence,
      });

      opEdge.solutions?.forEach((solEdge) => {
        opportunitySolutions.push({
          edgeId: solEdge.edgeId,
          label: `${opEdge.opportunity.description} → ${solEdge.solution.title}`,
          opportunityId: opEdge.opportunity.id,
          solutionId: solEdge.solution.id,
          confidence: solEdge.confidence,
        });

        solEdge.assumptions?.forEach((assEdge) => {
          solutionAssumptions.push({
            edgeId: assEdge.edgeId,
            label: `${solEdge.solution.title} → ${assEdge.assumption.statement}`,
            solutionId: solEdge.solution.id,
            assumptionId: assEdge.assumption.id,
            confidence: assEdge.confidence,
          });
        });
      });
    });
  });

  return { outcomeOpportunities, opportunitySolutions, solutionAssumptions };
}
