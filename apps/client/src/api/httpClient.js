const API_BASE = import.meta.env.VITE_API_URL || "";

const etagCache = new Map();

export class ApiError extends Error {
  constructor(message, { status, problem, response }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
    this.response = response;
  }
}

function buildHeaders(headers = {}) {
  const next = new Headers({
    "Content-Type": "application/json",
  });
  Object.entries(headers).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      next.set(key, value);
    }
  });
  return next;
}

function resolveUrl(path) {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

function getEtagKey(path, id) {
  if (id) return `${path}::${id}`;
  return path;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  return text ? { data: text } : null;
}

export function getStoredEtag(path, id) {
  return etagCache.get(getEtagKey(path, id));
}

export function clearStoredEtag(path, id) {
  etagCache.delete(getEtagKey(path, id));
}

export async function request(path, { method = "GET", body, headers, signal, etagKey } = {}) {
  const url = resolveUrl(path);
  const requestHeaders = buildHeaders(headers);

  if (etagKey) {
    const existingEtag = etagCache.get(etagKey);
    if (existingEtag && (method === "PATCH" || method === "DELETE" || method === "PUT")) {
      requestHeaders.set("If-Match", existingEtag);
    }
  }

  const response = await fetch(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: requestHeaders,
    credentials: "include",
    signal,
  });

  const payload = await parseResponse(response);
  const etag = response.headers.get("etag");
  if (!response.ok) {
    const problem = payload?.error || payload?.problem || payload;
    const message = problem?.title || problem?.detail || `Request failed (${response.status})`;
    throw new ApiError(message, { status: response.status, problem, response });
  }

  if (etag && etagKey) {
    etagCache.set(etagKey, etag);
  }

  return { ...payload, etag };
}

export async function getJson(path, options = {}) {
  return request(path, { ...options, method: "GET" });
}

export async function postJson(path, body, options = {}) {
  return request(path, { ...options, method: "POST", body });
}

export async function patchJson(path, body, options = {}) {
  return request(path, { ...options, method: "PATCH", body });
}

export async function deleteJson(path, options = {}) {
  return request(path, { ...options, method: "DELETE" });
}
