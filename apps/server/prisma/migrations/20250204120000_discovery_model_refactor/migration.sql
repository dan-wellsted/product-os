-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop legacy tables if they exist
DROP TABLE IF EXISTS "Insight" CASCADE;
DROP TABLE IF EXISTS "Experiment" CASCADE;
DROP TABLE IF EXISTS "Hypothesis" CASCADE;
DROP TABLE IF EXISTS "SolutionAssumption" CASCADE;
DROP TABLE IF EXISTS "OpportunitySolution" CASCADE;
DROP TABLE IF EXISTS "OutcomeOpportunity" CASCADE;
DROP TABLE IF EXISTS "Assumption" CASCADE;
DROP TABLE IF EXISTS "Solution" CASCADE;
DROP TABLE IF EXISTS "Opportunity" CASCADE;
DROP TABLE IF EXISTS "Outcome" CASCADE;

-- Drop legacy enums if they exist
DROP TYPE IF EXISTS "Confidence" CASCADE;
DROP TYPE IF EXISTS "ExperimentStatus" CASCADE;
DROP TYPE IF EXISTS "RelationshipType" CASCADE;
DROP TYPE IF EXISTS "ValidationState" CASCADE;
DROP TYPE IF EXISTS "LifecycleStage" CASCADE;
DROP TYPE IF EXISTS "PrivacyLevel" CASCADE;
DROP TYPE IF EXISTS "ConfidenceLevel" CASCADE;
DROP TYPE IF EXISTS "AssumptionCategory" CASCADE;
-- Create enums
CREATE TYPE "ConfidenceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "AssumptionCategory" AS ENUM ('DESIRABILITY', 'VIABILITY', 'FEASIBILITY', 'USABILITY');
CREATE TYPE "ValidationState" AS ENUM ('SUPPORTS', 'WEAKENS', 'FALSIFIES', 'INCONCLUSIVE');
CREATE TYPE "LifecycleStage" AS ENUM ('DISCOVERED', 'TRIANGULATED', 'VALIDATED', 'INSTITUTIONALIZED', 'OBSOLETE');
CREATE TYPE "PrivacyLevel" AS ENUM ('PUBLIC', 'INTERNAL', 'RESTRICTED');
CREATE TYPE "ExperimentStatus" AS ENUM ('PLANNED', 'RUNNING', 'COMPLETE', 'ARCHIVED');
CREATE TYPE "RelationshipType" AS ENUM ('OUTCOME_OPPORTUNITY', 'OPPORTUNITY_SOLUTION', 'SOLUTION_ASSUMPTION', 'NODE');

-- Core nodes
CREATE TABLE "Outcome" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "metricName" TEXT,
  "metricBaseline" DOUBLE PRECISION,
  "metricTarget" DOUBLE PRECISION,
  "ownerId" TEXT,
  "status" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Outcome_ownerId_idx" ON "Outcome" ("ownerId");

CREATE TABLE "Opportunity" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "description" TEXT NOT NULL,
  "segment" TEXT,
  "severity" TEXT,
  "status" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Solution" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Assumption" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "statement" TEXT NOT NULL,
  "category" "AssumptionCategory" NOT NULL,
  "riskLevel" "ConfidenceLevel",
  "status" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Edge tables
CREATE TABLE "OutcomeOpportunity" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "outcomeId" UUID NOT NULL,
  "opportunityId" UUID NOT NULL,
  "confidence" DOUBLE PRECISION,
  "notes" TEXT,
  CONSTRAINT "OutcomeOpportunity_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OutcomeOpportunity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "OutcomeOpportunity_outcomeId_opportunityId_key" ON "OutcomeOpportunity" ("outcomeId", "opportunityId");
CREATE INDEX "OutcomeOpportunity_opportunityId_idx" ON "OutcomeOpportunity" ("opportunityId");

CREATE TABLE "OpportunitySolution" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "opportunityId" UUID NOT NULL,
  "solutionId" UUID NOT NULL,
  "confidence" DOUBLE PRECISION,
  "notes" TEXT,
  CONSTRAINT "OpportunitySolution_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OpportunitySolution_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "OpportunitySolution_opportunityId_solutionId_key" ON "OpportunitySolution" ("opportunityId", "solutionId");
CREATE INDEX "OpportunitySolution_solutionId_idx" ON "OpportunitySolution" ("solutionId");

CREATE TABLE "SolutionAssumption" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "solutionId" UUID NOT NULL,
  "assumptionId" UUID NOT NULL,
  "confidence" DOUBLE PRECISION,
  "notes" TEXT,
  CONSTRAINT "SolutionAssumption_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SolutionAssumption_assumptionId_fkey" FOREIGN KEY ("assumptionId") REFERENCES "Assumption"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SolutionAssumption_solutionId_assumptionId_key" ON "SolutionAssumption" ("solutionId", "assumptionId");
CREATE INDEX "SolutionAssumption_assumptionId_idx" ON "SolutionAssumption" ("assumptionId");

-- Hypotheses & experiments
CREATE TABLE "Hypothesis" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "assumptionId" UUID,
  "outcomeOpportunityId" UUID,
  "opportunitySolutionId" UUID,
  "solutionAssumptionId" UUID,
  "outcomeId" UUID,
  "opportunityId" UUID,
  "solutionId" UUID,
  "statement" TEXT NOT NULL,
  "targetType" "RelationshipType" NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Hypothesis_assumptionId_fkey" FOREIGN KEY ("assumptionId") REFERENCES "Assumption"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Hypothesis_outcomeOpportunityId_fkey" FOREIGN KEY ("outcomeOpportunityId") REFERENCES "OutcomeOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Hypothesis_opportunitySolutionId_fkey" FOREIGN KEY ("opportunitySolutionId") REFERENCES "OpportunitySolution"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Hypothesis_solutionAssumptionId_fkey" FOREIGN KEY ("solutionAssumptionId") REFERENCES "SolutionAssumption"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Hypothesis_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Hypothesis_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Hypothesis_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Hypothesis_assumptionId_idx" ON "Hypothesis" ("assumptionId");
CREATE INDEX "Hypothesis_outcomeOpportunityId_idx" ON "Hypothesis" ("outcomeOpportunityId");
CREATE INDEX "Hypothesis_opportunitySolutionId_idx" ON "Hypothesis" ("opportunitySolutionId");
CREATE INDEX "Hypothesis_solutionAssumptionId_idx" ON "Hypothesis" ("solutionAssumptionId");
CREATE INDEX "Hypothesis_outcomeId_idx" ON "Hypothesis" ("outcomeId");
CREATE INDEX "Hypothesis_opportunityId_idx" ON "Hypothesis" ("opportunityId");
CREATE INDEX "Hypothesis_solutionId_idx" ON "Hypothesis" ("solutionId");

CREATE TABLE "Experiment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "hypothesisId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "method" TEXT,
  "status" "ExperimentStatus" NOT NULL DEFAULT 'PLANNED',
  "startAt" TIMESTAMPTZ,
  "endAt" TIMESTAMPTZ,
  "resultSummary" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Experiment_hypothesisId_fkey" FOREIGN KEY ("hypothesisId") REFERENCES "Hypothesis"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Experiment_hypothesisId_idx" ON "Experiment" ("hypothesisId");

-- Insights
CREATE TABLE "Insight" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "experimentId" UUID NOT NULL,
  "relationshipType" "RelationshipType" NOT NULL,
  "outcomeOpportunityId" UUID,
  "opportunitySolutionId" UUID,
  "solutionAssumptionId" UUID,
  "outcomeId" UUID,
  "opportunityId" UUID,
  "solutionId" UUID,
  "assumptionId" UUID,
  "validationState" "ValidationState" NOT NULL,
  "confidenceLevel" "ConfidenceLevel" NOT NULL DEFAULT 'MEDIUM',
  "statement" TEXT NOT NULL,
  "evidenceSummary" TEXT NOT NULL,
  "sourceTypes" TEXT[] NOT NULL,
  "tags" TEXT[] NOT NULL,
  "lifecycleStage" "LifecycleStage" NOT NULL DEFAULT 'DISCOVERED',
  "privacyLevel" "PrivacyLevel" NOT NULL DEFAULT 'INTERNAL',
  "discoveredOn" TIMESTAMPTZ,
  "validUntil" TIMESTAMPTZ,
  "dedupeHash" TEXT,
  "createdById" TEXT,
  "reviewedById" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Insight_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Insight_outcomeOpportunityId_fkey" FOREIGN KEY ("outcomeOpportunityId") REFERENCES "OutcomeOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Insight_opportunitySolutionId_fkey" FOREIGN KEY ("opportunitySolutionId") REFERENCES "OpportunitySolution"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Insight_solutionAssumptionId_fkey" FOREIGN KEY ("solutionAssumptionId") REFERENCES "SolutionAssumption"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Insight_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Insight_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Insight_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Insight_assumptionId_fkey" FOREIGN KEY ("assumptionId") REFERENCES "Assumption"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Insight_dedupeHash_key" ON "Insight" ("dedupeHash");
CREATE INDEX "Insight_experimentId_idx" ON "Insight" ("experimentId");
CREATE INDEX "Insight_outcomeOpportunityId_idx" ON "Insight" ("outcomeOpportunityId");
CREATE INDEX "Insight_opportunitySolutionId_idx" ON "Insight" ("opportunitySolutionId");
CREATE INDEX "Insight_solutionAssumptionId_idx" ON "Insight" ("solutionAssumptionId");
CREATE INDEX "Insight_outcomeId_idx" ON "Insight" ("outcomeId");
CREATE INDEX "Insight_opportunityId_idx" ON "Insight" ("opportunityId");
CREATE INDEX "Insight_solutionId_idx" ON "Insight" ("solutionId");
CREATE INDEX "Insight_assumptionId_idx" ON "Insight" ("assumptionId");
