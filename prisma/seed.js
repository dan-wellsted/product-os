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

  const opp = await prisma.opportunity.create({
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
      opportunityId: opp.id,
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

  console.log({ org: org.name, project: project.name, outcome: outcome.title });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
