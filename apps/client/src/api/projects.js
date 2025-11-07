import { getJson } from "./httpClient.js";

const PROJECTS_BASE = "/api/projects";

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.cursor) searchParams.set("cursor", params.cursor);
  if (params.take) searchParams.set("take", String(params.take));
  if (params.q) searchParams.set("q", params.q);
  return searchParams.toString();
}

export async function listProjects(params = {}) {
  const query = buildQuery(params);
  const res = await getJson(query ? `${PROJECTS_BASE}?${query}` : PROJECTS_BASE);
  const data = Array.isArray(res?.data)
    ? res.data
    : Array.isArray(res?.projects)
      ? res.projects
      : [];
  const meta = res?.meta ?? {};
  return { data, meta };
}

export async function getProject(projectId) {
  if (!projectId) throw new Error("projectId is required");
  const res = await getJson(`${PROJECTS_BASE}/${projectId}`);
  const project = res?.project ?? res?.data;
  return { data: project, etag: res?.etag };
}
