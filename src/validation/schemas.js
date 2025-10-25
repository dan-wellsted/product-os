// src/validation/schemas.js
import { z } from "zod";

const id = z.string().min(1, "id is required");

// --- Projects ---
export const ProjectCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Project name required"),
    description: z.string().optional().nullable(),
    orgName: z.string().optional().nullable(),
  }),
});

// --- Insights ---
export const InsightAddSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    title: z.string().min(1, "Title required"),
    summary: z.string().optional().nullable(),
    impactScore: z.coerce.number().int().min(1).max(10).default(5),
    confidence: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  }),
});

export const InsightUpdateSchema = z.object({
  params: z.object({ id, insightId: id }),
  body: z.object({
    title: z.string().min(1, "Title required"),
    summary: z.string().optional().nullable(),
    impactScore: z.coerce.number().int().min(1).max(10),
    confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  }),
});

// --- Outcomes ---
export const OutcomeAddSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    title: z.string().min(1, "Title required"),
    description: z.string().optional().nullable(),
    targetValue: z
      .union([z.coerce.number(), z.literal("")])
      .optional()
      .nullable()
      .transform((v) => (v === "" ? null : v)),
    metricId: z
      .union([id, z.literal("")])
      .optional()
      .nullable()
      .transform((v) => (v === "" ? null : v)),
  }),
});

export const OutcomeUpdateSchema = z.object({
  params: z.object({ id, outcomeId: id }),
  body: z.object({
    title: z.string().min(1, "Title required"),
    description: z.string().optional().nullable(),
    targetValue: z
      .union([z.coerce.number(), z.literal("")])
      .optional()
      .nullable()
      .transform((v) => (v === "" ? null : v)),
    metricId: z
      .union([id, z.literal("")])
      .optional()
      .nullable()
      .transform((v) => (v === "" ? null : v)),
  }),
});

// --- Opportunities ---
export const OpportunityAddSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    title: z.string().min(1, "Title required"),
    problem: z.string().optional().nullable(),
    evidence: z.string().optional().nullable(),
    confidence: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    outcomeId: z
      .union([id, z.literal("")])
      .optional()
      .nullable()
      .transform((v) => (v === "" ? null : v)),
  }),
});

export const OpportunityUpdateSchema = z.object({
  params: z.object({ id, oppId: id }),
  body: z.object({
    title: z.string().min(1, "Title required"),
    problem: z.string().optional().nullable(),
    evidence: z.string().optional().nullable(),
    confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
    outcomeId: z
      .union([id, z.literal("")])
      .optional()
      .nullable()
      .transform((v) => (v === "" ? null : v)),
  }),
});

// --- Experiments ---
export const ExperimentAddSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    opportunityId: id,
    hypothesis: z.string().min(1, "hypothesis required"),
    method: z.string().optional().nullable(),
    status: z.enum(["PLANNED", "RUNNING", "COMPLETE"]).default("PLANNED"),
    result: z.string().optional().nullable(),
  }),
});

export const ExperimentUpdateSchema = z.object({
  params: z.object({ id, expId: id }),
  body: z.object({
    opportunityId: id,
    hypothesis: z.string().min(1, "hypothesis required"),
    method: z.string().optional().nullable(),
    status: z.enum(["PLANNED", "RUNNING", "COMPLETE"]),
    result: z.string().optional().nullable(),
  }),
});

// --- Metrics & Snapshots ---
export const MetricAddSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    name: z.string().min(1, "Metric name required"),
    unit: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
  }),
});

export const MetricUpdateSchema = z.object({
  params: z.object({ id, metricId: id }),
  body: z.object({
    name: z.string().min(1, "Metric name required"),
    unit: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
  }),
});

export const MetricSnapshotAddSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    metricId: id,
    value: z.coerce.number(),
    ts: z
      .union([
        z
          .string()
          .datetime({ offset: true })
          .or(z.string().datetime())
          .or(z.string()),
        z.date(),
      ])
      .optional(),
    note: z.string().optional().nullable(),
  }),
});

// --- Schedule toggles (simple) ---
export const EnableWeeklySchema = z.object({
  params: z.object({ id }),
  body: z.object({
    hour: z.coerce.number().min(0).max(23).default(9),
    minute: z.coerce.number().min(0).max(59).default(0),
  }),
});

export const EnableMonthlySchema = z.object({
  params: z.object({ id }),
  body: z.object({
    day: z.coerce.number().min(1).max(28).default(1),
    hour: z.coerce.number().min(0).max(23).default(9),
    minute: z.coerce.number().min(0).max(59).default(0),
  }),
});
