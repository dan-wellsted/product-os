import React from "react";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch("/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status || data.ok ? "ok" : "unknown"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="stack">
      <h1 className="page-title">Product OS</h1>
      <p className="muted">Welcome to the Continuous Discovery workspace.</p>
      <section className="card">
        <h2>System Status</h2>
        <p>Server health: <strong>{status ?? "Checking..."}</strong></p>
        <p className="muted">Use the navigation to explore Projects, Reports, and Discovery insights.</p>
      </section>
    </div>
  );
}
