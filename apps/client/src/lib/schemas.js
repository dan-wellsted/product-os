import { z } from "zod";
import {
  ASSUMPTION_CATEGORIES,
  CONFIDENCE_LEVELS,
  EXPERIMENT_STATUSES,
  RELATIONSHIP_TYPES,
  VALIDATION_STATES,
  LIFECYCLE_STAGES,
  PRIVACY_LEVELS,
} from "./constants.js";

const nonEmpty = z.string().min(1, "Required");

export const outcomeFormSchema = z.object({
  name: nonEmpty,
  description: z.string().optional(),
  metricName: z.string().optional(),
  metricBaseline: z
    .union([z.string().refine((value) => value === "" || !Number.isNaN(Number(value)), "Must be numeric"), z.undefined()])
    .transform((value) => {
      if (value === undefined || value === "") return undefined;
      return Number(value);
    }),
  metricTarget: z
    .union([z.string().refine((value) => value === "" || !Number.isNaN(Number(value)), "Must be numeric"), z.undefined()])
    .transform((value) => {
      if (value === undefined || value === "") return undefined;
      return Number(value);
    }),
  ownerId: z.string().optional(),
  status: z.string().optional(),
});

export const opportunityFormSchema = z.object({
  description: nonEmpty,
  segment: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
});

export const solutionFormSchema = z.object({
  title: nonEmpty,
  description: z.string().optional(),
  status: z.string().optional(),
});

export const assumptionFormSchema = z.object({
  statement: nonEmpty,
  category: z.enum(ASSUMPTION_CATEGORIES),
  riskLevel: z.enum(CONFIDENCE_LEVELS).optional(),
  status: z.string().optional(),
});

export const edgeFormSchema = z.object({
  confidence: z
    .union([
      z
        .string()
        .refine((value) => value === "" || !Number.isNaN(Number(value)), "Must be numeric between 0 and 1")
        .transform((value) => {
          if (value === "" || value === undefined) return undefined;
          return Number(value);
        }),
      z.number().min(0).max(1),
      z.undefined(),
    ])
    .refine((value) => value === undefined || (typeof value === "number" && value >= 0 && value <= 1), {
      message: "Confidence must be between 0 and 1",
    }),
  notes: z.string().optional(),
});

export const outcomeOpportunitySchema = edgeFormSchema.extend({
  outcomeId: nonEmpty,
  opportunityId: nonEmpty,
});

export const opportunitySolutionSchema = edgeFormSchema.extend({
  opportunityId: nonEmpty,
  solutionId: nonEmpty,
});

export const solutionAssumptionSchema = edgeFormSchema.extend({
  solutionId: nonEmpty,
  assumptionId: nonEmpty,
});

export const batchOpportunitySolutionSchema = z.object({
  items: z
    .array(
      opportunitySolutionSchema.extend({
        id: z.string().optional(),
      }),
    )
    .min(1, "Add at least one pair"),
});

const hypothesisBase = z.object({
  statement: nonEmpty,
  targetType: z.enum(RELATIONSHIP_TYPES),
  assumptionId: z.string().optional(),
  outcomeOpportunityId: z.string().optional(),
  opportunitySolutionId: z.string().optional(),
  solutionAssumptionId: z.string().optional(),
  outcomeId: z.string().optional(),
  opportunityId: z.string().optional(),
  solutionId: z.string().optional(),
  createdById: z.string().optional(),
});

export const hypothesisCreateSchema = hypothesisBase.superRefine((data, ctx) => {
  const targetFields = [
    "assumptionId",
    "outcomeOpportunityId",
    "opportunitySolutionId",
    "solutionAssumptionId",
    "outcomeId",
    "opportunityId",
    "solutionId",
  ];
  const provided = targetFields.filter((field) => data[field]);
  if (provided.length !== 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select exactly one target", path: ["target"] });
  }
});

export const hypothesisUpdateSchema = hypothesisBase.partial().superRefine((data, ctx) => {
  const targetFields = [
    "assumptionId",
    "outcomeOpportunityId",
    "opportunitySolutionId",
    "solutionAssumptionId",
    "outcomeId",
    "opportunityId",
    "solutionId",
  ];
  const provided = targetFields.filter((field) => data[field]);
  if (provided.length > 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Only one target can be set", path: ["target"] });
  }
});

export const experimentFormSchema = z.object({
  hypothesisId: nonEmpty,
  name: nonEmpty,
  method: z.string().optional(),
  status: z.enum(EXPERIMENT_STATUSES).optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  resultSummary: z.string().optional(),
});

const insightTargetFields = [
  "outcomeOpportunityId",
  "opportunitySolutionId",
  "solutionAssumptionId",
  "outcomeId",
  "opportunityId",
  "solutionId",
  "assumptionId",
];

const insightBaseSchema = z.object({
  experimentId: nonEmpty,
  relationshipType: z.enum(RELATIONSHIP_TYPES),
  outcomeOpportunityId: z.string().optional(),
  opportunitySolutionId: z.string().optional(),
  solutionAssumptionId: z.string().optional(),
  outcomeId: z.string().optional(),
  opportunityId: z.string().optional(),
  solutionId: z.string().optional(),
  assumptionId: z.string().optional(),
  validationState: z.enum(VALIDATION_STATES),
  confidenceLevel: z.enum(CONFIDENCE_LEVELS).optional(),
  statement: nonEmpty.max(600, "Max 600 characters"),
  evidenceSummary: nonEmpty.max(2000, "Max 2000 characters"),
  sourceTypes: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  lifecycleStage: z.enum(LIFECYCLE_STAGES).optional(),
  privacyLevel: z.enum(PRIVACY_LEVELS).optional(),
  discoveredOn: z.string().optional(),
  validUntil: z.string().optional(),
  dedupeHash: z.string().optional(),
  createdById: z.string().optional(),
  reviewedById: z.string().optional(),
});

export const insightCreateSchema = insightBaseSchema.superRefine((data, ctx) => {
  const provided = insightTargetFields.filter((field) => data[field]);
  if (provided.length !== 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select exactly one target", path: ["target"] });
  }
});

export const insightUpdateSchema = insightBaseSchema
  .partial()
  .superRefine((data, ctx) => {
    const provided = insightTargetFields.filter((field) => data[field]);
    if (provided.length > 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Only one target can be updated", path: ["target"] });
    }
    if (provided.length === 1 && !data.relationshipType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "relationshipType must match the selected target",
        path: ["relationshipType"],
      });
    }
    if (provided.length === 0 && data.relationshipType !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a target for the selected relationship type",
        path: ["relationshipType"],
      });
    }
  });
