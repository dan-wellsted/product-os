import { get } from "./client.js";

export function fetchProjects() {
  return get("/api/projects");
}

export function fetchProject(projectId) {
  return get(`/api/projects/${projectId}`);
}

export function fetchProjectDiscovery(projectId) {
  return get(`/api/projects/${projectId}/discovery`);
}
