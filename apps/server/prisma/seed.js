import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, RelationshipType, ValidationState, ConfidenceLevel, AssumptionCategory, LifecycleStage } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv({ path: path.resolve(__dirname, "../../../.env") });
loadEnv({ path: path.resolve(__dirname, ".env") });

const prisma = new PrismaClient();

async function main() {
  await prisma.insight.deleteMany();
  await prisma.experiment.deleteMany();
  await prisma.hypothesis.deleteMany();
  await prisma.solutionAssumption.deleteMany();
  await prisma.opportunitySolution.deleteMany();
  await prisma.outcomeOpportunity.deleteMany();
  await prisma.assumption.deleteMany();
  await prisma.solution.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.outcome.deleteMany();

  console.log("🌱 Seeding discovery data…");

  const outcomes = await prisma.$transaction([
    prisma.outcome.create({
      data: {
        name: "Increase activation",
        description: "Help new users reach core value faster",
        metricName: "Activation rate",
        metricBaseline: 0.35,
        metricTarget: 0.5,
      },
    }),
    prisma.outcome.create({
      data: {
        name: "Grow weekly retention",
        description: "Keep teams coming back every week",
        metricName: "Weekly active accounts",
        metricBaseline: 420,
        metricTarget: 600,
      },
    }),
  ]);

  const opportunities = await prisma.$transaction([
    prisma.opportunity.create({
      data: {
        description: "New accounts stall during onboarding",
        segment: "Self-serve SMB",
        severity: "HIGH",
        status: "open",
      },
    }),
    prisma.opportunity.create({
      data: {
        description: "Admins struggle to invite teammates",
        segment: "Mid-market",
        severity: "MEDIUM",
        status: "researching",
      },
    }),
    prisma.opportunity.create({
      data: {
        description: "Power users need richer insights",
        segment: "Enterprise",
        severity: "HIGH",
        status: "validated",
      },
    }),
  ]);

  const solutions = await prisma.$transaction([
    prisma.solution.create({
      data: {
        title: "Guided onboarding checklist",
        description: "Step-by-step walkthrough highlighting aha moments",
        status: "proposed",
      },
    }),
    prisma.solution.create({
      data: {
        title: "Team invite nudges",
        description: "In-product prompts + email reminders to add teammates",
        status: "testing",
      },
    }),
    prisma.solution.create({
      data: {
        title: "Executive insights dashboard",
        description: "Curated KPI snapshots for leadership",
        status: "discovery",
      },
    }),
  ]);

  const assumptions = await prisma.$transaction([
    prisma.assumption.create({
      data: {
        statement: "New users want contextual guidance rather than self-discovery",
        category: AssumptionCategory.DESIRABILITY,
        riskLevel: ConfidenceLevel.MEDIUM,
        status: "open",
      },
    }),
    prisma.assumption.create({
      data: {
        statement: "Admins will invite teammates if we show ROI of collaboration",
        category: AssumptionCategory.VIABILITY,
        riskLevel: ConfidenceLevel.LOW,
        status: "open",
      },
    }),
    prisma.assumption.create({
      data: {
        statement: "Leaders need weekly summaries, not real-time dashboards",
        category: AssumptionCategory.FEASIBILITY,
        riskLevel: ConfidenceLevel.HIGH,
        status: "validated",
      },
    }),
  ]);

  // Link outcomes to opportunities
  const outcomeOpportunities = await prisma.$transaction([
    prisma.outcomeOpportunity.create({
      data: {
        outcomeId: outcomes[0].id,
        opportunityId: opportunities[0].id,
        confidence: 0.3,
        notes: "Based on activation analysis",
      },
    }),
    prisma.outcomeOpportunity.create({
      data: {
        outcomeId: outcomes[0].id,
        opportunityId: opportunities[1].id,
        confidence: 0.5,
        notes: "CS feedback + analytics",
      },
    }),
    prisma.outcomeOpportunity.create({
      data: {
        outcomeId: outcomes[1].id,
        opportunityId: opportunities[2].id,
        confidence: 0.6,
        notes: "Enterprise account interviews",
      },
    }),
  ]);

  // Link opportunities to solutions
  const opportunitySolutions = await prisma.$transaction([
    prisma.opportunitySolution.create({
      data: {
        opportunityId: opportunities[0].id,
        solutionId: solutions[0].id,
        confidence: 0.2,
        notes: "Initial product trio shaping",
      },
    }),
    prisma.opportunitySolution.create({
      data: {
        opportunityId: opportunities[1].id,
        solutionId: solutions[1].id,
        confidence: 0.45,
        notes: "High completion in smoke tests",
      },
    }),
    prisma.opportunitySolution.create({
      data: {
        opportunityId: opportunities[2].id,
        solutionId: solutions[2].id,
        confidence: 0.15,
        notes: "Need validation",
      },
    }),
  ]);

  // Link solutions to assumptions
  await prisma.$transaction([
    prisma.solutionAssumption.create({
      data: {
        solutionId: solutions[0].id,
        assumptionId: assumptions[0].id,
        confidence: 0.25,
        notes: "Interviews suggest guided flow desired",
      },
    }),
    prisma.solutionAssumption.create({
      data: {
        solutionId: solutions[1].id,
        assumptionId: assumptions[1].id,
        confidence: 0.35,
        notes: "Admins cite value of collaboration prompts",
      },
    }),
    prisma.solutionAssumption.create({
      data: {
        solutionId: solutions[2].id,
        assumptionId: assumptions[2].id,
        confidence: 0.1,
        notes: "Need to validate dashboard appetite",
      },
    }),
  ]);

  const hypotheses = await prisma.$transaction([
    prisma.hypothesis.create({
      data: {
        statement: "If we add the checklist, guided users will activate 15% faster",
        targetType: RelationshipType.OPPORTUNITY_SOLUTION,
        opportunitySolutionId: opportunitySolutions[0].id,
      },
    }),
    prisma.hypothesis.create({
      data: {
        statement: "Teammate invite nudges will grow active users per account",
        targetType: RelationshipType.OUTCOME_OPPORTUNITY,
        outcomeOpportunityId: outcomeOpportunities[1].id,
      },
    }),
  ]);

  const experiments = await prisma.$transaction([
    prisma.experiment.create({
      data: {
        hypothesisId: hypotheses[0].id,
        name: "High-fidelity onboarding prototype",
        method: "usability_test",
        status: "RUNNING",
      },
    }),
    prisma.experiment.create({
      data: {
        hypothesisId: hypotheses[1].id,
        name: "Nudge email A/B",
        method: "ab_test",
        status: "PLANNED",
      },
    }),
  ]);

  await prisma.$transaction([
    prisma.insight.create({
      data: {
        experimentId: experiments[0].id,
        relationshipType: RelationshipType.OPPORTUNITY_SOLUTION,
        opportunitySolutionId: opportunitySolutions[0].id,
        validationState: ValidationState.SUPPORTS,
        confidenceLevel: ConfidenceLevel.HIGH,
        statement: "Prototype users completed onboarding 40% faster",
        evidenceSummary: "5/6 participants reached success in <8 minutes",
        sourceTypes: ["interview", "usability_test"],
        tags: ["onboarding", "activation"],
        lifecycleStage: LifecycleStage.VALIDATED,
      },
    }),
    prisma.insight.create({
      data: {
        experimentId: experiments[1].id,
        relationshipType: RelationshipType.OUTCOME_OPPORTUNITY,
        outcomeOpportunityId: outcomeOpportunities[1].id,
        validationState: ValidationState.INCONCLUSIVE,
        confidenceLevel: ConfidenceLevel.MEDIUM,
        statement: "Invite nudges generated a small lift but needs more data",
        evidenceSummary: "Test ran for 5 days, sample size too small",
        sourceTypes: ["ab_test"],
        tags: ["retention", "growth"],
        lifecycleStage: LifecycleStage.DISCOVERED,
      },
    }),
  ]);

  console.log("✅ Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
