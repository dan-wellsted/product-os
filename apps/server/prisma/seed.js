import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const daysAgo = (n) => new Date(Date.now() - n * 24 * 3600 * 1000);

async function main() {
  const org = await prisma.organization.create({
    data: { name: "Acme Org", domain: "acme.test" },
  });
  const user = await prisma.user.create({
    data: { email: "product@acme.test", name: "Product Lead" },
  });
  await prisma.membership.create({ data: { userId: user.id, orgId: org.id } });

  const project = await prisma.project.create({
    data: {
      orgId: org.id,
      name: "Product OS Pilot",
      description: "Pilot for Continuous Discovery",
    },
  });

  const metric = await prisma.metric.create({
    data: { projectId: project.id, name: "Activation Rate", unit: "%" },
  });
  await prisma.metricSnapshot.createMany({
    data: [
      { metricId: metric.id, ts: daysAgo(30), value: 38.2 },
      { metricId: metric.id, ts: daysAgo(0), value: 41.7 },
    ],
  });

  const outcome = await prisma.outcome.create({
    data: {
      projectId: project.id,
      title: "Increase activation rate",
      description: "Improve first-week activation to drive retention",
      targetValue: 50,
      metricId: metric.id,
    },
  });

  const opportunity = await prisma.opportunity.create({
    data: {
      projectId: project.id,
      outcomeId: outcome.id,
      title: "Confusing setup flow",
      problem: "Drop on step 2",
      evidence: "Analytics + interviews",
    },
  });

  await prisma.experiment.create({
    data: {
      projectId: project.id,
      opportunityId: opportunity.id,
      hypothesis: "Redesign step 2 → +10% activation",
      method: "prototype-test",
    },
  });

  await prisma.insight.createMany({
    data: [
      {
        projectId: project.id,
        title: "Users want shortcuts",
        summary: "Speeds up updates",
        impactScore: 6,
      },
      {
        projectId: project.id,
        title: "Drop on step 2",
        summary: "Period selection confusion",
        impactScore: 8,
      },
    ],
  });

  const hypothesis = await prisma.hypothesis.create({
    data: {
      projectId: project.id,
      outcomeId: outcome.id,
      title: "Activation hypothesis",
      statement: "If we streamline onboarding customers will activate faster",
    },
  });

  const assumption = await prisma.assumption.create({
    data: {
      projectId: project.id,
      hypothesisId: hypothesis.id,
      title: "Value unclear during onboarding",
      statement: "Prospects need clearer value cues before step 2",
    },
  });

  const interview = await prisma.interview.create({
    data: {
      projectId: project.id,
      assumptionId: assumption.id,
      title: "Interview — Growth PM",
      participant: "Growth PM",
      interviewAt: new Date(),
      notes: "Need to surface value metrics earlier in onboarding.",
    },
  });

  const interviewInsight = await prisma.insight.create({
    data: {
      projectId: project.id,
      interviewId: interview.id,
      title: "Setup confusion stems from unclear value",
      summary: "Participants are uncertain about success metrics until late in onboarding.",
      source: "Interview",
      impactScore: 7,
      confidence: "MEDIUM",
    },
  });

  await prisma.opportunity.update({
    where: { id: opportunity.id },
    data: { insightId: interviewInsight.id },
  });

  const solution = await prisma.solution.create({
    data: {
      projectId: project.id,
      opportunityId: opportunity.id,
      assumptionId: assumption.id,
      title: "Guided onboarding checklist",
      description: "Introduce a guided checklist to highlight value within the first session.",
    },
  });

  const guidedExperiment = await prisma.experiment.create({
    data: {
      projectId: project.id,
      opportunityId: opportunity.id,
      solutionId: solution.id,
      hypothesis: "Guided onboarding raises activation by 5%",
      method: "In-product experiment",
      status: "PLANNED",
    },
  });

  const evidence = await prisma.evidence.create({
    data: {
      projectId: project.id,
      experimentId: guidedExperiment.id,
      type: "NOTE",
      summary: "Baseline activation recorded for comparison",
      details: { baselineActivation: 0.417 },
    },
  });

  await prisma.discoveryTrace.createMany({
    data: [
      {
        projectId: project.id,
        fromType: "OUTCOME",
        fromId: outcome.id,
        toType: "HYPOTHESIS",
        toId: hypothesis.id,
      },
      {
        projectId: project.id,
        fromType: "HYPOTHESIS",
        fromId: hypothesis.id,
        toType: "ASSUMPTION",
        toId: assumption.id,
      },
      {
        projectId: project.id,
        fromType: "ASSUMPTION",
        fromId: assumption.id,
        toType: "INTERVIEW",
        toId: interview.id,
      },
      {
        projectId: project.id,
        fromType: "INTERVIEW",
        fromId: interview.id,
        toType: "INSIGHT",
        toId: interviewInsight.id,
      },
      {
        projectId: project.id,
        fromType: "INSIGHT",
        fromId: interviewInsight.id,
        toType: "OPPORTUNITY",
        toId: opportunity.id,
      },
      {
        projectId: project.id,
        fromType: "OPPORTUNITY",
        fromId: opportunity.id,
        toType: "SOLUTION",
        toId: solution.id,
      },
      {
        projectId: project.id,
        fromType: "SOLUTION",
        fromId: solution.id,
        toType: "EXPERIMENT",
        toId: guidedExperiment.id,
      },
      {
        projectId: project.id,
        fromType: "EXPERIMENT",
        fromId: guidedExperiment.id,
        toType: "EVIDENCE",
        toId: evidence.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log({ org: org.name, project: project.name, outcome: outcome.title });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
