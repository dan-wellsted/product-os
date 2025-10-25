// src/middleware/error.js

// 404 passthrough (optional)
export function notFound(_req, res, _next) {
  res.status(404);
  res.render("error", {
    title: "Not Found",
    status: 404,
    message: "The page you are looking for does not exist.",
    issues: [],
  });
}

// Central error handler
export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const isJson =
    req.get("accept")?.includes("application/json") ||
    req.query.format === "json";

  const payload = {
    title:
      err.title || (status === 400 ? "Bad Request" : "Something went wrong"),
    status,
    message: err.friendly?.message || err.message || "Unexpected error",
    issues: err.friendly?.issues || [],
  };

  if (isJson) {
    return res.status(status).json({ error: payload });
  }

  res.status(status);
  res.render("error", payload);
}
