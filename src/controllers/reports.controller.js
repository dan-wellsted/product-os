import { prisma } from "../db/prisma.js";
import MarkdownIt from "markdown-it";
import { runDiscoveryJob } from "../services/reports.service.js";

const md = new MarkdownIt({ linkify: true, breaks: false });

export async function list(req, res) {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  if (req.query.format === "json") return res.json(reports);
  res.render("reports-list", { title: "Reports", reports });
}

export async function getReport(req, res) {
  const report = await prisma.report.findUnique({
    where: { id: req.params.id },
  });
  if (!report) return res.status(404).json({ error: "Not found" });
  const html = md.render(report.contentMd || "");
  res.render("report", { title: report.title, report: { ...report, html } });
}

export async function runDiscoveryNow(req, res, next) {
  try {
    const job = await runDiscoveryJob({ projectId: req.params.projectId });
    return res.status(202).json({ queued: true, jobId: job.id });
  } catch (err) {
    if (next) return next(err);
    throw err;
  }
}
