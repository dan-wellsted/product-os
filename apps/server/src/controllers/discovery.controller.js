import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import {
  paginationQuerySchema,
  outcomeCreateSchema,
  outcomeUpdateSchema,
  opportunityCreateSchema,
  opportunityUpdateSchema,
  solutionCreateSchema,
  solutionUpdateSchema,
  assumptionCreateSchema,
  assumptionUpdateSchema,
  outcomeOpportunityCreateSchema,
  opportunitySolutionCreateSchema,
  solutionAssumptionCreateSchema,
  opportunitySolutionBatchSchema,
  hypothesisCreateSchema,
  hypothesisUpdateSchema,
  experimentCreateSchema,
  experimentUpdateSchema,
  insightCreateSchema,
  insightUpdateSchema,
  RelationshipTypeEnum,
  ValidationStateEnum,
  ConfidenceLevelEnum,
  LifecycleStageEnum,
  PrivacyLevelEnum,
  ExperimentStatusEnum,
} from "../validation/discovery.schemas.js";
import { formatProblem, sendProblem, handlePrismaError } from "../utils/problem.js";
import { paginateQuery } from "../utils/pagination.js";
import { toWeakEtag, isEtagMatch } from "../utils/etag.js";
import { ZodError } from "zod";

function handleZod(error) {
  return formatProblem({
    type: "https://httpstatuses.com/422",
    title: "Unprocessable Entity",
    status: 422,
    detail: "Validation failed",
    meta: {
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
  });
}

function parseFilterQuery(req) {
  try {
    return paginationQuerySchema.parse(req.query);
  } catch (error) {
    if (error instanceof ZodError) {
      throw handleZod(error);
    }
    throw error;
  }
}

function applyDateFilter(where, from, to) {
  if (!from && !to) return;
  where.createdAt = {};
  if (from) where.createdAt.gte = new Date(from);
  if (to) where.createdAt.lte = new Date(to);
}

function ensureSoftDeleteFilter(where, includeDeprecated, statusField = "status") {
  if (includeDeprecated) return;
  if (where[statusField]) return;
  where.OR = [
    { [statusField]: { not: "deprecated" } },
    { [statusField]: null },
  ];
}

function buildSearchFilter(fields, query) {
  if (!query) return undefined;
  return {
    OR: fields.map((field) => ({
      [field]: { contains: query, mode: "insensitive" },
    })),
  };
}

function appendAndFilter(where, filter) {
  if (!filter) return;
  if (where.AND) {
    where.AND.push(filter);
  } else {
    where.AND = [filter];
  }
}

function mapError(error, req) {
  if (error instanceof ZodError) {
    return handleZod(error);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }
  if (error?.status) return error;
  return formatProblem({
    status: 500,
    title: "Unexpected Error",
    detail: error.message,
    instance: req.originalUrl,
  });
}

function withEtag(res, record) {
  if (record?.updatedAt) {
    res.setHeader("ETag", toWeakEtag(record.updatedAt));
  }
}

function enforceIfMatch(req, record) {
  const ifMatch = req.headers["if-match"];
  if (!ifMatch) return;
  if (!isEtagMatch(ifMatch, record.updatedAt)) {
    const problem = formatProblem({
      status: 412,
      title: "Precondition Failed",
      detail: "Resource has been modified",
    });
    throw problem;
  }
}

function normalizeInsightPayload(payload, { ensureDefaults = false } = {}) {
  const nextPayload = { ...payload };

  if (ensureDefaults) {
    if (!Object.prototype.hasOwnProperty.call(nextPayload, "sourceTypes")) {
      nextPayload.sourceTypes = [];
    }
    if (!Object.prototype.hasOwnProperty.call(nextPayload, "tags")) {
      nextPayload.tags = [];
    }
  }

  if (Object.prototype.hasOwnProperty.call(nextPayload, "sourceTypes") && !nextPayload.sourceTypes) {
    nextPayload.sourceTypes = [];
  }

  if (Object.prototype.hasOwnProperty.call(nextPayload, "tags") && !nextPayload.tags) {
    nextPayload.tags = [];
  }

  if (!Object.prototype.hasOwnProperty.call(nextPayload, "dedupeHash") && nextPayload.statement) {
    nextPayload.dedupeHash = createHash("sha256")
      .update(nextPayload.statement.trim().toLowerCase())
      .digest("hex");
  }
  return nextPayload;
}

function validateTargetAlignment(targetType, payload) {
  const map = {
    OUTCOME_OPPORTUNITY: "outcomeOpportunityId",
    OPPORTUNITY_SOLUTION: "opportunitySolutionId",
    SOLUTION_ASSUMPTION: "solutionAssumptionId",
    NODE: ["outcomeId", "opportunityId", "solutionId", "assumptionId"],
  };
  const expected = map[targetType];
  if (!expected) return true;

  if (Array.isArray(expected)) {
    const provided = expected.filter((key) => payload[key]);
    return provided.length === 1;
  }

  return Boolean(payload[expected]);
}

export async function listOutcomes(req, res) {
  try {
    const { cursor, take, q, status, includeDeprecated, from, to } = parseFilterQuery(req);
    const where = {};
    if (status) where.status = status;
    ensureSoftDeleteFilter(where, includeDeprecated, "status");
    appendAndFilter(where, buildSearchFilter(["name", "description", "metricName"], q));
    applyDateFilter(where, from, to);

    const result = await paginateQuery({
      model: prisma.outcome,
      cursor,
      take: take ?? 25,
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: result.data, meta: result.meta });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function createOutcome(req, res) {
  try {
    const payload = outcomeCreateSchema.parse(req.body);
    const outcome = await prisma.outcome.create({ data: payload });
    withEtag(res, outcome);
    res.status(201).json({ data: outcome });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function getOutcome(req, res) {
  try {
    const outcome = await prisma.outcome.findUnique({ where: { id: req.params.id } });
    if (!outcome) {
      sendProblem(
        res,
        formatProblem({ status: 404, title: "Not Found", detail: "Outcome not found" }),
      );
      return;
    }
    withEtag(res, outcome);
    res.json({ data: outcome });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function updateOutcome(req, res) {
  try {
    const payload = outcomeUpdateSchema.parse(req.body);
    const existing = await prisma.outcome.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      sendProblem(
        res,
        formatProblem({ status: 404, title: "Not Found", detail: "Outcome not found" }),
      );
      return;
    }
    enforceIfMatch(req, existing);
    const outcome = await prisma.outcome.update({ where: { id: req.params.id }, data: payload });
    withEtag(res, outcome);
    res.json({ data: outcome });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function deleteOutcome(req, res) {
  try {
    const existing = await prisma.outcome.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      sendProblem(
        res,
        formatProblem({ status: 404, title: "Not Found", detail: "Outcome not found" }),
      );
      return;
    }
    enforceIfMatch(req, existing);
    const outcome = await prisma.outcome.update({
      where: { id: req.params.id },
      data: { status: "deprecated" },
    });
    withEtag(res, outcome);
    res.json({ data: outcome });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

function buildNodeHandlers({
  listHandler,
  createSchema,
  updateSchema,
  model,
  searchFields,
  statusField = "status",
}) {
  return {
    list: async (req, res) => {
      try {
        const { cursor, take, q, status, includeDeprecated, from, to } = parseFilterQuery(req);
        const where = {};
        if (status) where[statusField] = status;
        ensureSoftDeleteFilter(where, includeDeprecated, statusField);
        appendAndFilter(where, buildSearchFilter(searchFields, q));
        applyDateFilter(where, from, to);

        const result = await paginateQuery({
          model,
          cursor,
          take: take ?? 25,
          where,
          orderBy: { createdAt: "desc" },
        });

        res.json({ data: result.data, meta: result.meta });
      } catch (error) {
        sendProblem(res, mapError(error, req));
      }
    },
    create: async (req, res) => {
      try {
        const payload = createSchema.parse(req.body);
        const record = await model.create({ data: payload });
        withEtag(res, record);
        res.status(201).json({ data: record });
      } catch (error) {
        sendProblem(res, mapError(error, req));
      }
    },
    getById: async (req, res) => {
      try {
        const record = await model.findUnique({ where: { id: req.params.id } });
        if (!record) {
          sendProblem(res, formatProblem({ status: 404, title: "Not Found" }));
          return;
        }
        withEtag(res, record);
        res.json({ data: record });
      } catch (error) {
        sendProblem(res, mapError(error, req));
      }
    },
    update: async (req, res) => {
      try {
        const payload = updateSchema.parse(req.body);
        const existing = await model.findUnique({ where: { id: req.params.id } });
        if (!existing) {
          sendProblem(res, formatProblem({ status: 404, title: "Not Found" }));
          return;
        }
        enforceIfMatch(req, existing);
        const record = await model.update({ where: { id: req.params.id }, data: payload });
        withEtag(res, record);
        res.json({ data: record });
      } catch (error) {
        sendProblem(res, mapError(error, req));
      }
    },
    softDelete: async (req, res) => {
      try {
        const existing = await model.findUnique({ where: { id: req.params.id } });
        if (!existing) {
          sendProblem(res, formatProblem({ status: 404, title: "Not Found" }));
          return;
        }
        enforceIfMatch(req, existing);
        const record = await model.update({
          where: { id: req.params.id },
          data: { [statusField]: "deprecated" },
        });
        withEtag(res, record);
        res.json({ data: record });
      } catch (error) {
        sendProblem(res, mapError(error, req));
      }
    },
  };
}

export const opportunityHandlers = buildNodeHandlers({
  model: prisma.opportunity,
  createSchema: opportunityCreateSchema,
  updateSchema: opportunityUpdateSchema,
  searchFields: ["description", "segment", "status"],
});

export const solutionHandlers = buildNodeHandlers({
  model: prisma.solution,
  createSchema: solutionCreateSchema,
  updateSchema: solutionUpdateSchema,
  searchFields: ["title", "description", "status"],
});

export const assumptionHandlers = buildNodeHandlers({
  model: prisma.assumption,
  createSchema: assumptionCreateSchema,
  updateSchema: assumptionUpdateSchema,
  searchFields: ["statement", "status"],
});

export async function createOutcomeOpportunity(req, res) {
  try {
    const payload = outcomeOpportunityCreateSchema.parse(req.body);
    const edge = await prisma.outcomeOpportunity.create({ data: payload });
    res.status(201).json({ data: edge });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function deleteOutcomeOpportunity(req, res) {
  try {
    await prisma.outcomeOpportunity.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function createOpportunitySolution(req, res) {
  try {
    const payload = opportunitySolutionCreateSchema.parse(req.body);
    const edge = await prisma.opportunitySolution.create({ data: payload });
    res.status(201).json({ data: edge });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function deleteOpportunitySolution(req, res) {
  try {
    await prisma.opportunitySolution.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function batchCreateOpportunitySolution(req, res) {
  try {
    const { items } = opportunitySolutionBatchSchema.parse(req.body);
    const duplicates = new Set();
    items.forEach(({ opportunityId, solutionId }) => {
      const key = `${opportunityId}:${solutionId}`;
      if (duplicates.has(key)) {
        throw formatProblem({
          status: 409,
          title: "Conflict",
          detail: "Duplicate pair in payload",
          meta: { opportunityId, solutionId },
        });
      }
      duplicates.add(key);
    });

    const existing = await prisma.opportunitySolution.findMany({
      where: {
        OR: items.map((item) => ({
          opportunityId: item.opportunityId,
          solutionId: item.solutionId,
        })),
      },
      select: {
        opportunityId: true,
        solutionId: true,
      },
    });

    if (existing.length > 0) {
      throw formatProblem({
        status: 409,
        title: "Conflict",
        detail: "One or more pairs already exist",
        meta: {
          duplicates: existing.map((edge) => ({
            opportunityId: edge.opportunityId,
            solutionId: edge.solutionId,
          })),
        },
      });
    }

    const created = await prisma.$transaction(
      items.map((item) =>
        prisma.opportunitySolution.create({
          data: {
            opportunityId: item.opportunityId,
            solutionId: item.solutionId,
            confidence: item.confidence,
            notes: item.notes,
          },
        }),
      ),
    );

    res.status(201).json({ data: created });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function createSolutionAssumption(req, res) {
  try {
    const payload = solutionAssumptionCreateSchema.parse(req.body);
    const edge = await prisma.solutionAssumption.create({ data: payload });
    res.status(201).json({ data: edge });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function deleteSolutionAssumption(req, res) {
  try {
    await prisma.solutionAssumption.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function createHypothesis(req, res) {
  try {
    const payload = hypothesisCreateSchema.parse(req.body);
    if (!validateTargetAlignment(payload.targetType, payload)) {
      throw formatProblem({
        status: 422,
        title: "Unprocessable Entity",
        detail: "targetType does not match provided target id",
      });
    }
    const hypothesis = await prisma.hypothesis.create({ data: payload });
    withEtag(res, hypothesis);
    res.status(201).json({ data: hypothesis });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function updateHypothesis(req, res) {
  try {
    const payload = hypothesisUpdateSchema.parse(req.body);
    const existing = await prisma.hypothesis.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      sendProblem(res, formatProblem({ status: 404, title: "Not Found" }));
      return;
    }
    enforceIfMatch(req, existing);
    const merged = { ...existing, ...payload };
    const targetType = payload.targetType ?? existing.targetType;
    if (!validateTargetAlignment(targetType, merged)) {
      throw formatProblem({
        status: 422,
        title: "Unprocessable Entity",
        detail: "targetType does not match provided target id",
      });
    }
    const hypothesis = await prisma.hypothesis.update({
      where: { id: req.params.id },
      data: payload,
    });
    withEtag(res, hypothesis);
    res.json({ data: hypothesis });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function deleteHypothesis(req, res) {
  try {
    await prisma.hypothesis.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function createExperiment(req, res) {
  try {
    const payload = experimentCreateSchema.parse(req.body);
    const experiment = await prisma.experiment.create({ data: payload });
    withEtag(res, experiment);
    res.status(201).json({ data: experiment });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function updateExperiment(req, res) {
  try {
    const payload = experimentUpdateSchema.parse(req.body);
    const existing = await prisma.experiment.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      sendProblem(res, formatProblem({ status: 404, title: "Not Found" }));
      return;
    }
    enforceIfMatch(req, existing);
    const experiment = await prisma.experiment.update({ where: { id: req.params.id }, data: payload });
    withEtag(res, experiment);
    res.json({ data: experiment });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function deleteExperiment(req, res) {
  try {
    await prisma.experiment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function createInsight(req, res) {
  try {
    const parsed = insightCreateSchema.parse(req.body);
    const payload = normalizeInsightPayload(parsed, { ensureDefaults: true });
    if (!validateTargetAlignment(payload.relationshipType, payload)) {
      throw formatProblem({
        status: 422,
        title: "Unprocessable Entity",
        detail: "relationshipType does not match provided target id",
      });
    }
    const insight = await prisma.insight.create({ data: payload });
    withEtag(res, insight);
    res.status(201).json({ data: insight });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function updateInsight(req, res) {
  try {
    const payload = insightUpdateSchema.parse(req.body);
    const existing = await prisma.insight.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      sendProblem(res, formatProblem({ status: 404, title: "Not Found" }));
      return;
    }
    enforceIfMatch(req, existing);
    const merged = { ...existing, ...payload };
    const relationshipType = payload.relationshipType ?? existing.relationshipType;
    if (!validateTargetAlignment(relationshipType, merged)) {
      throw formatProblem({
        status: 422,
        title: "Unprocessable Entity",
        detail: "relationshipType does not match provided target id",
      });
    }
    const updatePayload = normalizeInsightPayload(payload);
    const insight = await prisma.insight.update({
      where: { id: req.params.id },
      data: updatePayload,
    });
    withEtag(res, insight);
    res.json({ data: insight });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function deleteInsight(req, res) {
  try {
    await prisma.insight.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function listHypotheses(req, res) {
  try {
    const { cursor, take, q, from, to } = parseFilterQuery(req);
    const where = {};
    appendAndFilter(where, buildSearchFilter(["statement"], q));
    applyDateFilter(where, from, to);

    const { targetType, assumptionId, outcomeId, opportunityId, solutionId } = req.query;
    if (targetType) where.targetType = RelationshipTypeEnum.parse(targetType);
    if (assumptionId) where.assumptionId = assumptionId;
    if (outcomeId) where.outcomeId = outcomeId;
    if (opportunityId) where.opportunityId = opportunityId;
    if (solutionId) where.solutionId = solutionId;

    const result = await paginateQuery({
      model: prisma.hypothesis,
      cursor,
      take: take ?? 25,
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: result.data, meta: result.meta });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function getHypothesis(req, res) {
  try {
    const hypothesis = await prisma.hypothesis.findUnique({ where: { id: req.params.id } });
    if (!hypothesis) {
      sendProblem(res, formatProblem({ status: 404, title: "Not Found" }));
      return;
    }
    withEtag(res, hypothesis);
    res.json({ data: hypothesis });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function listExperiments(req, res) {
  try {
    const { cursor, take, q, from, to, status } = parseFilterQuery(req);
    const where = {};
    appendAndFilter(where, buildSearchFilter(["name", "method", "resultSummary"], q));
    applyDateFilter(where, from, to);
    if (status) where.status = ExperimentStatusEnum.parse(status);
    if (req.query.hypothesisId) where.hypothesisId = req.query.hypothesisId;

    const result = await paginateQuery({
      model: prisma.experiment,
      cursor,
      take: take ?? 25,
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: result.data, meta: result.meta });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function getExperiment(req, res) {
  try {
    const experiment = await prisma.experiment.findUnique({ where: { id: req.params.id } });
    if (!experiment) {
      sendProblem(res, formatProblem({ status: 404, title: "Not Found" }));
      return;
    }
    withEtag(res, experiment);
    res.json({ data: experiment });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function listInsights(req, res) {
  try {
    const { cursor, take, q, from, to, status } = parseFilterQuery(req);
    const where = {};
    if (status) where.validationState = ValidationStateEnum.parse(status);
    appendAndFilter(where, buildSearchFilter(["statement", "evidenceSummary"], q));
    applyDateFilter(where, from, to);

    const { relationshipType, confidenceLevel, lifecycleStage, privacyLevel, experimentId } = req.query;
    if (relationshipType) where.relationshipType = RelationshipTypeEnum.parse(relationshipType);
    if (confidenceLevel) where.confidenceLevel = ConfidenceLevelEnum.parse(confidenceLevel);
    if (lifecycleStage) where.lifecycleStage = LifecycleStageEnum.parse(lifecycleStage);
    if (privacyLevel) where.privacyLevel = PrivacyLevelEnum.parse(privacyLevel);
    if (experimentId) where.experimentId = experimentId;

    const result = await paginateQuery({
      model: prisma.insight,
      cursor,
      take: take ?? 25,
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: result.data, meta: result.meta });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export async function getInsight(req, res) {
  try {
    const insight = await prisma.insight.findUnique({ where: { id: req.params.id } });
    if (!insight) {
      sendProblem(res, formatProblem({ status: 404, title: "Not Found" }));
      return;
    }
    withEtag(res, insight);
    res.json({ data: insight });
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

function shouldIncludeStatus(status, includeDeprecated) {
  if (includeDeprecated) return true;
  if (!status) return true;
  return status !== "deprecated";
}

function formatOutcomeTree(outcomes, includeDeprecated) {
  const totals = {
    outcomes: 0,
    opportunities: 0,
    solutions: 0,
    assumptions: 0,
  };

  const data = outcomes.map((outcome) => {
    totals.outcomes += 1;
    return {
      id: outcome.id,
      name: outcome.name,
      status: outcome.status,
      opportunities: outcome.outcomeOpportunities
        .filter((edge) => shouldIncludeStatus(edge.opportunity.status, includeDeprecated))
        .map((edge) => {
          totals.opportunities += 1;
          const opportunity = edge.opportunity;
          return {
            edgeId: edge.id,
            confidence: edge.confidence,
            opportunity: {
              id: opportunity.id,
              description: opportunity.description,
              status: opportunity.status,
            },
            solutions: opportunity.opportunitySolutions
              .filter((osEdge) => shouldIncludeStatus(osEdge.solution.status, includeDeprecated))
              .map((osEdge) => {
                totals.solutions += 1;
                const solution = osEdge.solution;
                return {
                  edgeId: osEdge.id,
                  confidence: osEdge.confidence,
                  solution: {
                    id: solution.id,
                    title: solution.title,
                    status: solution.status,
                  },
                  assumptions: solution.solutionAssumptions
                    .filter((saEdge) => shouldIncludeStatus(saEdge.assumption.status, includeDeprecated))
                    .map((saEdge) => {
                      totals.assumptions += 1;
                      const assumption = saEdge.assumption;
                      return {
                        edgeId: saEdge.id,
                        confidence: saEdge.confidence,
                        assumption: {
                          id: assumption.id,
                          statement: assumption.statement,
                          status: assumption.status,
                        },
                      };
                    }),
                };
              }),
          };
        }),
    };
  });

  return { data, meta: { totals } };
}

export async function getOutcomeSolutionTree(req, res) {
  try {
    const includeDeprecated = req.query.includeDeprecated === "true";
    const where = includeDeprecated
      ? {}
      : {
          OR: [{ status: { not: "deprecated" } }, { status: null }],
        };

    const outcomes = await prisma.outcome.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        outcomeOpportunities: {
          include: {
            opportunity: {
              include: {
                opportunitySolutions: {
                  include: {
                    solution: {
                      include: {
                        solutionAssumptions: {
                          include: { assumption: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const tree = formatOutcomeTree(outcomes, includeDeprecated);
    res.json(tree);
  } catch (error) {
    sendProblem(res, mapError(error, req));
  }
}

export const listOpportunities = opportunityHandlers.list;
export const createOpportunity = opportunityHandlers.create;
export const getOpportunityById = opportunityHandlers.getById;
export const updateOpportunityById = opportunityHandlers.update;
export const deleteOpportunityById = opportunityHandlers.softDelete;

export const listSolutions = solutionHandlers.list;
export const createSolution = solutionHandlers.create;
export const getSolutionById = solutionHandlers.getById;
export const updateSolutionById = solutionHandlers.update;
export const deleteSolutionById = solutionHandlers.softDelete;

export const listAssumptions = assumptionHandlers.list;
export const createAssumption = assumptionHandlers.create;
export const getAssumptionById = assumptionHandlers.getById;
export const updateAssumptionById = assumptionHandlers.update;
export const deleteAssumptionById = assumptionHandlers.softDelete;

export const listHypothesis = listHypotheses;
export const listExperiment = listExperiments;
export const listInsight = listInsights;
