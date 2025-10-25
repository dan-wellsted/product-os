import { discoveryQueue } from "../queues/discovery.queue.js";

const SCHEDULE_JOB = "discovery_pulse_scheduled";
const weeklyJobId = (projectId) => `weekly:${projectId}`;
const monthlyJobId = (projectId) => `monthly:${projectId}`;

/**
 * Enable a weekly Discovery Pulse for a project.
 * Default: every Monday at 09:00 (server time).
 */
export async function enableWeeklyDiscovery({
  projectId,
  hour = 9,
  minute = 0,
}) {
  return discoveryQueue.add(
    SCHEDULE_JOB,
    { projectId, cadence: "weekly" },
    {
      jobId: weeklyJobId(projectId),
      repeat: { pattern: `${minute} ${hour} * * 1` }, // cron: m h dom mon dow
      removeOnComplete: true,
    },
  );
}

/**
 * Enable a monthly Discovery Pulse for a project.
 * Default: day 1 at 09:00 (server time).
 */
export async function enableMonthlyDiscovery({
  projectId,
  day = 1,
  hour = 9,
  minute = 0,
}) {
  return discoveryQueue.add(
    SCHEDULE_JOB,
    { projectId, cadence: "monthly" },
    {
      jobId: monthlyJobId(projectId),
      repeat: { pattern: `${minute} ${hour} ${day} * *` }, // cron: m h dom mon dow
      removeOnComplete: true,
    },
  );
}

/**
 * Disable scheduled Discovery pulses for a single project.
 */
export async function disableAllDiscovery({ projectId }) {
  const jobIds = new Set([weeklyJobId(projectId), monthlyJobId(projectId)]);
  const repeatables = await discoveryQueue.getRepeatableJobs();
  const matches = repeatables.filter((job) => {
    if (job.name !== SCHEDULE_JOB) return false;
    if (job.id && jobIds.has(job.id)) return true;
    return job.key.includes(projectId);
  });

  await Promise.all(matches.map((job) => discoveryQueue.removeRepeatableByKey(job.key)));
  return matches.length > 0;
}
