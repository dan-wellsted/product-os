import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePaginatedResource } from "../../hooks/usePaginatedResource.js";
import { flattenPages } from "../../lib/pagination.js";
import {
  listInsights,
  createInsight,
  updateInsight,
  deleteInsight,
  getInsightById,
} from "../../api/discovery.js";
import Drawer from "../Drawer.jsx";
import Modal from "../Modal.jsx";
import InsightForm from "./InsightForm.jsx";
import { insightCreateSchema, insightUpdateSchema } from "../../lib/schemas.js";
import { VALIDATION_STATES } from "../../lib/constants.js";
import { useToast } from "../../hooks/useToast.js";
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

export default function InsightsPanel({ filters, options, onInvalidate }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [modalState, setModalState] = useState(null); // { mode, id }
  const [drawerId, setDrawerId] = useState(null);
  const [latestData, setLatestData] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState(null);

  const listQuery = usePaginatedResource({
    key: ["discovery", "insights"],
    listFn: listInsights,
    params: {
      q: filters.q || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      status: filters.validationState || undefined,
      relationshipType: filters.relationshipType || undefined,
      confidenceLevel: filters.confidenceLevel || undefined,
      lifecycleStage: filters.lifecycleStage || undefined,
      privacyLevel: filters.privacyLevel || undefined,
    },
  });

  const items = useMemo(() => flattenPages(listQuery.data), [listQuery.data]);

  const detailId = modalState?.id ?? drawerId ?? null;
  const detailQuery = useQuery({
    queryKey: ["discovery", "insight", detailId],
    queryFn: () => getInsightById(detailId),
    enabled: Boolean(detailId),
  });

  const detailRecord = useMemo(() => detailQuery.data?.data ?? detailQuery.data ?? null, [detailQuery.data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["discovery", "insights"] });
    queryClient.invalidateQueries({ queryKey: ["discovery", "ost-tree"] });
    onInvalidate?.();
  };

  const createMutation = useMutation({
    mutationFn: (values) => createInsight(values),
    onSuccess: () => {
      addToast({ status: "success", title: "Insight created" });
      invalidate();
      setModalState(null);
    },
    onError: (error) => {
      if (!(error instanceof ApiError && error.status === 422)) {
        addToast({
          status: "error",
          title: "Unable to create insight",
          description: error?.problem?.detail ?? error.message,
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => updateInsight(id, values),
    onSuccess: () => {
      addToast({ status: "success", title: "Insight updated" });
      invalidate();
      setShowDiff(false);
      setLatestData(null);
      setModalState(null);
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 412) {
        const latest = await detailQuery.refetch();
        const record = latest.data?.data ?? latest.data ?? null;
        if (record) {
          setLatestData(record);
          setShowDiff(true);
        }
        addToast({
          status: "warning",
          title: "Update conflict",
          description: "Reload the latest insight and try again.",
          duration: null,
          actions: [
            {
              label: "Reload Latest",
              onClick: () => {
                if (record) {
                  setLatestData(record);
                  setShowDiff(true);
                }
              },
            },
            {
              label: "Review & Merge",
              onClick: () => {
                if (record) {
                  setLatestData(record);
                  setShowDiff(true);
                }
              },
            },
            {
              label: "Retry",
              dismiss: false,
              onClick: () => {
                if (lastSubmitted && modalState?.id) {
                  updateMutation.mutate({ id: modalState.id, values: lastSubmitted });
                }
              },
            },
          ],
        });
        return;
      }

      if (!(error instanceof ApiError && error.status === 422)) {
        addToast({
          status: "error",
          title: "Unable to update insight",
          description: error?.problem?.detail ?? error.message,
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteInsight(id),
    onSuccess: () => {
      addToast({ status: "success", title: "Insight deleted" });
      invalidate();
      setDrawerId(null);
    },
    onError: (error) => {
      addToast({
        status: "error",
        title: "Unable to delete insight",
        description: error?.problem?.detail ?? error.message,
      });
    },
  });

  const handleCreate = async (values) => {
    setLastSubmitted(values);
    const payload = normalise(values);
    await createMutation.mutateAsync(payload);
  };

  const handleUpdate = async (values) => {
    if (!modalState?.id) return;
    setLastSubmitted(values);
    const payload = normalise(values);
    await updateMutation.mutateAsync({ id: modalState.id, values: payload });
  };

  const normalise = (values) => {
    const payload = { ...values };
    TARGET_FIELDS.forEach((field) => {
      if (payload[field] === "") payload[field] = undefined;
    });
    if (Array.isArray(payload.sourceTypes) === false) {
      payload.sourceTypes = (payload.sourceTypes || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (Array.isArray(payload.tags) === false) {
      payload.tags = (payload.tags || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    ["discoveredOn", "validUntil", "dedupeHash", "createdById", "reviewedById"].forEach((field) => {
      if (payload[field] === "") payload[field] = undefined;
    });
    return payload;
  };

  const defaults = useMemo(() => {
    if (modalState?.mode === "edit" && detailRecord) {
      const values = { ...detailRecord };
      TARGET_FIELDS.forEach((field) => {
        values[field] = values[field] ?? "";
      });
      values.sourceTypes = values.sourceTypes?.join(", ") ?? "";
      values.tags = values.tags?.join(", ") ?? "";
      values.discoveredOn = values.discoveredOn ? values.discoveredOn.slice(0, 10) : "";
      values.validUntil = values.validUntil ? values.validUntil.slice(0, 10) : "";
      values.dedupeHash = values.dedupeHash ?? "";
      values.createdById = values.createdById ?? "";
      values.reviewedById = values.reviewedById ?? "";
      return values;
    }
    const base = {
      experimentId: "",
      relationshipType: "NODE",
      validationState: VALIDATION_STATES[0],
      confidenceLevel: "MEDIUM",
      statement: "",
      evidenceSummary: "",
      sourceTypes: "",
      tags: "",
      lifecycleStage: "",
      privacyLevel: "",
      discoveredOn: "",
      validUntil: "",
      dedupeHash: "",
      createdById: "",
      reviewedById: "",
    };
    TARGET_FIELDS.forEach((field) => {
      base[field] = "";
    });
    return base;
  }, [modalState, detailRecord]);

  return (
    <section className="card stack">
      <header className="cluster">
        <h2>Insights</h2>
        <button type="button" className="btn" onClick={() => setModalState({ mode: "create" })}>
          New Insight
        </button>
      </header>

      {listQuery.isLoading ? <p>Loading insights…</p> : null}
      {listQuery.isError ? <p className="muted">Unable to load insights.</p> : null}

      {!listQuery.isLoading && !listQuery.isError ? (
        items.length ? (
          <div className="stack">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="panel stack"
                onClick={() => {
                  setDrawerId(item.id);
                  setModalState(null);
                }}
              >
                <strong>{item.statement}</strong>
                <span className="muted">
                  {item.validationState} — {item.relationshipType}
                </span>
              </button>
            ))}
            {listQuery.hasNextPage ? (
              <button
                type="button"
                className="btn-outline"
                onClick={() => listQuery.fetchNextPage()}
                disabled={listQuery.isFetchingNextPage}
              >
                {listQuery.isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            ) : null}
          </div>
        ) : (
          <p className="muted">No insights yet.</p>
        )
      ) : null}

      <Modal
        open={Boolean(modalState)}
        title={modalState?.mode === "edit" ? "Edit Insight" : "New Insight"}
        onClose={() => setModalState(null)}
        footer={null}
      >
        <InsightForm
          schema={modalState?.mode === "edit" ? insightUpdateSchema : insightCreateSchema}
          defaultValues={defaults}
          onSubmit={modalState?.mode === "edit" ? handleUpdate : handleCreate}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          options={options}
          latestData={latestData}
          showDiff={showDiff}
          onApplyLatest={() => setShowDiff(false)}
          onCancel={() => setModalState(null)}
        />
      </Modal>

      <Drawer open={Boolean(drawerId)} title="Insight" onClose={() => setDrawerId(null)}>
        {detailQuery.isLoading ? (
          <p>Loading…</p>
        ) : detailQuery.isError || !detailRecord ? (
          <p className="muted">Insight not found.</p>
        ) : (
          <div className="stack">
            <h3>{detailRecord.statement}</h3>
            <p className="muted">
              {detailRecord.validationState} — {detailRecord.relationshipType}
            </p>
            <p>{detailRecord.evidenceSummary}</p>
            <div className="card-actions">
              <button
                type="button"
                className="btn"
                onClick={() => setModalState({ mode: "edit", id: drawerId })}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => deleteMutation.mutate(detailRecord.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </section>
  );
}
