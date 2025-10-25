// src/services/discovery.service.js

import { prisma } from "../db/prisma.js";

const TraceType = {
  OUTCOME: "OUTCOME",
  HYPOTHESIS: "HYPOTHESIS",
  ASSUMPTION: "ASSUMPTION",
  INTERVIEW: "INTERVIEW",
  INSIGHT: "INSIGHT",
  OPPORTUNITY: "OPPORTUNITY",
  SOLUTION: "SOLUTION",
  EXPERIMENT: "EXPERIMENT",
  EVIDENCE: "EVIDENCE",
};

export async function listProjectsWithDiscoveryCounts() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          hypotheses: true,
          assumptions: true,
          interviews: true,
          insights: true,
          opportunities: true,
          solutions: true,
          experiments: true,
          evidences: true,
        },
      },
    },
  });
  return projects;
}

export async function getProjectDiscoveryContext(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      outcomes: {
        orderBy: { title: "asc" },
        include: {
          hypotheses: {
            orderBy: { createdAt: "desc" },
            include: {
              assumptions: { orderBy: { createdAt: "desc" } },
            },
          },
        },
      },
      hypotheses: {
        orderBy: { createdAt: "desc" },
        include: { outcome: true, assumptions: true },
      },
      assumptions: {
        orderBy: { createdAt: "desc" },
        include: { hypothesis: true, opportunity: true, solutions: true },
      },
      interviews: {
        orderBy: { interviewAt: "desc" },
        include: { assumption: true, insights: true },
      },
      insights: {
        orderBy: { createdAt: "desc" },
        include: { interview: true },
      },
      opportunities: {
        orderBy: { createdAt: "desc" },
        include: {
          insight: { include: { interview: true } },
          experiments: {
            orderBy: { createdAt: "desc" },
            include: { evidences: true, solution: true },
          },
          solutions: {
            orderBy: { createdAt: "desc" },
            include: { assumption: true },
          },
          assumptions: true,
        },
      },
      solutions: {
        orderBy: { createdAt: "desc" },
        include: { opportunity: true, assumption: true, experiments: true },
      },
      experiments: {
        orderBy: { createdAt: "desc" },
        include: { opportunity: true, solution: true, evidences: true },
      },
      evidences: {
        orderBy: { createdAt: "desc" },
        include: {
          experiment: {
            select: {
              id: true,
              hypothesis: true,
              opportunity: { select: { id: true, title: true } },
            },
          },
        },
      },
      traces: { orderBy: { createdAt: "desc" } },
    },
  });
  return project;
}

export async function recordTrace({ projectId, fromType, fromId, toType, toId, context }) {
  if (!projectId || !fromId || !toId) return null;
  return prisma.discoveryTrace.create({
    data: {
      projectId,
      fromType,
      fromId,
      toType,
      toId,
      context: context || null,
    },
  });
}

export async function removeTracesForEntity(projectId, entityId) {
  if (!projectId || !entityId) return 0;
  const result = await prisma.discoveryTrace.deleteMany({
    where: {
      projectId,
      OR: [{ fromId: entityId }, { toId: entityId }],
    },
  });
  return result.count;
}

export { TraceType };
