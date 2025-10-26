import { prisma } from "../db/prisma.js";
import { getProjectDiscoveryContext } from "../services/discovery.service.js";

export async function listProjects(_req, res, next) {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            outcomes: true,
            opportunities: true,
            experiments: true,
            insights: true,
          },
        },
      },
    });
    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        org: true,
        outcomes: {
          include: { metric: true },
          orderBy: { title: "asc" },
        },
        opportunities: {
          include: {
            experiments: { orderBy: { createdAt: "desc" } },
            insight: true,
          },
          orderBy: { createdAt: "desc" },
        },
        insights: { orderBy: { createdAt: "desc" } },
        metrics: {
          include: { snapshots: { orderBy: { ts: "desc" } } },
        },
      },
    });
    if (!project) return res.status(404).json({ error: "not_found" });
    res.json({ project });
  } catch (err) {
    next(err);
  }
}


export async function getProjectDiscovery(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await getProjectDiscoveryContext(projectId);
    if (!project) return res.status(404).json({ error: "not_found" });
    res.json({ project });
  } catch (err) {
    next(err);
  }
}
