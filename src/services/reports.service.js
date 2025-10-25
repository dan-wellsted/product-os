import { discoveryQueue } from "../queues/discovery.queue.js";
export function runDiscoveryJob({ projectId }) {
  return discoveryQueue.add(
    "discovery_pulse",
    { projectId },
    { removeOnComplete: true, removeOnFail: false },
  );
}
