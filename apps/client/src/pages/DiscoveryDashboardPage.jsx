import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDiscoveryProjects } from "../api/discovery.js";

export default function DiscoveryDashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDiscoveryProjects()
      .then((res) => setProjects(res.projects || res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="stack">
      <h1 className="page-title">Discovery Admin</h1>
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="muted">{error}</p>
      ) : projects.length === 0 ? (
        <p className="muted">No projects found.</p>
      ) : (
        <div className="grid two">
          {projects.map((project) => (
            <section key={project.id} className="card">
              <h2>{project.name}</h2>
              <p className="muted">Hypotheses: {project._count?.hypotheses ?? 0}</p>
              <Link className="btn" to={`/discovery/projects/${project.id}`}>
                Open Discovery Workspace
              </Link>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
