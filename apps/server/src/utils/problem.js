const DEFAULT_TYPE = "about:blank";

export function formatProblem(options = {}) {
  const {
    type = DEFAULT_TYPE,
    title = "Unexpected Error",
    status = 500,
    detail,
    instance,
    meta,
  } = options;

  const problem = {
    type,
    title,
    status,
  };

  if (detail) problem.detail = detail;
  if (instance) problem.instance = instance;
  if (meta) problem.meta = meta;

  return problem;
}

export function sendProblem(res, problem) {
  res.status(problem.status || 500).json({ error: problem });
}

export function handleZodError(error) {
  return formatProblem({
    type: "https://httpstatuses.com/422",
    title: "Unprocessable Entity",
    status: 422,
    detail: "Validation failed",
    meta: {
      issues: error.errors?.map((issue) => ({
        path: Array.isArray(issue.path) ? issue.path.join(".") : String(issue.path),
        message: issue.message,
      })),
    },
  });
}

export function handlePrismaError(error) {
  if (error.code === "P2002") {
    return formatProblem({
      type: "https://httpstatuses.com/409",
      title: "Conflict",
      status: 409,
      detail: "Unique constraint violated",
      meta: { target: error.meta?.target },
    });
  }

  if (error.code === "P2025") {
    return formatProblem({
      type: "https://httpstatuses.com/404",
      title: "Not Found",
      status: 404,
      detail: error.meta?.cause || "Record not found",
    });
  }

  return formatProblem({
    title: "Database Error",
    status: 500,
    detail: error.message,
  });
}
