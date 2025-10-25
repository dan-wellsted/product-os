import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchReport } from "../api/reports.js";

export default function ReportDetailPage() {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport(reportId)
      .then((res) => setReport(res.report || res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [reportId]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="muted">{error}</p>;
  if (!report) return <p className="muted">Report not found.</p>;

  return (
    <div className="stack">
      <h1 className="page-title">{report.title}</h1>
      <section className="card">
        <pre style={{ whiteSpace: "pre-wrap" }}>{report.contentMd || "No content"}</pre>
      </section>
    </div>
  );
}
