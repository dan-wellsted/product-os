import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProject } from "../api/projects.js";

function useProject(projectId) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
    enabled: Boolean(projectId),
  });
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useProject(projectId);

  const project = data?.data;

  let content = null;

  if (isLoading) {
    content = <p>Loading project…</p>;
  } else if (isError) {
    content = (
      <div className="stack">
        <p className="muted">Unable to load project.</p>
        <small className="muted">{error?.message}</small>
      </div>
    );
  } else if (!project) {
    content = <p className="muted">Project not found.</p>;
  } else {
    content = (
      <div className="stack gap-md">
        <section className="card stack">
          <header className="stack">
            <h2>{project.name}</h2>
            {project.description ? <p className="muted">{project.description}</p> : null}
          </header>
          <dl className="grid two">
            <dt>Created</dt>
            <dd>{project.createdAt ? new Date(project.createdAt).toLocaleString() : "—"}</dd>
            {project.updatedAt ? (
              <>
                <dt>Updated</dt>
                <dd>{new Date(project.updatedAt).toLocaleString()}</dd>
              </>
            ) : null}
            {project.org?.name ? (
              <>
                <dt>Org</dt>
                <dd>{project.org.name}</dd>
              </>
            ) : null}
          </dl>
          <div className="cluster">
            <button type="button" className="btn" onClick={() => navigate("discovery")}>
              Open Discovery
            </button>
            <Link className="btn-outline" to="/projects">
              Back to Projects
            </Link>
          </div>
        </section>
        {project.metrics?.length ? (
          <section className="card stack">
            <h3>Metrics</h3>
            <ul className="stack">
              {project.metrics.map((metric) => (
                <li key={metric.id} className="panel">
                  <header>
                    <strong>{metric.name}</strong>
                  </header>
                  <p className="muted">{metric.description || "No description"}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="stack">
      <h1 className="page-title">Project</h1>
      {content}
    </div>
  );
}
