import { formatProblem, sendProblem } from "../utils/problem.js";

export function notFound(_req, res, _next) {
  sendProblem(res, formatProblem({ status: 404, title: "Not Found" }));
}

export function errorHandler(err, req, res, _next) {
  if (res.headersSent) {
    return;
  }

  if (err?.type && err?.title && err?.status) {
    sendProblem(res, err);
    return;
  }

  const problem = formatProblem({
    status: err.status || 500,
    title: err.title || "Unexpected Error",
    detail: err.detail || err.message,
    instance: req.originalUrl,
    meta: err.meta,
  });

  sendProblem(res, problem);
}
