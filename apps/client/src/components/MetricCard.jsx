import React from "react";
export default function MetricCard({ label, value }) {
  return (
    <div className="panel">
      <div className="muted" style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.6rem", fontWeight: 600 }}>{value ?? "—"}</div>
    </div>
  );
}
