import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProject } from "../api/projects.js";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProject(projectId)
      .then((res) => setProject(res.project || res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="muted">{error}</p>;
  if (!project) return <p className="muted">Project not found.</p>;

  return (
    <div className="stack">
      <h1 className="page-title">{project.name}</h1>
      <p className="muted">{project.description || "No description"}</p>
      <section className="card">
        <h2>Opportunities</h2>
        {(project.opportunities || []).length ? (
          <ul>
            {project.opportunities.map((opp) => (
              <li key={opp.id}>
                <strong>{opp.title}</strong>
                <div className="muted">{opp.problem || "No problem statement"}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No opportunities yet.</p>
        )}
      </section>
    </div>
  );
}
