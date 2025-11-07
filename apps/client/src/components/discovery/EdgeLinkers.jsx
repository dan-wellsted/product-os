import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import NodeForm from "./NodeForm.jsx";
import {
  createOutcomeOpportunity,
  createOpportunitySolution,
  createSolutionAssumption,
  batchCreateOpportunitySolutions,
  deleteOutcomeOpportunity,
  deleteOpportunitySolution,
  deleteSolutionAssumption,
} from "../../api/discovery.js";
import {
  outcomeOpportunitySchema,
  opportunitySolutionSchema,
  solutionAssumptionSchema,
  batchOpportunitySolutionSchema,
} from "../../lib/schemas.js";
import { useToast } from "../../hooks/useToast.js";

function buildOption(items, labelKey) {
  return items.map((item) => ({
    value: item.id ?? item.value,
    label: item.label ?? item[labelKey] ?? item.name ?? item.title ?? item.description ?? item.statement,
  }));
}

const defaultEdgeValues = { confidence: "", notes: "" };

export default function EdgeLinkers({
  outcomeOptions = [],
  opportunityOptions = [],
  solutionOptions = [],
  assumptionOptions = [],
  outcomeOpportunityEdges = [],
  opportunitySolutionEdges = [],
  solutionAssumptionEdges = [],
  onInvalidate,
}) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [batchResult, setBatchResult] = useState(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["discovery", "ost-tree"] });
    onInvalidate?.();
  };

  const outcomeMutation = useMutation({
    mutationFn: (payload) => createOutcomeOpportunity(payload),
    onSuccess: () => {
      addToast({ status: "success", title: "Linked outcome to opportunity" });
      invalidate();
    },
    onError: (error) => {
      addToast({
        status: "error",
        title: "Unable to link outcome",
        description: error?.problem?.detail ?? error.message,
      });
    },
  });

  const opportunitySolutionMutation = useMutation({
    mutationFn: (payload) => createOpportunitySolution(payload),
    onSuccess: () => {
      addToast({ status: "success", title: "Linked opportunity to solution" });
      invalidate();
    },
    onError: (error) => {
      addToast({
        status: "error",
        title: "Unable to link opportunity",
        description: error?.problem?.detail ?? error.message,
      });
    },
  });

  const solutionAssumptionMutation = useMutation({
    mutationFn: (payload) => createSolutionAssumption(payload),
    onSuccess: () => {
      addToast({ status: "success", title: "Linked solution to assumption" });
      invalidate();
    },
    onError: (error) => {
      addToast({
        status: "error",
        title: "Unable to link solution",
        description: error?.problem?.detail ?? error.message,
      });
    },
  });

  const batchMutation = useMutation({
    mutationFn: (payload) => batchCreateOpportunitySolutions(payload),
    onSuccess: (result) => {
      const created = Array.isArray(result?.data) ? result.data.length : 0;
      addToast({ status: "success", title: `Linked ${created} pairs` });
      setBatchResult({ success: result?.data ?? [], errors: [] });
      invalidate();
    },
    onError: (error) => {
      if (error?.problem?.meta?.duplicates) {
        setBatchResult({ success: [], errors: error.problem.meta.duplicates });
        addToast({
          status: "warning",
          title: "Duplicate pairs detected",
          description: "Some pairs already exist.",
        });
      } else {
        addToast({
          status: "error",
          title: "Batch link failed",
          description: error?.problem?.detail ?? error.message,
        });
      }
    },
  });

  const handleUnlink = async (type, id) => {
    try {
      if (type === "outcomeOpportunity") await deleteOutcomeOpportunity(id);
      if (type === "opportunitySolution") await deleteOpportunitySolution(id);
      if (type === "solutionAssumption") await deleteSolutionAssumption(id);
      addToast({ status: "success", title: "Edge unlinked" });
      invalidate();
    } catch (error) {
      addToast({
        status: "error",
        title: "Unable to unlink edge",
        description: error?.problem?.detail ?? error.message,
      });
    }
  };

  const outcomeFieldConfig = useMemo(
    () => [
      { name: "outcomeId", label: "Outcome", type: "select", options: buildOption(outcomeOptions, "name") },
      {
        name: "opportunityId",
        label: "Opportunity",
        type: "select",
        options: buildOption(opportunityOptions, "description"),
      },
      { name: "confidence", label: "Confidence (0-1)", type: "number" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    [outcomeOptions, opportunityOptions],
  );

  const opportunitySolutionFields = useMemo(
    () => [
      {
        name: "opportunityId",
        label: "Opportunity",
        type: "select",
        options: buildOption(opportunityOptions, "description"),
      },
      { name: "solutionId", label: "Solution", type: "select", options: buildOption(solutionOptions, "title") },
      { name: "confidence", label: "Confidence (0-1)", type: "number" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    [opportunityOptions, solutionOptions],
  );

  const solutionAssumptionFields = useMemo(
    () => [
      { name: "solutionId", label: "Solution", type: "select", options: buildOption(solutionOptions, "title") },
      {
        name: "assumptionId",
        label: "Assumption",
        type: "select",
        options: buildOption(assumptionOptions, "statement"),
      },
      { name: "confidence", label: "Confidence (0-1)", type: "number" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    [solutionOptions, assumptionOptions],
  );

  return (
    <section className="card stack">
      <header className="stack">
        <h2>Edge Linkers</h2>
        <p className="muted">Create links between discovery entities and manage existing relationships.</p>
      </header>

      <div className="grid two">
        <section className="panel stack">
          <h3>Outcome ↔ Opportunity</h3>
          <NodeForm
            schema={outcomeOpportunitySchema}
            defaultValues={{ ...defaultEdgeValues, outcomeId: "", opportunityId: "" }}
            onSubmit={(values) => outcomeMutation.mutateAsync(values)}
            submitLabel="Link"
            fields={outcomeFieldConfig}
            isSubmitting={outcomeMutation.isPending}
          />
        </section>

        <section className="panel stack">
          <h3>Opportunity ↔ Solution</h3>
          <NodeForm
            schema={opportunitySolutionSchema}
            defaultValues={{ ...defaultEdgeValues, opportunityId: "", solutionId: "" }}
            onSubmit={(values) => opportunitySolutionMutation.mutateAsync(values)}
            submitLabel="Link"
            fields={opportunitySolutionFields}
            isSubmitting={opportunitySolutionMutation.isPending}
          />
        </section>

        <section className="panel stack">
          <h3>Solution ↔ Assumption</h3>
          <NodeForm
            schema={solutionAssumptionSchema}
            defaultValues={{ ...defaultEdgeValues, solutionId: "", assumptionId: "" }}
            onSubmit={(values) => solutionAssumptionMutation.mutateAsync(values)}
            submitLabel="Link"
            fields={solutionAssumptionFields}
            isSubmitting={solutionAssumptionMutation.isPending}
          />
        </section>

        <section className="panel stack">
          <h3>Batch Opportunity ↔ Solution</h3>
          <BatchLinker
            schema={batchOpportunitySolutionSchema}
            opportunityOptions={opportunityOptions}
            solutionOptions={solutionOptions}
            isSubmitting={batchMutation.isPending}
            onSubmit={(payload) => batchMutation.mutateAsync(payload)}
            batchResult={batchResult}
          />
        </section>
      </div>

      <ExistingEdges
        outcomeEdges={outcomeOpportunityEdges}
        opportunityEdges={opportunitySolutionEdges}
        solutionEdges={solutionAssumptionEdges}
        onUnlink={handleUnlink}
      />
    </section>
  );
}

function createTempId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function BatchLinker({ schema, opportunityOptions, solutionOptions, isSubmitting, onSubmit, batchResult }) {
  const [rows, setRows] = useState([
    { id: createTempId(), opportunityId: "", solutionId: "", confidence: "", notes: "" },
  ]);

  const addRow = () => {
    setRows((current) => [
      ...current,
      { id: createTempId(), opportunityId: "", solutionId: "", confidence: "", notes: "" },
    ]);
  };

  const removeRow = (id) => {
    setRows((current) => current.filter((row) => row.id !== id));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      items: rows.map(({ id, ...rest }) => rest),
    };
    const result = schema.safeParse(payload);
    if (!result.success) {
      alert(result.error.issues.map((issue) => issue.message).join("\n"));
      return;
    }
    await onSubmit(result.data);
  };

  const opportunityOpts = buildOption(opportunityOptions, "description");
  const solutionOpts = buildOption(solutionOptions, "title");

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="stack">
        {rows.map((row, index) => (
          <div key={row.id} className="panel stack">
            <h4>Pair {index + 1}</h4>
            <label className="stack">
              <span>Opportunity</span>
              <select
                value={row.opportunityId}
                onChange={(event) =>
                  setRows((current) =>
                    current.map((item) =>
                      item.id === row.id ? { ...item, opportunityId: event.target.value } : item,
                    ),
                  )
                }
              >
                <option value="">Select…</option>
                {opportunityOpts.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="stack">
              <span>Solution</span>
              <select
                value={row.solutionId}
                onChange={(event) =>
                  setRows((current) =>
                    current.map((item) =>
                      item.id === row.id ? { ...item, solutionId: event.target.value } : item,
                    ),
                  )
                }
              >
                <option value="">Select…</option>
                {solutionOpts.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="stack">
              <span>Confidence (0-1)</span>
              <input
                type="number"
                step="0.1"
                value={row.confidence}
                onChange={(event) =>
                  setRows((current) =>
                    current.map((item) =>
                      item.id === row.id ? { ...item, confidence: event.target.value } : item,
                    ),
                  )
                }
              />
            </label>
            <label className="stack">
              <span>Notes</span>
              <textarea
                rows={2}
                value={row.notes}
                onChange={(event) =>
                  setRows((current) =>
                    current.map((item) => (item.id === row.id ? { ...item, notes: event.target.value } : item)),
                  )
                }
              />
            </label>
            {rows.length > 1 ? (
              <button type="button" className="btn-outline" onClick={() => removeRow(row.id)}>
                Remove row
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="card-actions">
        <button type="button" className="btn-outline" onClick={addRow}>
          Add row
        </button>
        <button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting ? "Linking…" : "Submit batch"}
        </button>
      </div>

      {batchResult ? (
        <div className="stack">
          {batchResult.success.length ? (
            <section className="panel">
              <h4>Created</h4>
              <ul>
                {batchResult.success.map((item) => (
                  <li key={`${item.opportunityId}-${item.solutionId}`}>
                    {item.opportunityId} → {item.solutionId}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {batchResult.errors.length ? (
            <section className="panel">
              <h4>Duplicates</h4>
              <ul>
                {batchResult.errors.map((item) => (
                  <li key={`${item.opportunityId}-${item.solutionId}`}>
                    {item.opportunityId} → {item.solutionId}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

function ExistingEdges({ outcomeEdges, opportunityEdges, solutionEdges, onUnlink }) {
  return (
    <div className="stack">
      <h3>Existing edges</h3>
      <div className="grid three">
        <EdgeList title="Outcome ↔ Opportunity" edges={outcomeEdges} onUnlink={(id) => onUnlink("outcomeOpportunity", id)} />
        <EdgeList title="Opportunity ↔ Solution" edges={opportunityEdges} onUnlink={(id) => onUnlink("opportunitySolution", id)} />
        <EdgeList title="Solution ↔ Assumption" edges={solutionEdges} onUnlink={(id) => onUnlink("solutionAssumption", id)} />
      </div>
    </div>
  );
}

function EdgeList({ title, edges, onUnlink }) {
  if (!edges?.length) {
    return (
      <section className="panel stack">
        <h4>{title}</h4>
        <p className="muted">None</p>
      </section>
    );
  }

  return (
    <section className="panel stack">
      <h4>{title}</h4>
      <ul className="stack">
        {edges.map((edge) => (
          <li key={edge.edgeId} className="cluster" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{edge.label}</strong>
              <div className="muted">Confidence: {edge.confidence ?? "—"}</div>
            </div>
            <button type="button" className="btn-outline" onClick={() => onUnlink(edge.edgeId)}>
              Unlink
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
