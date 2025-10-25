const API_BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text}`);
  }
  const isJson = res.headers.get("content-type")?.includes("application/json");
  return isJson ? res.json() : res.text();
}

export function get(path) {
  return request(path);
}

export function post(path, body) {
  return request(path, { method: "POST", body: JSON.stringify(body) });
}

export function put(path, body) {
  return request(path, { method: "PUT", body: JSON.stringify(body) });
}

export function del(path) {
  return request(path, { method: "DELETE" });
}
