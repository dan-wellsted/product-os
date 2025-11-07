import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "../../api/httpClient.js";

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

export default function NodeForm({
  schema,
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  onCancel,
  fields,
  isSubmitting,
  latestData,
  onApplyLatest,
  showDiff = false,
  onInit,
}) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    onInit?.(form);
  }, [form, onInit]);

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const handled = applyFieldErrors(error, form.setError);
      if (!handled) {
        console.error(error);
      }
    }
  });

  return (
    <form className="stack" onSubmit={handleSubmit}>
      {fields.map((field) => {
        const error = form.formState.errors[field.name];
        return (
          <label key={field.name} className="stack">
            <span>{field.label}</span>
            {field.type === "textarea" ? (
              <textarea {...form.register(field.name)} rows={field.rows ?? 3} placeholder={field.placeholder} />
            ) : field.type === "select" ? (
              <select {...form.register(field.name)}>
                <option value="">Select…</option>
                {field.options.map((option) => {
                  const value = typeof option === "string" ? option : option.value;
                  const label = typeof option === "string" ? option : option.label;
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            ) : field.type === "checkbox" ? (
              <input type="checkbox" {...form.register(field.name)} />
            ) : (
              <input type={field.type ?? "text"} {...form.register(field.name)} placeholder={field.placeholder} />
            )}
            {error ? <span className="form-error">{error.message}</span> : null}
          </label>
        );
      })}

      {showDiff && latestData ? (
        <section className="panel stack">
          <strong>Latest server version</strong>
          <pre>{JSON.stringify(latestData, null, 2)}</pre>
          <button
            type="button"
            className="btn-outline"
            onClick={() => onApplyLatest?.({ reset: form.reset })}
          >
            Reload latest
          </button>
        </section>
      ) : null}

      <div className="card-actions">
        <button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className="btn-outline" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
