import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProjects } from "../api/projects.js";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects()
      .then((res) => setProjects(res.projects || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="stack">
      <h1 className="page-title">Projects</h1>
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="muted">{error}</p>
      ) : projects.length === 0 ? (
        <p className="muted">No projects yet.</p>
      ) : (
        <div className="grid two">
          {projects.map((project) => (
            <section key={project.id} className="card">
              <h2>{project.name}</h2>
              <p className="muted">{project.description || "No description"}</p>
              <Link className="btn" to={`/projects/${project.id}`}>
                View Project
              </Link>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
