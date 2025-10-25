import { Queue, QueueEvents } from "bullmq";
import IORedis from "ioredis";

// BullMQ requires maxRetriesPerRequest === null for blocking commands
export const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  { maxRetriesPerRequest: null },
);

export function makeQueue(name) {
  const queue = new Queue(name, { connection });
  const events = new QueueEvents(name, { connection });
  return { queue, events };
}
