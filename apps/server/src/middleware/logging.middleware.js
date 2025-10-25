// src/middleware/logging.middleware.js

export function discoveryAuditLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const user = req.user?.id || "anon";
    console.log(
      `[discovery] ${req.method} ${req.originalUrl} ${res.statusCode} user=${user} ${duration}ms`,
    );
  });
  next();
}
