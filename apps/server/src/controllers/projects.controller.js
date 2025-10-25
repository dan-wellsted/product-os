// src/controllers/projects.controller.js
import { prisma } from "../db/prisma.js";
import {
  enableWeeklyDiscovery,
  enableMonthlyDiscovery,
  disableAllDiscovery,
} from "../services/schedule.service.js"; // ok if file exists; else ignore

// -------- List / Create --------

export async function list(req, res) {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
  if (req.query.format === "json") return res.json({ projects });
  res.render("project", { title: "Projects", projects });
}

export async function newForm(_req, res) {
  res.render("project-new", { title: "New Project" });
}

export async function create(req, res) {
  const { name, description, orgName } = req.body;
  if (!name) return res.status(400).send("Project name required");

  let org = await prisma.organization.findFirst({
    where: { name: orgName || "Default Org" },
  });
  if (!org)
    org = await prisma.organization.create({
      data: { name: orgName || "Default Org" },
    });

  await prisma.project.create({
    data: { orgId: org.id, name, description: description || null },
  });
  res.redirect("/projects");
}

export async function quickCreate(_req, res) {
  let org = await prisma.organization.findFirst({
    where: { name: "Default Org" },
  });
  if (!org)
    org = await prisma.organization.create({ data: { name: "Default Org" } });
  const project = await prisma.project.create({
    data: {
      orgId: org.id,
      name: "My First Project",
      description: "Created via quick-create",
    },
  });
  res.json({ created: true, project });
}

// -------- Detail view --------

export async function detail(req, res) {
  const { id } = req.params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      outcomes: true,
      opportunities: { include: { experiments: true } },
      insights: { orderBy: { createdAt: "desc" } },
      metrics: { include: { snapshots: { orderBy: { ts: "desc" } } } },
    },
  });
  if (!project) return res.status(404).send("Project not found");

  const outcomes = project.outcomes;
  const opportunities = project.opportunities;
  const metrics = project.metrics;

  res.render("project-detail", {
    title: project.name,
    project,
    outcomes,
    opportunities,
    metrics,
  });
}

// -------- Creates --------

export async function addInsight(req, res) {
  const { id } = req.params;
  const { title, summary, impactScore = 5, confidence = "MEDIUM" } = req.body;
  if (!title) return res.status(400).send("Title required");
  await prisma.insight.create({
    data: {
      projectId: id,
      title,
      summary: summary || "",
      impactScore: Number(impactScore),
      confidence,
    },
  });
  res.redirect(`/projects/${id}`);
}

export async function addOutcome(req, res) {
  const { id } = req.params;
  const { title, description, targetValue, metricId } = req.body;
  if (!title) return res.status(400).send("Title required");
  await prisma.outcome.create({
    data: {
      projectId: id,
      title,
      description: description || null,
      targetValue: targetValue ? Number(targetValue) : null,
      metricId: metricId || null,
    },
  });
  res.redirect(`/projects/${id}`);
}

export async function addOpportunity(req, res) {
  const { id } = req.params;
  const {
    title,
    problem,
    evidence,
    confidence = "MEDIUM",
    outcomeId,
  } = req.body;
  if (!title) return res.status(400).send("Title required");
  await prisma.opportunity.create({
    data: {
      projectId: id,
      outcomeId: outcomeId || null,
      title,
      problem: problem || null,
      evidence: evidence || null,
      confidence,
    },
  });
  res.redirect(`/projects/${id}`);
}

export async function addExperiment(req, res) {
  const { id } = req.params;
  const {
    opportunityId,
    hypothesis,
    method,
    status = "PLANNED",
    result,
  } = req.body;
  if (!opportunityId) return res.status(400).send("opportunityId required");
  if (!hypothesis) return res.status(400).send("hypothesis required");
  await prisma.experiment.create({
    data: {
      opportunityId,
      hypothesis,
      method: method || null,
      status,
      result: result || null,
    },
  });
  res.redirect(`/projects/${id}`);
}

export async function addMetric(req, res) {
  const { id } = req.params;
  const { name, unit, description } = req.body;
  if (!name) return res.status(400).send("Metric name required");
  await prisma.metric.create({
    data: {
      projectId: id,
      name,
      unit: unit || null,
      description: description || null,
    },
  });
  res.redirect(`/projects/${id}`);
}

export async function addMetricSnapshot(req, res) {
  const { id } = req.params;
  const { metricId, value, ts, note } = req.body;
  if (!metricId) return res.status(400).send("metricId required");
  if (value === undefined || value === null || value === "")
    return res.status(400).send("value required");
  await prisma.metricSnapshot.create({
    data: {
      metricId,
      value: Number(value),
      ts: ts ? new Date(ts) : new Date(),
      note: note || null,
    },
  });
  res.redirect(`/projects/${id}`);
}

// -------- INSIGHTS: edit/update/delete --------

export async function editInsightForm(req, res) {
  const { id, insightId } = req.params;
  const [project, insight] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.insight.findUnique({ where: { id: insightId } }),
  ]);
  if (!project || !insight || insight.projectId !== id)
    return res.status(404).send("Not found");
  res.render("edit-insight", {
    title: `Edit Insight — ${project.name}`,
    project,
    insight,
  });
}

export async function updateInsight(req, res) {
  const { id, insightId } = req.params;
  const { title, summary, impactScore = 5, confidence = "MEDIUM" } = req.body;
  await prisma.insight.update({
    where: { id: insightId },
    data: {
      title,
      summary,
      impactScore: Number(impactScore),
      confidence,
    },
  });
  res.redirect(`/projects/${id}`);
}

export async function deleteInsight(req, res) {
  const { id, insightId } = req.params;
  await prisma.insight.delete({ where: { id: insightId } });
  res.redirect(`/projects/${id}`);
}

// -------- OPPORTUNITIES: edit/update/delete --------

export async function editOpportunityForm(req, res) {
  const { id, oppId } = req.params;
  const [project, opportunity] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: { outcomes: true },
    }),
    prisma.opportunity.findUnique({ where: { id: oppId } }),
  ]);
  if (!project || !opportunity || opportunity.projectId !== id)
    return res.status(404).send("Not found");
  res.render("edit-opportunity", {
    title: `Edit Opportunity — ${project.name}`,
    project,
    opportunity,
    outcomes: project.outcomes,
  });
}

export async function updateOpportunity(req, res) {
  const { id, oppId } = req.params;
  const {
    title,
    problem,
    evidence,
    confidence = "MEDIUM",
    outcomeId,
  } = req.body;
  await prisma.opportunity.update({
    where: { id: oppId },
    data: {
      title,
      problem: problem || null,
      evidence: evidence || null,
      confidence,
      outcomeId: outcomeId || null,
    },
  });
  res.redirect(`/projects/${id}`);
}

export async function deleteOpportunity(req, res) {
  const { id, oppId } = req.params;
  await prisma.opportunity.delete({ where: { id: oppId } });
  res.redirect(`/projects/${id}`);
}

// -------- EXPERIMENTS: edit/update/delete --------

export async function editExperimentForm(req, res) {
  const { id, expId } = req.params;
  const [project, experiment] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: { opportunities: true },
    }),
    prisma.experiment.findUnique({ where: { id: expId } }),
  ]);
  if (!project || !experiment) return res.status(404).send("Not found");
  // Ensure experiment belongs to a project opportunity
  const belongs = project.opportunities.some(
    (o) => o.id === experiment.opportunityId,
  );
  if (!belongs) return res.status(404).send("Not found");
  res.render("edit-experiment", {
    title: `Edit Experiment — ${project.name}`,
    project,
    experiment,
    opportunities: project.opportunities,
  });
}

export async function updateExperiment(req, res) {
  const { id, expId } = req.params;
  const { opportunityId, hypothesis, method, status, result } = req.body;
  await prisma.experiment.update({
    where: { id: expId },
    data: {
      opportunityId,
      hypothesis,
      method: method || null,
      status,
      result: result || null,
    },
  });
  res.redirect(`/projects/${id}`);
}

export async function deleteExperiment(req, res) {
  const { id, expId } = req.params;
  await prisma.experiment.delete({ where: { id: expId } });
  res.redirect(`/projects/${id}`);
}

// -------- OUTCOMES: edit/update -------- (NEW)

export async function editOutcomeForm(req, res) {
  const { id, outcomeId } = req.params;
  const [project, outcome, metrics] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.outcome.findUnique({ where: { id: outcomeId } }),
    prisma.metric.findMany({
      where: { projectId: id },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!project || !outcome || outcome.projectId !== id)
    return res.status(404).send("Not found");
  res.render("edit-outcome", {
    title: `Edit Outcome — ${project.name}`,
    project,
    outcome,
    metrics,
  });
}

export async function updateOutcome(req, res) {
  const { id, outcomeId } = req.params;
  const { title, description, targetValue, metricId } = req.body;
  await prisma.outcome.update({
    where: { id: outcomeId },
    data: {
      title,
      description: description || null,
      targetValue:
        targetValue === "" || targetValue === undefined || targetValue === null
          ? null
          : Number(targetValue),
      metricId: metricId || null,
    },
  });
  res.redirect(`/projects/${id}`);
}

// -------- METRICS: edit/update -------- (NEW)

export async function editMetricForm(req, res) {
  const { id, metricId } = req.params;
  const [project, metric] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.metric.findUnique({ where: { id: metricId } }),
  ]);
  if (!project || !metric || metric.projectId !== id)
    return res.status(404).send("Not found");
  res.render("edit-metric", {
    title: `Edit Metric — ${project.name}`,
    project,
    metric,
  });
}

export async function updateMetric(req, res) {
  const { id, metricId } = req.params;
  const { name, unit, description } = req.body;
  await prisma.metric.update({
    where: { id: metricId },
    data: {
      name,
      unit: unit || null,
      description: description || null,
    },
  });
  res.redirect(`/projects/${id}`);
}

// -------- Simple deletes for Outcomes / Metrics / Snapshots --------

export async function deleteOutcome(req, res) {
  const { id, outcomeId } = req.params;
  await prisma.outcome.delete({ where: { id: outcomeId } });
  res.redirect(`/projects/${id}`);
}

export async function deleteMetric(req, res) {
  const { id, metricId } = req.params;
  await prisma.metric.delete({ where: { id: metricId } });
  res.redirect(`/projects/${id}`);
}

export async function deleteMetricSnapshot(req, res) {
  const { id, snapshotId } = req.params;
  await prisma.metricSnapshot.delete({ where: { id: snapshotId } });
  res.redirect(`/projects/${id}`);
}

// -------- Scheduling (optional if you added schedule.service.js) --------
export async function enableWeekly(req, res) {
  const { id } = req.params;
  const { hour = 9, minute = 0 } = req.body;
  await enableWeeklyDiscovery({
    projectId: id,
    hour: Number(hour),
    minute: Number(minute),
  });
  res.redirect(`/projects/${id}`);
}

export async function enableMonthly(req, res) {
  const { id } = req.params;
  const { day = 1, hour = 9, minute = 0 } = req.body;
  await enableMonthlyDiscovery({
    projectId: id,
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  });
  res.redirect(`/projects/${id}`);
}

export async function disableSchedule(req, res) {
  const { id } = req.params;
  await disableAllDiscovery({ projectId: id });
  res.redirect(`/projects/${id}`);
}
