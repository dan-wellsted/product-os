import { prisma } from "../db/prisma.js";
import {
  recordTrace,
  removeTracesForEntity,
  TraceType,
  getProjectDiscoveryContext,
  listProjectsWithDiscoveryCounts,
} from "../services/discovery.service.js";

function pick(source, fields) {
  return fields.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      acc[key] = source[key];
    }
    return acc;
  }, {});
}

function parseDateInput(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function safeParseJSON(value) {
  if (!value) return null;
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch (_err) {
    return null;
  }
}

const CONFIDENCE_VALUES = new Set(["LOW", "MEDIUM", "HIGH"]);
const EXPERIMENT_STATUS = new Set(["PLANNED", "RUNNING", "SUCCEEDED", "FAILED"]);

function normalizeConfidence(value) {
  if (!value) return undefined;
  const upper = String(value).toUpperCase();
  return CONFIDENCE_VALUES.has(upper) ? upper : undefined;
}

function normalizeExperimentStatus(value) {
  if (!value) return undefined;
  const upper = String(value).toUpperCase();
  return EXPERIMENT_STATUS.has(upper) ? upper : undefined;
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function compactData(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, v]) => v !== undefined),
  );
}

export async function listProjects(_req, res, next) {
  try {
    const projects = await listProjectsWithDiscoveryCounts();
    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

const entityConfigs = {
  hypotheses: {
    model: "hypothesis",
    idParam: "hypothesisId",
    fields: ["outcomeId", "title", "statement", "status"],
    include: { outcome: { select: { id: true, title: true } }, assumptions: true },
    orderBy: { updatedAt: "desc" },
    afterCreate: async (req, created) => {
      await recordTrace({
        projectId: created.projectId,
        fromType: TraceType.OUTCOME,
        fromId: created.outcomeId,
        toType: TraceType.HYPOTHESIS,
        toId: created.id,
      });
    },
  },
  assumptions: {
    model: "assumption",
    idParam: "assumptionId",
    fields: ["hypothesisId", "opportunityId", "title", "statement", "confidence", "status"],
    include: { hypothesis: true, opportunity: true, solutions: true },
    orderBy: { updatedAt: "desc" },
    prepareData: (data) => {
      if (data.confidence) data.confidence = normalizeConfidence(data.confidence) || undefined;
    },
    afterCreate: async (_req, created) => {
      if (created.hypothesisId) {
        await recordTrace({
          projectId: created.projectId,
          fromType: TraceType.HYPOTHESIS,
          fromId: created.hypothesisId,
          toType: TraceType.ASSUMPTION,
          toId: created.id,
        });
      }
      if (created.opportunityId) {
        await recordTrace({
          projectId: created.projectId,
          fromType: TraceType.OPPORTUNITY,
          fromId: created.opportunityId,
          toType: TraceType.ASSUMPTION,
          toId: created.id,
        });
      }
    },
  },
  interviews: {
    model: "interview",
    idParam: "interviewId",
    fields: ["assumptionId", "title", "participant", "notes"],
    transform: (body) => ({
      interviewAt: parseDateInput(body.interviewAt),
    }),
    include: { assumption: true, insights: true },
    orderBy: { interviewAt: "desc" },
    afterCreate: async (_req, created) => {
      if (created.assumptionId) {
        await recordTrace({
          projectId: created.projectId,
          fromType: TraceType.ASSUMPTION,
          fromId: created.assumptionId,
          toType: TraceType.INTERVIEW,
          toId: created.id,
        });
      }
    },
  },
  insights: {
    model: "insight",
    idParam: "insightId",
    fields: ["interviewId", "title", "summary", "source", "impactScore", "confidence"],
    include: { interview: true },
    orderBy: { createdAt: "desc" },
    prepareData: (data) => {
      if (Object.prototype.hasOwnProperty.call(data, "impactScore")) {
        data.impactScore = toNumberOrNull(data.impactScore);
      }
      if (data.confidence) data.confidence = normalizeConfidence(data.confidence) || undefined;
    },
    afterCreate: async (_req, created) => {
      if (created.interviewId) {
        await recordTrace({
          projectId: created.projectId,
          fromType: TraceType.INTERVIEW,
          fromId: created.interviewId,
          toType: TraceType.INSIGHT,
          toId: created.id,
        });
      }
    },
  },
  opportunities: {
    model: "opportunity",
    idParam: "opportunityId",
    fields: ["outcomeId", "insightId", "title", "problem", "evidence", "confidence"],
    include: { insight: true, experiments: true, assumptions: true, solutions: true },
    orderBy: { updatedAt: "desc" },
    prepareData: (data) => {
      if (data.confidence) data.confidence = normalizeConfidence(data.confidence) || undefined;
    },
    afterCreate: async (_req, created) => {
      if (created.insightId) {
        await recordTrace({
          projectId: created.projectId,
          fromType: TraceType.INSIGHT,
          fromId: created.insightId,
          toType: TraceType.OPPORTUNITY,
          toId: created.id,
        });
      }
      if (created.outcomeId) {
        await recordTrace({
          projectId: created.projectId,
          fromType: TraceType.OUTCOME,
          fromId: created.outcomeId,
          toType: TraceType.OPPORTUNITY,
          toId: created.id,
        });
      }
    },
  },
  solutions: {
    model: "solution",
    idParam: "solutionId",
    fields: ["opportunityId", "assumptionId", "title", "description"],
    include: { opportunity: true, assumption: true, experiments: true },
    orderBy: { updatedAt: "desc" },
    afterCreate: async (_req, created) => {
      await recordTrace({
        projectId: created.projectId,
        fromType: TraceType.OPPORTUNITY,
        fromId: created.opportunityId,
        toType: TraceType.SOLUTION,
        toId: created.id,
      });
      if (created.assumptionId) {
        await recordTrace({
          projectId: created.projectId,
          fromType: TraceType.ASSUMPTION,
          fromId: created.assumptionId,
          toType: TraceType.SOLUTION,
          toId: created.id,
        });
      }
    },
  },
  experiments: {
    model: "experiment",
    idParam: "experimentId",
    fields: ["opportunityId", "solutionId", "hypothesis", "method", "status", "result"],
    include: { opportunity: true, solution: true, evidences: true },
    orderBy: { updatedAt: "desc" },
    prepareData: (data) => {
      if (data.status) data.status = normalizeExperimentStatus(data.status) || undefined;
    },
    afterCreate: async (_req, created) => {
      const projectId = created.projectId;
      if (created.solutionId) {
        await recordTrace({
          projectId,
          fromType: TraceType.SOLUTION,
          fromId: created.solutionId,
          toType: TraceType.EXPERIMENT,
          toId: created.id,
        });
      } else {
        await recordTrace({
          projectId,
          fromType: TraceType.OPPORTUNITY,
          fromId: created.opportunityId,
          toType: TraceType.EXPERIMENT,
          toId: created.id,
        });
      }
    },
  },
  evidences: {
    model: "evidence",
    idParam: "evidenceId",
    fields: ["experimentId", "type", "summary"],
    include: { experiment: true },
    orderBy: { createdAt: "desc" },
    transform: (body) => ({
      details: safeParseJSON(body.details),
    }),
    afterCreate: async (_req, created) => {
      await recordTrace({
        projectId: created.projectId,
        fromType: TraceType.EXPERIMENT,
        fromId: created.experimentId,
        toType: TraceType.EVIDENCE,
        toId: created.id,
      });
    },
  },
};

function buildHandlers(config) {
  const { model, idParam, fields, include, transform, orderBy } = config;
  return {
    list: async (req, res, next) => {
      try {
        const { projectId } = req.params;
        const items = await prisma[model].findMany({
          where: { projectId },
          include,
          orderBy: orderBy || { updatedAt: "desc" },
        });
        res.json({ items });
      } catch (err) {
        next(err);
      }
    },
    retrieve: async (req, res, next) => {
      try {
        const { projectId } = req.params;
        const id = req.params[idParam];
        const item = await prisma[model].findFirst({
          where: { id, projectId },
          include,
        });
        if (!item) return res.status(404).json({ error: "not_found" });
        res.json({ item });
      } catch (err) {
        next(err);
      }
    },
    create: async (req, res, next) => {
      try {
        const { projectId } = req.params;
        const base = pick(req.body, fields);
        const extra = transform ? transform(req.body) : {};
        const data = compactData({ ...base, ...extra, projectId });
        if (config.prepareData) config.prepareData(data, req.body);
        const created = await prisma[model].create({ data, include });
        if (config.afterCreate) {
          await config.afterCreate(req, created);
        }
        res.status(201).json({ item: created });
      } catch (err) {
        next(err);
      }
    },
    update: async (req, res, next) => {
      try {
        const { projectId } = req.params;
        const id = req.params[idParam];
        const base = pick(req.body, fields);
        const extra = transform ? transform(req.body) : {};
        const data = compactData({ ...base, ...extra });
        if (config.prepareData) config.prepareData(data, req.body);
        const updated = await prisma[model].update({
          where: { id },
          data,
          include,
        });
        if (updated.projectId !== projectId) {
          return res.status(400).json({ error: "project_mismatch" });
        }
        res.json({ item: updated });
      } catch (err) {
        next(err);
      }
    },
    destroy: async (req, res, next) => {
      try {
        const { projectId } = req.params;
        const id = req.params[idParam];
        const existing = await prisma[model].findFirst({ where: { id, projectId } });
        if (!existing) return res.status(404).json({ error: "not_found" });
        await removeTracesForEntity(projectId, id);
        const deleted = await prisma[model].delete({ where: { id } });
        res.json({ item: deleted });
      } catch (err) {
        next(err);
      }
    },
  };
}

const hypothesisHandlers = buildHandlers(entityConfigs.hypotheses);
const assumptionHandlers = buildHandlers(entityConfigs.assumptions);
const interviewHandlers = buildHandlers(entityConfigs.interviews);
const insightHandlers = buildHandlers(entityConfigs.insights);
const opportunityHandlers = buildHandlers(entityConfigs.opportunities);
const solutionHandlers = buildHandlers(entityConfigs.solutions);
const experimentHandlers = buildHandlers(entityConfigs.experiments);
const evidenceHandlers = buildHandlers(entityConfigs.evidences);

export const listHypotheses = hypothesisHandlers.list;
export const getHypothesis = hypothesisHandlers.retrieve;
export const createHypothesis = hypothesisHandlers.create;
export const updateHypothesis = hypothesisHandlers.update;
export const deleteHypothesis = hypothesisHandlers.destroy;

export const listAssumptions = assumptionHandlers.list;
export const getAssumption = assumptionHandlers.retrieve;
export const createAssumption = assumptionHandlers.create;
export const updateAssumption = assumptionHandlers.update;
export const deleteAssumption = assumptionHandlers.destroy;

export const listInterviews = interviewHandlers.list;
export const getInterview = interviewHandlers.retrieve;
export const createInterview = interviewHandlers.create;
export const updateInterview = interviewHandlers.update;
export const deleteInterview = interviewHandlers.destroy;

export const listInsights = insightHandlers.list;
export const getInsight = insightHandlers.retrieve;
export const createInsight = insightHandlers.create;
export const updateInsight = insightHandlers.update;
export const deleteInsight = insightHandlers.destroy;

export const listOpportunities = opportunityHandlers.list;
export const getOpportunity = opportunityHandlers.retrieve;
export const createOpportunity = opportunityHandlers.create;
export const updateOpportunity = opportunityHandlers.update;
export const deleteOpportunity = opportunityHandlers.destroy;

export const listSolutions = solutionHandlers.list;
export const getSolution = solutionHandlers.retrieve;
export const createSolution = solutionHandlers.create;
export const updateSolution = solutionHandlers.update;
export const deleteSolution = solutionHandlers.destroy;

export const listExperiments = experimentHandlers.list;
export const getExperiment = experimentHandlers.retrieve;
export const createExperiment = experimentHandlers.create;
export const updateExperiment = experimentHandlers.update;
export const deleteExperiment = experimentHandlers.destroy;

export const listEvidence = evidenceHandlers.list;
export const getEvidence = evidenceHandlers.retrieve;
export const createEvidence = evidenceHandlers.create;
export const updateEvidence = evidenceHandlers.update;
export const deleteEvidence = evidenceHandlers.destroy;

export async function getProjectOverview(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await getProjectDiscoveryContext(projectId);
    if (!project) return res.status(404).json({ error: "not_found" });
    res.json({ project });
  } catch (err) {
    next(err);
  }
}
