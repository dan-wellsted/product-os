import { PrismaClient, RelationshipType, ValidationState, ConfidenceLevel, AssumptionCategory, LifecycleStage } from "@prisma/client";

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

  const outcome = await prisma.outcome.create({
    data: {
      name: "Increase activation",
      description: "Help new users reach core value faster",
      metricName: "Activation rate",
      metricBaseline: 0.35,
      metricTarget: 0.5,
    },
  });

  const opportunity = await prisma.opportunity.create({
    data: {
      description: "New accounts stall during onboarding",
      segment: "Self-serve SMB",
      severity: "HIGH",
      status: "open",
    },
  });

  const solution = await prisma.solution.create({
    data: {
      title: "Guided onboarding checklist",
      description: "Step-by-step walkthrough highlighting aha moments",
      status: "proposed",
    },
  });

  const assumption = await prisma.assumption.create({
    data: {
      statement: "New users want contextual guidance rather than self-discovery",
      category: AssumptionCategory.DESIRABILITY,
      riskLevel: ConfidenceLevel.MEDIUM,
      status: "open",
    },
  });

  const outcomeOpportunity = await prisma.outcomeOpportunity.create({
    data: {
      outcomeId: outcome.id,
      opportunityId: opportunity.id,
      confidence: 0.3,
      notes: "Based on activation analysis",
    },
  });

  const opportunitySolution = await prisma.opportunitySolution.create({
    data: {
      opportunityId: opportunity.id,
      solutionId: solution.id,
      confidence: 0.2,
      notes: "Initial product trio shaping",
    },
  });

  const solutionAssumption = await prisma.solutionAssumption.create({
    data: {
      solutionId: solution.id,
      assumptionId: assumption.id,
      confidence: 0.25,
      notes: "Interviews suggest guided flow desired",
    },
  });

  const hypothesis = await prisma.hypothesis.create({
    data: {
      statement: "If we add the checklist, guided users will activate 15% faster",
      targetType: RelationshipType.OPPORTUNITY_SOLUTION,
      opportunitySolutionId: opportunitySolution.id,
    },
  });

  const experiment = await prisma.experiment.create({
    data: {
      hypothesisId: hypothesis.id,
      name: "High-fidelity onboarding prototype",
      method: "usability_test",
      status: "RUNNING",
    },
  });

  await prisma.insight.create({
    data: {
      experimentId: experiment.id,
      relationshipType: RelationshipType.OPPORTUNITY_SOLUTION,
      opportunitySolutionId: opportunitySolution.id,
      validationState: ValidationState.SUPPORTS,
      confidenceLevel: ConfidenceLevel.HIGH,
      statement: "Prototype users completed onboarding 40% faster",
      evidenceSummary: "5/6 participants reached success in <8 minutes",
      sourceTypes: ["interview", "usability_test"],
      tags: ["onboarding", "activation"],
      lifecycleStage: LifecycleStage.VALIDATED,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
