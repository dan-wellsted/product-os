import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePaginatedResource } from "../../hooks/usePaginatedResource.js";
import { flattenPages } from "../../lib/pagination.js";
import {
  listHypotheses,
  createHypothesis,
  updateHypothesis,
  deleteHypothesis,
  getHypothesisById,
} from "../../api/discovery.js";
import { hypothesisCreateSchema, hypothesisUpdateSchema } from "../../lib/schemas.js";
import Drawer from "../Drawer.jsx";
import Modal from "../Modal.jsx";
import { useToast } from "../../hooks/useToast.js";
import { ApiError } from "../../api/httpClient.js";
import HypothesisForm from "./HypothesisForm.jsx";

const TARGET_FIELDS = [
  "assumptionId",
  "outcomeOpportunityId",
  "opportunitySolutionId",
  "solutionAssumptionId",
  "outcomeId",
  "opportunityId",
  "solutionId",
];

export default function HypothesesPanel({ filters, options, onInvalidate, onItemsChange }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [modalState, setModalState] = useState(null); // { mode: 'create'|'edit', id }
  const [drawerId, setDrawerId] = useState(null);
  const [latestData, setLatestData] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState(null);

  const listQuery = usePaginatedResource({
    key: ["discovery", "hypotheses"],
    listFn: listHypotheses,
    params: {
      q: filters.q || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      targetType: filters.relationshipType || undefined,
    },
  });

  const items = useMemo(() => flattenPages(listQuery.data), [listQuery.data]);

  useEffect(() => {
    onItemsChange?.(items ?? []);
  }, [items, onItemsChange]);

  const detailId = modalState?.id ?? drawerId ?? null;
  const detailQuery = useQuery({
    queryKey: ["discovery", "hypothesis", detailId],
    queryFn: () => getHypothesisById(detailId),
    enabled: Boolean(detailId),
  });

  const detailRecord = useMemo(() => detailQuery.data?.data ?? detailQuery.data ?? null, [detailQuery.data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["discovery", "hypotheses"] });
    queryClient.invalidateQueries({ queryKey: ["discovery", "experiments"] });
    queryClient.invalidateQueries({ queryKey: ["discovery", "ost-tree"] });
    onInvalidate?.();
  };

  const createMutation = useMutation({
    mutationFn: (values) => createHypothesis(values),
    onSuccess: () => {
      addToast({ status: "success", title: "Hypothesis created" });
      invalidate();
      setModalState(null);
    },
    onError: (error) => {
      if (!(error instanceof ApiError && error.status === 422)) {
        addToast({
          status: "error",
          title: "Unable to create hypothesis",
          description: error?.problem?.detail ?? error.message,
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => updateHypothesis(id, values),
    onSuccess: () => {
      addToast({ status: "success", title: "Hypothesis updated" });
      invalidate();
      setModalState(null);
      setShowDiff(false);
      setLatestData(null);
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
          description: "Reload the latest hypothesis and retry.",
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
          title: "Unable to update hypothesis",
          description: error?.problem?.detail ?? error.message,
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteHypothesis(id),
    onSuccess: () => {
      addToast({ status: "success", title: "Hypothesis deleted" });
      invalidate();
      setDrawerId(null);
    },
    onError: (error) => {
      addToast({
        status: "error",
        title: "Unable to delete hypothesis",
        description: error?.problem?.detail ?? error.message,
      });
    },
  });

  const handleCreate = async (values) => {
    setLastSubmitted(values);
    const payload = normalisePayload(values);
    await createMutation.mutateAsync(payload);
  };

  const handleUpdate = async (values) => {
    if (!modalState?.id) return;
    setLastSubmitted(values);
    const payload = normalisePayload(values);
    await updateMutation.mutateAsync({ id: modalState.id, values: payload });
  };

  const normalisePayload = (values) => {
    const payload = { ...values };
    TARGET_FIELDS.forEach((field) => {
      if (payload[field] === "") payload[field] = undefined;
    });
    return payload;
  };

  const defaultValues = useMemo(() => {
    if (modalState?.mode === "edit" && detailRecord) {
      const values = { ...detailRecord };
      TARGET_FIELDS.forEach((field) => {
        values[field] = values[field] ?? "";
      });
      return values;
    }
    const defaults = {
      statement: "",
      targetType: "NODE",
    };
    TARGET_FIELDS.forEach((field) => {
      defaults[field] = "";
    });
    return defaults;
  }, [modalState, detailRecord]);

  return (
    <section className="card stack">
      <header className="cluster">
        <h2>Hypotheses</h2>
        <button type="button" className="btn" onClick={() => setModalState({ mode: "create" })}>
          New Hypothesis
        </button>
      </header>

      {listQuery.isLoading ? <p>Loading hypotheses…</p> : null}
      {listQuery.isError ? <p className="muted">Unable to load hypotheses.</p> : null}

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
                <span className="muted">Target: {item.targetType}</span>
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
          <p className="muted">No hypotheses yet.</p>
        )
      ) : null}

      <Modal
        open={Boolean(modalState)}
        title={modalState?.mode === "edit" ? "Edit Hypothesis" : "New Hypothesis"}
        onClose={() => setModalState(null)}
        footer={null}
      >
        <HypothesisForm
          mode={modalState?.mode ?? "create"}
          schema={modalState?.mode === "edit" ? hypothesisUpdateSchema : hypothesisCreateSchema}
          defaultValues={defaultValues}
          onSubmit={modalState?.mode === "edit" ? handleUpdate : handleCreate}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          options={options}
          latestData={latestData}
          showDiff={showDiff}
          onApplyLatest={() => setShowDiff(false)}
          onCancel={() => setModalState(null)}
        />
      </Modal>

      <Drawer open={Boolean(drawerId)} title="Hypothesis" onClose={() => setDrawerId(null)}>
        {detailQuery.isLoading ? (
          <p>Loading…</p>
        ) : detailQuery.isError || !detailRecord ? (
          <p className="muted">Hypothesis not found.</p>
        ) : (
          <div className="stack">
            <h3>{detailRecord.statement}</h3>
            <p className="muted">Target type: {detailRecord.targetType}</p>
            <p>ID: {detailRecord.id}</p>
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
