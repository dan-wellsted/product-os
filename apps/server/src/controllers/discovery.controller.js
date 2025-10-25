import { prisma } from "../db/prisma.js";
import {
  getProjectDiscoveryContext,
  listProjectsWithDiscoveryCounts,
  recordTrace,
  removeTracesForEntity,
  TraceType,
} from "../services/discovery.service.js";

function normalizeConfidenceInput(value) {
  if (!value) return undefined;
  const upper = String(value).toUpperCase();
  return ["LOW", "MEDIUM", "HIGH"].includes(upper) ? upper : undefined;
}

function normalizeStatus(value, allowed) {
  if (!value) return undefined;
  const upper = String(value).toUpperCase();
  return allowed.includes(upper) ? upper : undefined;
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseDetails(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (_err) {
    return value;
  }
}

const EXPERIMENT_STATUS = ["PLANNED", "RUNNING", "SUCCEEDED", "FAILED"];

export async function dashboard(_req, res, next) {
  try {
    const projects = await listProjectsWithDiscoveryCounts();
    res.render("discovery/index", { title: "Discovery", projects });
  } catch (err) {
    next(err);
  }
}

export async function projectOverview(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await getProjectDiscoveryContext(projectId);
    if (!project)
      return res
        .status(404)
        .render("error", { title: "Not Found", status: 404, message: "Project not found", issues: [] });
    project.hypotheses ||= [];
    project.assumptions ||= [];
    project.interviews ||= [];
    project.insights ||= [];
    project.opportunities ||= [];
    project.solutions ||= [];
    project.experiments ||= [];
    project.evidences ||= [];
    project.traces ||= [];
    const outcomes = await prisma.outcome.findMany({ where: { projectId }, orderBy: { title: "asc" } });
    const opportunities = await prisma.opportunity.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } });
    res.render("discovery/project", {
      title: `${project.name} — Discovery`,
      project,
      outcomes,
      opportunities,
      hypotheses: project.hypotheses,
      assumptions: project.assumptions,
      interviews: project.interviews,
      insights: project.insights,
      solutions: project.solutions,
      experiments: project.experiments,
      evidences: project.evidences,
      traces: project.traces,
    });
  } catch (err) {
    next(err);
  }
}

export async function createHypothesis(req, res, next) {
  try {
    const { projectId } = req.params;
    const { outcomeId, title, statement, status } = req.body;
    const hypothesis = await prisma.hypothesis.create({
      data: {
        projectId,
        outcomeId,
        title,
        statement,
        status: status || "ACTIVE",
      },
    });
    await recordTrace({
      projectId,
      fromType: TraceType.OUTCOME,
      fromId: hypothesis.outcomeId,
      toType: TraceType.HYPOTHESIS,
      toId: hypothesis.id,
    });
    res.redirect(`/discovery/projects/${projectId}#hypotheses`);
  } catch (err) {
    next(err);
  }
}

export async function updateHypothesis(req, res, next) {
  try {
    const { projectId, hypothesisId } = req.params;
    const { title, statement, status } = req.body;
    await prisma.hypothesis.update({
      where: { id: hypothesisId },
      data: {
        title,
        statement,
        status: status || "ACTIVE",
      },
    });
    res.redirect(`/discovery/projects/${projectId}#hypotheses`);
  } catch (err) {
    next(err);
  }
}

export async function deleteHypothesis(req, res, next) {
  try {
    const { projectId, hypothesisId } = req.params;
    await removeTracesForEntity(projectId, hypothesisId);
    await prisma.hypothesis.delete({ where: { id: hypothesisId } });
    res.redirect(`/discovery/projects/${projectId}#hypotheses`);
  } catch (err) {
    next(err);
  }
}

export async function createAssumption(req, res, next) {
  try {
    const { projectId } = req.params;
    const { hypothesisId, opportunityId, title, statement, confidence, status } = req.body;
    const assumption = await prisma.assumption.create({
      data: {
        projectId,
        hypothesisId: hypothesisId || null,
        opportunityId: opportunityId || null,
        title,
        statement: statement || null,
        confidence: normalizeConfidenceInput(confidence) || "MEDIUM",
        status: status || "OPEN",
      },
    });
    if (assumption.hypothesisId) {
      await recordTrace({
        projectId,
        fromType: TraceType.HYPOTHESIS,
        fromId: assumption.hypothesisId,
        toType: TraceType.ASSUMPTION,
        toId: assumption.id,
      });
    }
    if (assumption.opportunityId) {
      await recordTrace({
        projectId,
        fromType: TraceType.OPPORTUNITY,
        fromId: assumption.opportunityId,
        toType: TraceType.ASSUMPTION,
        toId: assumption.id,
      });
    }
    res.redirect(`/discovery/projects/${projectId}#assumptions`);
  } catch (err) {
    next(err);
  }
}

export async function updateAssumption(req, res, next) {
  try {
    const { projectId, assumptionId } = req.params;
    const { title, statement, confidence, status } = req.body;
    await prisma.assumption.update({
      where: { id: assumptionId },
      data: {
        title,
        statement: statement || null,
        confidence: normalizeConfidenceInput(confidence) || "MEDIUM",
        status: status || "OPEN",
      },
    });
    res.redirect(`/discovery/projects/${projectId}#assumptions`);
  } catch (err) {
    next(err);
  }
}

export async function deleteAssumption(req, res, next) {
  try {
    const { projectId, assumptionId } = req.params;
    await removeTracesForEntity(projectId, assumptionId);
    await prisma.assumption.delete({ where: { id: assumptionId } });
    res.redirect(`/discovery/projects/${projectId}#assumptions`);
  } catch (err) {
    next(err);
  }
}

export async function createInterview(req, res, next) {
  try {
    const { projectId } = req.params;
    const { assumptionId, title, participant, interviewAt, notes } = req.body;
    const interview = await prisma.interview.create({
      data: {
        projectId,
        assumptionId: assumptionId || null,
        title,
        participant: participant || null,
        interviewAt: interviewAt ? new Date(interviewAt) : null,
        notes: notes || null,
      },
    });
    if (interview.assumptionId) {
      await recordTrace({
        projectId,
        fromType: TraceType.ASSUMPTION,
        fromId: interview.assumptionId,
        toType: TraceType.INTERVIEW,
        toId: interview.id,
      });
    }
    res.redirect(`/discovery/projects/${projectId}#interviews`);
  } catch (err) {
    next(err);
  }
}

export async function updateInterview(req, res, next) {
  try {
    const { projectId, interviewId } = req.params;
    const { title, participant, interviewAt, notes } = req.body;
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        title,
        participant: participant || null,
        interviewAt: interviewAt ? new Date(interviewAt) : null,
        notes: notes || null,
      },
    });
    res.redirect(`/discovery/projects/${projectId}#interviews`);
  } catch (err) {
    next(err);
  }
}

export async function deleteInterview(req, res, next) {
  try {
    const { projectId, interviewId } = req.params;
    await removeTracesForEntity(projectId, interviewId);
    await prisma.interview.delete({ where: { id: interviewId } });
    res.redirect(`/discovery/projects/${projectId}#interviews`);
  } catch (err) {
    next(err);
  }
}

export async function createInsight(req, res, next) {
  try {
    const { projectId } = req.params;
    const { interviewId, title, summary, source, impactScore, confidence } = req.body;
    const insight = await prisma.insight.create({
      data: {
        projectId,
        interviewId: interviewId || null,
        title,
        summary,
        source: source || null,
        impactScore: numberOrNull(impactScore) ?? 0,
        confidence: normalizeConfidenceInput(confidence) || "MEDIUM",
      },
    });
    if (insight.interviewId) {
      await recordTrace({
        projectId,
        fromType: TraceType.INTERVIEW,
        fromId: insight.interviewId,
        toType: TraceType.INSIGHT,
        toId: insight.id,
      });
    }
    res.redirect(`/discovery/projects/${projectId}#insights`);
  } catch (err) {
    next(err);
  }
}

export async function updateInsight(req, res, next) {
  try {
    const { projectId, insightId } = req.params;
    const { title, summary, source, impactScore, confidence } = req.body;
    await prisma.insight.update({
      where: { id: insightId },
      data: {
        title,
        summary,
        source: source || null,
        impactScore: numberOrNull(impactScore) ?? 0,
        confidence: normalizeConfidenceInput(confidence) || "MEDIUM",
      },
    });
    res.redirect(`/discovery/projects/${projectId}#insights`);
  } catch (err) {
    next(err);
  }
}

export async function deleteInsight(req, res, next) {
  try {
    const { projectId, insightId } = req.params;
    await removeTracesForEntity(projectId, insightId);
    await prisma.insight.delete({ where: { id: insightId } });
    res.redirect(`/discovery/projects/${projectId}#insights`);
  } catch (err) {
    next(err);
  }
}

export async function createOpportunity(req, res, next) {
  try {
    const { projectId } = req.params;
    const { outcomeId, insightId, title, problem, evidence, confidence } = req.body;
    const opportunity = await prisma.opportunity.create({
      data: {
        projectId,
        outcomeId: outcomeId || null,
        insightId: insightId || null,
        title,
        problem: problem || null,
        evidence: evidence || null,
        confidence: normalizeConfidenceInput(confidence) || "MEDIUM",
      },
    });
    if (opportunity.insightId) {
      await recordTrace({
        projectId,
        fromType: TraceType.INSIGHT,
        fromId: opportunity.insightId,
        toType: TraceType.OPPORTUNITY,
        toId: opportunity.id,
      });
    }
    if (opportunity.outcomeId) {
      await recordTrace({
        projectId,
        fromType: TraceType.OUTCOME,
        fromId: opportunity.outcomeId,
        toType: TraceType.OPPORTUNITY,
        toId: opportunity.id,
      });
    }
    res.redirect(`/discovery/projects/${projectId}#opportunities`);
  } catch (err) {
    next(err);
  }
}

export async function updateOpportunity(req, res, next) {
  try {
    const { projectId, opportunityId } = req.params;
    const { title, problem, evidence, confidence } = req.body;
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        title,
        problem: problem || null,
        evidence: evidence || null,
        confidence: normalizeConfidenceInput(confidence) || "MEDIUM",
      },
    });
    res.redirect(`/discovery/projects/${projectId}#opportunities`);
  } catch (err) {
    next(err);
  }
}

export async function deleteOpportunity(req, res, next) {
  try {
    const { projectId, opportunityId } = req.params;
    await removeTracesForEntity(projectId, opportunityId);
    await prisma.opportunity.delete({ where: { id: opportunityId } });
    res.redirect(`/discovery/projects/${projectId}#opportunities`);
  } catch (err) {
    next(err);
  }
}

export async function createSolution(req, res, next) {
  try {
    const { projectId } = req.params;
    const { opportunityId, assumptionId, title, description } = req.body;
    const solution = await prisma.solution.create({
      data: {
        projectId,
        opportunityId,
        assumptionId: assumptionId || null,
        title,
        description: description || null,
      },
    });
    await recordTrace({
      projectId,
      fromType: TraceType.OPPORTUNITY,
      fromId: solution.opportunityId,
      toType: TraceType.SOLUTION,
      toId: solution.id,
    });
    if (solution.assumptionId) {
      await recordTrace({
        projectId,
        fromType: TraceType.ASSUMPTION,
        fromId: solution.assumptionId,
        toType: TraceType.SOLUTION,
        toId: solution.id,
      });
    }
    res.redirect(`/discovery/projects/${projectId}#solutions`);
  } catch (err) {
    next(err);
  }
}

export async function updateSolution(req, res, next) {
  try {
    const { projectId, solutionId } = req.params;
    const { title, description } = req.body;
    await prisma.solution.update({
      where: { id: solutionId },
      data: {
        title,
        description: description || null,
      },
    });
    res.redirect(`/discovery/projects/${projectId}#solutions`);
  } catch (err) {
    next(err);
  }
}

export async function deleteSolution(req, res, next) {
  try {
    const { projectId, solutionId } = req.params;
    await removeTracesForEntity(projectId, solutionId);
    await prisma.solution.delete({ where: { id: solutionId } });
    res.redirect(`/discovery/projects/${projectId}#solutions`);
  } catch (err) {
    next(err);
  }
}

export async function createExperiment(req, res, next) {
  try {
    const { projectId } = req.params;
    const { opportunityId, solutionId, hypothesis, method, status, result } = req.body;
    const experiment = await prisma.experiment.create({
      data: {
        projectId,
        opportunityId,
        solutionId: solutionId || null,
        hypothesis,
        method: method || null,
        status: normalizeStatus(status, EXPERIMENT_STATUS) || "PLANNED",
        result: result || null,
      },
    });
    if (experiment.solutionId) {
      await recordTrace({
        projectId,
        fromType: TraceType.SOLUTION,
        fromId: experiment.solutionId,
        toType: TraceType.EXPERIMENT,
        toId: experiment.id,
      });
    } else {
      await recordTrace({
        projectId,
        fromType: TraceType.OPPORTUNITY,
        fromId: experiment.opportunityId,
        toType: TraceType.EXPERIMENT,
        toId: experiment.id,
      });
    }
    res.redirect(`/discovery/projects/${projectId}#experiments`);
  } catch (err) {
    next(err);
  }
}

export async function updateExperiment(req, res, next) {
  try {
    const { projectId, experimentId } = req.params;
    const { hypothesis, method, status, result } = req.body;
    await prisma.experiment.update({
      where: { id: experimentId },
      data: {
        hypothesis,
        method: method || null,
        status: normalizeStatus(status, EXPERIMENT_STATUS) || "PLANNED",
        result: result || null,
      },
    });
    res.redirect(`/discovery/projects/${projectId}#experiments`);
  } catch (err) {
    next(err);
  }
}

export async function deleteExperiment(req, res, next) {
  try {
    const { projectId, experimentId } = req.params;
    await removeTracesForEntity(projectId, experimentId);
    await prisma.experiment.delete({ where: { id: experimentId } });
    res.redirect(`/discovery/projects/${projectId}#experiments`);
  } catch (err) {
    next(err);
  }
}

export async function createEvidence(req, res, next) {
  try {
    const { projectId } = req.params;
    const { experimentId, type, summary, details } = req.body;
    const evidence = await prisma.evidence.create({
      data: {
        projectId,
        experimentId,
        type,
        summary,
        details: parseDetails(details),
      },
    });
    await recordTrace({
      projectId,
      fromType: TraceType.EXPERIMENT,
      fromId: evidence.experimentId,
      toType: TraceType.EVIDENCE,
      toId: evidence.id,
    });
    res.redirect(`/discovery/projects/${projectId}#evidence`);
  } catch (err) {
    next(err);
  }
}

export async function updateEvidence(req, res, next) {
  try {
    const { projectId, evidenceId } = req.params;
    const { type, summary, details } = req.body;
    await prisma.evidence.update({
      where: { id: evidenceId },
      data: {
        type,
        summary,
        details: parseDetails(details),
      },
    });
    res.redirect(`/discovery/projects/${projectId}#evidence`);
  } catch (err) {
    next(err);
  }
}

export async function deleteEvidence(req, res, next) {
  try {
    const { projectId, evidenceId } = req.params;
    await removeTracesForEntity(projectId, evidenceId);
    await prisma.evidence.delete({ where: { id: evidenceId } });
    res.redirect(`/discovery/projects/${projectId}#evidence`);
  } catch (err) {
    next(err);
  }
}

export async function createTrace(req, res, next) {
  try {
    const { projectId } = req.params;
    const { fromType, fromId, toType, toId, context } = req.body;
    await recordTrace({ projectId, fromType, fromId, toType, toId, context });
    res.redirect(`/discovery/projects/${projectId}#traces`);
  } catch (err) {
    next(err);
  }
}
