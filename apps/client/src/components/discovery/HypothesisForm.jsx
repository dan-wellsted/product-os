import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RELATIONSHIP_TYPES } from "../../lib/constants.js";
import { ApiError } from "../../api/httpClient.js";

const TARGET_FIELDS = [
  "assumptionId",
  "outcomeOpportunityId",
  "opportunitySolutionId",
  "solutionAssumptionId",
  "outcomeId",
  "opportunityId",
  "solutionId",
];

function applyFieldErrors(error, setError) {
  if (error instanceof ApiError && error.status === 422) {
    const issues = error.problem?.meta?.issues ?? [];
    issues.forEach((issue) => {
      setError(issue.path ?? "root", { type: "server", message: issue.message });
    });
    return true;
  }
  return false;
}

export default function HypothesisForm({
  mode,
  schema,
  defaultValues,
  onSubmit,
  isSubmitting,
  options,
  latestData,
  showDiff,
  onApplyLatest,
  onCancel,
}) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const targetType = form.watch("targetType");

  useEffect(() => {
    if (!targetType) return;
    clearTargets();
  }, [targetType]);

  const clearTargets = () => {
    TARGET_FIELDS.forEach((field) => form.setValue(field, ""));
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = { ...values };
      TARGET_FIELDS.forEach((field) => {
        if (payload[field] === "") payload[field] = undefined;
      });
      await onSubmit(payload);
    } catch (error) {
      const handled = applyFieldErrors(error, form.setError);
      if (!handled) {
        console.error(error);
      }
    }
  });

  const renderTargetSelect = () => {
    if (targetType === "OUTCOME_OPPORTUNITY") {
      return (
        <label className="stack">
          <span>Outcome → Opportunity</span>
          <select
            {...form.register("outcomeOpportunityId")}
            onChange={(event) => {
              clearTargets();
              form.setValue("targetType", "OUTCOME_OPPORTUNITY");
              form.setValue("outcomeOpportunityId", event.target.value);
            }}
          >
            <option value="">Select…</option>
            {options.outcomeOpportunities?.map((edge) => (
              <option key={edge.edgeId} value={edge.edgeId}>
                {edge.label}
              </option>
            ))}
          </select>
          <FieldError error={form.formState.errors.outcomeOpportunityId} />
        </label>
      );
    }

    if (targetType === "OPPORTUNITY_SOLUTION") {
      return (
        <label className="stack">
          <span>Opportunity → Solution</span>
          <select
            {...form.register("opportunitySolutionId")}
            onChange={(event) => {
              clearTargets();
              form.setValue("targetType", "OPPORTUNITY_SOLUTION");
              form.setValue("opportunitySolutionId", event.target.value);
            }}
          >
            <option value="">Select…</option>
            {options.opportunitySolutions?.map((edge) => (
              <option key={edge.edgeId} value={edge.edgeId}>
                {edge.label}
              </option>
            ))}
          </select>
          <FieldError error={form.formState.errors.opportunitySolutionId} />
        </label>
      );
    }

    if (targetType === "SOLUTION_ASSUMPTION") {
      return (
        <label className="stack">
          <span>Solution → Assumption</span>
          <select
            {...form.register("solutionAssumptionId")}
            onChange={(event) => {
              clearTargets();
              form.setValue("targetType", "SOLUTION_ASSUMPTION");
              form.setValue("solutionAssumptionId", event.target.value);
            }}
          >
            <option value="">Select…</option>
            {options.solutionAssumptions?.map((edge) => (
              <option key={edge.edgeId} value={edge.edgeId}>
                {edge.label}
              </option>
            ))}
          </select>
          <FieldError error={form.formState.errors.solutionAssumptionId} />
        </label>
      );
    }

    return (
      <div className="stack">
        <p className="muted">Select the node this hypothesis targets.</p>
        <label className="stack">
          <span>Outcome</span>
          <select
            value={form.watch("outcomeId")}
            onChange={(event) => {
              clearTargets();
              form.setValue("targetType", "NODE");
              form.setValue("outcomeId", event.target.value);
            }}
          >
            <option value="">None</option>
            {options.outcomes?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="stack">
          <span>Opportunity</span>
          <select
            value={form.watch("opportunityId")}
            onChange={(event) => {
              clearTargets();
              form.setValue("targetType", "NODE");
              form.setValue("opportunityId", event.target.value);
            }}
          >
            <option value="">None</option>
            {options.opportunities?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.description}
              </option>
            ))}
          </select>
        </label>
        <label className="stack">
          <span>Solution</span>
          <select
            value={form.watch("solutionId")}
            onChange={(event) => {
              clearTargets();
              form.setValue("targetType", "NODE");
              form.setValue("solutionId", event.target.value);
            }}
          >
            <option value="">None</option>
            {options.solutions?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label className="stack">
          <span>Assumption</span>
          <select
            value={form.watch("assumptionId")}
            onChange={(event) => {
              clearTargets();
              form.setValue("targetType", "NODE");
              form.setValue("assumptionId", event.target.value);
            }}
          >
            <option value="">None</option>
            {options.assumptions?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.statement}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  };

  const applyLatest = () => {
    if (!latestData) return;
    const values = { ...latestData };
    TARGET_FIELDS.forEach((field) => {
      values[field] = values[field] ?? "";
    });
    form.reset({
      statement: values.statement ?? "",
      targetType: values.targetType ?? "NODE",
      assumptionId: values.assumptionId ?? "",
      outcomeOpportunityId: values.outcomeOpportunityId ?? "",
      opportunitySolutionId: values.opportunitySolutionId ?? "",
      solutionAssumptionId: values.solutionAssumptionId ?? "",
      outcomeId: values.outcomeId ?? "",
      opportunityId: values.opportunityId ?? "",
      solutionId: values.solutionId ?? "",
      createdById: values.createdById ?? "",
    });
    onApplyLatest?.(latestData);
  };

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <label className="stack">
        <span>Statement</span>
        <textarea rows={4} {...form.register("statement")} />
        <FieldError error={form.formState.errors.statement} />
      </label>

      <label className="stack">
        <span>Target type</span>
        <select {...form.register("targetType")}>
          {RELATIONSHIP_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " → ")}
            </option>
          ))}
        </select>
      </label>

      {renderTargetSelect()}

      {showDiff && latestData ? (
        <section className="panel stack">
          <strong>Latest server version</strong>
          <pre>{JSON.stringify(latestData, null, 2)}</pre>
          <button type="button" className="btn-outline" onClick={applyLatest}>
            Reload latest
          </button>
        </section>
      ) : null}

      <div className="card-actions">
        <button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : mode === "edit" ? "Save changes" : "Create"}
        </button>
        <button type="button" className="btn-outline" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function FieldError({ error }) {
  if (!error) return null;
  return <span className="form-error">{error.message}</span>;
}
