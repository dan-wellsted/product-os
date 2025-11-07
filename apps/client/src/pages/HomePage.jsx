import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="stack">
      <header className="stack">
        <h1 className="page-title">Product OS</h1>
        <p className="muted">
          Continuous discovery and product strategy tooling. Jump into your projects to explore
          outcomes, opportunities, and evidence.
        </p>
      </header>
      <section className="card stack">
        <h2>Get Started</h2>
        <p>Navigate to the projects workspace to manage discovery across outcomes and teams.</p>
        <Link className="btn" to="/projects">
          View Projects
        </Link>
      </section>
    </div>
  );
}
