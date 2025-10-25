export function notFound(_req, res, _next) {
  res.status(404).json({ error: { status: 404, message: "Not Found" } });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const payload = {
    status,
    message: err.friendly?.message || err.message || "Unexpected error",
    issues: err.friendly?.issues || [],
  };
  res.status(status).json({ error: payload });
}
