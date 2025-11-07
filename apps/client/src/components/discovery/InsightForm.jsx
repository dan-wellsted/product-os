import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RELATIONSHIP_TYPES,
  VALIDATION_STATES,
  CONFIDENCE_LEVELS,
  LIFECYCLE_STAGES,
  PRIVACY_LEVELS,
} from "../../lib/constants.js";
import { ApiError } from "../../api/httpClient.js";

const TARGET_FIELDS = [
  "outcomeOpportunityId",
  "opportunitySolutionId",
  "solutionAssumptionId",
  "outcomeId",
  "opportunityId",
  "solutionId",
  "assumptionId",
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

export default function InsightForm({
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

  const targetType = form.watch("relationshipType");

  const clearTargets = () => {
    TARGET_FIELDS.forEach((field) => form.setValue(field, ""));
  };

  useEffect(() => {
    clearTargets();
  }, [targetType]);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...values,
        sourceTypes: parseList(values.sourceTypes),
        tags: parseList(values.tags),
      };
      TARGET_FIELDS.forEach((field) => {
        if (payload[field] === "") payload[field] = undefined;
      });
      if (payload.discoveredOn === "") payload.discoveredOn = undefined;
      if (payload.validUntil === "") payload.validUntil = undefined;
      if (payload.dedupeHash === "") payload.dedupeHash = undefined;
      if (payload.createdById === "") payload.createdById = undefined;
      if (payload.reviewedById === "") payload.reviewedById = undefined;
      await onSubmit(payload);
    } catch (error) {
      const handled = applyFieldErrors(error, form.setError);
      if (!handled) {
        console.error(error);
      }
    }
  });

  const parseList = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    return value
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);
  };

  const renderTargetSection = () => {
    if (targetType === "OUTCOME_OPPORTUNITY") {
      return (
        <SelectField
          label="Outcome → Opportunity"
          value={form.watch("outcomeOpportunityId")}
          options={options.outcomeOpportunities}
          onChange={(value) => {
            clearTargets();
            form.setValue("outcomeOpportunityId", value);
          }}
        />
      );
    }

    if (targetType === "OPPORTUNITY_SOLUTION") {
      return (
        <SelectField
          label="Opportunity → Solution"
          value={form.watch("opportunitySolutionId")}
          options={options.opportunitySolutions}
          onChange={(value) => {
            clearTargets();
            form.setValue("opportunitySolutionId", value);
          }}
        />
      );
    }

    if (targetType === "SOLUTION_ASSUMPTION") {
      return (
        <SelectField
          label="Solution → Assumption"
          value={form.watch("solutionAssumptionId")}
          options={options.solutionAssumptions}
          onChange={(value) => {
            clearTargets();
            form.setValue("solutionAssumptionId", value);
          }}
        />
      );
    }

    return (
      <div className="grid two">
        <SelectField
          label="Outcome"
          value={form.watch("outcomeId")}
          options={options.outcomes}
          onChange={(value) => {
            clearTargets();
            form.setValue("outcomeId", value);
          }}
        />
        <SelectField
          label="Opportunity"
          value={form.watch("opportunityId")}
          options={options.opportunities}
          onChange={(value) => {
            clearTargets();
            form.setValue("opportunityId", value);
          }}
        />
        <SelectField
          label="Solution"
          value={form.watch("solutionId")}
          options={options.solutions}
          onChange={(value) => {
            clearTargets();
            form.setValue("solutionId", value);
          }}
        />
        <SelectField
          label="Assumption"
          value={form.watch("assumptionId")}
          options={options.assumptions}
          onChange={(value) => {
            clearTargets();
            form.setValue("assumptionId", value);
          }}
        />
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
      experimentId: values.experimentId ?? "",
      relationshipType: values.relationshipType ?? "NODE",
      outcomeOpportunityId: values.outcomeOpportunityId ?? "",
      opportunitySolutionId: values.opportunitySolutionId ?? "",
      solutionAssumptionId: values.solutionAssumptionId ?? "",
      outcomeId: values.outcomeId ?? "",
      opportunityId: values.opportunityId ?? "",
      solutionId: values.solutionId ?? "",
      assumptionId: values.assumptionId ?? "",
      validationState: values.validationState ?? VALIDATION_STATES[0],
      confidenceLevel: values.confidenceLevel ?? "MEDIUM",
      statement: values.statement ?? "",
      evidenceSummary: values.evidenceSummary ?? "",
      sourceTypes: values.sourceTypes?.join(", ") ?? "",
      tags: values.tags?.join(", ") ?? "",
      lifecycleStage: values.lifecycleStage ?? "",
      privacyLevel: values.privacyLevel ?? "",
      discoveredOn: values.discoveredOn ? values.discoveredOn.slice(0, 10) : "",
      validUntil: values.validUntil ? values.validUntil.slice(0, 10) : "",
      dedupeHash: values.dedupeHash ?? "",
      createdById: values.createdById ?? "",
      reviewedById: values.reviewedById ?? "",
    });
    onApplyLatest?.(latestData);
  };

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <label className="stack">
        <span>Experiment</span>
        <select {...form.register("experimentId")}
          onChange={(event) => form.setValue("experimentId", event.target.value)}
        >
          <option value="">Select…</option>
          {options.experiments?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <FieldError error={form.formState.errors.experimentId} />
      </label>

      <label className="stack">
        <span>Relationship type</span>
        <select {...form.register("relationshipType")}>
          {RELATIONSHIP_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " → ")}
            </option>
          ))}
        </select>
        <FieldError error={form.formState.errors.relationshipType} />
      </label>

      {renderTargetSection()}

      <label className="stack">
        <span>Validation state</span>
        <select {...form.register("validationState")}>
          {VALIDATION_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        <FieldError error={form.formState.errors.validationState} />
      </label>

      <label className="stack">
        <span>Confidence level</span>
        <select {...form.register("confidenceLevel")}>
          <option value="">Select…</option>
          {CONFIDENCE_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>

      <label className="stack">
        <span>Statement</span>
        <textarea rows={4} {...form.register("statement")} />
        <FieldError error={form.formState.errors.statement} />
      </label>

      <label className="stack">
        <span>Evidence summary</span>
        <textarea rows={4} {...form.register("evidenceSummary")} />
        <FieldError error={form.formState.errors.evidenceSummary} />
      </label>

      <label className="stack">
        <span>Source types (comma separated)</span>
        <input type="text" {...form.register("sourceTypes")} />
      </label>

      <label className="stack">
        <span>Tags (comma separated)</span>
        <input type="text" {...form.register("tags")} />
      </label>

      <label className="stack">
        <span>Lifecycle stage</span>
        <select {...form.register("lifecycleStage")}>
          <option value="">Select…</option>
          {LIFECYCLE_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </label>

      <label className="stack">
        <span>Privacy level</span>
        <select {...form.register("privacyLevel")}>
          <option value="">Select…</option>
          {PRIVACY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>

      <div className="grid two">
        <label className="stack">
          <span>Discovered on</span>
          <input type="date" {...form.register("discoveredOn")} />
        </label>
        <label className="stack">
          <span>Valid until</span>
          <input type="date" {...form.register("validUntil")} />
        </label>
      </div>

      <div className="grid two">
        <label className="stack">
          <span>Dedup hash</span>
          <input type="text" {...form.register("dedupeHash")} />
        </label>
        <label className="stack">
          <span>Created by</span>
          <input type="text" {...form.register("createdById")} />
        </label>
        <label className="stack">
          <span>Reviewed by</span>
          <input type="text" {...form.register("reviewedById")} />
        </label>
      </div>

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
          {isSubmitting ? "Saving…" : "Save"}
        </button>
        <button type="button" className="btn-outline" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function SelectField({ label, value, options = [], onChange }) {
  return (
    <label className="stack">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">None</option>
        {options.map((option) => (
          <option key={option.id ?? option.edgeId} value={option.id ?? option.edgeId}>
            {option.label ?? option.name ?? option.title ?? option.statement}
          </option>
        ))}
      </select>
    </label>
  );
}

function FieldError({ error }) {
  if (!error) return null;
  return <span className="form-error">{error.message}</span>;
}
