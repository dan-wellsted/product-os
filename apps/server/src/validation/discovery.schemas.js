import { z } from "zod";

export const ConfidenceLevelEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const AssumptionCategoryEnum = z.enum(["DESIRABILITY", "VIABILITY", "FEASIBILITY", "USABILITY"]);
export const ValidationStateEnum = z.enum(["SUPPORTS", "WEAKENS", "FALSIFIES", "INCONCLUSIVE"]);
export const LifecycleStageEnum = z.enum([
  "DISCOVERED",
  "TRIANGULATED",
  "VALIDATED",
  "INSTITUTIONALIZED",
  "OBSOLETE",
]);
export const PrivacyLevelEnum = z.enum(["PUBLIC", "INTERNAL", "RESTRICTED"]);
export const ExperimentStatusEnum = z.enum(["PLANNED", "RUNNING", "COMPLETE", "ARCHIVED"]);
export const RelationshipTypeEnum = z.enum([
  "OUTCOME_OPPORTUNITY",
  "OPPORTUNITY_SOLUTION",
  "SOLUTION_ASSUMPTION",
  "NODE",
]);

const isoDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().datetime())
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

export const paginationQuerySchema = z
  .object({
    cursor: z.string().optional(),
    take: z
      .string()
      .regex(/^[0-9]+$/)
      .transform((val) => Number.parseInt(val, 10))
      .pipe(z.number().int().positive().max(100))
      .optional(),
    q: z.string().min(1).optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    createdById: z.string().optional(),
    status: z.string().optional(),
    includeDeprecated: z
      .string()
      .transform((val) => val === "true")
      .optional(),
  })
  .strict();

export const outcomeCreateSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    metricName: z.string().optional(),
    metricBaseline: z.number().optional(),
    metricTarget: z.number().optional(),
    ownerId: z.string().optional(),
  })
  .strict();

export const outcomeUpdateSchema = outcomeCreateSchema.partial();

export const opportunityCreateSchema = z
  .object({
    description: z.string().min(1),
    segment: z.string().optional(),
    severity: z.string().optional(),
    status: z.string().optional(),
  })
  .strict();

export const opportunityUpdateSchema = opportunityCreateSchema.partial();

export const solutionCreateSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.string().optional(),
  })
  .strict();

export const solutionUpdateSchema = solutionCreateSchema.partial();

export const assumptionCreateSchema = z
  .object({
    statement: z.string().min(1),
    category: AssumptionCategoryEnum,
    riskLevel: ConfidenceLevelEnum.optional(),
    status: z.string().optional(),
  })
  .strict();

export const assumptionUpdateSchema = assumptionCreateSchema.partial();

const edgeBase = z
  .object({
    confidence: z.number().min(0).max(1).optional(),
    notes: z.string().optional(),
  })
  .strict();

export const outcomeOpportunityCreateSchema = edgeBase.extend({
  outcomeId: z.string().min(1),
  opportunityId: z.string().min(1),
});

export const opportunitySolutionCreateSchema = edgeBase.extend({
  opportunityId: z.string().min(1),
  solutionId: z.string().min(1),
});

export const solutionAssumptionCreateSchema = edgeBase.extend({
  solutionId: z.string().min(1),
  assumptionId: z.string().min(1),
});

export const opportunitySolutionBatchSchema = z
  .object({
    items: z
      .array(
        edgeBase.extend({
          opportunityId: z.string().min(1),
          solutionId: z.string().min(1),
        }),
      )
      .min(1)
      .max(100),
  })
  .strict();

const hypothesisTargets = [
  "assumptionId",
  "outcomeOpportunityId",
  "opportunitySolutionId",
  "solutionAssumptionId",
  "outcomeId",
  "opportunityId",
  "solutionId",
];

const hypothesisBase = z
  .object({
    statement: z.string().min(1),
    targetType: RelationshipTypeEnum,
    assumptionId: z.string().optional(),
    outcomeOpportunityId: z.string().optional(),
    opportunitySolutionId: z.string().optional(),
    solutionAssumptionId: z.string().optional(),
    outcomeId: z.string().optional(),
    opportunityId: z.string().optional(),
    solutionId: z.string().optional(),
    createdById: z.string().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const provided = hypothesisTargets.filter((key) => data[key]);
    if (provided.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Exactly one target reference must be provided",
        path: ["target"],
      });
    }
  });

export const hypothesisCreateSchema = hypothesisBase;
export const hypothesisUpdateSchema = z
  .object({
    statement: z.string().min(1).optional(),
    targetType: RelationshipTypeEnum.optional(),
    assumptionId: z.string().optional(),
    outcomeOpportunityId: z.string().optional(),
    opportunitySolutionId: z.string().optional(),
    solutionAssumptionId: z.string().optional(),
    outcomeId: z.string().optional(),
    opportunityId: z.string().optional(),
    solutionId: z.string().optional(),
    createdById: z.string().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const provided = hypothesisTargets.filter((key) => data[key]);
    if (provided.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only one target reference can be updated at a time",
        path: ["target"],
      });
    }

    if (provided.length === 1 && !data.targetType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "targetType must be provided when updating a target reference",
        path: ["targetType"],
      });
    }

    if (provided.length === 0 && data.targetType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "targetType requires a matching target reference",
        path: ["targetType"],
      });
    }
  });

export const experimentCreateSchema = z
  .object({
    hypothesisId: z.string().min(1),
    name: z.string().min(1),
    method: z.string().optional(),
    status: ExperimentStatusEnum.optional(),
    startAt: isoDate.optional(),
    endAt: isoDate.optional(),
    resultSummary: z.string().optional(),
  })
  .strict();

export const experimentUpdateSchema = experimentCreateSchema.partial();

const insightTargets = [
  "outcomeOpportunityId",
  "opportunitySolutionId",
  "solutionAssumptionId",
  "outcomeId",
  "opportunityId",
  "solutionId",
  "assumptionId",
];

const insightCreateBase = z
  .object({
    experimentId: z.string().min(1),
    relationshipType: RelationshipTypeEnum,
    outcomeOpportunityId: z.string().optional(),
    opportunitySolutionId: z.string().optional(),
    solutionAssumptionId: z.string().optional(),
    outcomeId: z.string().optional(),
    opportunityId: z.string().optional(),
    solutionId: z.string().optional(),
    assumptionId: z.string().optional(),
    validationState: ValidationStateEnum,
    confidenceLevel: ConfidenceLevelEnum.optional(),
    statement: z.string().min(1).max(600),
    evidenceSummary: z.string().min(1).max(2000),
    sourceTypes: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    lifecycleStage: LifecycleStageEnum.optional(),
    privacyLevel: PrivacyLevelEnum.optional(),
    discoveredOn: isoDate.optional(),
    validUntil: isoDate.optional(),
    dedupeHash: z.string().optional(),
    createdById: z.string().optional(),
    reviewedById: z.string().optional(),
  })
  .strict();

export const insightCreateSchema = insightCreateBase
  .superRefine((data, ctx) => {
    const provided = insightTargets.filter((key) => data[key]);
    if (provided.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Exactly one target reference must be provided",
        path: ["target"],
      });
    }
  })
  .transform((data) => ({
    ...data,
    sourceTypes: data.sourceTypes ?? [],
    tags: data.tags ?? [],
  }));

export const insightUpdateSchema = z
  .object({
    experimentId: z.string().min(1).optional(),
    relationshipType: RelationshipTypeEnum.optional(),
    outcomeOpportunityId: z.string().optional(),
    opportunitySolutionId: z.string().optional(),
    solutionAssumptionId: z.string().optional(),
    outcomeId: z.string().optional(),
    opportunityId: z.string().optional(),
    solutionId: z.string().optional(),
    assumptionId: z.string().optional(),
    validationState: ValidationStateEnum.optional(),
    confidenceLevel: ConfidenceLevelEnum.optional(),
    statement: z.string().min(1).max(600).optional(),
    evidenceSummary: z.string().min(1).max(2000).optional(),
    sourceTypes: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    lifecycleStage: LifecycleStageEnum.optional(),
    privacyLevel: PrivacyLevelEnum.optional(),
    discoveredOn: isoDate.optional(),
    validUntil: isoDate.optional(),
    dedupeHash: z.string().optional(),
    createdById: z.string().optional(),
    reviewedById: z.string().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const provided = insightTargets.filter((key) => data[key]);
    if (provided.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only one target reference can be updated at a time",
        path: ["target"],
      });
    }

    if (provided.length === 1 && !data.relationshipType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "relationshipType must be provided when updating a target reference",
        path: ["relationshipType"],
      });
    }

    if (provided.length === 0 && data.relationshipType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "relationshipType requires a matching target reference",
        path: ["relationshipType"],
      });
    }
  });
