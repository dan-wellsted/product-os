import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchReports } from "../api/reports.js";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports()
      .then((res) => setReports(res.reports || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="muted">{error}</p>;
  if (!reports.length) return <p className="muted">No reports found.</p>;

  return (
    <div className="stack">
      <h1 className="page-title">Reports</h1>
      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>
                  <Link to={`/reports/${report.id}`}>{report.title}</Link>
                </td>
                <td>{report.type}</td>
                <td>{new Date(report.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
