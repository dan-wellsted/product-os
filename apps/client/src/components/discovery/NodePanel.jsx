import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Modal from "../Modal.jsx";
import Drawer from "../Drawer.jsx";
import NodeForm from "./NodeForm.jsx";
import { usePaginatedResource } from "../../hooks/usePaginatedResource.js";
import { flattenPages } from "../../lib/pagination.js";
import { ApiError } from "../../api/httpClient.js";
import { useToast } from "../../hooks/useToast.js";

const baseDetailFields = [
  { label: "Status", value: (record) => record.status || "—" },
  {
    label: "Created",
    value: (record) => (record.createdAt ? new Date(record.createdAt).toLocaleString() : "—"),
  },
  {
    label: "Updated",
    value: (record) => (record.updatedAt ? new Date(record.updatedAt).toLocaleString() : "—"),
  },
];

export default function NodePanel({ config, filters, onItemsChange }) {
  const {
    key,
    title,
    singular,
    listFn,
    getFn,
    createFn,
    updateFn,
    archiveFn,
    buildParams,
    schema,
    createDefaults,
    toFormValues,
    fields,
    detailFields = baseDetailFields,
    archiveLabel = "Archive",
    invalidateKeys = [],
  } = config;

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [modalState, setModalState] = useState(null); // { mode: "create" | "edit", id? }
  const [drawerId, setDrawerId] = useState(null);
  const [latestData, setLatestData] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState(null);
  const [formApi, setFormApi] = useState(null);

  const listQuery = usePaginatedResource({
    key: ["discovery", key],
    listFn,
    params: buildParams(filters),
  });

  const items = useMemo(() => flattenPages(listQuery.data), [listQuery.data]);

  useEffect(() => {
    onItemsChange?.(items ?? []);
  }, [items, onItemsChange]);

  const detailId = modalState?.id ?? drawerId ?? null;
  const detailQuery = useQuery({
    queryKey: ["discovery", key, "detail", detailId],
    queryFn: () => getFn(detailId),
    enabled: Boolean(detailId),
  });

  const detailRecord = useMemo(() => {
    const payload = detailQuery.data;
    if (!payload) return null;
    return payload.data ?? payload;
  }, [detailQuery.data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["discovery", key] });
    queryClient.invalidateQueries({ queryKey: ["discovery", "ost-tree"] });
    invalidateKeys.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    });
  };

  const closeModal = () => {
    setModalState(null);
    setShowDiff(false);
    setLatestData(null);
    setLastSubmitted(null);
  };

  const handleGenericError = (error, message) => {
    if (error instanceof ApiError) {
      addToast({
        status: "error",
        title: message,
        description: error.problem?.detail ?? error.message,
      });
    } else {
      addToast({
        status: "error",
        title: message,
        description: error?.message ?? "Unexpected error",
      });
    }
  };

  const handleConcurrency = async (error) => {
    if (!(error instanceof ApiError) || error.status !== 412 || !modalState?.id) return false;

    const latest = await detailQuery.refetch();
    const serverRecord = latest.data?.data ?? latest.data ?? null;
    if (serverRecord) {
      setLatestData(serverRecord);
      setShowDiff(true);
    }

    addToast({
      status: "warning",
      title: "Update conflict",
      description: "This record changed since you opened it.",
      duration: null,
      actions: [
        {
          label: "Reload Latest",
          onClick: () => {
            if (serverRecord && formApi) {
              formApi.reset(toFormValues(serverRecord));
              setShowDiff(false);
            }
          },
        },
        {
          label: "Review & Merge",
          onClick: () => setShowDiff(true),
        },
        {
          label: "Retry",
          dismiss: false,
          onClick: () => {
            if (lastSubmitted) {
              updateMutation.mutate({ id: modalState.id, values: lastSubmitted });
            }
          },
        },
      ],
    });

    return true;
  };

  const createMutation = useMutation({
    mutationFn: (values) => createFn(values),
    onSuccess: () => {
      addToast({ status: "success", title: `${singular} created` });
      invalidate();
      closeModal();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        addToast({
          status: "warning",
          title: "Duplicate",
          description: error.problem?.detail ?? "Record already exists.",
        });
      } else if (!(error instanceof ApiError && error.status === 422)) {
        handleGenericError(error, `Unable to create ${singular.toLowerCase()}`);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => updateFn(id, values),
    onSuccess: () => {
      addToast({ status: "success", title: `${singular} updated` });
      invalidate();
      closeModal();
    },
    onError: async (error) => {
      if (await handleConcurrency(error)) return;
      if (error instanceof ApiError && error.status === 409) {
        addToast({
          status: "warning",
          title: "Conflict",
          description: error.problem?.detail ?? "Unique constraint violated.",
        });
      } else if (!(error instanceof ApiError && error.status === 422)) {
        handleGenericError(error, `Unable to update ${singular.toLowerCase()}`);
      }
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => archiveFn(id),
    onSuccess: () => {
      addToast({ status: "success", title: `${singular} archived` });
      invalidate();
      setDrawerId(null);
    },
    onError: (error) => {
      handleGenericError(error, `Unable to archive ${singular.toLowerCase()}`);
    },
  });

  const handleCreate = async (values) => {
    setLastSubmitted(values);
    await createMutation.mutateAsync(values);
  };

  const handleUpdate = async (values) => {
    if (!modalState?.id) return;
    setLastSubmitted(values);
    await updateMutation.mutateAsync({ id: modalState.id, values });
  };

  const handleArchive = (id) => {
    archiveMutation.mutate(id);
  };

  const renderList = () => {
    if (listQuery.isLoading) {
      return <p>Loading {title.toLowerCase()}…</p>;
    }

    if (listQuery.isError) {
      return <p className="muted">Unable to load {title.toLowerCase()}.</p>;
    }

    if (!items?.length) {
      return <p className="muted">No {title.toLowerCase()} yet.</p>;
    }

    return (
      <div className="stack">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="panel"
            onClick={() => {
              setDrawerId(item.id);
              setModalState(null);
            }}
          >
            <header className="stack">
              <strong>{config.listLabel ? config.listLabel(item) : item.name || item.title || item.statement}</strong>
              {item.status ? <span className="muted">Status: {item.status}</span> : null}
              {config.listDescription ? <span className="muted">{config.listDescription(item)}</span> : null}
            </header>
          </button>
        ))}
        {listQuery.hasNextPage ? (
          <button
            type="button"
            className="btn-outline"
            disabled={listQuery.isFetchingNextPage}
            onClick={() => listQuery.fetchNextPage()}
          >
            {listQuery.isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        ) : null}
      </div>
    );
  };

  const modalTitle = modalState?.mode === "edit" ? `Edit ${singular}` : `New ${singular}`;
  const modalDefaults = useMemo(() => {
    if (modalState?.mode === "edit" && detailRecord) {
      return toFormValues(detailRecord);
    }
    return createDefaults;
  }, [modalState, detailRecord, toFormValues, createDefaults]);

  return (
    <section className="card stack">
      <header className="cluster">
        <h2>{title}</h2>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setModalState({ mode: "create" });
            setLatestData(null);
            setShowDiff(false);
          }}
        >
          New {singular}
        </button>
      </header>

      {renderList()}

      <Modal open={Boolean(modalState)} title={modalTitle} onClose={closeModal}
        footer={null}
      >
        <NodeForm
          schema={schema}
          defaultValues={modalDefaults}
          onSubmit={modalState?.mode === "edit" ? handleUpdate : handleCreate}
          submitLabel={modalState?.mode === "edit" ? "Save changes" : `Create ${singular}`}
          onCancel={closeModal}
          fields={fields}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          latestData={latestData}
          showDiff={showDiff}
          onApplyLatest={({ reset }) => {
            if (latestData) {
              reset(toFormValues(latestData));
              setShowDiff(false);
            }
          }}
          onInit={setFormApi}
        />
      </Modal>

      <Drawer
        open={Boolean(drawerId)}
        title={`${singular} details`}
        onClose={() => setDrawerId(null)}
      >
        {detailQuery.isLoading ? (
          <p>Loading…</p>
        ) : detailQuery.isError || !detailRecord ? (
          <p className="muted">Unable to load record.</p>
        ) : (
          <div className="stack">
            <h3>{config.listLabel ? config.listLabel(detailRecord) : detailRecord.name || detailRecord.title}</h3>
            {detailFields.map((field) => (
              <div key={field.label}>
                <strong>{field.label}</strong>
                <div className="muted">{field.value(detailRecord)}</div>
              </div>
            ))}
            {detailQuery.data?.etag ? (
              <div>
                <strong>ETag</strong>
                <div className="muted">{detailQuery.data.etag}</div>
              </div>
            ) : null}
          <div className="card-actions">
            <button
              type="button"
              className="btn"
              onClick={() => {
                setModalState({ mode: "edit", id: drawerId });
                setLatestData(detailRecord);
                setShowDiff(false);
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => handleArchive(detailRecord.id)}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? `${archiveLabel}…` : archiveLabel}
            </button>
          </div>
        </div>
      )}
      </Drawer>
    </section>
  );
}
