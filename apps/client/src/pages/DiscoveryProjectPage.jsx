import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchDiscoveryOverview } from "../api/discovery.js";
import TabNav from "../components/TabNav.jsx";

const tabs = [
  { key: "hypotheses", label: "Hypotheses" },
  { key: "assumptions", label: "Assumptions" },
  { key: "interviews", label: "Interviews" },
  { key: "insights", label: "Insights" },
  { key: "opportunities", label: "Opportunities" },
  { key: "solutions", label: "Solutions" },
  { key: "experiments", label: "Experiments" },
  { key: "evidence", label: "Evidence" },
  { key: "traces", label: "Trace Log" }
];

export default function DiscoveryProjectPage() {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState("hypotheses");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDiscoveryOverview(projectId)
      .then((res) => setData(res.project || res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  const sectionData = useMemo(() => {
    if (!data) return [];
    return data[activeTab] || [];
  }, [data, activeTab]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="muted">{error}</p>;
  if (!data) return <p className="muted">Project not found.</p>;

  return (
    <div className="stack">
      <h1 className="page-title">{data.name}</h1>
      <p className="muted">Continuous Discovery workspace</p>
      <TabNav tabs={tabs} active={activeTab} onSelect={setActiveTab} />

      {activeTab === "traces" ? (
        <section className="card">
          <h2>Trace Log</h2>
          {(sectionData || []).length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Context</th>
                </tr>
              </thead>
              <tbody>
                {sectionData.map((trace) => (
                  <tr key={trace.id}>
                    <td>{new Date(trace.createdAt).toLocaleString()}</td>
                    <td>{trace.fromType} → {trace.fromId}</td>
                    <td>{trace.toType} → {trace.toId}</td>
                    <td>{trace.context || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No trace entries yet.</p>
          )}
        </section>
      ) : (
        <section className="card">
          <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
          {(sectionData || []).length ? (
            <ul>
              {sectionData.map((item) => (
                <li key={item.id}>
                  <strong>{item.title || item.type || item.name || item.hypothesis || item.summary}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No items yet.</p>
          )}
        </section>
      )}
    </div>
  );
}
