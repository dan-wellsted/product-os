import { makeQueue } from "./connection.js";

export const DISCOVERY_QUEUE = "reports.discovery"; // no colon
export const { queue: discoveryQueue, events: discoveryEvents } =
  makeQueue(DISCOVERY_QUEUE);
