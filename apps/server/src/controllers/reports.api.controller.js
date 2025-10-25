import { prisma } from "../db/prisma.js";

export async function listReports(_req, res, next) {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json({ reports });
  } catch (err) {
    next(err);
  }
}

export async function getReport(req, res, next) {
  try {
    const { reportId } = req.params;
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) return res.status(404).json({ error: "not_found" });
    res.json({ report });
  } catch (err) {
    next(err);
  }
}
