import "dotenv/config";
import { Worker } from "bullmq";
import { connection } from "../connection.js";
import { DISCOVERY_QUEUE } from "../discovery.queue.js";
import { prisma } from "../../db/prisma.js";
import {
  discoverySystem,
  discoveryUser,
} from "../../services/ai/prompts/discoveryPulse.js";
import { chatJSON } from "../../services/ai/openai.js";

function toMarkdown(p) {
  const lines = [
    `# ${p.title}`,
    "\n## Executive Summary\n",
    p.executive_summary || "",
    "\n## Opportunity Updates\n",
    ...(p.opportunity_updates || []).map((x) => `- ${x}`),
    "\n## Experiment Updates\n",
    ...(p.experiment_updates || []).map((x) => `- ${x}`),
    "\n## Metric Trends\n",
    ...(p.metric_trends || []).map(
      (t) =>
        `- **${t.name}:** ${t.current}${t.previous != null ? ` (prev ${t.previous})` : ""}${t.deltaPct != null ? ` — ${Number(t.deltaPct).toFixed(1)}%` : ""}`,
    ),
    "\n## Risks\n",
    ...(p.risks || []).map((x) => `- ${x}`),
    "\n## Next Actions\n",
    ...(p.next_actions || []).map((x) => `- ${x}`),
  ];
  return lines.join("\n");
}

async function buildData(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      outcomes: true,
      opportunities: { include: { experiments: true } },
      insights: { orderBy: { createdAt: "desc" }, take: 15 },
      metrics: { include: { snapshots: { orderBy: { ts: "desc" }, take: 2 } } },
    },
  });
  if (!project) throw new Error("Project not found");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const period = `${monthStart} to ${now.toISOString().slice(0, 10)}`;

  const metrics = project.metrics.map((m) => {
    const [current, previous] = m.snapshots;
    let deltaPct = null;
    if (current && previous && previous.value !== 0) {
      deltaPct =
        ((current.value - previous.value) / Math.abs(previous.value)) * 100;
    }
    return {
      name: m.name,
      unit: m.unit,
      current: current?.value ?? null,
      previous: previous?.value ?? null,
      deltaPct,
    };
  });

  return {
    project,
    period,
    outcomes: project.outcomes.map((o) => ({
      title: o.title,
      targetValue: o.targetValue,
    })),
    opportunities: project.opportunities.map((o) => ({
      title: o.title,
      confidence: o.confidence,
    })),
    experiments: project.opportunities.flatMap((o) =>
      o.experiments.map((e) => ({ title: e.hypothesis, status: e.status })),
    ),
    insights: project.insights.map((i) => ({
      title: i.title,
      summary: i.summary,
      impactScore: i.impactScore,
      confidence: i.confidence,
    })),
    metrics,
  };
}

new Worker(
  DISCOVERY_QUEUE,
  async (job) => {
    const { projectId } = job.data;
    const run = await prisma.reportRun.create({
      data: {
        projectId,
        type: "DISCOVERY_PULSE",
        status: "RUNNING",
        startedAt: new Date(),
      },
    });
    try {
      const d = await buildData(projectId);
      const json = await chatJSON({
        system: discoverySystem(),
        user: discoveryUser({
          projectName: d.project.name,
          period: d.period,
          outcomes: JSON.stringify(d.outcomes, null, 2),
          opportunities: JSON.stringify(d.opportunities, null, 2),
          experiments: JSON.stringify(d.experiments, null, 2),
          insights: JSON.stringify(d.insights, null, 2),
          metrics: JSON.stringify(d.metrics, null, 2),
        }),
      });
      const md = toMarkdown(json);
      const report = await prisma.report.create({
        data: {
          projectId,
          type: "DISCOVERY_PULSE",
          title: json.title || `Discovery Pulse — ${d.period}`,
          contentMd: md,
          model: process.env.OPENAI_MODEL,
        },
      });
      await prisma.reportRun.update({
        where: { id: run.id },
        data: {
          status: "SUCCEEDED",
          finishedAt: new Date(),
          reportId: report.id,
        },
      });
      return { reportId: report.id };
    } catch (err) {
      await prisma.reportRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          error: String(err?.message || err),
        },
      });
      throw err;
    }
  },
  { connection },
);

console.log("Discovery worker ready");
